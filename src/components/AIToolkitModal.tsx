import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Rocket, FileText, Calendar, 
  MessageSquare, ChevronRight, Loader2, 
  CheckCircle2, AlertCircle, TrendingUp, 
  Target, GraduationCap, Briefcase, Award,
  Send, UserCheck, Clock, Download, Copy,
  Globe, BrainCircuit
} from 'lucide-react';
import { Scholarship, UserProfile } from '../types';
import * as Gemini from '../services/geminiService';
import { UniversityInterviewTips } from './UniversityInterviewTips';

interface AIToolkitModalProps {
  scholarship: Scholarship;
  profile: UserProfile | null;
  onClose: () => void;
  initialTab?: Tab;
}

type Tab = 'success' | 'sop' | 'interview' | 'university-tips' | 'timeline' | 'lor' | 'essay';

export function AIToolkitModal({ scholarship, profile, onClose, initialTab }: AIToolkitModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'success');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [sopData, setSopData] = useState<string | null>(null);
  const [essayFeedback, setEssayFeedback] = useState<any>(null);
  
  // Essay Feedback state
  const [essayContent, setEssayContent] = useState('');

  // LOR Briefing state
  const [lorBrief, setLorBrief] = useState<any>(null);

  const handleError = (e: any) => {
    console.error(e);
    const message = e.message || String(e);
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      setError("AI service is currently under high demand. Please try again in 30 seconds.");
    } else {
      setError("An error occurred while connecting to the AI. Please try again.");
    }
  };

  useEffect(() => {
    setError(null);
  }, [activeTab]);

  const handleFetchLOR = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const result = await Gemini.getLORGuidance(profile, scholarship, { name: 'Referee', role: 'Professor', relationship: 'Academic' });
      setLorBrief(result);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGetEssayFeedback = async () => {
    if (!profile || !essayContent) return;
    setLoading(true);
    try {
      const result = await Gemini.getEssayFeedback(scholarship, "Evaluate this scholarship essay draft.", essayContent);
      setEssayFeedback(result);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  // SOP Generator state
  const [sopInputs, setSopInputs] = useState({
    whyThisCountry: '',
    careerGoal: '',
    biggestChallenge: '',
    proudestAchievement: '',
    whyThisUniversity: `I am particularly drawn to ${scholarship.university}'s reputation for academic excellence.`
  });

  // Success Prob state
  const [probData, setProbData] = useState<any>(null);

  // Interview Prep state
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'success' && !probData && profile) {
      handleFetchSuccessProb();
    } else if (activeTab === 'timeline' && !timelineData && profile) {
      handleFetchTimeline();
    } else if (activeTab === 'lor' && !lorBrief && profile) {
      handleFetchLOR();
    }
  }, [activeTab, profile, probData, timelineData, lorBrief]);

  const handleFetchSuccessProb = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const result = await Gemini.getSuccessProbability(profile, scholarship);
      setProbData(result);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTimeline = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const result = await Gemini.getApplicationTimeline(profile, scholarship);
      setTimelineData(result);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSOP = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const result = await Gemini.generateSOP(profile, scholarship, sopInputs);
      setSopData(result);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchQuestions = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const result = await Gemini.getDetailedInterviewPrep(profile, scholarship);
      setInterviewQuestions(result);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!profile || !interviewQuestions[currentQuestionIndex]) return;
    setLoading(true);
    try {
      const result = await Gemini.evaluateInterviewAnswer(
        profile, 
        scholarship, 
        interviewQuestions[currentQuestionIndex].question, 
        answer
      );
      setEvaluation(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[1400px] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[850px]"
      >
        {/* Sidebar Tabs */}
        <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-brand-600 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-slate-900">AI Toolkit</h2>
          </div>

          <nav className="space-y-1 flex-1">
            {[
              { id: 'success', label: 'Success Analysis', icon: <Rocket className="w-4 h-4" /> },
              { id: 'sop', label: 'SOP Generator', icon: <FileText className="w-4 h-4" /> },
              { id: 'essay', label: 'Essay Feedback', icon: <MessageSquare className="w-4 h-4" /> },
              { id: 'interview', label: 'Interview Coach', icon: <UserCheck className="w-4 h-4" /> },
              { id: 'university-tips', label: 'University Interview Tips', icon: <GraduationCap className="w-4 h-4" /> },
              { id: 'timeline', label: 'App Timeline', icon: <Calendar className="w-4 h-4" /> },
              { id: 'lor', label: 'LOR Briefing', icon: <Award className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  setEvaluation(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-brand-600 shadow-md shadow-brand-500/5 ring-1 ring-slate-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 p-4 bg-brand-50 rounded-3xl border border-brand-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-brand-600" />
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">ScholarMind Pro</span>
            </div>
            <p className="text-[11px] text-brand-950 font-medium leading-relaxed">
              Premium features unlocked for your academic journey.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-8 md:p-12">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-rose-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'success' && 'Chances & Analysis'}
                {activeTab === 'sop' && 'Statement of Purpose Writer'}
                {activeTab === 'essay' && 'AI Essay Feedback'}
                {activeTab === 'interview' && 'Scholarship Interview Coach'}
                {activeTab === 'university-tips' && 'University Interview Intelligence'}
                {activeTab === 'timeline' && 'Your Application Roadmap'}
                {activeTab === 'lor' && 'Recommendation Briefing'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">{scholarship.scholarshipName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {!profile && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-900">Complete your profile</h4>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">Our AI needs your academic background to provide personalized analysis and tools.</p>
            </div>
          )}

          {profile && (
            <div className="space-y-8">
              {/* SUCCESS ANALYSIS TAB */}
              {activeTab === 'success' && (
                <div className="space-y-10">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                      <div className="relative">
                        <Loader2 className="w-16 h-16 text-brand-600 animate-spin" />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 bg-brand-400 blur-2xl rounded-full"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-1">Synthesizing Profile Data</p>
                        <p className="text-xs text-slate-400">Running compatibility algorithms...</p>
                      </div>
                    </div>
                  ) : probData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-12">
                        <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-30" />
                          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-20" />
                          
                          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="relative w-48 h-48 shrink-0">
                               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle className="text-white/10" strokeWidth="2.5" stroke="currentColor" fill="none" r="16" cx="18" cy="18" />
                                <motion.circle 
                                  initial={{ strokeDasharray: "0 100" }}
                                  animate={{ strokeDasharray: `${probData.percentageRange.split('-')[1]} 100` }}
                                  transition={{ duration: 2, ease: "easeOut" }}
                                  className="text-brand-400" 
                                  strokeWidth="2.5" 
                                  strokeLinecap="round" 
                                  stroke="currentColor" 
                                  fill="none" 
                                  r="16" cx="18" cy="18" 
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-bold tracking-tighter leading-none">{probData.percentageRange}</span>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">Chance</span>
                              </div>
                            </div>
                            
                            <div className="flex-1 space-y-6 text-center md:text-left">
                              <div>
                                <h4 className="text-brand-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">AI Verdict</h4>
                                <p className="text-2xl md:text-3xl font-bold leading-tight tracking-tight italic">
                                  "{probData.overallVerdict}"
                                </p>
                              </div>
                              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Target Rank</span>
                                  <span className="text-sm font-bold">Top 5%</span>
                                </div>
                                <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Profile Strength</span>
                                  <span className="text-sm font-bold text-emerald-400">Exceptional</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-7 space-y-8">
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Comparative Advantages</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {probData.strengths?.map((s: string, i: number) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-4 bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                              >
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 transition-colors">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                                </div>
                                <span className="text-[13px] font-semibold text-slate-700 leading-snug">{s}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">High-Impact Optimization Tips</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {probData.weaknesses?.map((w: string, i: number) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                                className="flex items-start gap-4 bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                              >
                                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0 group-hover:bg-rose-500 transition-colors">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 group-hover:text-white" />
                                </div>
                                <span className="text-[13px] font-semibold text-slate-700 leading-snug">{w}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5">
                        <div className="bg-slate-50 border border-slate-200/60 rounded-[32px] p-8 sticky top-0">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                             <Target className="w-4 h-4" /> Competitor Benchmarking
                          </h4>
                          <p className="text-[13px] text-slate-600 leading-relaxed italic bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
                            "{probData.competitorProfile}"
                          </p>
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                   <span>Academic Excellence</span>
                                   <span>9.2/10</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                   <div className="h-full bg-brand-500" style={{ width: '92%' }} />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                   <span>Experience Weight</span>
                                   <span>8.5/10</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                   <div className="h-full bg-brand-500" style={{ width: '85%' }} />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                   <span>Leadership Signal</span>
                                   <span>7.8/10</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500" style={{ width: '78%' }} />
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* SOP GENERATOR TAB */}
              {activeTab === 'sop' && (
                <div className="h-full">
                  {!sopData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                      <div className="lg:col-span-8 space-y-8">
                        <div className="bg-slate-50 border border-slate-200/60 rounded-[32px] p-8 md:p-10">
                           <div className="flex items-center gap-3 mb-8">
                              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
                                <Sparkles className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-slate-900 tracking-tight">Statement of Purpose Architect</h4>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">Let's build your academic narrative</p>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                              {[
                                { id: 'whyThisCountry', label: 'Why this destination?', icon: <Globe className="w-3.5 h-3.5" />, placeholder: 'e.g., Innovative research hub, cultural growth...' },
                                { id: 'careerGoal', label: 'Long-term Career Goal', icon: <Target className="w-3.5 h-3.5" />, placeholder: 'e.g., Establishing an NGO for rural education...' },
                                { id: 'biggestChallenge', label: 'Defining Challenge', icon: <AlertCircle className="w-3.5 h-3.5" />, placeholder: 'Share a moment that shaped your resilience...' },
                                { id: 'proudestAchievement', label: 'Peak Achievement', icon: <Award className="w-3.5 h-3.5" />, placeholder: 'An accomplishment that defines you...' },
                              ].map(field => (
                                <div key={field.id} className="space-y-2">
                                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                                    {field.icon} {field.label}
                                  </label>
                                  <textarea
                                    value={(sopInputs as any)[field.id]}
                                    onChange={(e) => setSopInputs(prev => ({ ...prev, [field.id]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none h-32 custom-scrollbar shadow-sm"
                                  />
                                </div>
                              ))}
                              <div className="md:col-span-2 space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                                  <GraduationCap className="w-3.5 h-3.5" /> Institutional Alignment
                                </label>
                                <textarea
                                  value={(sopInputs as any).whyThisUniversity}
                                  onChange={(e) => setSopInputs(prev => ({ ...prev, whyThisUniversity: e.target.value }))}
                                  placeholder="Why is THIS university the perfect fit for you?"
                                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none h-32 custom-scrollbar shadow-sm"
                                />
                              </div>
                           </div>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-[32px] p-8 text-white overflow-hidden relative shadow-2xl">
                          <div className="absolute top-0 right-0 p-6 opacity-20"><FileText className="w-20 h-20" /></div>
                          <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-4">Guidelines</h5>
                          <ul className="space-y-4 mb-10">
                            {[
                              '800-1000 Words Target',
                              'Strict Academic Tone',
                              'Tailored to Faculty Interests',
                              'Clear Career Trajectory'
                            ].map((g, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm font-medium text-white/80">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                                {g}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={handleGenerateSOP}
                            disabled={loading}
                            className="w-full bg-white text-slate-900 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-brand-50 transition-all shadow-xl group disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-brand-600 group-hover:scale-125 transition-transform" />}
                            {loading ? 'Drafting Engine Working...' : 'Craft My Statement'}
                          </button>
                        </div>
                        
                        <div className="bg-brand-50 border border-brand-100 rounded-[32px] p-6">
                          <h5 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-3">AI Engine Status</h5>
                          <div className="flex items-center gap-3 mb-4">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-xs font-bold text-brand-950">Gemini Pro 1.5 Active</span>
                          </div>
                          <p className="text-[11px] text-brand-900/60 leading-relaxed font-medium">
                            Synthesizing personal sopData with scholarship requirements for maximum impact.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100 rounded-[40px] p-4 md:p-8 min-h-full">
                       <div className="max-w-4xl mx-auto space-y-8">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-brand-600" />
                               </div>
                               <div>
                                  <h4 className="text-xl font-bold text-slate-900">Your Masterpiece</h4>
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                     <Clock className="w-3.5 h-3.5" /> Generated Just Now
                                  </div>
                               </div>
                            </div>
                            <div className="flex gap-3">
                               <button onClick={() => handleCopy(sopData)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-600 rounded-2xl text-sm font-bold transition-all shadow-sm group">
                                 <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" /> Copy Text
                               </button>
                               <button onClick={() => setSopData(null)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold transition-all shadow-xl hover:bg-slate-800">
                                 Refine Inputs
                               </button>
                            </div>
                         </div>
                         
                         {/* Document Preview */}
                         <motion.div 
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-200 p-12 md:p-20 relative"
                         >
                            {/* Paper marks */}
                            <div className="absolute top-8 left-8 w-12 h-1 bg-slate-100" />
                            <div className="absolute top-8 right-8 w-12 h-1 bg-slate-100" />
                            
                            <div className="prose prose-slate max-w-none">
                               <div className="text-slate-800 leading-[1.8] whitespace-pre-wrap font-serif text-lg selection:bg-brand-100 selection:text-brand-900">
                                  {sopData}
                               </div>
                            </div>
                         </motion.div>
                         
                         {/* AI Feedback Bar on Draft */}
                         <div className="bg-emerald-900 text-white rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                               <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                               <h5 className="text-lg font-bold mb-2 tracking-tight">AI Quality Score: Superior</h5>
                               <p className="text-sm text-emerald-100/80 leading-relaxed font-medium">
                                 This statement effectively bridges your past achievements with {scholarship.university}'s mission. The narrative arc shows clear leadership evolution.
                               </p>
                            </div>
                            <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold transition-all whitespace-nowrap shadow-lg shadow-emerald-950">
                               Download PDF
                            </button>
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* INTERVIEW COACH TAB */}
              {activeTab === 'interview' && (
                <div className="space-y-8">
                  {interviewQuestions.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center mx-auto mb-6">
                        <UserCheck className="w-10 h-10 text-brand-600" />
                      </div>
                      <h4 className="text-2xl font-bold text-slate-900">Scholarship Panel Simulation</h4>
                      <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed mb-8">
                        Prepare for the competitive interview rounds with our simulated panel. We'll generate the 10 most likely questions based on this scholarship's values.
                      </p>
                      <button
                        onClick={handleFetchQuestions}
                        disabled={loading}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 mx-auto transition-all shadow-xl"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {loading ? 'Analyzing Scholarship Values...' : 'Start Mock Interview'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-12">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-brand-600"
                              animate={{ width: `${((currentQuestionIndex + 1) / interviewQuestions.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-400">Q{currentQuestionIndex + 1} of {interviewQuestions.length}</span>
                        </div>
                      </div>

                      <div className="lg:col-span-7 space-y-6">
                        <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MessageSquare className="w-20 h-20" />
                          </div>
                          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-widest mb-4">
                            {interviewQuestions[currentQuestionIndex].type}
                          </span>
                          <h4 className="text-xl md:text-2xl font-bold leading-tight relative z-10 italic">
                            "{interviewQuestions[currentQuestionIndex].question}"
                          </h4>
                          <p className="mt-6 text-sm text-white/50 leading-relaxed italic border-t border-white/10 pt-4">
                            Expert Context: {interviewQuestions[currentQuestionIndex].whyTheyAsk}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Your Practice Answer</label>
                            {evaluation && (
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                evaluation.grade === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                                evaluation.grade === 'Good' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {evaluation.grade} • {evaluation.score}/10
                              </span>
                            )}
                          </div>
                          <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your practice answer here (be specific with your examples)..."
                            className="w-full px-6 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-h-[200px]"
                          />
                          {!evaluation ? (
                            <button
                              onClick={handleEvaluateAnswer}
                              disabled={loading || !answer}
                              className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-500 disabled:opacity-50 shadow-lg shadow-brand-500/20"
                            >
                              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                              Submit for AI Evaluation
                            </button>
                          ) : (
                            <div className="flex gap-4">
                              <button
                                onClick={() => {
                                  setAnswer('');
                                  setEvaluation(null);
                                  setCurrentQuestionIndex(prev => (prev + 1) % interviewQuestions.length);
                                }}
                                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
                              >
                                Next Question
                                <ChevronRight className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEvaluation(null)}
                                className="px-8 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200"
                              >
                                Retake
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-5 space-y-6">
                        {evaluation ? (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                          >
                            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
                              <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">What Worked</h5>
                              <p className="text-sm text-emerald-950 font-medium leading-relaxed italic">"{evaluation.whatWorked}"</p>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6">
                              <h5 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">Needs Improvement</h5>
                              <p className="text-sm text-rose-950 font-medium leading-relaxed italic">"{evaluation.whatToImprove}"</p>
                            </div>
                            <div className="bg-brand-50 border border-brand-100 rounded-3xl p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Champion Answer (Revised)</h5>
                                <button onClick={() => handleCopy(evaluation.improvedAnswer)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Copy className="w-3.5 h-3.5 text-brand-400" /></button>
                              </div>
                              <p className="text-[13px] text-brand-950 font-medium leading-relaxed bg-white p-4 rounded-2xl border border-brand-100 italic">"{evaluation.improvedAnswer}"</p>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 h-full">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Preparation Guide</h5>
                            <ul className="space-y-4">
                              {interviewQuestions[currentQuestionIndex]?.keyPoints?.map((p: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm font-medium text-slate-600">
                                  <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 shrink-0 select-none">{i + 1}</div>
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="space-y-8">
                   {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Building Roadmap...</p>
                    </div>
                  ) : timelineData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                       <div className="lg:col-span-8 space-y-8">
                         <div className="relative border-l-2 border-slate-100 ml-8 md:ml-12 pl-8 md:pl-12 space-y-12 py-4">
                           {timelineData.timeline?.map((period: any, i: number) => (
                             <div key={i} className="relative">
                               <div className="absolute -left-[53px] md:-left-[69px] top-0 w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-brand-600 rounded-full flex items-center justify-center text-[11px] font-bold text-brand-600 z-10 shadow-sm">
                                  {i + 1}
                               </div>
                               <div>
                                 <div className="flex items-center gap-3 mb-2">
                                   <span className="text-sm font-bold text-brand-600 uppercase tracking-widest">{period.period}</span>
                                   <div className="h-0.5 flex-1 bg-slate-50" />
                                 </div>
                                 <h4 className="text-xl font-bold text-slate-900 mb-4">{period.focus}</h4>
                                 <div className="space-y-3">
                                   {period.tasks?.map((t: any, j: number) => (
                                     <div key={j} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-100 hover:bg-white transition-all shadow-sm">
                                       <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${t.priority === 'Must do' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                          <span className="text-sm font-medium text-slate-700">{t.task}</span>
                                       </div>
                                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                         <Clock className="w-3 h-3" />
                                         {t.estimatedHours}h
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>

                       <div className="lg:col-span-4 space-y-6">
                         <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
                           <div className="absolute top-0 right-0 p-4 opacity-20"><Target className="w-16 h-16" /></div>
                           <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-6">Execution Summary</h5>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <div className="text-2xl font-bold">{timelineData.totalWeeksAvailable}</div>
                               <div className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Weeks to Deadline</div>
                             </div>
                             <div>
                               <div className={`text-sm font-bold px-2 py-0.5 rounded inline-block ${
                                 timelineData.urgencyLevel.includes('Critical') ? 'bg-rose-500' : 'bg-emerald-500'
                               }`}>{timelineData.urgencyLevel.split(' ')[0]}</div>
                               <div className="text-[10px] text-white/50 uppercase font-bold tracking-widest mt-1">Urgency</div>
                             </div>
                           </div>
                         </div>

                         <div className="bg-brand-50 border border-brand-100 rounded-3xl p-6">
                           <h5 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-4">Immediate Actions</h5>
                           <div className="space-y-3">
                             {timelineData.immediateActions?.map((a: string, i: number) => (
                               <div key={i} className="flex gap-3 text-sm font-bold text-brand-950">
                                 <ChevronRight className="w-4 h-4 text-brand-600 shrink-0" />
                                 {a}
                               </div>
                             ))}
                           </div>
                         </div>

                         <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                           <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Required Documents</h5>
                           <div className="space-y-4">
                             {timelineData.documentsNeeded?.map((doc: any, i: number) => (
                               <div key={i} className="group relative">
                                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 transition-all cursor-help">
                                   <div className="flex items-center gap-2">
                                     <FileText className="w-3.5 h-3.5 text-slate-400" />
                                     <span className="text-xs font-bold text-slate-600">{doc.document}</span>
                                   </div>
                                   <span className="text-[10px] font-bold text-slate-400">{doc.typicalTimeNeeded}</span>
                                 </div>
                                 <div className="absolute left-full top-0 ml-3 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 shadow-2xl invisible group-hover:visible">
                                   <p className="font-bold mb-1">How to obtain:</p>
                                   <p className="text-white/70 leading-relaxed mb-2">{doc.howToGet}</p>
                                   {doc.warning && <p className="text-rose-400 italic">⚠️ {doc.warning}</p>}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* LOR BRIEFING TAB */}
              {activeTab === 'lor' && (
                <div className="space-y-8">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Generating Briefing...</p>
                    </div>
                  ) : lorBrief ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-brand-50 border border-brand-100 rounded-3xl p-6">
                          <h5 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-4">Letter Strategy</h5>
                          <p className="text-sm text-brand-950 font-medium leading-relaxed italic">"{lorBrief.strategy}"</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Recommended Recommenders</h5>
                          <div className="space-y-3">
                            {lorBrief.recommendedRefereeTypes?.map((type: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                <UserCheck className="w-4 h-4 text-brand-500" />
                                <span className="text-xs font-bold text-slate-700">{type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">The "Briefing Document" (Copy this to your referee)</h5>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative group">
                          <button onClick={() => handleCopy(lorBrief.suggestedTalkingPoints.join('\n'))} className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Copy className="w-4 h-4 text-slate-400" />
                          </button>
                          <div className="space-y-4">
                            {lorBrief.suggestedTalkingPoints?.map((point: string, i: number) => (
                              <div key={i} className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600 shrink-0">{i+1}</div>
                                <p className="text-[13px] text-slate-700 font-medium leading-relaxed">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* UNIVERSITY INTERVIEW TIPS TAB */}
              {activeTab === 'university-tips' && (
                <UniversityInterviewTips scholarship={scholarship} profile={profile} />
              )}

              {/* ESSAY FEEDBACK TAB */}
              {activeTab === 'essay' && (
                <div className="space-y-8">
                  {!essayFeedback ? (
                    <div className="space-y-6">
                      <div className="bg-brand-50 rounded-3xl p-8 border border-brand-100">
                        <h5 className="text-xl font-bold text-brand-950 mb-2">Essay Reviewer</h5>
                        <p className="text-sm text-brand-900 leading-relaxed max-w-2xl">
                          Paste your scholarship essay draft below. Our AI will analyze it against the specific selection criteria of this scholarship and provide detailed improvement tips.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Your Essay Draft</label>
                        <textarea
                          value={essayContent}
                          onChange={(e) => setEssayContent(e.target.value)}
                          placeholder="Paste your essay here..."
                          className="w-full px-8 py-8 bg-slate-50 border border-slate-100 rounded-[32px] text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-h-[400px] resize-none"
                        />
                      </div>
                      <button
                        onClick={handleGetEssayFeedback}
                        disabled={loading || !essayContent}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 shadow-xl"
                      >
                         {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                         {loading ? 'Analyzing your writing...' : 'Get Deep Feedback'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-8">
                         <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Detailed Improvement Tips</h4>
                         <div className="space-y-4">
                           {essayFeedback.improvements?.map((imp: any, i: number) => (
                             <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                               <div className="flex items-center justify-between">
                                 <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">{imp.category}</span>
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                   imp.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                                 }`}>{imp.priority} Priority</span>
                               </div>
                               <h5 className="font-bold text-slate-900">Original: <span className="text-slate-400 font-normal italic line-through">"{imp.originalPhrase}"</span></h5>
                               <p className="text-sm text-slate-600 leading-relaxed font-medium">Suggestion: <span className="text-brand-600 italic">"{imp.suggestion}"</span></p>
                               <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 leading-relaxed">
                                 <span className="font-bold text-slate-700">Why:</span> {imp.reason}
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                      <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-3xl p-6 text-white text-center">
                           <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Overall Score</div>
                           <div className="text-4xl font-bold mb-4">{essayFeedback.overallScore}/10</div>
                           <div className="space-y-4">
                             {essayFeedback.metricScores && Object.entries(essayFeedback.metricScores).map(([m, s]: [any, any]) => (
                               <div key={m} className="space-y-1">
                                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/50">
                                   <span>{m}</span>
                                   <span>{s}/10</span>
                                 </div>
                                 <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                   <div className="h-full bg-brand-400" style={{ width: `${s * 10}%` }} />
                                 </div>
                               </div>
                             ))}
                           </div>
                        </div>
                        <div className="bg-brand-50 border border-brand-100 rounded-3xl p-6">
                           <h5 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-2">The "Next Step"</h5>
                           <p className="text-sm text-brand-950 font-medium leading-relaxed italic">"{essayFeedback.nextFocus}"</p>
                        </div>
                        <button onClick={() => setEssayFeedback(null)} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">Edit Essay</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
