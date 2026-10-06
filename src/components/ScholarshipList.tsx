import React, { useState, useMemo, useEffect } from 'react';
import { Scholarship, InterviewPrep, UserProfile } from '../types';
import { ExternalLink, Calendar, GraduationCap, MapPin, CheckCircle, FileText, AlertCircle, Award, Filter, X, Info, MessageSquare, Loader2, Sparkles, Rocket, BrainCircuit, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getInterviewPrep } from '../services/geminiService';
import { AIToolkitModal } from './AIToolkitModal';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const getClosingTime = (dateStr: string) => {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  const time = d.getTime();
  if (isNaN(time)) return Infinity;
  return time;
};

const isScholarshipOpen = (s: { closingDate: string }) => {
  const now = new Date().getTime();
  const closing = getClosingTime(s.closingDate);
  return closing >= now;
};

const SuccessGauge = ({ probability }: { probability: number }) => {
  const percentage = Math.min(Math.max(probability, 0), 100);
  const arcLength = 125.66; // Half of 2 * PI * 40
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  let ratingText = "Competitive Match";
  let ratingColor = "text-rose-400 border-rose-500/20 bg-rose-500/5";
  
  if (percentage >= 85) {
    ratingText = "Excellent Match";
    ratingColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
  } else if (percentage >= 70) {
    ratingText = "Very Good Match";
    ratingColor = "text-brand-400 border-brand-500/20 bg-brand-500/5";
  } else if (percentage >= 50) {
    ratingText = "Good Match";
    ratingColor = "text-amber-400 border-amber-500/20 bg-amber-500/5";
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-44 h-24 mb-2">
        <svg className="w-full h-full" viewBox="0 0 100 55" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="75%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Active Arc */}
          <motion.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            stroke="url(#gaugeGradient)"
            strokeWidth="7"
            strokeLinecap="round"
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeDasharray={`${arcLength} ${arcLength}`}
          />

          {/* Tick Marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * 180 - 180;
            const rad = (angle * Math.PI) / 180;
            const r1 = 43;
            const r2 = 47;
            const x1 = 50 + r1 * Math.cos(rad);
            const y1 = 50 + r1 * Math.sin(rad);
            const x2 = 50 + r2 * Math.cos(rad);
            const y2 = 50 + r2 * Math.sin(rad);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1"
              />
            );
          })}

          {/* Needle Pin and Line */}
          <motion.line
            x1="50"
            y1="50"
            x2="50"
            y2="18"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: (percentage / 100) * 180 - 90 }}
            style={{ transformOrigin: "50px 50px" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            filter="url(#glow)"
          />

          {/* Center Hub */}
          <circle cx="50" cy="50" r="5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />

          {/* Text Labels */}
          <text x="10" y="55" fill="rgba(255, 255, 255, 0.4)" fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">0%</text>
          <text x="50" y="8" fill="rgba(255, 255, 255, 0.4)" fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">50%</text>
          <text x="90" y="55" fill="rgba(255, 255, 255, 0.4)" fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">100%</text>
        </svg>
      </div>

      <div className="flex flex-col items-center relative z-10">
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-200 bg-clip-text text-transparent">
            {percentage}
          </span>
          <span className="text-sm font-bold text-slate-400">%</span>
        </div>
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">AI Success Probability</span>
        <p className={`text-[10px] font-extrabold mt-2 transition-colors ${ratingColor} border px-3 py-1 rounded-full uppercase tracking-wider`}>
          {ratingText}
        </p>
      </div>
    </div>
  );
};

interface ScholarshipListProps {
  scholarships: Scholarship[];
  onAction?: (action: string, details: string) => void;
  showFavoritesOnly?: boolean;
  profile: UserProfile | null;
}

export function ScholarshipList({ scholarships, onAction, showFavoritesOnly = false, profile }: ScholarshipListProps) {
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [activeModal, setActiveModal] = useState<'checklist' | 'interview' | 'details' | 'ai-toolkit' | null>(null);
  const [interviewData, setInterviewData] = useState<InterviewPrep | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [favoriteScholarships, setFavoriteScholarships] = useState<Scholarship[]>([]);
  const [scholarshipStatuses, setScholarshipStatuses] = useState<Record<string, 'Applied' | 'Interviewing' | 'Accepted' | 'Rejected' | 'None'>>({});
  const [initialToolkitTab, setInitialToolkitTab] = useState<string | undefined>(undefined);
  
  const currentUserId = (profile as any)?.userId || (window as any)._scholarMindUserId || null;

  // Load from Firestore
  useEffect(() => {
    if (currentUserId) {
      const loadData = async () => {
        try {
          const favRef = collection(db, `users/${currentUserId}/favorites`);
          const favSnap = await getDocs(query(favRef));
          const favs: Scholarship[] = [];
          favSnap.forEach(doc => {
             const data = doc.data();
             favs.push({
                id: doc.id as any,
                scholarshipName: data.scholarshipName,
                country: data.country,
                fundingCoverage: data.fundingCoverage,
                degreeLevel: data.degreeLevel,
                university: '',
                eligibility: '',
                requiredDocuments: [],
                ieltsRequirement: '',
                closingDate: '',
                competitivenessLevel: 'High',
                openingDate: '',
                applicationLink: '',
                matchScore: 0,
                successProbability: 0,
                rankingReason: '',
                status: 'None',
                isAnnual: false,
                tags: [],
                isFavorite: true
             });
          });
          setFavoriteScholarships(favs);

          const statusRef = collection(db, `users/${currentUserId}/applications`);
          const statusSnap = await getDocs(query(statusRef));
          const statuses: Record<string, any> = {};
          statusSnap.forEach(doc => {
            const data = doc.data();
            statuses[data.scholarshipName] = data.status;
          });
          setScholarshipStatuses(statuses);
        } catch (e) {
          console.error("Error loading data from Firestore", e);
        }
      };
      loadData();
    } else {
      // Fallback
      const savedFavs = localStorage.getItem('favoriteScholarships_v2');
      if (savedFavs) setFavoriteScholarships(JSON.parse(savedFavs));
      const savedStats = localStorage.getItem('scholarshipStatuses_v2');
      if (savedStats) setScholarshipStatuses(JSON.parse(savedStats));
    }
  }, [currentUserId]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleFavorite = async (scholarship: Scholarship) => {
    const isRemoving = favoriteScholarships.some(s => s.scholarshipName === scholarship.scholarshipName);
    
    setFavoriteScholarships(prev => {
      return isRemoving 
        ? prev.filter(s => s.scholarshipName !== scholarship.scholarshipName) 
        : [...prev, scholarship];
    });

    if (currentUserId) {
       try {
         const docId = scholarship.scholarshipName.replace(/[^a-zA-Z0-9]/g, '');
         const docRef = doc(db, `users/${currentUserId}/favorites`, docId);
         if (isRemoving) {
            await deleteDoc(docRef);
         } else {
            await setDoc(docRef, {
              userId: currentUserId,
              scholarshipName: scholarship.scholarshipName,
              country: scholarship.country,
              fundingCoverage: scholarship.fundingCoverage,
              degreeLevel: scholarship.degreeLevel
            });
         }
       } catch (e) {
         console.error("Firestore favorite toggle failed", e);
       }
    } else {
       localStorage.setItem('favoriteScholarships_v2', JSON.stringify(isRemoving ? favoriteScholarships.filter(s => s.scholarshipName !== scholarship.scholarshipName) : [...favoriteScholarships, scholarship]));
    }

    showToast(isRemoving ? `Removed ${scholarship.scholarshipName} from favorites` : `Added ${scholarship.scholarshipName} to favorites`);
    onAction?.('toggle_favorite', `Scholarship: ${scholarship.scholarshipName}`);
  };

  const handleStatusChange = async (name: string, status: 'Applied' | 'Interviewing' | 'Accepted' | 'Rejected' | 'None') => {
    setScholarshipStatuses(prev => {
      const updated = { ...prev, [name]: status };
      if (!currentUserId) {
        localStorage.setItem('scholarshipStatuses_v2', JSON.stringify(updated));
      }
      return updated;
    });

    if (currentUserId) {
      try {
         const docId = name.replace(/[^a-zA-Z0-9]/g, '');
         const docRef = doc(db, `users/${currentUserId}/applications`, docId);
         if (status === 'None') {
            await deleteDoc(docRef);
         } else {
            await setDoc(docRef, {
              userId: currentUserId,
              scholarshipName: name,
              status: status,
              updatedAt: new Date().toISOString()
            });
         }
      } catch (e) {
        console.error("Firestore status update failed", e);
      }
    }

    onAction?.('update_status', `Scholarship: ${name}, Status: ${status}`);
  };

  const handleInterviewPrep = async (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setActiveModal('interview');
    setIsModalLoading(true);
    onAction?.('interview_prep', scholarship.scholarshipName);
    try {
      const data = await getInterviewPrep(scholarship.scholarshipName);
      setInterviewData(data);
    } catch (error) {
      console.error("Failed to fetch interview prep:", error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleChecklist = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setActiveModal('checklist');
    onAction?.('generate_checklist', scholarship.scholarshipName);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedScholarship(null);
    setInterviewData(null);
    setInitialToolkitTab(undefined);
  };

  const [filters, setFilters] = useState({
    countries: [] as string[],
    fundingTypes: [] as string[],
    degreeLevels: [] as string[],
    fields: [] as string[],
    competitiveness: 'All',
    deadline: 'All',
    hasWaiver: false,
    startDate: '',
    endDate: ''
  });
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'comp'>('date');
  const [showFilters, setShowFilters] = useState(false);

  const filteredScholarships = useMemo(() => {
    let source = showFavoritesOnly ? favoriteScholarships : scholarships;
    let result = source.filter(s => {
      const countryMatch = filters.countries.length === 0 || filters.countries.some(c => s.country.toLowerCase().includes(c.toLowerCase()));
      const fundingMatch = filters.fundingTypes.length === 0 || filters.fundingTypes.some(f => s.fundingCoverage.toLowerCase().includes(f.toLowerCase()));
      const degreeMatch = filters.degreeLevels.length === 0 || filters.degreeLevels.some(d => s.degreeLevel.toLowerCase().includes(d.toLowerCase()));
      const fieldMatch = filters.fields.length === 0 || filters.fields.some(f => s.scholarshipName.toLowerCase().includes(f.toLowerCase()) || s.eligibility.toLowerCase().includes(f.toLowerCase()));
      const compMatch = filters.competitiveness === 'All' || s.competitivenessLevel.toLowerCase().includes(filters.competitiveness.toLowerCase());
      const waiverMatch = !filters.hasWaiver || (s.ieltsWaiverInfo && s.ieltsWaiverInfo.length > 0);
      
      let dateMatch = true;
      const closingDate = new Date(s.closingDate);
      const closingTime = closingDate.getTime();
      
      if (!isNaN(closingTime)) {
        if (filters.startDate) {
          dateMatch = dateMatch && closingDate >= new Date(filters.startDate);
        }
        if (filters.endDate) {
          dateMatch = dateMatch && closingDate <= new Date(filters.endDate);
        }

        if (filters.deadline !== 'All' && !filters.startDate && !filters.endDate) {
          const now = new Date();
          const diffDays = (closingTime - now.getTime()) / (1000 * 3600 * 24);
          if (filters.deadline === 'Next 30 Days') dateMatch = diffDays >= 0 && diffDays <= 30;
          if (filters.deadline === 'Next 90 Days') dateMatch = diffDays >= 0 && diffDays <= 90;
        }
      } else {
        if (filters.startDate || filters.endDate || filters.deadline !== 'All') {
          dateMatch = false;
        }
      }

      return countryMatch && fundingMatch && degreeMatch && fieldMatch && compMatch && waiverMatch && dateMatch;
    });

    // Sorting
    result.sort((a, b) => {
      const now = new Date().getTime();
      const closingA = getClosingTime(a.closingDate);
      const closingB = getClosingTime(b.closingDate);
      const isClosedA = closingA < now;
      const isClosedB = closingB < now;

      // Always prioritize open/active scholarships first, regardless of sort mode
      if (isClosedA && !isClosedB) return 1;
      if (!isClosedA && isClosedB) return -1;

      if (sortBy === 'match') {
        return b.matchScore - a.matchScore;
      }
      if (sortBy === 'date') {
        if (isClosedA) {
          // If both are closed, show the more recently closed first
          return closingB - closingA;
        }
        // If both are open, show closest deadline first
        return closingA - closingB;
      }
      if (sortBy === 'comp') {
        const getVal = (val: string) => {
          const l = (val || '').toLowerCase();
          if (l.includes('low')) return 1;
          if (l.includes('medium')) return 2;
          if (l.includes('high')) return 3;
          return 0;
        };
        return getVal(a.competitivenessLevel) - getVal(b.competitivenessLevel);
      }
      return 0;
    });

    return result;
  }, [scholarships, filters, sortBy, showFavoritesOnly, favoriteScholarships]);

  const openScholarships = useMemo(() => filteredScholarships.filter(isScholarshipOpen), [filteredScholarships]);
  const closedScholarships = useMemo(() => filteredScholarships.filter(s => !isScholarshipOpen(s)), [filteredScholarships]);

  const bestMatches = useMemo(() => openScholarships.filter(s => s.matchScore >= 85), [openScholarships]);
  const similarScholarships = useMemo(() => openScholarships.filter(s => s.matchScore < 85), [openScholarships]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activeModal]); // Re-run effect when modal state changes

  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    scholarships.forEach(s => countries.add(s.country));
    return ['All', ...Array.from(countries).sort()];
  }, [scholarships]);

  if (scholarships.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">No scholarships found</h3>
        <p className="text-slate-500 mt-1">Fill out your profile and search to see matched scholarships.</p>
      </div>
    );
  }

  const CompetitivenessTooltip = ({ level }: { level: string }) => {
    const info = {
      low: "Acceptance rate > 20%. Good for most qualified applicants.",
      medium: "Acceptance rate 5-20%. Requires strong academic and extracurricular profile.",
      high: "Acceptance rate < 5%. Extremely prestigious, requires exceptional profile."
    };
    const key = level.toLowerCase().includes('high') ? 'high' : level.toLowerCase().includes('medium') ? 'medium' : 'low';
    
    return (
      <div className="group relative inline-block">
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider cursor-help ${
          key === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
          key === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
          'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          {level}
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
          {info[key]}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
      </div>
    );
  };

  const ScholarshipCard = ({ scholarship, index }: { scholarship: Scholarship, index: number }) => {
    const isFav = favoriteScholarships.some(fav => fav.scholarshipName === scholarship.scholarshipName);
    const currentStatus = scholarshipStatuses[scholarship.scholarshipName] || 'None';

    const handleCardClick = () => {
      setSelectedScholarship(scholarship);
      setActiveModal('details');
      onAction?.('view_details', scholarship.scholarshipName);
    };

    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white rounded-[32px] border border-slate-200/60 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 overflow-hidden"
    >
      {/* Premium Gradient Accent */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-600 via-brand-400 to-emerald-500 opacity-60" />

      {/* Action Buttons (Floating) */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFavorite(scholarship);
          }}
          className={`p-3 rounded-2xl transition-all duration-300 ${
            isFav 
              ? 'bg-rose-500 text-white shadow-[0_10px_20px_rgba(244,63,94,0.3)] scale-110' 
              : 'bg-white/80 backdrop-blur-md text-slate-400 hover:text-rose-500 hover:bg-white shadow-sm ring-1 ring-slate-200/50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isFav ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.835 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </button>
      </div>

      <div className="p-8 md:p-10">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-16">
          {/* Left Column: Core Info & Visuals */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const now = new Date().getTime();
                  const closing = new Date(scholarship.closingDate).getTime();
                  const daysToClose = (closing - now) / (1000 * 60 * 60 * 24);
                  
                  let statusText = 'Open';
                  let statusClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                  
                  if (closing < now) {
                    statusText = 'Closed';
                    statusClass = 'bg-slate-50 text-slate-400 border-slate-100';
                  } else if (daysToClose <= 30) {
                    statusText = 'Closing Soon';
                    statusClass = 'bg-rose-50 text-rose-600 border-rose-100';
                  }

                  return (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusClass}`}>
                      {statusText}
                    </span>
                  );
                })()}
                {scholarship.isAnnual && (
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                    Annual Recurring
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-100 italic">
                   {scholarship.fundingCoverage}
                </span>
              </div>
              
              <h3 
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight tracking-tight group-hover:text-brand-600 transition-colors cursor-pointer"
                onClick={handleCardClick}
              >
                {scholarship.scholarshipName}
              </h3>
              
              <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
                <span className="text-brand-600 font-bold italic mr-2 text-base">"AI Insight:</span> 
                {scholarship.rankingReason}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">University</span>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{scholarship.university}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Location</span>
                  <span className="text-sm font-bold text-slate-700">{scholarship.country}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Deadline</span>
                  <span className="text-sm font-bold text-slate-700">{scholarship.closingDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-brand-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Study Level</span>
                  <span className="text-sm font-bold text-slate-700">{scholarship.degreeLevel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Metrics & Quick Actions */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Probability Gauge - Premium Visualization */}
            <div className="relative bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit className="w-16 h-16" /></div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-600/50 to-emerald-500/50" />
              
              <div className="flex flex-col items-center text-center relative z-10 w-full">
                <SuccessGauge probability={scholarship.successProbability} />
                
                <div className="w-full mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Match Score</span>
                    <span className="text-sm font-bold text-brand-400">{scholarship.matchScore}%</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Comp.</span>
                    <span className={`text-sm font-bold ${scholarship.competitivenessLevel.includes('High') ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {scholarship.competitivenessLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Manage Application</h4>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Stage</span>
                  <div className="relative">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(scholarship.scholarshipName, e.target.value as any)}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest bg-white border-2 transition-all appearance-none cursor-pointer ${
                        currentStatus === 'Applied' ? 'text-blue-600 border-blue-200 bg-blue-50/10' : 
                        currentStatus === 'Interviewing' ? 'text-purple-600 border-purple-200 bg-purple-50/10' : 
                        currentStatus === 'Accepted' ? 'text-emerald-600 border-emerald-200 bg-emerald-50/10' : 
                        currentStatus === 'Rejected' ? 'text-rose-600 border-rose-200 bg-rose-50/10' : 
                        'text-slate-500 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <option value="None">Not Started</option>
                      <option value="Applied">Application Sent</option>
                      <option value="Interviewing">Interview Underway</option>
                      <option value="Accepted">Scholarship Won</option>
                      <option value="Rejected">Not Selected</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              setSelectedScholarship(scholarship);
              setActiveModal('ai-toolkit');
              onAction?.('open_ai_toolkit', scholarship.scholarshipName);
            }}
            className="w-full md:flex-1 group/btn relative flex items-center justify-center gap-3 text-sm font-bold text-white bg-slate-900 overflow-hidden px-8 py-5 rounded-[24px] shadow-2xl transition-all hover:translate-y-[-2px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
            <BrainCircuit className="w-5 h-5 text-brand-400 group-hover/btn:text-white transition-colors relative z-10" />
            <span className="relative z-10">Generate Application with AI</span>
          </button>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={(e) => {e.stopPropagation(); handleChecklist(scholarship);}}
              className="flex-1 md:w-16 h-14 flex items-center justify-center rounded-[20px] bg-slate-50 border border-slate-200/60 text-slate-600 hover:bg-white hover:shadow-md hover:text-brand-600 transition-all group/icon"
            >
              <FileText className="w-5 h-5 group-hover/icon:scale-110 transition-transform" />
            </button>
            <button 
              onClick={(e) => {e.stopPropagation(); handleInterviewPrep(scholarship);}}
              className="flex-1 md:w-16 h-14 flex items-center justify-center rounded-[20px] bg-slate-50 border border-slate-200/60 text-slate-600 hover:bg-white hover:shadow-md hover:text-brand-600 transition-all group/icon"
            >
              <Sparkles className="w-5 h-5 group-hover/icon:scale-110 transition-transform" />
            </button>
            <a
              href={scholarship.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 md:flex-none h-14 px-8 flex items-center justify-center rounded-[20px] bg-brand-50 text-brand-600 font-bold text-sm border border-brand-100 hover:bg-brand-600 hover:text-white transition-all"
            >
              Portal
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Advanced Filters & Sorting */}
      <div className="glass-card rounded-3xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors px-4 py-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Advanced Filters'}
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 ml-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort By</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm font-bold text-slate-600 bg-transparent outline-none cursor-pointer hover:text-brand-600 transition-colors"
              >
                <option value="date">Deadline (Open First)</option>
                <option value="match">Match Score</option>
                <option value="comp">Competitiveness (Low to High)</option>
              </select>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 px-4 border-l border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Quick Filters</span>
            {['Fully Funded', 'Partial', 'Tuition Only'].map(type => (
              <button
                key={type}
                onClick={() => {
                  setFilters(f => ({
                    ...f,
                    fundingTypes: f.fundingTypes.includes(type) 
                      ? f.fundingTypes.filter(t => t !== type)
                      : [...f.fundingTypes, type]
                  }));
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                  filters.fundingTypes.includes(type)
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {(filters.countries.length > 0 || filters.fundingTypes.length > 0 || filters.degreeLevels.length > 0 || filters.fields.length > 0 || filters.competitiveness !== 'All' || filters.deadline !== 'All' || filters.hasWaiver || filters.startDate || filters.endDate) && (
            <button 
              onClick={() => setFilters({ countries: [], fundingTypes: [], degreeLevels: [], fields: [], competitiveness: 'All', deadline: 'All', hasWaiver: false, startDate: '', endDate: '' })}
              className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-4"
            >
              <X className="w-3 h-3" />
              Reset All
            </button>
          )}
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-slate-100 mt-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country (Multiple)</label>
                    <select 
                      multiple
                      value={filters.countries}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setFilters(f => ({ ...f, countries: values }));
                      }}
                      className="input-field py-2 h-24"
                    >
                      {allCountries.filter(c => c !== 'All').map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Funding Type (Multiple)</label>
                    <select 
                      multiple
                      value={filters.fundingTypes}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setFilters(f => ({ ...f, fundingTypes: values }));
                      }}
                      className="input-field py-2 h-24"
                    >
                      <option value="Fully Funded">Fully Funded</option>
                      <option value="Partial">Partial</option>
                      <option value="Tuition Only">Tuition Only</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Degree Level (Multiple)</label>
                    <select 
                      multiple
                      value={filters.degreeLevels}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setFilters(f => ({ ...f, degreeLevels: values }));
                      }}
                      className="input-field py-2 h-24"
                    >
                      <option value="Bachelor">Bachelor's</option>
                      <option value="Master">Master's</option>
                      <option value="PhD">PhD</option>
                      <option value="Postdoc">Postdoc</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Competitiveness</label>
                      <div className="group relative">
                        <Info className="w-3 h-3 text-slate-300 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          Low: Easy to get<br/>Medium: Competitive<br/>High: Extremely selective
                        </div>
                      </div>
                    </div>
                    <select 
                      value={filters.competitiveness}
                      onChange={(e) => setFilters(f => ({ ...f, competitiveness: e.target.value }))}
                      className="input-field py-2"
                    >
                      <option>All</option>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Field</label>
                    <input 
                      type="text"
                      placeholder="e.g., Computer Science, Medicine..."
                      value={filters.fields.join(', ')}
                      onChange={(e) => {
                        const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                        setFilters(f => ({ ...f, fields: values }));
                      }}
                      className="input-field py-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Deadline</label>
                    <select 
                      value={filters.deadline}
                      onChange={(e) => setFilters(f => ({ ...f, deadline: e.target.value }))}
                      className="input-field py-2"
                    >
                      <option>All</option>
                      <option>Next 30 Days</option>
                      <option>Next 90 Days</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Date Range (Closing Date)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={filters.startDate}
                        onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                        className="input-field py-2"
                      />
                      <span className="text-slate-300">to</span>
                      <input 
                        type="date" 
                        value={filters.endDate}
                        onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                        className="input-field py-2"
                      />
                    </div>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={filters.hasWaiver}
                          onChange={(e) => setFilters(f => ({ ...f, hasWaiver: e.target.checked }))}
                          className="sr-only"
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${filters.hasWaiver ? 'bg-brand-600' : 'bg-slate-200'}`} />
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${filters.hasWaiver ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className="text-sm font-bold text-slate-600 group-hover:text-brand-600 transition-colors">Show only IELTS Waivers / Alternatives</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Best Matches Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Best Matches</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        {bestMatches.length > 0 ? (
          bestMatches.map((s, i) => <ScholarshipCard key={i} scholarship={s} index={i} />)
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm italic">No high-match results found for current filters.</div>
        )}
      </div>

      {/* Similar Scholarships Section */}
      {similarScholarships.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Similar Opportunities</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10">
            {similarScholarships.map((s, i) => <ScholarshipCard key={i} scholarship={s} index={i + bestMatches.length} />)}
          </div>
        </div>
      )}

      {/* Closed Scholarships Section */}
      {closedScholarships.length > 0 && (
        <div className="space-y-6 pt-12 opacity-60">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Closed / Past Deadlines</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 gap-6">
            {closedScholarships.map((s, i) => <ScholarshipCard key={i} scholarship={s} index={i + bestMatches.length + similarScholarships.length} />)}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'ai-toolkit' && selectedScholarship && (
          <AIToolkitModal 
            scholarship={selectedScholarship}
            profile={profile}
            onClose={closeModal}
            initialTab={initialToolkitTab as any}
          />
        )}

        {activeModal && activeModal !== 'ai-toolkit' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {activeModal === 'checklist' ? 'Document Checklist' : 'AI Interview Preparation'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                    {selectedScholarship?.scholarshipName}
                  </p>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                {isModalLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Generating Intelligence...</p>
                  </div>
                ) : activeModal === 'details' && selectedScholarship ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none" />
                      <h3 className="text-2xl font-bold text-slate-900 mb-2 relative z-10 leading-tight">{selectedScholarship.scholarshipName}</h3>
                      <p className="text-sm text-brand-600 font-bold italic relative z-10">"{selectedScholarship.rankingReason}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">University & Country</span>
                        <span className="text-sm font-bold text-slate-700">{selectedScholarship.university}, {selectedScholarship.country}</span>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.1em]">Funding Coverage</span>
                        <span className="text-sm font-bold text-emerald-800">{selectedScholarship.fundingCoverage}</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Degree Level</span>
                        <span className="text-sm font-bold text-slate-700">{selectedScholarship.degreeLevel}</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Competitiveness</span>
                        <span className="text-sm font-bold text-slate-700">{selectedScholarship.competitivenessLevel}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="text-[11px] font-bold text-brand-500 uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> Application Window
                        </h4>
                        <div className="flex items-center justify-between text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Opens</span>
                            <span>{selectedScholarship.openingDate || 'N/A'}</span>
                          </div>
                          <div className="w-8 h-px bg-slate-300" />
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Closes</span>
                            <span className="text-rose-600">{selectedScholarship.closingDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="text-[11px] font-bold text-brand-500 uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4" /> Eligibility Criteria
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{selectedScholarship.eligibility}</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="text-[11px] font-bold text-brand-500 uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Required Documents
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedScholarship.requiredDocuments?.map((doc, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                              <span className="font-medium">{doc}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2.5 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                            <span className="font-medium">IELTS/TOEFL (or MOI)</span>
                          </div>
                        </div>
                      </div>

                      {selectedScholarship.ieltsWaiverInfo && (
                        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
                          <h4 className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> IELTS Waiver Available
                          </h4>
                          <p className="text-sm text-amber-800 leading-relaxed font-medium">{selectedScholarship.ieltsWaiverInfo}</p>
                        </div>
                      )}

                      {/* University Interview Tips Promotion */}
                      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-brand-500/20 text-brand-400 rounded-xl shrink-0">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">University Interview Prep & Tips</h4>
                            <p className="text-xs text-slate-400 mt-1">Get custom admissions interview strategies, etiquette rules, and sample STAR responses tailored to this university and your background.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setInitialToolkitTab('university-tips');
                            setActiveModal('ai-toolkit');
                          }}
                          className="w-full md:w-auto bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                          Unlock Tips
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                      <a
                        href={selectedScholarship.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto flex-1 bg-brand-600 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 flex items-center justify-center gap-2 group"
                      >
                        Apply Officially
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                      <button
                        onClick={() => handleChecklist(selectedScholarship)}
                        className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all px-6 py-4 rounded-2xl border border-emerald-100 shadow-sm"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Generate Checklist
                      </button>
                    </div>
                  </div>
                ) : activeModal === 'checklist' ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-start gap-4">
                      <div className="p-2 bg-emerald-100 rounded-xl shrink-0">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-emerald-900 text-lg">Smart Application Checklist</h4>
                        <p className="text-sm text-emerald-700 mt-1">Track your progress for {selectedScholarship?.university}.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {selectedScholarship?.requiredDocuments?.map((doc, i) => (
                        <label key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
                          <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                            <input type="checkbox" className="peer w-6 h-6 appearance-none border-2 border-slate-300 rounded-lg checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer" />
                            <CheckCircle className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 peer-checked:text-slate-400 peer-checked:line-through transition-all">{doc}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
                        <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                          <input type="checkbox" className="peer w-6 h-6 appearance-none border-2 border-slate-300 rounded-lg checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer" />
                          <CheckCircle className="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 peer-checked:text-slate-400 peer-checked:line-through transition-all">IELTS/TOEFL Certificate (or MOI)</span>
                      </label>
                    </div>
                    <button className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]">
                      <FileText className="w-5 h-5" />
                      Download PDF Checklist
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {interviewData?.questions?.map((item, i) => (
                      <div key={i} className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm">
                            Q
                          </div>
                          <h4 className="font-bold text-slate-900 leading-tight pt-1">{item.question}</h4>
                        </div>
                        <div className="ml-11 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Suggested Answer</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{item.suggestedAnswer}</p>
                          <div className="mt-4 pt-4 border-t border-slate-200 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-brand-500 mt-0.5" />
                            <p className="text-[11px] text-slate-500 italic"><span className="font-bold not-italic text-slate-700">Expert Tip:</span> {item.tips}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-sm">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ScholarshipSkeleton() {
  return (
    <div className="space-y-6 animate-pulse mt-8">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-3 flex-1 pr-12">
            <div className="h-4 bg-slate-100 rounded-full w-24" />
            <div className="h-8 bg-slate-200 rounded-2xl w-3/4" />
            <div className="h-4 bg-slate-100 rounded-full w-1/2" />
          </div>
          <div className="w-24 h-10 bg-slate-200 rounded-xl" />
        </div>
        <div className="flex gap-4 mb-8">
          <div className="h-8 bg-slate-100 rounded-xl w-32" />
          <div className="h-8 bg-slate-100 rounded-xl w-32" />
          <div className="h-8 bg-slate-100 rounded-xl w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="h-3 bg-slate-50 rounded-full w-1/4" />
            <div className="h-12 bg-slate-50 rounded-xl w-full" />
            <div className="h-3 bg-slate-50 rounded-full w-1/4" />
            <div className="h-12 bg-slate-50 rounded-xl w-full" />
          </div>
          <div className="space-y-4">
            <div className="h-3 bg-slate-50 rounded-full w-1/4" />
            <div className="h-32 bg-slate-50 rounded-xl w-full" />
          </div>
        </div>
        <div className="flex justify-between pt-6 border-t border-slate-50">
          <div className="h-6 bg-slate-100 rounded-full w-32" />
          <div className="h-10 bg-slate-200 rounded-xl w-40" />
        </div>
      </div>
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm opacity-60">
          <div className="flex justify-between">
            <div className="space-y-3 w-2/3">
              <div className="h-6 bg-slate-100 rounded-full w-24" />
              <div className="h-8 bg-slate-200 rounded-2xl w-full" />
              <div className="h-4 bg-slate-100 rounded-full w-1/2" />
            </div>
            <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
