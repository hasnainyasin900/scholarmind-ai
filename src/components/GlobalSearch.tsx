import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, Globe } from 'lucide-react';
import { ScholarshipList } from './ScholarshipList';
import { searchScholarshipsByCountry } from '../services/geminiService';
import { Scholarship } from '../types';

export function GlobalSearch() {
  const [countryQuery, setCountryQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Scholarship[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const scholarships = await searchScholarshipsByCountry(countryQuery);
      setResults(scholarships);
    } catch (err: any) {
      console.error(err);
      const message = err.message || String(err);
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        setError("The service is under high demand. Please wait 30 seconds and try again.");
      } else {
        setError("Failed to fetch scholarships. Please try again.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-brand-50 rounded-2xl">
            <Globe className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Search by Country</h3>
            <p className="text-sm text-slate-500">Find top scholarships available in any specific country.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={countryQuery}
              onChange={(e) => setCountryQuery(e.target.value)}
              placeholder="Enter a country (e.g., USA, UK, Canada, Australia)..."
              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !countryQuery.trim()}
            className="bg-brand-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
      </div>

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Results for "{countryQuery}"</h3>
            <p className="text-slate-500 text-sm">Found {results.length} scholarships</p>
          </div>
          <ScholarshipList scholarships={results} profile={null} />
        </motion.div>
      )}
    </div>
  );
}
