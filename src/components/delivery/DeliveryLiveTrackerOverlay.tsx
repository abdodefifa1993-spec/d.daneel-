import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  X,
  Bike,
  Store,
  MapPin,
  Clock,
  Phone,
  Navigation,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Zap,
  ShieldCheck,
  Compass,
  Gauge
} from 'lucide-react';

interface DeliveryLiveTrackerOverlayProps {
  order: any;
  onClose: () => void;
}

export const DeliveryLiveTrackerOverlay: React.FC<DeliveryLiveTrackerOverlayProps> = ({
  order,
  onClose
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Store & Delivery Coordinates (Baghdad defaults if not specified)
  const storePos = {
    lat: order?.storeLat || 33.3152,
    lng: order?.storeLng || 44.3661,
    name: order?.storeName || 'المتجر'
  };

  const destPos = {
    lat: order?.deliveryAddress?.lat || 33.3050,
    lng: order?.deliveryAddress?.lng || 44.3820,
    name: order?.deliveryAddress?.name || 'موقع الزبون'
  };

  // Generate realistic curved street path between Store and Customer
  const generateStreetRoute = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    const points: [number, number][] = [];
    const steps = 30;
    const dLat = (end.lat - start.lat) / steps;
    const dLng = (end.lng - start.lng) / steps;

    for (let i = 0; i <= steps; i++) {
      // Add realistic street curve deviation
      const curve = Math.sin((i / steps) * Math.PI) * 0.0035;
      points.push([
        start.lat + dLat * i + curve,
        start.lng + dLng * i - curve * 0.5
      ]);
    }
    return points;
  };

  const [routePoints] = useState<[number, number][]>(() => generateStreetRoute(storePos, destPos));

  // Simulation State
  const [progress, setProgress] = useState(0.35); // 35% on the way
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [courierSpeedKmh, setCourierSpeedKmh] = useState(36);

  // Remaining Calculations
  const remainingPercent = Math.max(0, 1 - progress);
  const totalDistanceKm = 3.8;
  const remainingDistanceKm = (totalDistanceKm * remainingPercent).toFixed(1);
  const remainingMinutes = Math.max(1, Math.ceil(remainingPercent * 12));

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [storePos.lat, storePos.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });
    mapInstanceRef.current = map;

    // Dark Mode Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Custom Store Icon
    const storeIcon = L.divIcon({
      className: 'custom-store-pin',
      html: `
        <div style="background: #f59e0b; color: #020617; padding: 8px; border-radius: 12px; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(245,158,11,0.5); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    // Custom Customer Icon
    const customerIcon = L.divIcon({
      className: 'custom-customer-pin',
      html: `
        <div style="background: #10b981; color: #ffffff; padding: 8px; border-radius: 12px; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    // Custom Courier Icon
    const courierIcon = L.divIcon({
      className: 'custom-courier-pin',
      html: `
        <div id="animated-courier-marker" style="background: #3b82f6; color: #ffffff; padding: 8px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 16px rgba(59,130,246,0.8); display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; transition: transform 0.2s ease;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });

    // Add Markers
    L.marker([storePos.lat, storePos.lng], { icon: storeIcon })
      .addTo(map)
      .bindPopup(`<b>${storePos.name}</b><br>نقطة الانطلاق والاستلام`);

    L.marker([destPos.lat, destPos.lng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<b>${destPos.name}</b><br>عنوان التسليم للزبون`);

    // Draw Route Polyline with glowing pulse effect
    const routeLine = L.polyline(routePoints, {
      color: '#f59e0b',
      weight: 6,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '8, 8'
    }).addTo(map);
    polylineRef.current = routeLine;

    // Draw Courier Marker at current progress
    const currentIndex = Math.floor(progress * (routePoints.length - 1));
    const currentCoord = routePoints[currentIndex] || routePoints[0];
    const courierMarker = L.marker(currentCoord, { icon: courierIcon }).addTo(map);
    courierMarkerRef.current = courierMarker;

    // Fit Bounds so entire route is visible
    const bounds = L.latLngBounds([
      [storePos.lat, storePos.lng],
      [destPos.lat, destPos.lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Courier Marker & Polyline Animation loop
  useEffect(() => {
    let lastTime = performance.now();

    const animateCourier = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        setProgress(prev => {
          const next = prev + 0.02 * speedMultiplier * delta;
          if (next >= 1) return 0; // loop simulation
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(animateCourier);
    };

    animationFrameRef.current = requestAnimationFrame(animateCourier);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speedMultiplier]);

  // Sync Marker Position with Progress
  useEffect(() => {
    if (!courierMarkerRef.current || routePoints.length === 0) return;
    const index = Math.min(
      routePoints.length - 1,
      Math.floor(progress * (routePoints.length - 1))
    );
    const coord = routePoints[index];
    if (coord) {
      courierMarkerRef.current.setLatLng(coord);
    }
  }, [progress, routePoints]);

  return (
    <div
      id="delivery-live-tracker-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bike className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100">
                  تتبع الكابتن اللحظي (Daniel Live Courier Radar)
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  مباشر عبر الأقمار الصناعية
                </span>
              </div>
              <p className="text-xs text-slate-400">
                طلب رقم: <span className="font-mono text-amber-400">{order?.id || 'ORD-9821'}</span> | {order?.storeName || 'مطعم صمد - المنصور'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  const bounds = L.latLngBounds([
                    [storePos.lat, storePos.lng],
                    [destPos.lat, destPos.lng]
                  ]);
                  mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
                }
              }}
              title="إعادة ضبط الرؤية للمسار كاملاً"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Compass className="w-5 h-5" />
            </button>
            <button
              id="close-delivery-tracker-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors border border-slate-700/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Container Body */}
        <div className="flex-1 relative w-full h-full overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Live Telemetry HUD (Top Right) */}
          <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-xl text-xs space-y-3 w-72 max-w-[calc(100%-2rem)]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>بيانات الملاحة الحية</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {courierSpeedKmh} كم/س
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">الوقت المقدر</span>
                <span className="text-base font-black text-amber-400 flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {remainingMinutes} دقيقة
                </span>
              </div>
              <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">المسافة المتبقية</span>
                <span className="text-base font-black text-slate-100 flex items-center justify-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  {remainingDistanceKm} كم
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>المتجر</span>
                <span className="text-amber-400 font-bold">{Math.round(progress * 100)}%</span>
                <span>الزبون</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* Simulation Controls */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
                  title={isPlaying ? 'إيقاف مؤقت' : 'استئناف'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setProgress(0)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
                  title="إعادة من البداية"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>السرعة:</span>
                {[1, 2, 4].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeedMultiplier(s)}
                    className={`px-1.5 py-0.5 rounded font-mono ${
                      speedMultiplier === s
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Courier & Customer Card (Bottom Bar) */}
          <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Courier Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Bike className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-100">
                    {order?.courierName || 'علي المفرجي (دليفري سريع)'}
                  </h3>
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    دراجة نارية (بغداد 7821)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>كابتن موثق في شركة دانيال | تقييم 4.9 ★</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href="tel:+9647701234567"
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
              >
                <Phone className="w-4 h-4" />
                <span>اتصال بالكابتن</span>
              </a>

              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700"
              >
                إغلاق التتبع
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
