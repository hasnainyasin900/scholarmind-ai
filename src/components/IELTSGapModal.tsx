import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Loader2, Target, TrendingUp, AlertCircle, CheckCircle2, GraduationCap, ChevronRight, BookOpen } from 'lucide-react';
import { UserProfile } from '../types';
import { getIELTSGapAnalysis } from '../services/geminiService';

interface IELTSGapModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export function IELTSGapModal({ profile, onClose }: IELTSGapModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getIELTSGapAnalysis(
        profile.ielts || '6.5', 
        '7.5', 
        'Speaking', 
        '3 months'
      ); // Default target 7.5
      setData(result);
    } catch (e: any) {
      console.error(e);
      const message = e.message || String(e);
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        setError("AI is currently under heavy demand. Please try again soon.");
      } else {
        setError("Could not analyze profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
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
        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">IELTS Score Builder</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Performance Gap Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-sm font-medium text-rose-600">{error}</p>
              <button 
                onClick={handleFetch}
                className="text-xs font-bold uppercase tracking-widest text-rose-700 underline underline-offset-4"
              >
                Try Again
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-brand-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Analyzing your English Proficiency...</p>
                <p className="text-xs text-slate-400 mt-1">Comparing current score with top university requirements.</p>
              </div>
            </div>
          ) : data ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand-50 border border-brand-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-2">Current Score</span>
                  <div className="text-4xl font-black text-brand-950">{profile.ielts || 'N/A'}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Target Score</span>
                  <div className="text-4xl font-black text-white">7.5+</div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  Performance Verdict
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed italic">"{data.verdict}"</p>
              </div>

              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                   <Target className="w-4 h-4" /> Improvement Strategy
                 </h3>
                 <div className="grid grid-cols-1 gap-4">
                   {data.improvementPlan.map((step: any, i: number) => (
                     <div key={i} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex gap-4 hover:border-brand-200 transition-all group">
                       <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                         {i + 1}
                       </div>
                       <div className="flex-1">
                         <h4 className="text-sm font-bold text-slate-900 mb-1">{step.module} Strategy</h4>
                         <p className="text-xs text-slate-500 leading-relaxed italic">"{step.advice}"</p>
                         <div className="mt-3 flex flex-wrap gap-2">
                            {step.resources.map((r: string, j: number) => (
                              <span key={j} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-400 border border-slate-200">{r}</span>
                            ))}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="bg-brand-600 rounded-3xl p-8 text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><BookOpen className="w-20 h-20" /></div>
                 <div className="relative z-10">
                   <h3 className="text-lg font-bold mb-2">Exclusive AI Material</h3>
                   <p className="text-white/70 text-xs mb-6 leading-relaxed max-w-sm">We've compiled a personalized practice set based on your specific gap analysis.</p>
                   <button className="flex items-center gap-2 bg-white text-brand-600 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-brand-50 transition-all shadow-xl">
                     Download Prep Pack
                     <ChevronRight className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
