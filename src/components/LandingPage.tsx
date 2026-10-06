import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Sparkles, ShieldCheck, MessageSquare, ArrowRight, Globe, Award, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* Hero Section with integrated Navigation */}
      <section className="relative isolate overflow-hidden bg-[#050505] min-h-[90vh] flex flex-col border-b border-white/10">
        {/* Navigation */}
        <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 p-2 rounded-xl shadow-lg shadow-brand-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ScholarMind</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pro" className="hover:text-white transition-colors">Platform</a>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onSignIn}
              className="text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={onGetStarted}
              className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all shadow-lg"
            >
              Launch App
            </button>
          </div>
        </nav>

        <div className="absolute inset-0 z-0 opacity-50">
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] rounded-full bg-brand-900/40 blur-[120px] animate-pulse-slow" />
          <div className="absolute right-0 bottom-0 w-[80%] h-[80%] rounded-full bg-fuchsia-900/40 blur-[120px] animate-pulse-slow delay-1000" />
        </div>
        <div className="flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 border border-white/20 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-brand-300" />
              Empowering Global Ambitions
            </motion.div>
            <h1 className="text-6xl md:text-7xl lg:text-[88px] font-bold leading-[0.85] tracking-tight mb-8 text-white">
              Unlock Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-200 to-brand-400">Global Future</span> <br />
              with AI.
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-lg leading-relaxed font-light">
              ScholarMind AI is the world's first intelligent platform that matches your academic profile with global scholarships and provides a complete roadmap for your student visa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="bg-white text-brand-900 px-10 py-5 rounded-full font-bold text-lg hover:bg-brand-50 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 group"
              >
                Access Full Platform
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-400 to-fuchsia-400 rounded-[40px] blur-2xl opacity-40 animate-float-slow" />
            <div className="relative bg-white/10 rounded-[40px] p-4 shadow-2xl border border-white/20 backdrop-blur-md">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                className="rounded-[32px] w-full object-cover aspect-[4/3] shadow-inner"
                alt="Happy students on a university campus"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/50"
              >
                <div className="bg-brand-100 p-3 rounded-xl">
                  <Award className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Fully Funded</p>
                  <p className="text-slate-900 font-bold">Oxford University</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">How ScholarMind Works</h2>
            <p className="text-slate-500">Your journey from local student to global scholar in four simple steps.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-12">
            {[
              { step: '01', title: 'Create Profile', desc: 'Input your GPA, IELTS, and field of study.', icon: <GraduationCap className="w-6 h-6" /> },
              { step: '02', title: 'AI Matching', desc: 'Our AI scans thousands of global scholarships.', icon: <Sparkles className="w-6 h-6" /> },
              { step: '03', title: 'Visa Roadmap', desc: 'Get detailed visa requirements for your destination.', icon: <ShieldCheck className="w-6 h-6" /> },
              { step: '04', title: 'Apply & Win', desc: 'Use AI interview prep to ace your application.', icon: <Award className="w-6 h-6" /> },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-black text-brand-200 absolute -top-10 -left-4 z-0">{item.step}</div>
                <div className="relative z-10">
                  <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Scholarships Section */}
      <section className="py-32 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Featured Scholarships</h2>
            <p className="text-slate-500">Top-tier opportunities currently accepting applications.</p>
          </div>
          <button onClick={onGetStarted} className="text-brand-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
            View All Opportunities <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'DAAD Scholarship', country: 'Germany', snippet: 'Fully funded for Master\'s and PhD students in all disciplines.' },
            { name: 'Chevening Scholarship', country: 'UK', snippet: 'One-year Master\'s degree funding for future leaders.' },
            { name: 'Fulbright Program', country: 'USA', snippet: 'Prestigious exchange program for graduate study and research.' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
              <div className="bg-brand-50 text-brand-700 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">
                {s.country}
              </div>
              <h3 className="text-xl font-bold mb-3">{s.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">{s.snippet}</p>
              <button onClick={onGetStarted} className="text-xs font-bold text-slate-900 border-b-2 border-slate-900 pb-1">Learn More</button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">Success Stories</h2>
            <p className="text-slate-400">Join thousands of students who achieved their dreams with us.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Chen', field: 'Data Science', quote: 'ScholarMind AI found a niche scholarship I would have never found on my own. I\'m now studying in Germany!' },
              { name: 'Ahmed Hassan', field: 'Public Health', quote: 'The visa roadmap was a lifesaver. It broke down complex requirements into simple, actionable steps.' },
              { name: 'Elena Rodriguez', field: 'Architecture', quote: 'The AI interview prep was spot on. The questions it generated were almost identical to my actual interview!' },
            ].map((t, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm p-10 rounded-[40px] border border-white/10">
                <div className="flex items-center gap-4 mb-8">
                  <img src={`https://picsum.photos/seed/${i + 50}/100/100`} className="w-12 h-12 rounded-full border-2 border-brand-500" alt={t.name} referrerPolicy="no-referrer" />
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-[10px] text-brand-400 uppercase font-bold tracking-widest">{t.field}</div>
                  </div>
                </div>
                <p className="text-slate-300 italic leading-relaxed">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro CTA Section */}
      <section id="pro" className="py-32 max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-brand-600 to-violet-700 rounded-[60px] p-12 md:p-24 text-center text-white shadow-2xl shadow-brand-500/20">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8 backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
              Platform Features
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Master Your Career Abroad <br /> with Advanced Intelligence</h2>
            <p className="text-white/80 text-lg mb-12">Get unlimited searches, success probability scores, personalized SOP generation, and priority visa guidance — all for free.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={onGetStarted}
                className="bg-white text-brand-600 px-12 py-6 rounded-2xl font-bold text-xl hover:bg-brand-50 transition-all shadow-xl"
              >
                Start for Free
              </button>
              <div className="flex flex-col items-start gap-2">
                {['Unlimited Searches', 'Success Score', 'SOP Generator'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-brand-600 p-2 rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">ScholarMind</span>
            </div>
            <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
              Empowering global students with AI-driven scholarship research and visa guidance.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Product</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-brand-600">Scholarships</a></li>
              <li><a href="#" className="hover:text-brand-600">Visa Guide</a></li>
              <li><a href="#" className="hover:text-brand-600">AI Chat</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Company</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-brand-600">About</a></li>
              <li><a href="#" className="hover:text-brand-600">Privacy</a></li>
              <li><a href="#" className="hover:text-brand-600">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
          © 2026 ScholarMind. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
