import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, GraduationCap, AlertCircle, Loader2, 
  CheckCircle, XCircle, BookOpen, Award, ListChecks,
  Compass, HelpCircle, ChevronRight, ChevronDown, Copy
} from 'lucide-react';
import { Scholarship, UserProfile, UniversityInterviewTips as TipsType } from '../types';
import * as Gemini from '../services/geminiService';

interface UniversityInterviewTipsProps {
  scholarship: Scholarship;
  profile: UserProfile | null;
}

export function UniversityInterviewTips({ scholarship, profile }: UniversityInterviewTipsProps) {
  const [tips, setTips] = useState<TipsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'dos' | 'star'>('overview');
  const [expandedStarIndex, setExpandedStarIndex] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchTips = async () => {
    if (!profile) {
      setError("Please complete your profile first to receive personalized interview tips.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await Gemini.getUniversityInterviewTips(profile, scholarship);
      if (data) {
        setTips(data);
      } else {
        setError("Failed to generate university-specific interview tips. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while communicating with the AI model. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, [scholarship.scholarshipName, profile?.field]);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (error) {
    return (
      <div className="bg-rose-50/50 rounded-3xl p-8 border border-rose-100 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <div>
          <h4 className="text-lg font-bold text-slate-900">Unable to load Interview Tips</h4>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
        </div>
        <button
          onClick={fetchTips}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
        >
          Retry Generating
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-50/50 rounded-[32px] border border-slate-100">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-700 uppercase tracking-widest animate-pulse">Analyzing Interview Protocol</p>
          <p className="text-xs text-slate-400 font-medium max-w-xs px-4">Tailoring guidelines to {scholarship.university} and your {profile?.field || 'selected'} background...</p>
        </div>
      </div>
    );
  }

  if (!tips) {
    return (
      <div className="text-center py-20 bg-slate-50/50 rounded-[32px] border border-slate-100">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-8 h-8 text-brand-500" />
        </div>
        <h4 className="text-xl font-bold text-slate-900">University Interview Prep</h4>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed mb-6">
          Generate bespoke academic interview tips, country-specific etiquette, and sample answers based on this opportunity.
        </p>
        <button
          onClick={fetchTips}
          className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mx-auto transition-all shadow-lg shadow-brand-500/10"
        >
          <Sparkles className="w-4 h-4" />
          Generate Interview Intelligence
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="relative bg-slate-900 rounded-[32px] p-8 text-white overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-5"><GraduationCap className="w-32 h-32" /></div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-500 to-emerald-500" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-brand-400">
              Admission Intelligence
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {scholarship.country} Protocol
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black leading-tight">
            Interview Prep: {tips.universityName}
          </h3>
          <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-3xl">
            Admissions committees at {tips.universityName} focus heavily on fit, ambition, and research alignment. 
            Below are specialized guidelines and STAR responses prepared specifically for your background.
          </p>
        </div>
      </div>

      {/* Selector Subtabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
            activeSubTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview & Etiquette
        </button>
        <button
          onClick={() => setActiveSubTab('dos')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
            activeSubTab === 'dos'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Do's & Don'ts
        </button>
        <button
          onClick={() => setActiveSubTab('star')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
            activeSubTab === 'star'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          STAR Framework
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Format & Culture */}
              <div className="lg:col-span-7 space-y-6">
                {/* Format Panel */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Compass className="w-4 h-4 text-brand-500" />
                    Expected Interview Format
                  </h4>
                  <p className="text-sm font-bold text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                    {tips.interviewFormat}
                  </p>
                </div>

                {/* Cultural Fit */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-500" />
                    Institutional Cultural Fit
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {tips.culturalFit}
                  </p>
                </div>

                {/* Technical Advice */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                    Field-Specific Advice ({profile?.field})
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
                    {tips.technicalAdvice}
                  </p>
                </div>
              </div>

              {/* Right Column - Etiquette Tips */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-brand-500" />
                    Country Etiquette ({scholarship.country})
                  </h4>
                  <ul className="space-y-4">
                    {tips.etiquetteTips.map((tip, idx) => (
                      <li key={idx} className="flex gap-3 text-sm font-medium text-slate-700 bg-white p-4.5 rounded-2xl border border-slate-200/50 shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[10px] font-black shrink-0 select-none">
                          {idx + 1}
                        </div>
                        <span className="leading-normal">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'dos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Do Points */}
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-emerald-900 uppercase tracking-widest text-xs">Winning Do's</h4>
                </div>
                <div className="space-y-3">
                  {tips.doPoints.map((doPt, idx) => (
                    <div key={idx} className="bg-white p-4.5 rounded-2xl border border-emerald-100 shadow-sm flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <p className="text-sm font-bold text-slate-700 leading-normal">{doPt}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Don't Points */}
              <div className="bg-rose-50/30 border border-rose-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-rose-900 uppercase tracking-widest text-xs">Mistakes to Avoid</h4>
                </div>
                <div className="space-y-3">
                  {tips.dontPoints.map((dontPt, idx) => (
                    <div key={idx} className="bg-white p-4.5 rounded-2xl border border-rose-100 shadow-sm flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                      <p className="text-sm font-bold text-slate-700 leading-normal">{dontPt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'star' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-start gap-3.5">
                <HelpCircle className="w-6 h-6 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Interactive STAR Framework Practice</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    admissions panels look for structured answers. Click on the questions below to see how to align your experiences perfectly to the Situation, Task, Action, and Result (STAR) framework.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {tips.starPractice.map((star, idx) => {
                  const isExpanded = expandedStarIndex === idx;
                  return (
                    <div key={idx} className="bg-white border border-slate-200 rounded-[28px] overflow-hidden transition-all duration-300">
                      <button
                        onClick={() => setExpandedStarIndex(isExpanded ? -1 : idx)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-4.5 pr-4">
                          <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center font-bold text-sm text-brand-600 shrink-0">
                            Q{idx + 1}
                          </div>
                          <span className="font-bold text-slate-900 text-sm md:text-base leading-snug">{star.question}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* S & T */}
                              <div className="space-y-4">
                                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                                  <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest block">Situation (Background)</span>
                                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{star.situationExample}</p>
                                </div>
                                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                                  <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest block">Task (Your Goal)</span>
                                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{star.taskExample}</p>
                                </div>
                              </div>

                              {/* A & R */}
                              <div className="space-y-4">
                                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Action (What You Did)</span>
                                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{star.actionExample}</p>
                                </div>
                                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Result (The Outcome)</span>
                                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{star.resultExample}</p>
                                </div>
                              </div>

                              {/* Copy Complete Answer */}
                              <div className="md:col-span-2 pt-2 flex justify-end">
                                <button
                                  onClick={() => handleCopyText(`Question: ${star.question}\n\nSTAR Structure:\n- Situation: ${star.situationExample}\n- Task: ${star.taskExample}\n- Action: ${star.actionExample}\n- Result: ${star.resultExample}`, idx)}
                                  className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm"
                                >
                                  {copiedIndex === idx ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedIndex === idx ? "Copied Structure!" : "Copy STAR Draft"}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
