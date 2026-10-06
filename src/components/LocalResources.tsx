import React, { useState, useEffect } from 'react';
import { getLocalResources } from '../services/geminiService';
import { MapPin, Loader2, ExternalLink, Navigation, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

export function LocalResources() {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [submittedLocation, setSubmittedLocation] = useState<string | null>(null);
  const [resources, setResources] = useState<{ text: string, chunks: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = () => {
    setIsLoading(true);
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          setError("Location access denied. Please enable location services to find nearby resources.");
          setIsLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualLocation.trim()) {
      setLocation(null); // Clear auto location if manual is used
      setSubmittedLocation(manualLocation.trim());
    }
  };

  useEffect(() => {
    if (location || submittedLocation) {
      setIsLoading(true);
      setError(null);
      getLocalResources(location?.lat || null, location?.lng || null, submittedLocation || undefined)
        .then(data => {
          setResources(data);
          setIsLoading(false);
        })
        .catch((err: any) => {
          console.error(err);
          const message = err.message || String(err);
          if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
            setError("Google Maps search service is currently under high demand. Please wait a moment and try again.");
          } else {
            setError("Failed to fetch local resources.");
          }
          setIsLoading(false);
        });
    }
  }, [location, submittedLocation]);

  return (
    <div className="glass-card rounded-3xl p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <MapPin className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Local Support Network</h2>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">IELTS Centers • Consultants • Agencies</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchLocation}
            className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center shrink-0"
            title="Use Current Location"
          >
            <Navigation className="w-5 h-5" />
          </button>
          <form onSubmit={handleManualSearch} className="flex flex-1 sm:w-64 relative">
            <input
              type="text"
              placeholder="Enter city or region..."
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {!location && !submittedLocation && !isLoading && !error && (
        <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Navigation className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Find Nearby Assistance</h3>
          <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
            Use the search bar above or enable location services to discover physical test centers and expert consultants in your area.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-5">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-600 rounded-full" />
            </div>
          </div>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Scanning your area...</p>
        </div>
      )}

      {error && (
        <div className="p-5 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 flex items-start gap-4 shadow-sm">
          <div className="p-1.5 bg-rose-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          </div>
          <div>
            <p className="font-bold text-sm mb-1">Location Error</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {resources && !isLoading && (
        <div className="space-y-10">
          <div className="markdown-body bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <Markdown>{resources.text}</Markdown>
          </div>

          {resources.chunks && resources.chunks.length > 0 && (
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-8 h-px bg-slate-200" />
                Verified Map Locations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {resources.chunks?.map((chunk, idx) => {
                  if (chunk.maps?.uri) {
                    return (
                      <a
                        key={idx}
                        href={chunk.maps.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group bg-white"
                      >
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <MapPin className="w-5 h-5 shrink-0" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-1">
                            {chunk.maps.title || "View on Maps"}
                          </h4>
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                            Navigate <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
