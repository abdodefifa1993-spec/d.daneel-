import React, { useState, useEffect } from 'react';
import {
  Radio,
  X,
  Navigation,
  Car,
  Phone,
  Star,
  Compass,
  CheckCircle2,
  RefreshCw,
  Locate,
  Zap,
  Shield,
  ArrowRight,
  Crosshair
} from 'lucide-react';
import { MapCoordinates } from '../../services/maps/types';

export interface RadarCaptain {
  id: string;
  name: string;
  phone: string;
  rating: number;
  completedRides: number;
  vehicleType: 'taxi' | 'private' | 'vip' | 'delivery' | 'saiba';
  vehicleModel: string;
  plateNumber: string;
  coords: { lat: number; lng: number };
  distanceMeters: number;
  etaMins: number;
  bearing: number;
  status: 'available' | 'busy' | 'arriving';
}

interface RadarCockpitModalProps {
  isOpen: boolean;
  onClose: () => void;
  centerCoords: MapCoordinates;
  onSelectCaptainForRoute: (captain: RadarCaptain) => void;
}

export const RadarCockpitModal: React.FC<RadarCockpitModalProps> = ({
  isOpen,
  onClose,
  centerCoords,
  onSelectCaptainForRoute
}) => {
  const [scanRadius, setScanRadius] = useState<number>(3000); // 3km default
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [captains, setCaptains] = useState<RadarCaptain[]>([]);
  const [selectedCaptain, setSelectedCaptain] = useState<RadarCaptain | null>(null);

  // Generate realistic Iraqi captains based on current center coordinates
  useEffect(() => {
    if (!isOpen) return;

    setIsScanning(true);

    const vehicleTemplates: {
      type: RadarCaptain['vehicleType'];
      model: string;
      platePrefix: string;
    }[] = [
      { type: 'taxi', model: 'تكسي أصفر - كيا سيراتو 2022', platePrefix: 'بغداد أ' },
      { type: 'saiba', model: 'تكسي سايبا أصفر 2018', platePrefix: 'بغداد و' },
      { type: 'private', model: 'هيونداي إلنترا 2021', platePrefix: 'بغداد ب' },
      { type: 'vip', model: 'تويوتا كامري VIP 2024', platePrefix: 'بغداد د' },
      { type: 'delivery', model: 'دراجة نارية بلي إكسبريس', platePrefix: 'بغداد د' },
      { type: 'taxi', model: 'تكسي نيسان صني 2020', platePrefix: 'بغداد ط' },
      { type: 'private', model: 'كيا فورتي 2023', platePrefix: 'بغداد م' }
    ];

    const names = [
      'كابتن علي الكرخي',
      'كابتن حيدر الرصافي',
      'كابتن مصطفى الربيعي',
      'كابتن سجاد المنصور',
      'كابتن عمر الجادري',
      'كابتن كرار الزيدي',
      'كابتن يوسف البغدادي'
    ];

    // Create 7 realistic captains around center
    const simulatedCaptains: RadarCaptain[] = names.map((name, idx) => {
      const angle = (idx * (360 / names.length) + 25) * (Math.PI / 180);
      const distance = 350 + idx * 380; // 350m to 2.6km
      // Approx 111,000m per degree
      const latOffset = (Math.cos(angle) * distance) / 111000;
      const lngOffset = (Math.sin(angle) * distance) / (111000 * Math.cos((centerCoords.lat * Math.PI) / 180));

      const v = vehicleTemplates[idx % vehicleTemplates.length];
      const eta = Math.max(1, Math.round(distance / 350));

      return {
        id: `radar-cap-${idx + 1}`,
        name,
        phone: `0770${Math.floor(1000000 + Math.random() * 9000000)}`,
        rating: 4.8 + (idx % 3) * 0.1,
        completedRides: 320 + idx * 85,
        vehicleType: v.type,
        vehicleModel: v.model,
        plateNumber: `${v.platePrefix} ${10000 + idx * 1342}`,
        coords: {
          lat: centerCoords.lat + latOffset,
          lng: centerCoords.lng + lngOffset
        },
        distanceMeters: Math.round(distance),
        etaMins: eta,
        bearing: Math.round((idx * 51) % 360),
        status: 'available'
      };
    });

    // Simulate real radar ping arrival
    const timer = setTimeout(() => {
      setCaptains(simulatedCaptains);
      setIsScanning(false);
      setSelectedCaptain(simulatedCaptains[0]);
    }, 900);

    return () => clearTimeout(timer);
  }, [isOpen, centerCoords.lat, centerCoords.lng]);

  if (!isOpen) return null;

  const filteredCaptains = captains.filter(c => c.distanceMeters <= scanRadius);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-emerald-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all z-10"
          title="إغلاق الرادار"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <Radio className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">رادار الكباتن التكتيكي الحي</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  مسح مباشر 360°
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                رصد فوري لجميع الكباتن المتاحين حول موقعك الحالي مع المسافة وزمن الوصول الدقيق.
              </p>
            </div>
          </div>
        </div>

        {/* Radar Visual Display & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center mb-4">
          {/* Radar Screen (Circular Sonar Beam) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl border border-emerald-500/30 p-4 relative overflow-hidden aspect-square max-w-[320px] mx-auto w-full">
            {/* Radar Circular Grid Rings */}
            <div className="absolute inset-4 rounded-full border border-emerald-500/20" />
            <div className="absolute inset-12 rounded-full border border-emerald-500/25" />
            <div className="absolute inset-20 rounded-full border border-emerald-500/30" />
            <div className="absolute inset-28 rounded-full border border-emerald-500/40" />

            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-emerald-500/25" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-500/25" />

            {/* Rotating Sonar Beam */}
            <div
              className="absolute inset-4 rounded-full pointer-events-none animate-spin"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.4) 360deg)',
                animationDuration: '3s',
                animationTimingFunction: 'linear'
              }}
            />

            {/* Center User Blip */}
            <div className="relative z-10 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>

            {/* Captains Blips on Radar */}
            {filteredCaptains.map((c, i) => {
              const angleRad = (c.bearing * Math.PI) / 180;
              const normalizedDist = (c.distanceMeters / scanRadius) * 42; // percentage from center
              const topPercent = 50 - Math.cos(angleRad) * normalizedDist;
              const leftPercent = 50 + Math.sin(angleRad) * normalizedDist;
              const isSel = selectedCaptain?.id === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCaptain(c)}
                  style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform ${
                    isSel ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                  title={`${c.name} - ${c.distanceMeters} م`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    isSel
                      ? 'bg-amber-400 border-white shadow-lg shadow-amber-500/80 animate-bounce'
                      : 'bg-emerald-400 border-emerald-950 shadow-md shadow-emerald-400/50'
                  }`}>
                    <span className="w-1 h-1 rounded-full bg-slate-950" />
                  </div>
                  <span className="absolute top-full mt-0.5 right-1/2 translate-x-1/2 whitespace-nowrap text-[9px] font-bold bg-slate-900/90 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.distanceMeters}م
                  </span>
                </button>
              );
            })}

            {/* Range Badges */}
            <span className="absolute bottom-2 left-2 text-[9px] font-mono text-emerald-400/70 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
              نطاق: {scanRadius / 1000} كم
            </span>
            <span className="absolute top-2 right-2 text-[9px] font-mono text-emerald-400/70 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {filteredCaptains.length} كابتن مرصود
            </span>
          </div>

          {/* Radius & Selection Controls */}
          <div className="lg:col-span-6 space-y-3">
            {/* Radius Selector */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>تحديد قطر مسح الرادار:</span>
                <span className="font-mono text-emerald-400 font-black">{scanRadius / 1000} كم</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[1000, 3000, 5000].map((r) => (
                  <button
                    key={r}
                    onClick={() => setScanRadius(r)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      scanRadius === r
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    {r / 1000} كم
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Captain Card */}
            {selectedCaptain ? (
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/40 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{selectedCaptain.name}</div>
                      <div className="text-[11px] text-slate-400">{selectedCaptain.vehicleModel}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-black border border-amber-500/30">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{selectedCaptain.rating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">المسافة الفعلية</div>
                    <div className="text-xs font-black text-emerald-400">{selectedCaptain.distanceMeters} متر</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">وقت الوصول</div>
                    <div className="text-xs font-black text-cyan-400">{selectedCaptain.etaMins} دقائق</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">رقم اللوحة</div>
                    <div className="text-[11px] font-black text-white">{selectedCaptain.plateNumber}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      onSelectCaptainForRoute(selectedCaptain);
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-4 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>توجيه المسار والملاحة إلى هذا الكابتن</span>
                  </button>
                  <a
                    href={`tel:${selectedCaptain.phone}`}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="اتصال بالكابتن"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                اختر أي كابتن من شاشة الرادار لعرض بياناته والمسار إليه
              </div>
            )}
          </div>
        </div>

        {/* List of Detected Nearby Captains */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>الكباتن النشطين ضمن التغطية ({filteredCaptains.length})</span>
            <span className="text-[10px] text-emerald-400">تم التحديث منذ لحظات</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {filteredCaptains.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCaptain(c)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedCaptain?.id === c.id
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md'
                    : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200 text-xs font-black">
                    {c.vehicleType === 'taxi' || c.vehicleType === 'saiba' ? '🚕' : c.vehicleType === 'delivery' ? '🛵' : '🚗'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{c.name}</span>
                      <span className="text-[10px] text-amber-400">★ {c.rating}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{c.vehicleModel}</div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-xs font-mono font-black text-emerald-400">{c.distanceMeters} م</div>
                  <div className="text-[9px] text-slate-500">{c.etaMins} دقيقة</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            رادار شبكة بلي ومشوار الموحد - تغطية كاملة لمحافظات العراق
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
