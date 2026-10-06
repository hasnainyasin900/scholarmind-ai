export interface StudentProfile {
  name: string;
  nationality: string;           // e.g. "Pakistani"
  currentDegree: string;         // e.g. "Bachelor's in Computer Science"
  targetDegree: string;          // e.g. "Master's in AI"
  gpa: string;                   // e.g. "3.5/4.0" or "75%"
  ieltsScore: string;            // e.g. "7.0" or "not taken"
  fieldOfStudy: string;          // e.g. "Computer Science"
  targetCountries: string[];     // e.g. ["UK", "Germany", "USA"]
  workExperience: string;        // e.g. "2 years as software developer" or "none"
  researchPublications: string;  // e.g. "1 paper published" or "none"
  financialNeed: "high" | "medium" | "low";
  extracurriculars: string;      // e.g. "volunteer work, student council"
}

export interface ScholarshipData {
  id: number;
  scholarshipName: string;
  university: string;
  country: string;
  degreeLevel: string;
  fundingCoverage: string;
  eligibility: string;
  requiredDocuments: string[];
  ieltsRequirement: string;
  ieltsWaiverInfo: string;
  closingDate: string;
  competitivenessLevel: string;
  rankingReason: string;
}

export interface UserProfile {
  // Personal Info
  fullName?: string;
  profilePic?: string; // Base64 image
  
  // Academic Background
  pastStudy?: string; // e.g., "BSc Computer Science from MIT"
  gpa: string;
  
  // Test Scores
  ielts: string;
  greGmat?: string;
  
  // Experience & Achievements
  workExperience?: string;
  researchExp?: string;
  publications?: string;
  extracurriculars?: string;
  
  // Goals & Preferences
  field: string;
  degree: string; // Target degree
  country: string; // Preferred country
  budget: string;
}

export interface Scholarship {
  id: number;
  scholarshipName: string;
  university: string;
  country: string;
  degreeLevel: string;
  fundingCoverage: string;
  openingDate: string;
  closingDate: string;
  eligibility: string;
  requiredDocuments: string[];
  ieltsRequirement: string;
  ieltsWaiverInfo?: string;
  applicationLink: string;
  matchScore: number;
  competitivenessLevel: string; // "Low", "Moderate", "Competitive", "Extremely Competitive"
  successProbability: number; // 0-100
  rankingReason: string;
  status: 'Applied' | 'Interviewing' | 'Accepted' | 'Rejected' | 'None';
  isAnnual: boolean;
  tags: string[];
  isFavorite: boolean;
}

export interface VisaInfo {
  country: string;
  visaName: string;
  financialProofAmount: string;
  bankStatementDuration: string;
  visaFee: string;
  processingTime: string;
  interviewRequired: boolean;
  workRights: string;
  postStudyWorkOptions: string;
  officialLink: string;
}

export interface CountryComparison {
  id?: number;
  country: string;
  visaDifficulty: 'Easy' | 'Moderate' | 'Hard';
  costOfLiving: string;
  prOptions: string;
  acceptanceRate: string;
  partTimeWorkAllowance: string;
  postStudyWorkDuration: string;
  languageRequirements: string;
  englishProficiencyRequirements: string;
  averageTuitionFees: string;
  visaSuccessProbability: number;
  pros: string[];
  cons: string[];
}

export interface InterviewPrep {
  questions: {
    question: string;
    suggestedAnswer: string;
    tips: string;
  }[];
}

export interface UniversityComparison {
  universityName: string;
  country: string;
  globalRanking: string;
  averageTuition: string;
  averageScholarshipAmount: string;
  acceptanceRate: string;
  keyPrograms: string[];
  ieltsRequirement: string;
  costOfLivingEstimate: string;
  suitabilityReason: string;
  compatibilityScore?: number;
}

export interface UniversityInterviewTips {
  universityName: string;
  scholarshipName: string;
  interviewFormat: string;
  etiquetteTips: string[];
  culturalFit: string;
  technicalAdvice: string;
  doPoints: string[];
  dontPoints: string[];
  starPractice: {
    question: string;
    situationExample: string;
    taskExample: string;
    actionExample: string;
    resultExample: string;
  }[];
}


