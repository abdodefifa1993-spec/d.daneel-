import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Flag,
  Volume2,
  VolumeX,
  Pause,
  Play,
  X,
  Gauge,
  Compass,
  MapPin,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { NavigationStep } from '../../services/maps/types';

interface NavigationHudProps {
  isActive: boolean;
  onStop: () => void;
  destinationName?: string;
  totalDistanceKm: number;
  remainingDistanceKm: number;
  totalDurationMins: number;
  remainingDurationMins: number;
  etaText: string;
  currentStep: NavigationStep | null;
  distanceToNextTurnMeters: number;
  currentSpeedKmh: number;
  progressPercent: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onRecenter: () => void;
}

export const NavigationHud: React.FC<NavigationHudProps> = ({
  isActive,
  onStop,
  destinationName = 'الوجهة المحددة',
  totalDistanceKm,
  remainingDistanceKm,
  totalDurationMins,
  remainingDurationMins,
  etaText,
  currentStep,
  distanceToNextTurnMeters,
  currentSpeedKmh,
  progressPercent,
  isPaused,
  onTogglePause,
  onRecenter
}) => {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const lastSpokenStepIdRef = useRef<string>('');

  // Arabic voice announcement using Web Speech API
  useEffect(() => {
    if (!voiceEnabled || !currentStep || !isActive) return;

    if (currentStep.id !== lastSpokenStepIdRef.current) {
      lastSpokenStepIdRef.current = currentStep.id;

      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(currentStep.instructionAr || currentStep.instruction);
          utterance.lang = 'ar-IQ';
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {
        // Speech synthesis fallback
      }
    }
  }, [currentStep?.id, voiceEnabled, isActive]);

  if (!isActive) return null;

  // Turn maneuver icon helper
  const renderTurnIcon = (turnType: NavigationStep['turnType'] = 'straight') => {
    switch (turnType) {
      case 'turn-right':
        return <ArrowRight className="w-8 h-8 text-amber-400 stroke-[3]" />;
      case 'turn-left':
        return <ArrowLeft className="w-8 h-8 text-amber-400 stroke-[3]" />;
      case 'u-turn':
        return <RotateCcw className="w-8 h-8 text-amber-400 stroke-[3]" />;
      case 'arrive':
        return <Flag className="w-8 h-8 text-emerald-400 stroke-[3]" />;
      case 'straight':
      default:
        return <ArrowUp className="w-8 h-8 text-amber-400 stroke-[3]" />;
    }
  };

  return (
    <div className="absolute top-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[540px] z-40 pointer-events-auto select-none animate-in fade-in slide-in-from-top duration-300">
      {/* Primary Navigation Guidance HUD Card */}
      <div className="bg-slate-950/95 backdrop-blur-xl border-2 border-amber-500/80 rounded-3xl p-3 sm:p-4 shadow-2xl text-white">
        {/* Progress Bar along the very top of card */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>

        {/* Next Turn Instruction Row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Maneuver Icon Box */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/50 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              {renderTurnIcon(currentStep?.turnType)}
            </div>

            {/* Maneuver Instruction & Distance */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {distanceToNextTurnMeters < 1000
                    ? `${distanceToNextTurnMeters} م`
                    : `${(distanceToNextTurnMeters / 1000).toFixed(1)} كم`}
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {currentStep?.turnType === 'arrive' ? 'وصول' : 'المناورة القادمة'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-200 line-clamp-1 mt-0.5">
                {currentStep?.instructionAr || currentStep?.instruction || 'تابع السير في المسار الحالي'}
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-xl border transition-all ${
                voiceEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={voiceEnabled ? 'كتم التوجيه الصوتي' : 'تفعيل التوجيه الصوتي'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onTogglePause}
              className={`p-2 rounded-xl border transition-all ${
                isPaused
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
              title={isPaused ? 'استئناف الملاحة' : 'إيقاف مؤقت'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              onClick={onStop}
              className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
              title="إنهاء الملاحة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Telemetry Strip: Speed, Distance Left, ETA, Destination */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center bg-slate-900/60 rounded-2xl p-2">
          <div>
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Gauge className="w-3 h-3 text-emerald-400" />
              <span>السرعة</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
              {currentSpeedKmh} <span className="text-[9px] font-normal text-slate-400">كم/س</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>المتبقي</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-cyan-400 font-mono">
              {remainingDistanceKm} <span className="text-[9px] font-normal text-slate-400">كم</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>الوصول</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-400 font-mono">
              {etaText || `${remainingDurationMins} د`}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <button
              onClick={onRecenter}
              className="px-2 py-1 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-[10px] font-bold transition-all flex items-center justify-center gap-1"
              title="تثبيت الكاميرا على موقع السيارة"
            >
              <Navigation className="w-3 h-3" />
              <span>تثبيت</span>
            </button>
          </div>
        </div>

        {/* Destination Footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-2">
          <div className="flex items-center gap-1 truncate max-w-[340px]">
            <MapPin className="w-3 h-3 text-red-400 shrink-0" />
            <span className="truncate">الوجهة: <b className="text-slate-200">{destinationName}</b></span>
          </div>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>توجيه حي دقيق</span>
          </span>
        </div>
      </div>
    </div>
  );
};
