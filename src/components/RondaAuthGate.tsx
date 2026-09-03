'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Home,
  ChevronRight,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface RondaAuthGateProps {
  onSuccess: (token: string, passcode: string) => void;
  onBack: () => void;
}

export default function RondaAuthGate({ onSuccess, onBack }: RondaAuthGateProps) {
  const [passcode, setPasscode] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [hintText, setHintText] = useState<string>('Tanyakan sandi pada Komandan Regu (Danru) atau Koordinator Ronda Tugurejo.');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [adminSecurityConfig, setAdminSecurityConfig] = useState<{
    enabled: boolean;
    passcode: string;
    hint: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Subscribe to Firestore settings/ronda_security (Live sync with Web Admin Tab Sandi)
  useEffect(() => {
    if (!db) return;
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'ronda_security'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const cfg = {
            enabled: data.enabled !== false,
            passcode: String(data.passcode || 'linmas123').trim(),
            hint: data.hint || 'Tanyakan sandi pada Komandan Regu (Danru) atau Koordinator Ronda.',
          };
          setAdminSecurityConfig(cfg);
          setHintText(cfg.hint);

          // If admin disabled passcode protection, bypass directly
          if (!cfg.enabled) {
            onSuccess('bypass', '');
          }
        } else {
          // Default config if document does not exist
          setAdminSecurityConfig({
            enabled: true,
            passcode: 'linmas123',
            hint: 'Tanyakan sandi pada Komandan Regu (Danru) atau Koordinator Ronda Tugurejo.',
          });
        }
      });
      return () => unsub();
    } catch {
      // ignore
    }
  }, [onSuccess]);

  // 2. Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // 3. Handle Verify Passcode
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = passcode.trim();
    if (!candidate || lockoutTimer > 0 || loading) return;

    setLoading(true);
    setErrorMsg('');

    // Method A: Serverless API Verification
    try {
      const res = await fetch('/api/verify-ronda-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: candidate }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          const token = data.token || `tok_${Date.now()}`;
          sessionStorage.setItem('tentrem_ronda_auth_token', token);
          sessionStorage.setItem('tentrem_ronda_passcode', candidate);
          onSuccess(token, candidate);
          return;
        }
      } else if (res.status === 429) {
        const data = await res.json();
        setLockoutTimer(data.remainingSec || 60);
        triggerError(data.error || 'Terlalu banyak percobaan sandi. Akses dikunci sementara.');
        setLoading(false);
        return;
      }
    } catch {
      // Fall through to Direct Firestore Verification
    }

    // Method B: Direct Firestore Security Check
    try {
      let targetPasscode = 'linmas123';
      let isEnabled = true;
      let hint = hintText;

      if (adminSecurityConfig) {
        targetPasscode = adminSecurityConfig.passcode;
        isEnabled = adminSecurityConfig.enabled;
        hint = adminSecurityConfig.hint;
      } else if (db) {
        const snap = await getDoc(doc(db, 'settings', 'ronda_security'));
        if (snap.exists()) {
          const d = snap.data();
          isEnabled = d.enabled !== false;
          targetPasscode = String(d.passcode || 'linmas123').trim();
          hint = d.hint || hint;
        }
      }

      if (!isEnabled || candidate === targetPasscode) {
        const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem('tentrem_ronda_auth_token', sessionToken);
        sessionStorage.setItem('tentrem_ronda_passcode', candidate);
        setFailedAttempts(0);
        onSuccess(sessionToken, candidate);
        return;
      } else {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);
        if (newFailed >= 5) {
          setLockoutTimer(60);
          setFailedAttempts(0);
          triggerError('5x salah memasukkan sandi. Akses dikunci sementara selama 60 detik.');
        } else {
          triggerError(`Sandi yang dimasukkan salah. Sisa kesempatan: ${5 - newFailed} kali.`);
        }
        setHintText(hint);
        setLoading(false);
        return;
      }
    } catch {
      triggerError('Gagal memverifikasi sandi. Silakan periksa koneksi internet.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 pt-24 sm:pt-28 transition-colors duration-300">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-1">
          <button type="button" onClick={onBack} className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-white font-bold">Lapor Ronda</span>
        </nav>

        {/* Security Card */}
        <div
          className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-transform ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-slate-900 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 ring-8 ring-emerald-500/10">
              <Lock className="w-8 h-8 text-emerald-300" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Proteksi Sandi Siskamling</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Masukkan Sandi Akses Ronda
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Formulir lapor ronda diproteksi. Masukkan sandi yang diatur oleh Admin / Danru Linmas Desa Tugurejo.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sandi Akses Petugas</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Wajib Diisi</span>
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Ketik sandi akses ronda..."
                  disabled={loading || lockoutTimer > 0}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base font-bold focus:outline-none focus:border-emerald-500 transition-all pr-12 disabled:opacity-50"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
                  tabIndex={-1}
                  title={showPasscode ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">{errorMsg}</div>
              </div>
            )}

            {/* Lockout Timer */}
            {lockoutTimer > 0 && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold text-center">
                ⏳ Terlalu banyak percobaan. Silakan tunggu <strong>{lockoutTimer} detik</strong>.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !passcode.trim() || lockoutTimer > 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Sandi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Masuk &amp; Buka Laporan Ronda</span>
                </>
              )}
            </button>
          </form>

          {/* Hint Accordion */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Tutup Petunjuk' : 'Lupa atau Butuh Bantuan Sandi?'}</span>
            </button>

            {showHint && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/20 text-slate-700 dark:text-slate-300 text-xs leading-relaxed animate-in fade-in duration-150 text-left space-y-1">
                <p className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Petunjuk Sandi:</span>
                </p>
                <p>{hintText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="text-center text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sistem Keamanan Terenkripsi • Linmas Desa Tugurejo</span>
        </div>
      </div>
    </div>
  );
}
