import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { createChatSession, sendMessage } from '../services/geminiService';
import { Send, User, Bot, Loader2, Sparkles, Globe, GraduationCap, ShieldCheck, Zap } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';

interface ChatbotProps {
  profile: UserProfile | null;
}

export function Chatbot({ profile }: ChatbotProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usePro, setUsePro] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const researchSuggestions = [
    { label: 'Audit My Resume', icon: <User className="w-3 h-3 text-brand-500" />, prompt: 'Audit my resume for a specific scholarship (e.g. my top match) by analyzing my current profile data. Identify strengths, weaknesses, and actionable improvement tips.' },
    { label: 'Visa Comparison', icon: <ShieldCheck className="w-3 h-3 text-brand-500" />, prompt: 'Compare visa requirements for UK, USA and Germany for student visa.' },
    { label: 'Top CS Unis', icon: <GraduationCap className="w-3 h-3 text-brand-500" />, prompt: 'What are the top 10 universities in Australia for Computer Science with high scholarship rates?' },
    { label: 'Living Costs', icon: <Globe className="w-3 h-3 text-brand-500" />, prompt: 'What is the average cost of living for a student in Canada vs Netherlands?' },
    { label: 'PR Options', icon: <Sparkles className="w-3 h-3 text-brand-500" />, prompt: 'Which EU countries have the best Post-Study Work Visa (PR) paths for STEM students?' }
  ];

  const handleSendManual = async (text: string) => {
    if (!text.trim() || !chatSession || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);

    try {
      const response = await sendMessage(chatSession, text);
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
      const errorMessage = isRateLimit 
        ? "The AI is currently under high demand. Please wait a few seconds and try again."
        : "Sorry, I encountered an error. Please try again.";
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (!profile || isLoading) return;
    setInput(suggestion);
    handleSendManual(suggestion);
  };

  useEffect(() => {
    if (profile) {
      setChatSession(createChatSession(profile, usePro));
      if (messages.length === 0) {
        const needsIELTS = profile.ielts.toLowerCase().includes('not') || profile.ielts.toLowerCase().includes('plan');
        setMessages([{
          role: 'model',
          text: needsIELTS 
            ? "Hi! I noticed you haven't taken an English proficiency test yet. I can help you find the right test (IELTS, TOEFL, or Duolingo), suggest preparation resources, or find scholarships that don't require them. What would you like to start with?"
            : "Hi! I'm your AI education consultant. I've reviewed your profile. How can I help you with your scholarship applications today?"
        }]);
      }
    } else {
      setMessages([{
        role: 'model',
        text: "Hi! Please fill out your academic profile first so I can give you personalized advice."
      }]);
    }
  }, [profile, usePro]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await sendMessage(chatSession, userText);
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
      const errorMessage = isRateLimit 
        ? "The AI is currently under high demand. Please wait a few seconds and try again."
        : "Sorry, I encountered an error. Please try again.";
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] glass-card rounded-3xl overflow-hidden shadow-xl shadow-brand-500/5">
      <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Bot className="w-7 h-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 tracking-tight">AI Consultant</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Online • {usePro ? 'Deep Thinking' : 'Fast Response'}</p>
            </div>
          </div>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">High Thinking</span>
          <div className="relative">
            <input type="checkbox" checked={usePro} onChange={() => setUsePro(!usePro)} className="sr-only peer" />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
          </div>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-brand-600 border border-slate-100'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="markdown-body">
                  <Markdown>{msg.text}</Markdown>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-white text-brand-600 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white border border-slate-100 text-slate-500 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultant is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-5 bg-white border-t border-slate-100">
        <div className="flex flex-wrap gap-2 mb-4">
          {researchSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestionClick(s.prompt)}
              disabled={!profile || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 transition-all disabled:opacity-50"
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={profile ? "Ask about essays, interviews, or requirements..." : "Please fill out your profile first"}
            disabled={!profile || isLoading}
            className="w-full pl-5 pr-14 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all disabled:opacity-50 text-[15px]"
          />
          <button
            type="submit"
            disabled={!profile || !input.trim() || isLoading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
