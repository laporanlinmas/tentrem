import React, { useEffect } from 'react';
import { MessageSquare, Star, Home, ChevronRight, ShieldCheck } from 'lucide-react';
import Header from './Header';
import SurveySection from './SurveySection';

interface SurveyPageProps {
  onBack: () => void;
}

export default function SurveyPage({ onBack }: SurveyPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-x-hidden">

      <Header isSurveyPage={true} onBack={onBack} />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8" tabIndex={-1}>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-bold">Kritik &amp; Saran</span>
        </nav>

        {/* Hero Header Banner */}
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-700/60 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Kritik &amp; Saran Warga</h1>
          <p className="text-sm text-slate-400 mt-1.5">Bantu kami meningkatkan kualitas pelayanan dan keamanan lingkungan Desa Tugurejo.</p>
        </div>

        <SurveySection />

      </main>
    </div>
  );
}
