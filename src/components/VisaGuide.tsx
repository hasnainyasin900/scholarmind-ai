import React, { useState, useEffect, useRef } from 'react';
import { getVisaInfo, getCountryComparison } from '../services/geminiService';
import { VisaInfo, CountryComparison, Scholarship, UserProfile } from '../types';
import { Globe, ShieldCheck, Clock, DollarSign, Briefcase, ExternalLink, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus, CheckCircle, Languages, GraduationCap, Search, X, Compass, ListCollapse } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UniversityCompare } from './UniversityCompare';

export function VisaGuide({ country, university, profile, scholarships }: { country: string, university: string, profile?: UserProfile | null, scholarships: Scholarship[] }) {
  const countryCodeMap: { [key: string]: string } = {
    'United States': 'US',
    'USA': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Japan': 'JP',
    'China': 'CN',
    'India': 'IN',
    'Brazil': 'BR',
    'South Africa': 'ZA',
    'New Zealand': 'NZ',
    'Ireland': 'IE',
    'Singapore': 'SG',
    'Netherlands': 'NL',
    'Sweden': 'SE',
    'Switzerland': 'CH',
    'Italy': 'IT',
    'Spain': 'ES',
    'Mexico': 'MX',
    'Argentina': 'AR',
    'Egypt': 'EG',
    'Nigeria': 'NG',
    'Kenya': 'KE',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'Russia': 'RU',
    'South Korea': 'KR',
    'Indonesia': 'ID',
    'Malaysia': 'MY',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
    'Philippines': 'PH',
    'Turkey': 'TR',
    'Greece': 'GR',
    'Portugal': 'PT',
    'Belgium': 'BE',
    'Austria': 'AT',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Poland': 'PL',
    'Ukraine': 'UA',
    'Colombia': 'CO',
    'Chile': 'CL',
    'Peru': 'PE',
    'Venezuela': 'VE',
    'Morocco': 'MA',
    'Algeria': 'DZ',
    'Ghana': 'GH',
    'Ethiopia': 'ET',
    'Israel': 'IL',
    'Iran': 'IR',
    'Iraq': 'IQ',
    'Afghanistan': 'AF',
    'Kazakhstan': 'KZ',
    'Uzbekistan': 'UZ',
    'Sri Lanka': 'LK',
    'Nepal': 'NP',
    'Myanmar': 'MM',
    'Cambodia': 'KH',
    'Laos': 'LA',
    'Mongolia': 'MN',
    'Fiji': 'FJ',
    'Papua New Guinea': 'PG',
    'Cuba': 'CU',
    'Jamaica': 'JM',
    'Dominican Republic': 'DO',
    'Haiti': 'HT',
    'Guatemala': 'GT',
    'Honduras': 'HN',
    'El Salvador': 'SV',
    'Nicaragua': 'NI',
    'Costa Rica': 'CR',
    'Panama': 'PA',
    'Ecuador': 'EC',
    'Bolivia': 'BO',
    'Paraguay': 'PY',
    'Uruguay': 'UY',
  };

  const getFlagUrl = (countryName: string) => {
    const countryCode = countryCodeMap[countryName];
    if (countryCode) {
      return `https://flagsapi.com/${countryCode}/flat/64.png`;
    }
    return '';
  };
  const [visa, setVisa] = useState<VisaInfo | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'visa' | 'university'>('visa');
  const [comparison, setComparison] = useState<CountryComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareInput, setCompareInput] = useState('');
  const [compareCountries, setCompareCountries] = useState<string[]>(['Germany', 'UK', 'Canada', 'USA', 'Australia']);
  const [isComparing, setIsComparing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof CountryComparison, direction: 'asc' | 'desc' } | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const suggestionRef = useRef<HTMLFormElement>(null);
  const ALL_COUNTRIES = Object.keys(countryCodeMap);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompareInput(value);

    const segments = value.split(',');
    const currentSegment = segments[segments.length - 1].trim();

    if (currentSegment) {
      const filtered = ALL_COUNTRIES.filter(c => 
        c.toLowerCase().includes(currentSegment.toLowerCase()) && 
        !compareCountries.some(existing => existing.toLowerCase() === c.toLowerCase())
      ).slice(0, 10);
      setSuggestions(filtered);
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const segments = compareInput.split(',');
    segments[segments.length - 1] = ` ${suggestion}`;
    const newValue = segments.join(',').trim();
    setCompareInput(newValue);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const fetchData = async (countries: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const [v, c] = await Promise.all([
        getVisaInfo(country || 'USA', university || 'Top University'),
        getCountryComparison(countries, profile)
      ]);
      setVisa(v);
      setComparison(c);
    } catch (err: any) {
      console.error(err);
      const message = err.message || String(err);
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        setError("AI services are under high demand. Please try again soon.");
      } else {
        setError('Failed to load visa and comparison data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(compareCountries);
  }, [country, university, profile]);

  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compareInput.trim()) return;
    
    const newCountriesToAdd = compareInput.split(',').map(c => c.trim()).filter(c => c && !compareCountries.some(existing => existing.toLowerCase() === c.toLowerCase()));
    if (newCountriesToAdd.length === 0) {
      setCompareInput('');
      return;
    }

    const updatedCountries = [...compareCountries, ...newCountriesToAdd];
    setCompareInput('');
    setIsComparing(true);
    setError(null);
    try {
      const c = await getCountryComparison(updatedCountries, profile);
      setComparison(c);
      setCompareCountries(updatedCountries);
    } catch (err: any) {
      console.error(err);
      const message = err.message || String(err);
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        setError("AI services are under high demand. Please try again soon.");
      } else {
        setError('Failed to add country. Please try again.');
      }
    } finally {
      setIsComparing(false);
    }
  };

  const removeCountry = (countryToRemove: string) => {
    const updatedCountries = compareCountries.filter(c => c !== countryToRemove);
    if (updatedCountries.length === 0) return;

    setCompareCountries(updatedCountries);
    setComparison(prev => prev.filter(c => c.country !== countryToRemove));
  };

  const handleSort = (key: keyof CountryComparison) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedComparison = React.useMemo(() => {
    let sortableItems = [...comparison];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [comparison, sortConfig]);

  const filteredComparison = sortedComparison.filter(c => 
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50 p-6 md:p-12 xl:px-16">
      {/* Sub-tab Switcher Bar */}
      <div className="flex border-b border-slate-700/60 pb-4 mb-8">
        <button
          onClick={() => setActiveSubTab('visa')}
          className={`pb-2 px-4 text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'visa'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Visa & Country Guide
        </button>
        <button
          onClick={() => setActiveSubTab('university')}
          className={`pb-2 px-4 text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'university'
              ? 'border-brand-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          University Side-by-Side Matcher
        </button>
      </div>

      {activeSubTab === 'university' ? (
        <UniversityCompare scholarships={scholarships} profile={profile} />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Compiling Visa Intelligence...</p>
        </div>
      ) : (
        <>
          {error && (
        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => fetchData(compareCountries)} className="ml-auto text-xs font-bold uppercase tracking-widest hover:underline">
            Retry
          </button>
        </div>
      )}
      {/* Visa Info Card */}
      {visa && (
        <div className="glass-card rounded-3xl p-8 space-y-8 bg-slate-800/60 backdrop-blur-lg border border-slate-700 shadow-xl mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-500/20 text-brand-300 rounded-2xl flex items-center justify-center shadow-sm border border-brand-400/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{visa.visaName} Guide</h2>
              <p className="text-sm font-medium text-brand-200 uppercase tracking-wider mt-1">{visa.country} • Student Visa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md shadow-inner transition-all hover:bg-slate-900/60"
            >
              <div className="flex items-center gap-3 text-brand-300 text-[10px] font-bold uppercase tracking-widest mb-3">
                <div className="w-8 h-8 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
                Financial Proof
              </div>
              <p className="text-xl font-bold text-white tracking-tight">{visa.financialProofAmount}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Statement: {visa.bankStatementDuration}
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md shadow-inner transition-all hover:bg-slate-900/60"
            >
              <div className="flex items-center gap-3 text-brand-300 text-[10px] font-bold uppercase tracking-widest mb-3">
                <div className="w-8 h-8 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                Processing Time
              </div>
              <p className="text-xl font-bold text-white tracking-tight">{visa.processingTime}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                <AlertCircle className="w-3 h-3 text-brand-400" />
                Interview: {visa.interviewRequired ? 'Required' : 'Not Required'}
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md shadow-inner transition-all hover:bg-slate-900/60"
            >
              <div className="flex items-center gap-3 text-brand-300 text-[10px] font-bold uppercase tracking-widest mb-3">
                <div className="w-8 h-8 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                  <Briefcase className="w-4 h-4" />
                </div>
                Work Rights
              </div>
              <p className="text-xl font-bold text-white tracking-tight">{visa.workRights}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Globe className="w-3 h-3 text-blue-400" />
                PSW: {visa.postStudyWorkOptions}
              </div>
            </motion.div>
          </div>

          <div className="pt-6 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-base font-bold text-slate-300">
              Visa Fee: <span className="text-brand-400">{visa.visaFee}</span>
            </div>
            <a 
              href={visa.officialLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary px-8 py-3 text-base bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center gap-2 transition-colors"
            >
              Official Portal
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Country Comparison Dashboard */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-3xl border border-slate-700 backdrop-blur-lg shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/20 rounded-xl border border-brand-400/30">
              <Globe className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Global Comparison</h2>
              <p className="text-xs text-slate-400 mt-0.5">Compare visa requirements across destinations</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search results..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-sm"
            />
            <form onSubmit={handleAddCountry} className="flex gap-2 w-full sm:w-auto relative group" ref={suggestionRef}>
              <input 
                type="text" 
                placeholder="Japan, France, Germany..." 
                value={compareInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full sm:w-64 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-sm pr-24"
              />
              <button 
                type="submit" 
                disabled={isComparing} 
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center min-w-[80px] shadow-lg shadow-brand-500/10"
              >
                {isComparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Compare'}
              </button>

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                  >
                    <div className="p-2 border-b border-slate-800 bg-slate-800/30">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Suggestions</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {suggestions.map((s, i) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestionClick(s)}
                          onMouseEnter={() => setActiveSuggestionIndex(i)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-3 ${
                            i === activeSuggestionIndex 
                              ? 'bg-brand-500/20 text-brand-300 border-l-2 border-brand-500' 
                              : 'text-slate-300 hover:bg-slate-800 group'
                          }`}
                        >
                          <span className="opacity-60 grayscale group-hover:grayscale-0 transition-all">
                            {getFlagUrl(s) ? (
                              <img src={getFlagUrl(s)} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <Globe className="w-4 h-4 text-slate-600" />
                            )}
                          </span>
                          <span className="font-medium">{s}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute -bottom-6 left-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider opacity-0 group-focus-within:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Separate multiple countries with commas
              </div>
            </form>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-1">
          {compareCountries.map(c => (
            <div key={c} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold text-white shadow-sm transition-all hover:border-brand-500/50">
              <span className="opacity-60">{getFlagUrl(c) && <span>🌎</span>}</span>
              {c}
              <button 
                onClick={() => removeCountry(c)}
                className="p-0.5 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-rose-400"
                title="Remove from comparison"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 border-r border-slate-700 hidden md:flex">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analysis Engine</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 flex-grow">
            {[
              { id: 'costOfLiving', label: 'Cost', icon: <DollarSign className="w-3 h-3" /> },
              { id: 'prOptions', label: 'PR Options', icon: <Briefcase className="w-3 h-3" /> },
              { id: 'visaSuccessProbability', label: 'Success Prob.', icon: <CheckCircle className="w-3 h-3" /> }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => handleSort(item.id as keyof CountryComparison)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  sortConfig?.key === item.id 
                    ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30' 
                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-brand-500/50 hover:text-slate-200'
                }`}
              >
                {item.icon}
                {item.label}
                {sortConfig?.key === item.id && (
                  <span className="opacity-60">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button 
              onClick={() => setViewMode('cards')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'cards' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Cards
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Table
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="bg-slate-800/40 rounded-3xl border border-slate-700 overflow-hidden backdrop-blur-lg shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Destination</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-brand-400 transition-colors" onClick={() => handleSort('visaDifficulty')}>Difficulty</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-brand-400 transition-colors" onClick={() => handleSort('visaSuccessProbability')}>Success Prob.</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cost of Living</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tuition</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">PR Pathway</th>
                    <th className="p-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredComparison.map((c, idx) => (
                    <motion.tr 
                      key={c.country}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-700/30 transition-colors group"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          {getFlagUrl(c.country) ? (
                            <img src={getFlagUrl(c.country)} alt="" className="w-10 h-10 rounded-xl border border-slate-700 shadow-sm" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-slate-500 border border-slate-700">
                              {c.country.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-black text-white text-base tracking-tight">{c.country}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.15em] border ${
                          c.visaDifficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          c.visaDifficulty === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {c.visaDifficulty}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-black ${
                            c.visaSuccessProbability >= 80 ? 'text-emerald-400' :
                            c.visaSuccessProbability >= 50 ? 'text-amber-400' :
                            'text-rose-400'
                          }`}>{c.visaSuccessProbability}%</span>
                        </div>
                      </td>
                      <td className="p-6 text-sm font-bold text-slate-300">{c.costOfLiving}</td>
                      <td className="p-6 text-sm font-bold text-slate-300">{c.averageTuitionFees || 'N/A'}</td>
                      <td className="p-6 text-sm font-bold text-slate-300">{c.prOptions}</td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => removeCountry(c.country)}
                          className="p-3 bg-slate-800/50 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl transition-all border border-slate-700/50 opacity-0 group-hover:opacity-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredComparison.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/40 rounded-[40px] border border-slate-700/50 backdrop-blur-md">
                <Globe className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">No destination matches your query</p>
              </div>
            ) : (
              filteredComparison.map((c, idx) => (
                <motion.div 
                  key={c.country}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden transition-all duration-500 hover:border-brand-500/50 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)]"
                >
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-600/5 to-transparent pointer-events-none" />
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

                  <div className="p-8 md:p-12 relative z-10">
                    <div className="flex flex-col lg:flex-row gap-12">
                      <div className="flex-1 space-y-8">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              {getFlagUrl(c.country) ? (
                                <img src={getFlagUrl(c.country)} alt="" className="w-20 h-20 rounded-3xl shadow-2xl border-2 border-slate-700 object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-2xl font-black text-slate-600 border-2 border-slate-700 uppercase">
                                  {c.country.substring(0, 2)}
                                </div>
                              )}
                              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center border-4 border-slate-900 shadow-lg">
                                 <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">{c.country}</h3>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                                  c.visaDifficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                  c.visaDifficulty === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}>
                                  {c.visaDifficulty} Entry
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                  {c.costOfLiving}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                  <GraduationCap className="w-3.5 h-3.5 text-brand-400" />
                                  {c.averageTuitionFees || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeCountry(c.country)}
                            className="p-4 bg-slate-800/50 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-2xl transition-all border border-slate-700/50"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Strategic Advantages</h4>
                             <div className="space-y-3">
                                {c.pros?.slice(0, 3).map((p, i) => (
                                  <div key={i} className="flex items-center gap-4 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 group/item hover:border-emerald-500/30 transition-all">
                                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                     <span className="text-[13px] font-bold text-slate-300 group-hover/item:text-white transition-colors">{p}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Compliance Risks</h4>
                             <div className="space-y-3">
                                {c.cons?.slice(0, 3).map((con, i) => (
                                  <div key={i} className="flex items-center gap-4 bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 group/item hover:border-rose-500/30 transition-all">
                                     <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                     <span className="text-[13px] font-bold text-slate-300 group-hover/item:text-white transition-colors">{con}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:w-96 shrink-0">
                        <div className="bg-slate-800/40 rounded-[32px] border border-slate-700/50 p-8 space-y-8 backdrop-blur-xl h-full">
                          <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Application Success</span>
                                <span className={`text-2xl font-black ${
                                  c.visaSuccessProbability >= 80 ? 'text-emerald-400' :
                                  c.visaSuccessProbability >= 50 ? 'text-amber-400' :
                                  'text-rose-400'
                                }`}>{c.visaSuccessProbability}%</span>
                             </div>
                             <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.visaSuccessProbability}%` }}
                                  transition={{ duration: 1.5, ease: "easeOut" }}
                                  className={`h-full rounded-full ${
                                    c.visaSuccessProbability >= 80 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' :
                                    c.visaSuccessProbability >= 50 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                                    'bg-gradient-to-r from-rose-600 to-rose-400'
                                  }`}
                                />
                             </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                             <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <Briefcase className="w-4 h-4 text-brand-400" />
                                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">PR Pathway</span>
                                </div>
                                <span className="text-sm font-black text-white">{c.prOptions}</span>
                             </div>
                             <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <Clock className="w-4 h-4 text-brand-400" />
                                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Post-Study</span>
                                </div>
                                <span className="text-sm font-black text-white">{c.postStudyWorkDuration || 'N/A'}</span>
                             </div>
                             <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <Languages className="w-4 h-4 text-brand-400" />
                                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lang Req.</span>
                                </div>
                                <span className="text-sm font-black text-white">{c.englishProficiencyRequirements || 'N/A'}</span>
                             </div>
                          </div>

                          <div className="pt-4 border-t border-slate-700">
                             <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-brand-500/10 rounded-xl border border-brand-500/20">
                                   <TrendingUp className="w-4 h-4 text-brand-400" />
                                </div>
                                <div>
                                   <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">AI Recommendation</h5>
                                   <p className="text-[11px] font-semibold text-slate-300 leading-relaxed italic">
                                      "Your profile markers suggest a highly optimized fit for {c.country}'s current policy trends."
                                   </p>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
