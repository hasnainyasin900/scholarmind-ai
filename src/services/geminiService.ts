import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { UserProfile, Scholarship, VisaInfo, CountryComparison, InterviewPrep, StudentProfile, ScholarshipData, UniversityComparison, UniversityInterviewTips } from "../types";
import * as Prompts from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper for exponential backoff retries
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 3000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message?.toLowerCase() || "";
      
      // Specifically handle 429 Too Many Requests (RESOURCE_EXHAUSTED)
      const isRateLimit = 
        errorMsg.includes('429') || 
        errorMsg.includes('resource_exhausted') ||
        errorMsg.includes('quota') ||
        error.status === 429 ||
        (error.error && error.error.code === 429);

      if (isRateLimit && i < maxRetries - 1) {
        // Longer delay for quota issues
        const delay = baseDelay * Math.pow(2.5, i);
        console.warn(`Gemini API Quota/Rate Limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  throw lastError;
}

// Mapping Helpers
function mapProfileToStudent(profile: UserProfile): StudentProfile {
  return {
    name: profile.fullName || "Student",
    nationality: profile.country || "Not specified",
    currentDegree: profile.pastStudy || "Not specified",
    targetDegree: profile.degree || "Not specified",
    gpa: profile.gpa || "0.0",
    ieltsScore: profile.ielts || "not taken",
    fieldOfStudy: profile.field || "Not specified",
    targetCountries: [profile.country || "Any"],
    workExperience: profile.workExperience || "none",
    researchPublications: (profile.researchExp || "") + " " + (profile.publications || ""),
    financialNeed: (profile.budget && parseInt(profile.budget) < 10000) ? "high" : "medium",
    extracurriculars: profile.extracurriculars || "none"
  };
}

function mapScholarshipToData(s: Scholarship): ScholarshipData {
  return {
    id: s.id,
    scholarshipName: s.scholarshipName,
    university: s.university,
    country: s.country,
    degreeLevel: s.degreeLevel,
    fundingCoverage: s.fundingCoverage,
    eligibility: s.eligibility,
    requiredDocuments: s.requiredDocuments,
    ieltsRequirement: s.ieltsRequirement,
    ieltsWaiverInfo: s.ieltsWaiverInfo || "None",
    closingDate: s.closingDate,
    competitivenessLevel: s.competitivenessLevel,
    rankingReason: s.rankingReason
  };
}

export async function generateSOP(
  profile: UserProfile, 
  scholarship: Scholarship, 
  extras: {
    whyThisCountry: string;
    careerGoal: string;
    biggestChallenge: string;
    proudestAchievement: string;
    whyThisUniversity: string;
  }
): Promise<string> {
  const prompt = Prompts.buildSOPWriterPrompt(
    mapProfileToStudent(profile),
    mapScholarshipToData(scholarship),
    extras
  );

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  }));

  return response.text || "Failed to generate SOP.";
}

export async function getSuccessProbability(profile: UserProfile, scholarship: Scholarship): Promise<any> {
  const prompt = Prompts.buildSuccessProbabilityPrompt(
    mapProfileToStudent(profile),
    mapScholarshipToData(scholarship)
  );

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  }));

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export async function getDetailedInterviewPrep(profile: UserProfile, scholarship: Scholarship): Promise<any[]> {
  const prompt = Prompts.buildInterviewPrepPrompt(
    mapProfileToStudent(profile),
    mapScholarshipToData(scholarship),
    "generate_questions"
  );

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  }));

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
}

export async function evaluateInterviewAnswer(
  profile: UserProfile, 
  scholarship: Scholarship, 
  question: string, 
  answer: string
): Promise<any> {
  const prompt = Prompts.buildInterviewPrepPrompt(
    mapProfileToStudent(profile),
    mapScholarshipToData(scholarship),
    "evaluate_answer",
    question,
    answer
  );

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  }));

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export async function getLORGuidance(
  profile: UserProfile, 
  scholarship: Scholarship, 
  referee: { name: string; role: string; relationship: string }
): Promise<string> {
  const prompt = Prompts.buildLORGuidancePrompt(
    mapProfileToStudent(profile),
    mapScholarshipToData(scholarship),
    referee
  );

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  }));

  return response.text || "Failed to generate LOR guidance.";
}

export async function getApplicationTimeline(profile: UserProfile, scholarship: Scholarship): Promise<any> {
  const prompt = Prompts.buildTimelinePlannerPrompt(
    mapProfileToStudent(profile),
    mapScholarshipToData(scholarship),
    new Date().toISOString().split('T')[0]
  );

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  }));

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export async function getIELTSGapAnalysis(
  current: string, 
  target: string, 
  weakest: string, 
  time: string
): Promise<any> {
  const prompt = Prompts.buildIELTSGapAnalyserPrompt(current, target, weakest, time);

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  }));

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export async function getEssayFeedback(scholarship: Scholarship, prompt_text: string, essay: string): Promise<any> {
  const prompt = Prompts.buildEssayFeedbackPrompt(mapScholarshipToData(scholarship), prompt_text, essay);

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  }));

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export async function getCountryResearch(profile: UserProfile, country: string, university: string): Promise<any> {
  const prompt = Prompts.buildCountryResearchPrompt(mapProfileToStudent(profile), country, university);

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  }));

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export async function getDailyMotivation(profile: UserProfile, deadlines: { name: string; daysLeft: number }[], completed: number, total: number): Promise<string> {
  const prompt = Prompts.buildDailyMotivationPrompt(profile.fullName || "Student", deadlines, completed, total);

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    }), 2, 1000); // Fewer retries for non-essential content

    return response.text || "Stay focused on your goals!";
  } catch (e) {
    console.warn("Motivation call failed or throttled, using fallback.");
    return "Keep pushing forward! Your global education journey is just beginning.";
  }
}

export async function searchScholarships(profile: UserProfile): Promise<Scholarship[]> {
  const currentDate = new Date().toISOString().split('T')[0];
  const prompt = `You are a professional global education data research AI.
Today's date is ${currentDate}.

Your job is to find CURRENTLY ACTIVE or UPCOMING scholarships for the 2026-2027 academic cycle based on the user's profile.
Return exactly 10 high-quality results.

User Profile:
Name: ${profile.fullName || "Not specified"}
Past Study/Education: ${profile.pastStudy || "Not specified"}
Target Field: ${profile.field}
Target Degree Level: ${profile.degree || "Any (Infer best match)"}
Current GPA: ${profile.gpa}
IELTS/TOEFL Score: ${profile.ielts || "Not specified (Suggest tests if needed)"}
GRE/GMAT Score: ${profile.greGmat || "Not specified"}
Work Experience: ${profile.workExperience || "None specified"}
Research Experience: ${profile.researchExp || "None specified"}
Publications: ${profile.publications || "None specified"}
Extracurriculars: ${profile.extracurriculars || "None specified"}
Annual Budget: ${profile.budget || "Any"}
Preferred Country: ${profile.country || "Global"}

CRITICAL INSTRUCTIONS:
1. ONLY include scholarships with closing dates AFTER ${currentDate}.
2. Rank Top 10 scholarships by: Eligibility match, Funding level, Acceptance probability, and Deadline urgency.
3. For each scholarship, calculate a "Success Probability" (0-100) based on GPA weight, test scores, Country competition, and Scholarship selectivity. Use the user's work experience, research, publications, and extracurriculars as "Success Multipliers".
4. Rate "Competitiveness Level" as: Easy, Moderate, Competitive, or Extremely Competitive.
5. Determine "Status": Active, Closing Soon (within 30 days), Closed (if passed), or Upcoming.
6. Check if it's "Annual Recurring" (isAnnual).
7. Provide a "Ranking Reason" explaining why this fits the user's profile.
8. Include IELTS/TOEFL waiver details.
9. Provide official application links only.
`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scholarshipName: { type: Type.STRING },
            university: { type: Type.STRING },
            country: { type: Type.STRING },
            degreeLevel: { type: Type.STRING },
            fundingCoverage: { type: Type.STRING },
            openingDate: { type: Type.STRING },
            closingDate: { type: Type.STRING },
            eligibility: { type: Type.STRING },
            requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
            ieltsRequirement: { type: Type.STRING },
            ieltsWaiverInfo: { type: Type.STRING },
            applicationLink: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
            competitivenessLevel: { type: Type.STRING },
            successProbability: { type: Type.NUMBER },
            rankingReason: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["Active", "Closing Soon", "Closed", "Upcoming"] },
            isAnnual: { type: Type.BOOLEAN }
          },
          required: [
            "scholarshipName", "university", "country", "degreeLevel",
            "fundingCoverage", "openingDate", "closingDate", "eligibility",
            "requiredDocuments", "ieltsRequirement", "applicationLink",
            "matchScore", "competitivenessLevel", "successProbability",
            "rankingReason", "status", "isAnnual"
          ]
        }
      }
    }
  }));

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse scholarships", e);
    return [];
  }
}

export async function searchScholarshipsByCountry(country: string): Promise<Scholarship[]> {
  const currentDate = new Date().toISOString().split('T')[0];
  const prompt = `You are a professional global education data research AI.
Today's date is ${currentDate}.

Your job is to find CURRENTLY ACTIVE or UPCOMING scholarships for the 2026-2027 academic cycle specifically for universities in ${country}.
Return exactly 10 high-quality results. Provide comprehensive A to Z details for each scholarship.

CRITICAL INSTRUCTIONS:
1. ONLY include scholarships with closing dates AFTER ${currentDate}.
2. Rank Top 10 scholarships by: Funding level, Prestige, and Deadline urgency.
3. For each scholarship, calculate a general "Success Probability" (0-100) based on typical acceptance rates.
4. Rate "Competitiveness Level" as: Easy, Moderate, Competitive, or Extremely Competitive.
5. Determine "Status": Active, Closing Soon (within 30 days), Closed (if passed), or Upcoming.
6. Check if it's "Annual Recurring" (isAnnual).
7. Provide a "Ranking Reason" explaining why this is a top scholarship in ${country}.
8. Include IELTS/TOEFL waiver details.
9. Provide official application links only.
`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scholarshipName: { type: Type.STRING },
            university: { type: Type.STRING },
            country: { type: Type.STRING },
            degreeLevel: { type: Type.STRING },
            fundingCoverage: { type: Type.STRING },
            openingDate: { type: Type.STRING },
            closingDate: { type: Type.STRING },
            eligibility: { type: Type.STRING },
            requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
            ieltsRequirement: { type: Type.STRING },
            ieltsWaiverInfo: { type: Type.STRING },
            applicationLink: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
            competitivenessLevel: { type: Type.STRING },
            successProbability: { type: Type.NUMBER },
            rankingReason: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["Active", "Closing Soon", "Closed", "Upcoming"] },
            isAnnual: { type: Type.BOOLEAN }
          },
          required: [
            "scholarshipName", "university", "country", "degreeLevel",
            "fundingCoverage", "openingDate", "closingDate", "eligibility",
            "requiredDocuments", "ieltsRequirement", "applicationLink",
            "matchScore", "competitivenessLevel", "successProbability",
            "rankingReason", "status", "isAnnual"
          ]
        }
      }
    }
  }));

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse scholarships", e);
    return [];
  }
}

export async function getVisaInfo(country: string, university: string): Promise<VisaInfo | null> {
  const prompt = `Provide complete and updated student visa information for ${country} for a student attending ${university}.
  Today's date is 2026-02-22.
  Include: Visa name, Financial proof amount, Bank statement duration, Visa fee, Processing time, Interview required?, Work rights, Post-study work options, and Official government link.`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          country: { type: Type.STRING },
          visaName: { type: Type.STRING },
          financialProofAmount: { type: Type.STRING },
          bankStatementDuration: { type: Type.STRING },
          visaFee: { type: Type.STRING },
          processingTime: { type: Type.STRING },
          interviewRequired: { type: Type.BOOLEAN },
          workRights: { type: Type.STRING },
          postStudyWorkOptions: { type: Type.STRING },
          officialLink: { type: Type.STRING }
        },
        required: ["country", "visaName", "financialProofAmount", "bankStatementDuration", "visaFee", "processingTime", "interviewRequired", "workRights", "postStudyWorkOptions", "officialLink"]
      }
    }
  }));

  try {
    return JSON.parse(response.text || "null");
  } catch (e) {
    return null;
  }
}

export async function getCountryComparison(countries: string[] = ['Germany', 'UK', 'Canada', 'USA', 'Australia'], profile?: UserProfile): Promise<CountryComparison[]> {
  const foundComparisons: CountryComparison[] = [];
  const missingCountries: string[] = [];
  
  try {
    const adminRes = await fetch('/api/admin/country-comparisons');
    if (adminRes.ok) {
      const adminData: any[] = await adminRes.json();
      const dbComparisons: CountryComparison[] = Array.isArray(adminData) ? adminData.map(c => ({
          ...c,
          pros: typeof c.pros === 'string' ? JSON.parse(c.pros) : c.pros || [],
          cons: typeof c.cons === 'string' ? JSON.parse(c.cons) : c.cons || []
      })) : [];
      
      for (const c of countries) {
        const dbMatch = dbComparisons.find(dbC => dbC.country.toLowerCase() === c.toLowerCase());
        if (dbMatch) {
           foundComparisons.push(dbMatch);
        } else {
           missingCountries.push(c);
        }
      }
    } else {
      missingCountries.push(...countries);
    }
  } catch (e) {
    console.error("Failed to fetch admin comparisons, falling back entirely to AI");
    missingCountries.push(...countries);
  }

  if (missingCountries.length === 0) {
    return foundComparisons;
  }

  const countryList = missingCountries.join(', ');
  const prompt = `Compare ${countryList} for international students. 
  Include: Visa difficulty, Cost of living, PR options, Acceptance rate, Pros, and Cons.
  Also include: Part-time work allowance during studies, Post-study work visa duration, Language proficiency requirements beyond IELTS/TOEFL, English Proficiency Requirements (like IELTS/TOEFL scores needed), and Average Tuition Fees.
  Finally, calculate a "Visa Success Probability" (0-100) based on the country's visa difficulty and the user's profile.
  
  User Profile:
  Past Study: ${profile?.pastStudy || "Any"}
  Target Field: ${profile?.field || "Any"}
  Target Degree Level: ${profile?.degree || "Any"}
  Current GPA: ${profile?.gpa || "Any"}
  IELTS/TOEFL Score: ${profile?.ielts || "Any"}
  GRE/GMAT Score: ${profile?.greGmat || "Any"}
  Work Experience: ${profile?.workExperience || "Any"}
  Research Experience: ${profile?.researchExp || "Any"}
  Publications: ${profile?.publications || "Any"}
  Extracurriculars: ${profile?.extracurriculars || "Any"}
  Annual Budget: ${profile?.budget || "Any"}
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              country: { type: Type.STRING },
              visaDifficulty: { type: Type.STRING, enum: ["Easy", "Moderate", "Hard"] },
              costOfLiving: { type: Type.STRING },
              prOptions: { type: Type.STRING },
              acceptanceRate: { type: Type.STRING },
              partTimeWorkAllowance: { type: Type.STRING },
              postStudyWorkDuration: { type: Type.STRING },
              languageRequirements: { type: Type.STRING },
              englishProficiencyRequirements: { type: Type.STRING },
              averageTuitionFees: { type: Type.STRING },
              visaSuccessProbability: { type: Type.NUMBER },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["country", "visaDifficulty", "costOfLiving", "prOptions", "acceptanceRate", "partTimeWorkAllowance", "postStudyWorkDuration", "languageRequirements", "englishProficiencyRequirements", "averageTuitionFees", "visaSuccessProbability", "pros", "cons"]
          }
        }
      }
    }));

    const parsed = JSON.parse(response.text || "[]");
    return [...foundComparisons, ...parsed];
  } catch (e: any) {
    console.error("Error fetching country comparison:", e);
    if (foundComparisons.length > 0) return foundComparisons;
    throw new Error(e.message || "Failed to fetch country comparison data. Please try again later.");
  }
}

export async function getInterviewPrep(scholarshipName: string): Promise<InterviewPrep | null> {
  const prompt = `Generate the most common interview questions and personalized suggested answers for the ${scholarshipName}. Include expert tips.`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                suggestedAnswer: { type: Type.STRING },
                tips: { type: Type.STRING }
              },
              required: ["question", "suggestedAnswer", "tips"]
            }
          }
        },
        required: ["questions"]
      }
    }
  }));

  try {
    return JSON.parse(response.text || "null");
  } catch (e) {
    return null;
  }
}

export async function getLocalResources(lat: number | null, lng: number | null, manualLocation?: string): Promise<{text: string, chunks: any[]}> {
  let contents = "Find IELTS test centers, education consultants, or student visa agencies near me.";
  if (manualLocation) {
    contents = `Find IELTS test centers, education consultants, or student visa agencies in or near ${manualLocation}.`;
  }

  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (lat !== null && lng !== null) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: lat,
          longitude: lng
        }
      }
    };
  }

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview", // Standardizing on flash-preview
      contents: contents,
      config: config
    }));

    return {
      text: response.text || "No resources found.",
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (e: any) {
    console.error("Error fetching local resources:", e);
    throw new Error(e.message || "Failed to fetch local resources. Please try again later.");
  }
}

export function createChatSession(profile: UserProfile, usePro: boolean = false) {
  return ai.chats.create({
    model: usePro ? "gemini-3.1-pro-preview" : "gemini-3.5-flash",
    config: {
      ...(usePro ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : { tools: [{ googleSearch: {} }] }),
      systemInstruction: `You are an expert education consultant. Help the user with their scholarship applications, essays, and complex queries.
User Profile context:
Name: ${profile.fullName || "Not specified"}
Past Study/Education: ${profile.pastStudy || "Not specified"}
Target Field: ${profile.field}
Target Degree Level: ${profile.degree}
Current GPA: ${profile.gpa}
IELTS/TOEFL Score: ${profile.ielts || "Not specified"}
GRE/GMAT Score: ${profile.greGmat || "Not specified"}
Work Experience: ${profile.workExperience || "None specified"}
Research Experience: ${profile.researchExp || "None specified"}
Publications: ${profile.publications || "None specified"}
Extracurriculars: ${profile.extracurriculars || "None specified"}
Annual Budget: ${profile.budget || "Any"}
Preferred Country: ${profile.country || "Global"}

Special Instructions:
- Think like a pure student who is navigating the complexities of studying abroad. Give advice that is extremely practical, empathetic, and relatable.
- If the user has not taken IELTS/TOEFL yet or has a low score, proactively offer advice on:
  1. Which test to take based on their target country (e.g., IELTS for UK/Canada/Australia, TOEFL for USA).
  2. Specific preparation resources:
     - Official IELTS/TOEFL practice materials.
     - Free platforms like Khan Academy (for TOEFL) or British Council/IDP free resources (for IELTS).
     - YouTube channels like 'IELTS Liz' or 'E2 Language'.
     - Mobile apps for vocabulary and speaking practice.
  3. Finding local test centers (remind them to check the 'Local Resources' tab).
  4. Scholarships that might not require English proficiency tests or offer waivers (e.g., MOI, Duolingo, or university-specific internal tests).
  5. How to request an English Proficiency Waiver from a university.
`
    }
  });
}

export async function sendMessage(chatSession: any, message: string): Promise<any> {
  return withRetry(() => chatSession.sendMessage({ message }));
}

export async function compareUniversities(
  uni1: string,
  uni2: string,
  profile?: UserProfile
): Promise<UniversityComparison[]> {
  const prompt = `Compare the following two universities side-by-side for an international student:
  1. ${uni1}
  2. ${uni2}

  Provide accurate data or highly informed estimates for:
  - Global Ranking (QS or other reputable ranking systems)
  - Average Annual Tuition Fees (for international students in the user's field or level if specified, otherwise general average in local currency or USD)
  - Average Scholarship Amount or typical funding support for international students
  - Acceptance Rate (percentage estimate)
  - Key Programs / Academic Strengths
  - IELTS / Language Proficiency Requirement
  - Monthly Cost of Living Estimate (housing, food, etc. near the campus)
  - Suitability Reason: A custom note about how this university fits the student's profile or field of study.
  - Compatibility Score: An integer from 0 to 100 representing how compatible the university is with the student's academic profile. Evaluate based on:
    * Whether the student's GPA meets typical competitive standards for the school's global ranking and acceptance rate.
    * Whether the student's IELTS score meets the requirements.
    * How well the school's key programs match the student's target field/degree.
    * The affordability of the school's tuition/living costs vs. the student's target budget.
    * If no profile is provided, calculate a baseline score of around 70-80% representing standard international accessibility.

  User Profile context (if available):
  - Name: ${profile?.fullName || "Not specified"}
  - Target Field: ${profile?.field || "Not specified"}
  - Target Degree: ${profile?.degree || "Not specified"}
  - Current GPA: ${profile?.gpa || "Not specified"}
  - IELTS Score: ${profile?.ielts || "Not specified"}
  - Budget preference: ${profile?.budget || "Not specified"}
  - Preferred Country: ${profile?.country || "Not specified"}
  
  Return the comparison data for BOTH universities as a JSON array of exactly 2 items.`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            universityName: { type: Type.STRING },
            country: { type: Type.STRING },
            globalRanking: { type: Type.STRING },
            averageTuition: { type: Type.STRING },
            averageScholarshipAmount: { type: Type.STRING },
            acceptanceRate: { type: Type.STRING },
            keyPrograms: { type: Type.ARRAY, items: { type: Type.STRING } },
            ieltsRequirement: { type: Type.STRING },
            costOfLivingEstimate: { type: Type.STRING },
            suitabilityReason: { type: Type.STRING },
            compatibilityScore: { type: Type.INTEGER }
          },
          required: [
            "universityName", "country", "globalRanking", "averageTuition",
            "averageScholarshipAmount", "acceptanceRate", "keyPrograms",
            "ieltsRequirement", "costOfLivingEstimate", "suitabilityReason",
            "compatibilityScore"
          ]
        }
      }
    }
  }));

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse university comparison response:", e);
    return [];
  }
}

export async function getUniversityInterviewTips(
  profile: UserProfile, 
  scholarship: Scholarship
): Promise<UniversityInterviewTips | null> {
  const prompt = Prompts.buildUniversityInterviewTipsPrompt(
    mapProfileToStudent(profile),
    mapScholarshipToData(scholarship)
  );

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          universityName: { type: Type.STRING },
          scholarshipName: { type: Type.STRING },
          interviewFormat: { type: Type.STRING },
          etiquetteTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          culturalFit: { type: Type.STRING },
          technicalAdvice: { type: Type.STRING },
          doPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          dontPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          starPractice: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                situationExample: { type: Type.STRING },
                taskExample: { type: Type.STRING },
                actionExample: { type: Type.STRING },
                resultExample: { type: Type.STRING }
              },
              required: ["question", "situationExample", "taskExample", "actionExample", "resultExample"]
            }
          }
        },
        required: [
          "universityName", "scholarshipName", "interviewFormat", 
          "etiquetteTips", "culturalFit", "technicalAdvice", 
          "doPoints", "dontPoints", "starPractice"
        ]
      }
    }
  }));

  try {
    return JSON.parse(response.text || "null");
  } catch (e) {
    console.error("Failed to parse university interview tips:", e);
    return null;
  }
}


