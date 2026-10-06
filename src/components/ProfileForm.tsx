import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Search, BookOpen, GraduationCap, Award, Languages, DollarSign, Globe, ChevronRight, ChevronLeft, Sparkles, Loader2, Rocket, Beaker, User, Image as ImageIcon, Briefcase, FileText, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IELTSGapModal } from './IELTSGapModal';

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
  initialProfile?: UserProfile | null;
}

export function ProfileForm({ onSubmit, isLoading, initialProfile }: ProfileFormProps) {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showIELTSModal, setShowIELTSModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    profilePic: '',
    pastStudy: '',
    field: '',
    degree: '',
    gpa: '',
    ielts: '',
    greGmat: '',
    budget: '',
    country: '',
    workExperience: '',
    extracurriculars: '',
    researchExp: '',
    publications: ''
  });

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profilePic: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profile);
  };

  const isStep1Valid = profile.fullName && profile.pastStudy && profile.gpa;
  const isStep2Valid = profile.field && profile.degree;

  return (
    <div className="glass-card p-0 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100">
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100 flex">
        <motion.div 
          initial={{ width: '33.33%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
          className="h-full bg-brand-600"
        />
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 rounded-2xl">
              <Sparkles className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {step === 1 ? 'Personal Profile' : step === 2 ? 'Goals & Scores' : 'Experience & Achievements'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step {step} of 3</p>
            </div>
          </div>
          {profile.profilePic && (
            <img src={profile.profilePic} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-brand-100" />
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 hover:border-brand-400 transition-all overflow-hidden shrink-0"
                  >
                    {profile.profilePic ? (
                      <img src={profile.profilePic} alt="Upload" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Photo</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <User className="w-3 h-3" /> Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Jane Doe"
                      value={profile.fullName}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> Past Study / Current Education
                  </label>
                  <input
                    type="text"
                    name="pastStudy"
                    required
                    placeholder="e.g. BSc Computer Science from MIT"
                    value={profile.pastStudy}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Award className="w-3 h-3" /> Current GPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    name="gpa"
                    required
                    placeholder="e.g. 3.8"
                    value={profile.gpa}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 ml-1">Enter a valid number (e.g., 3.8 or 85)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                disabled={!isStep1Valid}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                Continue
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <BookOpen className="w-3 h-3" /> Target Field
                    </label>
                    <input
                      type="text"
                      name="field"
                      required
                      placeholder="e.g. Data Science"
                      value={profile.field}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <GraduationCap className="w-3 h-3" /> Target Degree
                    </label>
                    <select
                      name="degree"
                      value={profile.degree}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all appearance-none"
                    >
                      <option value="">Select Degree</option>
                      <option value="Bachelor's">Bachelor's</option>
                      <option value="Master's">Master's</option>
                      <option value="PhD">PhD</option>
                      <option value="Postdoc">Postdoc</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages className="w-3 h-3" /> IELTS/TOEFL
                      </div>
                      {profile.ielts && (
                        <button 
                          type="button"
                          onClick={() => setShowIELTSModal(true)}
                          className="text-brand-600 hover:text-brand-700 flex items-center gap-1 group/ai"
                        >
                          <Sparkles className="w-3 h-3 group-hover/ai:animate-pulse" />
                          AI Gap Analysis
                        </button>
                      )}
                    </label>
                    <input
                      type="text"
                      name="ielts"
                      placeholder="e.g. IELTS 7.5"
                      value={profile.ielts}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Award className="w-3 h-3" /> GRE/GMAT
                    </label>
                    <input
                      type="text"
                      name="greGmat"
                      placeholder="e.g. GRE 320"
                      value={profile.greGmat}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Globe className="w-3 h-3" /> Preferred Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      placeholder="e.g. USA"
                      value={profile.country}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <DollarSign className="w-3 h-3" /> Annual Budget
                    </label>
                    <input
                      type="text"
                      name="budget"
                      placeholder="e.g. $10,000"
                      value={profile.budget}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-shrink-0 p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStep2Valid}
                  className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  Experience & Achievements
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Briefcase className="w-3 h-3" /> Work Experience
                  </label>
                  <textarea
                    name="workExperience"
                    rows={2}
                    placeholder="e.g. 2 years as Software Engineer at Google"
                    value={profile.workExperience}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Beaker className="w-3 h-3" /> Research Experience
                  </label>
                  <textarea
                    name="researchExp"
                    rows={2}
                    placeholder="e.g. ML Research Assistant, 1 year"
                    value={profile.researchExp}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Publications
                    </label>
                    <textarea
                      name="publications"
                      rows={2}
                      placeholder="e.g. 1 IEEE Paper"
                      value={profile.publications}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Rocket className="w-3 h-3" /> Extracurriculars
                    </label>
                    <textarea
                      name="extracurriculars"
                      rows={2}
                      placeholder="e.g. Debate Club President"
                      value={profile.extracurriculars}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-shrink-0 p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Find Best Scholarships
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {showIELTSModal && (
          <IELTSGapModal 
            profile={profile}
            onClose={() => setShowIELTSModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
