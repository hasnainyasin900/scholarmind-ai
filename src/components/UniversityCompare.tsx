import React, { useState, useEffect } from 'react';
import { Scholarship, UserProfile, UniversityComparison } from '../types';
import { compareUniversities } from '../services/geminiService';
import { 
  GraduationCap, 
  DollarSign, 
  Award, 
  TrendingUp, 
  Languages, 
  MapPin, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  Shuffle, 
  Compass, 
  BookOpen,
  CheckCircle2,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

interface UniversityCompareProps {
  scholarships: Scholarship[];
  profile?: UserProfile | null;
}

// Fallback universities if the scholarship list is empty
const DEFAULT_UNIVERSITIES = [
  "Massachusetts Institute of Technology (MIT)",
  "University of Oxford",
  "Stanford University",
  "University of Cambridge",
  "Harvard University",
  "ETH Zurich",
  "National University of Singapore (NUS)",
  "Imperial College London",
  "Technical University of Munich (TUM)",
  "University of Toronto",
  "Heidelberg University",
  "University of Melbourne"
];

export function UniversityCompare({ scholarships, profile }: UniversityCompareProps) {
  // Extract unique university list from scholarships
  const userUniversities = React.useMemo(() => {
    const unis = scholarships
      .map(s => s.university.trim())
      .filter((uni, index, self) => uni && self.indexOf(uni) === index);
    return unis;
  }, [scholarships]);

  // Combined list of universities to select from
  const availableUniversities = React.useMemo(() => {
    const combined = [...userUniversities];
    DEFAULT_UNIVERSITIES.forEach(defUni => {
      if (!combined.some(u => u.toLowerCase() === defUni.toLowerCase())) {
        combined.push(defUni);
      }
    });
    return combined;
  }, [userUniversities]);

  const [uni1, setUni1] = useState<string>('');
  const [uni2, setUni2] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<UniversityComparison[] | null>(null);

  // Helper to parse currency or numeric amounts from string (e.g., "$45,000" or "£12,000")
  const parseAmount = (str: string, isMonthlyDefault = false): number => {
    if (!str) return 0;
    const clean = str.replace(/,/g, '').toLowerCase();
    
    // Find first number
    const match = clean.match(/\d+/);
    if (!match) return 0;
    
    let val = parseInt(match[0], 10);
    
    // Check if string mentions 'k' like '45k'
    if (clean.includes('k') && !clean.includes('lakh')) {
      val = val * 1000;
    }
    
    // Check if it's monthly
    const isMonthly = isMonthlyDefault || clean.includes('month') || clean.includes('/mo') || clean.includes('monthly');
    if (isMonthly) {
      val = val * 12;
    }
    
    return val;
  };

  const parsePercent = (str: string): number => {
    if (!str) return 0;
    const match = str.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const parseRank = (str: string): number => {
    if (!str) return 0;
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1000;
  };

  const parseIELTS = (str: string): number => {
    if (!str) return 0;
    const match = str.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const chartData = React.useMemo(() => {
    if (!comparison || comparison.length < 2) return { financial: [], academic: [] };

    const uni1Obj = comparison[0];
    const uni2Obj = comparison[1];

    const tuition1 = parseAmount(uni1Obj.averageTuition);
    const tuition2 = parseAmount(uni2Obj.averageTuition);

    const scholarship1 = parseAmount(uni1Obj.averageScholarshipAmount);
    const scholarship2 = parseAmount(uni2Obj.averageScholarshipAmount);

    const living1 = parseAmount(uni1Obj.costOfLivingEstimate, true);
    const living2 = parseAmount(uni2Obj.costOfLivingEstimate, true);

    const financial = [
      {
        metric: 'Tuition Fees',
        [uni1Obj.universityName]: tuition1,
        [uni2Obj.universityName]: tuition2,
      },
      {
        metric: 'Scholarship Coverage',
        [uni1Obj.universityName]: scholarship1,
        [uni2Obj.universityName]: scholarship2,
      },
      {
        metric: 'Cost of Living',
        [uni1Obj.universityName]: living1,
        [uni2Obj.universityName]: living2,
      }
    ];

    // Compute academic radar metrics (normalized 0-100 score)
    const rank1 = parseRank(uni1Obj.globalRanking);
    const rank2 = parseRank(uni2Obj.globalRanking);

    // Rank Percentile: lower is better rank. Let's make top rank close to 100
    const rankScore1 = Math.max(10, Math.min(100, 100 - (rank1 * 0.1)));
    const rankScore2 = Math.max(10, Math.min(100, 100 - (rank2 * 0.1)));

    // Selectivity: lower acceptance rate means higher selectivity
    const accept1 = parsePercent(uni1Obj.acceptanceRate);
    const accept2 = parsePercent(uni2Obj.acceptanceRate);
    const selectivity1 = Math.max(5, Math.min(100, 100 - accept1));
    const selectivity2 = Math.max(5, Math.min(100, 100 - accept2));

    // IELTS requirement (0-9 score mapped to 0-100 scale: score * 10)
    const ielts1 = parseIELTS(uni1Obj.ieltsRequirement) * 10;
    const ielts2 = parseIELTS(uni2Obj.ieltsRequirement) * 10;

    // Affordability index (more affordable (lower tuition) = higher score)
    const affordScore1 = Math.max(10, Math.min(100, 100 - (tuition1 / 800)));
    const affordScore2 = Math.max(10, Math.min(100, 100 - (tuition2 / 800)));

    // Funding ratio index (% of tuition covered by scholarship)
    const coverScore1 = tuition1 > 0 ? Math.min(100, (scholarship1 / tuition1) * 100) : (scholarship1 > 0 ? 100 : 20);
    const coverScore2 = tuition2 > 0 ? Math.min(100, (scholarship2 / tuition2) * 100) : (scholarship2 > 0 ? 100 : 20);

    const academic = [
      { subject: 'Academic Rank', [uni1Obj.universityName]: Math.round(rankScore1), [uni2Obj.universityName]: Math.round(rankScore2), fullMark: 100 },
      { subject: 'Selectivity', [uni1Obj.universityName]: Math.round(selectivity1), [uni2Obj.universityName]: Math.round(selectivity2), fullMark: 100 },
      { subject: 'English Standards', [uni1Obj.universityName]: Math.round(ielts1), [uni2Obj.universityName]: Math.round(ielts2), fullMark: 100 },
      { subject: 'Affordability', [uni1Obj.universityName]: Math.round(affordScore1), [uni2Obj.universityName]: Math.round(affordScore2), fullMark: 100 },
      { subject: 'Funding Support', [uni1Obj.universityName]: Math.round(coverScore1), [uni2Obj.universityName]: Math.round(coverScore2), fullMark: 100 }
    ];

    return { financial, academic };
  }, [comparison]);

  const calculateFallbackScore = (item: UniversityComparison, userProfile?: UserProfile | null): number => {
    if (!userProfile) return 75; // baseline

    let score = 75;

    // GPA evaluation
    if (userProfile.gpa) {
      const gpaStr = userProfile.gpa.toLowerCase();
      if (gpaStr.includes('/') || gpaStr.includes('.') || gpaStr.includes('%')) {
        if (gpaStr.includes('3.8') || gpaStr.includes('3.9') || gpaStr.includes('4.0') || gpaStr.includes('90') || gpaStr.includes('95')) {
          score += 10;
        } else if (gpaStr.includes('3.5') || gpaStr.includes('3.6') || gpaStr.includes('3.7') || gpaStr.includes('80') || gpaStr.includes('85')) {
          score += 5;
        } else if (gpaStr.includes('2.') || gpaStr.includes('60') || gpaStr.includes('70')) {
          score -= 10;
        }
      }
    }

    // IELTS evaluation
    if (userProfile.ielts && item.ieltsRequirement) {
      const pIelts = parseFloat(userProfile.ielts);
      const reqMatch = item.ieltsRequirement.match(/[\d.]+/);
      const reqIelts = reqMatch ? parseFloat(reqMatch[0]) : 6.0;
      if (!isNaN(pIelts)) {
        if (pIelts >= reqIelts) {
          score += 5;
        } else {
          score -= 10;
        }
      }
    }

    // Field match
    if (userProfile.field) {
      const fieldLower = userProfile.field.toLowerCase();
      const suitLower = item.suitabilityReason.toLowerCase();
      const programsLower = item.keyPrograms.join(' ').toLowerCase();
      if (suitLower.includes(fieldLower) || programsLower.includes(fieldLower)) {
        score += 8;
      }
    }

    // Budget check
    if (userProfile.budget && item.averageTuition) {
      const budgetVal = parseAmount(userProfile.budget);
      const tuitionVal = parseAmount(item.averageTuition);
      if (budgetVal > 0 && tuitionVal > 0) {
        if (tuitionVal <= budgetVal) {
          score += 5;
        } else {
          score -= Math.min(15, Math.round((tuitionVal - budgetVal) / 5000));
        }
      }
    }

    return Math.max(15, Math.min(100, score));
  };

  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-emerald-400';
    if (s >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (s: number) => {
    if (s >= 85) return 'bg-emerald-500/10';
    if (s >= 70) return 'bg-amber-500/10';
    return 'bg-rose-500/10';
  };

  const getScoreBarColor = (s: number) => {
    if (s >= 85) return 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]';
    if (s >= 70) return 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
    return 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return 'Excellent Match';
    if (s >= 80) return 'Very Good Match';
    if (s >= 70) return 'Good Match';
    if (s >= 55) return 'Moderate Match';
    return 'Reach Match';
  };

  const score0 = (comparison && comparison[0]) ? (comparison[0].compatibilityScore ?? calculateFallbackScore(comparison[0], profile)) : 75;
  const score1 = (comparison && comparison[1]) ? (comparison[1].compatibilityScore ?? calculateFallbackScore(comparison[1], profile)) : 75;

  // Set default selections
  useEffect(() => {
    if (availableUniversities.length >= 2) {
      setUni1(availableUniversities[0]);
      setUni2(availableUniversities[1]);
    } else if (availableUniversities.length === 1) {
      setUni1(availableUniversities[0]);
      setUni2(DEFAULT_UNIVERSITIES[0]);
    }
  }, [availableUniversities]);

  const handleCompare = async () => {
    if (!uni1 || !uni2) {
      setError("Please select two universities to compare.");
      return;
    }
    if (uni1 === uni2) {
      setError("Please select two different universities to compare.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await compareUniversities(uni1, uni2, profile || undefined);
      if (result && result.length >= 2) {
        setComparison(result);
      } else {
        throw new Error("Invalid response format received from AI. Try again.");
      }
    } catch (err: any) {
      console.error(err);
      const message = err.message || String(err);
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        setError("AI resources are temporarily busy. Please wait a moment and try again.");
      } else {
        setError("Failed to fetch university details. Please check your connection and retry.");
      }
    } finally {
      setLoading(false);
    }
  };

  const swapUniversities = () => {
    const temp = uni1;
    setUni1(uni2);
    setUni2(temp);
    if (comparison && comparison.length >= 2) {
      setComparison([comparison[1], comparison[0]]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Selector Section */}
      <div className="glass-card rounded-3xl p-6 md:p-8 bg-slate-800/60 backdrop-blur-lg border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-brand-500/20 rounded-xl border border-brand-400/30">
            <Compass className="w-5 h-5 text-brand-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">University Matcher</h3>
            <p className="text-xs text-slate-400 mt-0.5">Select two institutions to analyze and compare side-by-side</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* University 1 Selection */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">First University</label>
            <div className="relative">
              <select
                value={uni1}
                onChange={(e) => setUni1(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-sm appearance-none pr-10 cursor-pointer"
              >
                <option value="" disabled className="bg-slate-900">Select a university...</option>
                {availableUniversities.map((uni) => (
                  <option 
                    key={`uni1-${uni}`} 
                    value={uni} 
                    className="bg-slate-900 text-white"
                    disabled={uni === uni2}
                  >
                    {userUniversities.includes(uni) ? `🎓 ${uni} (From matches)` : `🏛️ ${uni}`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <Building className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center pt-2 md:pt-6">
            <button
              onClick={swapUniversities}
              className="p-3 bg-slate-700/50 hover:bg-brand-600 text-slate-300 hover:text-white rounded-full transition-all border border-slate-600/50 shadow-md transform hover:rotate-180 duration-300"
              title="Swap selection"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>

          {/* University 2 Selection */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Second University</label>
            <div className="relative">
              <select
                value={uni2}
                onChange={(e) => setUni2(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-sm appearance-none pr-10 cursor-pointer"
              >
                <option value="" disabled className="bg-slate-900">Select a university...</option>
                {availableUniversities.map((uni) => (
                  <option 
                    key={`uni2-${uni}`} 
                    value={uni} 
                    className="bg-slate-900 text-white"
                    disabled={uni === uni1}
                  >
                    {userUniversities.includes(uni) ? `🎓 ${uni} (From matches)` : `🏛️ ${uni}`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <Building className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-700/60 flex justify-end">
          <button
            onClick={handleCompare}
            disabled={loading || !uni1 || !uni2 || uni1 === uni2}
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Academic Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Compare Side-by-Side</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison Results Area */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="comparison-loading"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card rounded-3xl p-12 bg-slate-800/40 border border-slate-700/40 text-center flex flex-col items-center justify-center space-y-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="w-12 h-12 text-brand-400 animate-spin relative" />
            </div>
            <div className="space-y-1">
              <h4 className="text-white font-bold text-lg">Retrieving Institutional Databases</h4>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Our AI model is compiling latest global rankings, tuition metrics, scholarship yields, and program portfolios for both universities.
              </p>
            </div>
          </motion.div>
        )}

        {!loading && comparison && comparison.length >= 2 && (
          <motion.div
            key="comparison-table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Table / Grid Visualizer */}
            <div className="overflow-hidden glass-card rounded-3xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-lg shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/80">
                      <th className="py-5 px-6 text-xs font-extrabold text-slate-400 uppercase tracking-widest w-[20%]">Metric</th>
                      <th className="py-5 px-6 text-center w-[40%] bg-gradient-to-b from-brand-600/10 to-transparent">
                        <span className="text-sm font-black text-white block truncate">{comparison[0].universityName}</span>
                        <span className="text-[10px] font-bold text-brand-300 block uppercase mt-0.5">📍 {comparison[0].country}</span>
                      </th>
                      <th className="py-5 px-6 text-center w-[40%] bg-gradient-to-b from-violet-600/10 to-transparent">
                        <span className="text-sm font-black text-white block truncate">{comparison[1].universityName}</span>
                        <span className="text-[10px] font-bold text-violet-300 block uppercase mt-0.5">📍 {comparison[1].country}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {/* Compatibility Score */}
                    <tr className="hover:bg-slate-900/20 transition-all bg-brand-500/5">
                      <td className="py-5 px-6 font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-pulse shrink-0" />
                        <div>
                          <span className="block text-white">Match Fit</span>
                          <span className="text-[10px] text-slate-400 normal-case font-medium mt-0.5 block">Compatibility score</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center bg-brand-500/5">
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-black tracking-tight ${getScoreColor(score0)}`}>
                              {score0}%
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getScoreBg(score0)} ${getScoreColor(score0)} border border-current/20`}>
                              {getScoreLabel(score0)}
                            </span>
                          </div>
                          {/* Visual Progress Bar */}
                          <div className="w-full max-w-[150px] bg-slate-700/50 rounded-full h-2 overflow-hidden border border-slate-600/30">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(score0)}`}
                              style={{ width: `${score0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center bg-violet-500/5">
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-black tracking-tight ${getScoreColor(score1)}`}>
                              {score1}%
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getScoreBg(score1)} ${getScoreColor(score1)} border border-current/20`}>
                              {getScoreLabel(score1)}
                            </span>
                          </div>
                          {/* Visual Progress Bar */}
                          <div className="w-full max-w-[150px] bg-slate-700/50 rounded-full h-2 overflow-hidden border border-slate-600/30">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(score1)}`}
                              style={{ width: `${score1}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* QS Ranking */}
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-slate-400" />
                        <span>QS Rank</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-300 font-black text-sm">
                          {comparison[0].globalRanking}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 font-black text-sm">
                          {comparison[1].globalRanking}
                        </span>
                      </td>
                    </tr>

                    {/* Tuition Fees */}
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-300 text-xs uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span>Tuition Fees</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-white font-bold text-sm block">{comparison[0].averageTuition}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Annual Estimate</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-white font-bold text-sm block">{comparison[1].averageTuition}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Annual Estimate</span>
                      </td>
                    </tr>

                    {/* Average Scholarship Amount */}
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-300 text-xs uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-slate-400" />
                          <span>Avg Scholarship</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-emerald-400 font-black text-sm block">{comparison[0].averageScholarshipAmount}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Coverage / Support</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-emerald-400 font-black text-sm block">{comparison[1].averageScholarshipAmount}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Coverage / Support</span>
                      </td>
                    </tr>

                    {/* Acceptance Rate */}
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-300 text-xs uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-slate-400" />
                          <span>Acceptance Rate</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-white font-semibold text-sm">{comparison[0].acceptanceRate}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-white font-semibold text-sm">{comparison[1].acceptanceRate}</span>
                      </td>
                    </tr>

                    {/* IELTS/English Requirements */}
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-300 text-xs uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4 text-slate-400" />
                          <span>English Req.</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-white font-medium text-sm">{comparison[0].ieltsRequirement}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-white font-medium text-sm">{comparison[1].ieltsRequirement}</span>
                      </td>
                    </tr>

                    {/* Cost of Living */}
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-300 text-xs uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>Cost of Living</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-white font-medium text-sm block">{comparison[0].costOfLivingEstimate}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Local Area Index</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-white font-medium text-sm block">{comparison[1].costOfLivingEstimate}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Local Area Index</span>
                      </td>
                    </tr>

                    {/* Key Strengths */}
                    <tr className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-300 text-xs uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          <span>Key Strengths</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                          {comparison[0].keyPrograms.map((prog) => (
                            <span key={`comp0-${prog}`} className="text-[9px] font-bold px-2 py-0.5 bg-slate-700/50 text-slate-200 rounded-md border border-slate-600/30">
                              {prog}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                          {comparison[1].keyPrograms.map((prog) => (
                            <span key={`comp1-${prog}`} className="text-[9px] font-bold px-2 py-0.5 bg-slate-700/50 text-slate-200 rounded-md border border-slate-600/30">
                              {prog}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Charts Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Financial Comparison */}
              <div className="glass-card rounded-3xl p-6 md:p-8 bg-slate-800/60 backdrop-blur-lg border border-slate-700/60 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                      <DollarSign className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white tracking-tight">Financial Comparison</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Annual Tuition, Scholarships, and Cost of Living (USD equivalent)</p>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.financial} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                        <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', fontSize: '12px' }}
                          labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                          itemStyle={{ color: '#cbd5e1' }}
                          formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey={comparison[0].universityName} name={comparison[0].universityName} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        <Bar dataKey={comparison[1].universityName} name={comparison[1].universityName} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Profile & Standing Comparison (Radar) */}
              <div className="glass-card rounded-3xl p-6 md:p-8 bg-slate-800/60 backdrop-blur-lg border border-slate-700/60 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                      <TrendingUp className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white tracking-tight">Standing & Profile Fit</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Comparison across academic, selectivity, and funding indices</p>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData.academic}>
                        <PolarGrid stroke="#475569" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                        <Radar name={comparison[0].universityName} dataKey={comparison[0].universityName} stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.25} />
                        <Radar name={comparison[1].universityName} dataKey={comparison[1].universityName} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '12px', fontSize: '12px' }}
                          labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                          itemStyle={{ color: '#cbd5e1' }}
                          formatter={(value: any) => [`${value}/100`, 'Fit Index']}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Suitability Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Suitability Uni 1 */}
              <div className="glass-card rounded-3xl p-6 bg-slate-800/40 border border-brand-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-brand-300 mb-3">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">AI Match Analysis</span>
                  </div>
                  <h4 className="text-white font-black text-sm mb-2">{comparison[0].universityName}</h4>
                  <p className="text-slate-300 text-xs leading-relaxed italic">
                    "{comparison[0].suitabilityReason}"
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Recommended for Profile</span>
                </div>
              </div>

              {/* Suitability Uni 2 */}
              <div className="glass-card rounded-3xl p-6 bg-slate-800/40 border border-violet-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-violet-300 mb-3">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">AI Match Analysis</span>
                  </div>
                  <h4 className="text-white font-black text-sm mb-2">{comparison[1].universityName}</h4>
                  <p className="text-slate-300 text-xs leading-relaxed italic">
                    "{comparison[1].suitabilityReason}"
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Recommended for Profile</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
