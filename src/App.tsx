import { useState, useEffect } from 'react';
import { ProfileForm } from './components/ProfileForm';
import { ScholarshipList, ScholarshipSkeleton } from './components/ScholarshipList';
import { Chatbot } from './components/Chatbot';
import { LocalResources } from './components/LocalResources';
import { VisaGuide } from './components/VisaGuide';
import { LandingPage } from './components/LandingPage';
import { SignInPage } from './components/SignInPage';
import { SignUpPage } from './components/SignUpPage';
import { AdminPanel } from './components/AdminPanel';
import { GlobalSearch } from './components/GlobalSearch';
import { UserProfile, Scholarship } from './types';
import { searchScholarships, getDailyMotivation } from './services/geminiService';
import { GraduationCap, Globe, MessageSquare, Map as MapIcon, Sparkles, ShieldCheck, User, LogOut, Settings, Bell, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RemindersBell } from './components/RemindersBell';

import { auth, logout as firebaseLogout } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [authView, setAuthView] = useState<'signin' | 'signup' | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing academic profile...');
  const [activeTab, setActiveTab] = useState<'scholarships' | 'search' | 'chat' | 'local' | 'visa' | 'favorites'>('scholarships');
  const [motivation, setMotivation] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showMobileProfile, setShowMobileProfile] = useState(false);

  useEffect(() => {
    if (user && user.id && !profile) {
      fetch(`/api/user/profile?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setProfile(data.profile);
          }
        })
        .catch(err => console.error("Failed to load profile:", err));
    }
  }, [user, profile]);

  useEffect(() => {
    if (profile && !motivation) {
      // Fetch motivation once profile is available, only if not already set
      const savedDeadlines = scholarships.slice(0, 2).map(s => ({
        name: s.scholarshipName,
        daysLeft: Math.floor(Math.random() * 30) + 1
      }));
      getDailyMotivation(profile, savedDeadlines, 3, 10)
        .then(msg => setMotivation(msg))
        .catch(() => setMotivation('Keep pushing towards your academic goals!'));
    }
  }, [profile, motivation, scholarships]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const isDefaultAdmin = fbUser.email === 'admin@gmail.com';
        const u = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          role: isDefaultAdmin ? 'admin' : 'user'
        };
        setUser(u);
        (window as any)._scholarMindUserId = fbUser.uid;
        setShowLanding(false);

        try {
          await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              role: isDefaultAdmin ? 'admin' : 'user'
            }),
          });
        } catch (err) {
          console.error("Failed to sync user with SQLite backend:", err);
        }
      } else {
        setUser(null);
        (window as any)._scholarMindUserId = null;
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (u: any, rememberMe: boolean = true) => {
    // Auth state handled by onAuthStateChanged, but we can set UI state here
    setAuthView(null);
    if (u.role === 'admin') {
      setShowAdmin(true);
      setShowLanding(false);
    } else {
      setShowLanding(false);
    }
  };

  const handleLogout = () => {
    firebaseLogout();
    setProfile(null);
    setScholarships([]);
    setShowAdmin(false);
    setShowLanding(true);
  };

  const logActivity = async (action: string, details: string) => {
    if (!user) return;
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action, details }),
      });
    } catch (e) {
      console.error('Failed to log activity');
    }
  };

  const loadingMessages = [
    "Analyzing academic profile...",
    "Scanning global scholarship databases...",
    "Calculating success probabilities...",
    "Matching with university criteria...",
    "Verifying application deadlines...",
    "Finalizing your personalized roadmap..."
  ];

  const handleProfileSubmit = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    
    if (user && user.id) {
      try {
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, profile: newProfile }),
        });
      } catch (e) {
        console.error("Failed to save profile:", e);
      }
    }

    setIsLoading(true);
    
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      setLoadingMessage(loadingMessages[msgIndex % loadingMessages.length]);
      msgIndex++;
    }, 2000);

    logActivity('search', `Field: ${newProfile.field}, GPA: ${newProfile.gpa}`);
    setSearchError(null);
    try {
      const results = await searchScholarships(newProfile);
      setScholarships(results);
      setActiveTab('scholarships');
    } catch (error: any) {
      console.error("Search failed:", error);
      const message = error.message || String(error);
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        setSearchError("The AI service is experiencing high demand. We've tried retrying, but please wait a moment and try searching again.");
      } else {
        setSearchError("We encountered an error finding scholarships. Please try again later.");
      }
    } finally {
      setIsLoading(false);
      clearInterval(msgInterval);
    }
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (showLanding && !authView) {
    return (
      <LandingPage 
        onGetStarted={() => setAuthView('signup')} 
        onSignIn={() => setAuthView('signin')}
      />
    );
  }

  if (authView === 'signin') {
    return (
      <SignInPage 
        onSuccess={handleAuthSuccess} 
        onSwitchToSignUp={() => setAuthView('signup')}
        onBack={() => setAuthView(null)}
        onAdminLoginClick={() => {}}
      />
    );
  }

  if (authView === 'signup') {
    return (
      <SignUpPage 
        onSuccess={handleAuthSuccess} 
        onSwitchToSignIn={() => setAuthView('signin')}
        onBack={() => setAuthView(null)}
      />
    );
  }

  // Force login for main app
  if (!user) {
    return (
      <SignInPage 
        onSuccess={handleAuthSuccess} 
        onSwitchToSignUp={() => setAuthView('signup')}
        onBack={() => setShowLanding(true)}
        onAdminLoginClick={() => {}}
      />
    );
  }

  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-brand-600 p-2.5 rounded-2xl shadow-lg shadow-brand-500/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">ScholarMind</h1>
                <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Admin Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-xs">
                  {user.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden lg:block">
                  <div className="text-[11px] font-bold text-slate-900 leading-none">{user.name || 'Admin'}</div>
                  <div className="text-[9px] text-slate-400 font-medium mt-0.5">Administrator</div>
                </div>
                <button onClick={handleLogout} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-rose-500" title="Log Out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <AdminPanel onBack={handleLogout} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2.5 rounded-2xl shadow-lg shadow-brand-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">ScholarMind</h1>
              <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Global Scholarship Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setShowLanding(true);
              }}
              className="hidden md:block text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest"
            >
              Back to Home
            </button>
            <div className="h-8 w-px bg-slate-200 hidden md:block" />
            
            {user ? (
              <div className="flex items-center gap-4">
                <RemindersBell userId={user.id || user.uid} />
                <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100">
                  {profile?.profilePic ? (
                    <img src={profile.profilePic} alt="Profile" className="w-8 h-8 rounded-xl object-cover border border-brand-100" />
                  ) : (
                    <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-xs">
                      {profile?.fullName?.charAt(0) || user.name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                  )}
                  <div className="hidden lg:block">
                    <div className="text-[11px] font-bold text-slate-900 leading-none">{profile?.fullName || user.name || 'User'}</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">{user.role}</div>
                  </div>
                  <button onClick={handleLogout} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-rose-500">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setAuthView('signin')}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
            >
              <div className="max-w-md w-full text-center space-y-8">
                <div className="relative w-48 h-48 mx-auto group">
                  <div className="absolute inset-0 bg-brand-200/50 rounded-full animate-pulse blur-xl" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400&h=400" 
                      alt="AI Processing" 
                      className="w-full h-full object-cover"
                    />
                    {/* Scanning Beam */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-400/40 to-transparent"
                      initial={{ top: "-100%" }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-full shadow-xl z-10">
                    <Sparkles className="w-8 h-8 text-brand-600 animate-spin-slow" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <motion.h2 
                    key={loadingMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight"
                  >
                    {loadingMessage}
                  </motion.h2>
                  <p className="text-sm text-slate-500 font-medium">Please wait while our AI analyzes global opportunities for you.</p>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-brand-600 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 10, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation & Profile Summary */}
        <div className="lg:hidden space-y-4 mb-8">
          {/* Mobile Profile Summary */}
          <div className="bg-white rounded-3xl p-4.5 border border-slate-200/60 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100">
                <User className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">{profile?.fullName || 'Academic Profile'}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {profile ? `${profile.field || 'General'} • ${profile.degree || 'Any'}` : 'Profile Incomplete'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMobileProfile(!showMobileProfile)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-md shadow-slate-900/10"
            >
              {showMobileProfile ? 'Hide Profile' : 'Edit Profile'}
            </button>
          </div>

          {/* Collapsible Mobile Profile Form */}
          <AnimatePresence>
            {showMobileProfile && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pb-4">
                  <ProfileForm onSubmit={(p) => { handleProfileSubmit(p); setShowMobileProfile(false); }} isLoading={isLoading} initialProfile={profile} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Tab Navigation (Horizontal Scrollable) */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 flex gap-2 scrollbar-none sticky top-[64px] z-40 bg-[#F8FAFC]/95 backdrop-blur-md py-3.5 border-y border-slate-200/50">
            <button
              onClick={() => setActiveTab('scholarships')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeTab === 'scholarships'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Matches
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeTab === 'search'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              Global Search
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeTab === 'favorites'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.835 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              Favorites
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeTab === 'chat'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeTab === 'local'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Local
            </button>
            <button
              onClick={() => setActiveTab('visa')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeTab === 'visa'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Visa & Compare
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-12 xl:gap-16">
          
          {/* Left Column: Profile & Navigation */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 md:space-y-8">
            <ProfileForm onSubmit={handleProfileSubmit} isLoading={isLoading} initialProfile={profile} />
            
            <nav className="glass-card rounded-3xl p-2.5 space-y-1">
              <button
                onClick={() => setActiveTab('scholarships')}
                className={`nav-item w-full ${
                  activeTab === 'scholarships' 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <GraduationCap className={`w-5 h-5 ${activeTab === 'scholarships' ? 'text-white' : 'text-slate-400'}`} />
                Scholarship Matches
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`nav-item w-full ${
                  activeTab === 'search' 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Globe className={`w-5 h-5 ${activeTab === 'search' ? 'text-white' : 'text-slate-400'}`} />
                Global Search
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`nav-item w-full ${
                  activeTab === 'favorites' 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={`w-5 h-5 ${activeTab === 'favorites' ? 'text-white' : 'text-slate-400'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.835 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                Favorite Scholarships
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`nav-item w-full ${
                  activeTab === 'chat' 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <MessageSquare className={`w-5 h-5 ${activeTab === 'chat' ? 'text-white' : 'text-slate-400'}`} />
                AI Consultant Chat
              </button>
              <button
                onClick={() => setActiveTab('local')}
                className={`nav-item w-full ${
                  activeTab === 'local' 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <MapIcon className={`w-5 h-5 ${activeTab === 'local' ? 'text-white' : 'text-slate-400'}`} />
                Local Resources
              </button>
              <button
                onClick={() => setActiveTab('visa')}
                className={`nav-item w-full ${
                  activeTab === 'visa' 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 ${activeTab === 'visa' ? 'text-white' : 'text-slate-400'}`} />
                Visa & Comparison
              </button>
            </nav>

            <div className="bg-gradient-to-br from-brand-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Advanced Platform</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Powerful AI Tools</h3>
                <p className="text-white/70 text-xs mb-6 leading-relaxed">Included with your account: unlimited searches, SOP generator, and personalized interview prep.</p>
                <button className="w-full bg-white text-brand-600 font-bold py-3 rounded-xl text-sm hover:bg-brand-50 transition-colors shadow-lg">
                  Access All Features
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Content Area */}
          <div className="lg:col-span-8 xl:col-span-9">
            {searchError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium flex-1">{searchError}</p>
                <button onClick={() => setSearchError(null)} className="p-1 hover:bg-rose-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              {activeTab === 'scholarships' && (
                <motion.div
                  key="scholarships"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Scholarship Matches</h2>
                      <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">Curated opportunities based on your unique academic profile.</p>
                    </div>
                    {profile && (
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 shadow-sm shrink-0">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold">Profile Match Score: {
                          Math.min(
                            98,
                            50 + 
                            (parseFloat(profile.gpa) >= 3.5 ? 25 : parseFloat(profile.gpa) >= 3.0 ? 15 : 5) + 
                            (profile.ielts.includes('7') || profile.ielts.includes('8') ? 15 : 5) +
                            (profile.extracurriculars.length > 20 ? 8 : 0)
                          )
                        }%</span>
                      </div>
                    )}
                  </div>

                  {motivation && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-8 bg-brand-50 border border-brand-100 rounded-3xl p-6 relative overflow-hidden group shadow-sm"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-16 h-16 text-brand-600" />
                      </div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-brand-100 flex-shrink-0">
                          <Bell className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">Daily AI Insight</h4>
                          <p className="text-slate-800 text-sm font-medium leading-relaxed italic">
                            "{motivation}"
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {isLoading ? <ScholarshipSkeleton /> : <ScholarshipList scholarships={scholarships} profile={profile} onAction={logActivity} />}
                </motion.div>
              )}

              {activeTab === 'search' && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Global Search</h2>
                    <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">Find scholarships by country, regardless of your profile.</p>
                  </div>
                  <GlobalSearch />
                </motion.div>
              )}

              {activeTab === 'favorites' && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Favorite Scholarships</h2>
                    <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">Your saved opportunities to review and apply.</p>
                  </div>
                  <ScholarshipList scholarships={scholarships} profile={profile} onAction={logActivity} showFavoritesOnly={true} />
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">AI Education Consultant</h2>
                    <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">Expert guidance for your application journey.</p>
                  </div>
                  <Chatbot profile={profile} />
                </motion.div>
              )}

              {activeTab === 'local' && (
                <motion.div
                  key="local"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Nearby Resources</h2>
                    <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">Physical support centers and test locations in your area.</p>
                  </div>
                  <LocalResources />
                </motion.div>
              )}

              {activeTab === 'visa' && (
                <motion.div
                  key="visa"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Visa & Country Guide</h2>
                    <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">Global student visa intelligence and destination comparison.</p>
                  </div>
                  <VisaGuide country={profile?.country || 'USA'} university={scholarships[0]?.university || 'Top University'} profile={profile} scholarships={scholarships} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 md:py-8 mt-8 md:mt-12">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-xs">
            © 2026 ScholarMind. Data sourced from official university portals and verified scholarship boards.
          </p>
        </div>
      </footer>
    </div>
  );
}
