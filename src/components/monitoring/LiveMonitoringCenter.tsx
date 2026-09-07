import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { IRAQI_CITIES } from '../../data/iraqLocations';
import { DanielMapEngine } from '../common/DanielMapEngine';
import { LiveIncident } from '../../types';
import {
  Activity,
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
  Compass,
  Radio,
  RefreshCw,
  ShieldAlert,
  Users,
  Flame,
  PhoneCall,
  Volume2,
  VolumeX,
  Eye,
  Maximize2
} from 'lucide-react';

export const LiveMonitoringCenter: React.FC = () => {
  const {
    selectedCityId,
    setSelectedCityId,
    driversList,
    currentTrip,
    pastTrips,
    surgeZones,
    playAudioCue
  } = useApp();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'warning'>('all');
  const [fullscreenMap, setFullscreenMap] = useState(false);

  // Live Incidents Feed
  const [incidents, setIncidents] = useState<LiveIncident[]>([
    {
      id: 'INC-901',
      type: 'SOS_ALERT',
      title: 'إشعار طوارئ SOS نشط',
      description: 'الراكبة طلبت المساعدة الفورية قرب تقاطع المنصور',
      severity: 'critical',
      tripId: 'TRP-1092',
      driverId: 'drv-1',
      location: { lat: 33.3134, lng: 44.3541, name: 'بغداد - المنصور' },
      timestamp: 'منذ دقيقة',
      resolved: false
    },
    {
      id: 'INC-902',
      type: 'DELAYED_RIDE',
      title: 'تأخير في الوصول للراكب > 12 دقيقة',
      description: 'الكابتن عالق بازدحام جسر الجادرية',
      severity: 'warning',
      tripId: 'TRP-1088',
      driverId: 'drv-2',
      location: { lat: 33.2845, lng: 44.3821, name: 'بغداد - الجادرية' },
      timestamp: 'منذ 4 دقائق',
      resolved: false
    },
    {
      id: 'INC-903',
      type: 'ROUTE_DEVIATION',
      title: 'انحراف مسار غير معتاد',
      description: 'تم رصد تغيير خط السير بنسبة 400 متر عن المسار المقترح',
      severity: 'warning',
      tripId: 'TRP-1077',
      driverId: 'drv-3',
      location: { lat: 33.3211, lng: 44.4219, name: 'بغداد - الكرادة' },
      timestamp: 'منذ 8 دقائق',
      resolved: true
    },
    {
      id: 'INC-904',
      type: 'SURGE_SHORTAGE',
      title: 'نقص كباتن في منطقة عالية الطلب',
      description: 'منطقة الكرادة تشهد 28 طلباً مقابل 3 كباتن متاحين فقط',
      severity: 'info',
      location: { lat: 33.3089, lng: 44.4265, name: 'بغداد - الكرادة خارج' },
      timestamp: 'منذ 11 دقيقة',
      resolved: false
    }
  ]);

  // Statistics Calculations
  const onlineDrivers = driversList.filter(d => d.isOnline);
  const busyDrivers = driversList.filter(d => d.isOnline && d.isBusy);
  const availableDrivers = driversList.filter(d => d.isOnline && !d.isBusy);
  const totalVolumeIQD = pastTrips.reduce((acc, t) => acc + t.totalPriceIQD, 0) + (currentTrip?.totalPriceIQD || 0);

  const handleResolveIncident = (id: string) => {
    setIncidents(prev =>
      prev.map(inc => (inc.id === id ? { ...inc, resolved: true } : inc))
    );
    if (soundEnabled) playAudioCue('success');
  };

  const currentCity = IRAQI_CITIES.find(c => c.id === selectedCityId) || IRAQI_CITIES[0];

  const filteredIncidents = incidents.filter(inc => {
    if (filterStatus === 'critical') return inc.severity === 'critical';
    if (filterStatus === 'warning') return inc.severity === 'warning' || inc.severity === 'critical';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">مركز العمليات والمراقبة المباشرة</h1>
              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                LIVE OPS 60FPS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              مراقبة آنية لأسطول الكباتن، الرحلات النشطة، إنذارات الطوارئ وازدحامات شوارع العراق
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'صوت التنبيهات مفعّل' : 'صامت'}</span>
          </button>

          {/* City Quick Selector */}
          <select
            value={selectedCityId}
            onChange={e => setSelectedCityId(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
          >
            {IRAQI_CITIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Ticker Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>الكباتن الأونلاين</span>
            <Car className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{onlineDrivers.length}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">جاهزون في الميدان</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>في مشوار نشط</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {busyDrivers.length + (currentTrip && currentTrip.status !== 'completed' ? 1 : 0)}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">رحلات حالية متصلة</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>الكباتن المتاحون</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{availableDrivers.length}</div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">في انتظار الطلبات</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إنذارات الميدان</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">
            {incidents.filter(i => !i.resolved).length}
          </div>
          <div className="text-[10px] text-red-400/80 mt-0.5">تحتاج تدخل الموظف</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>مناطق الذروة</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400">{surgeZones.length}</div>
          <div className="text-[10px] text-orange-400/80 mt-0.5">مضاعف تسعير ديناميكي</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إجمالي الرحلات</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{pastTrips.length + 1}</div>
          <div className="text-[10px] text-purple-400 mt-0.5">
            {(totalVolumeIQD).toLocaleString('ar-IQ')} د.ع
          </div>
        </div>
      </div>

      {/* Main Grid: Live Radar Map (8 cols) + Incident Center (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[600px]">
        {/* Live Operations Map */}
        <div className="lg:col-span-8 h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <DanielMapEngine
            interactiveSelection={true}
            showSurgeHeatmap={true}
            showFleetFleetAll={true}
            showRadar={true}
            showTraffic={true}
            showTrail={true}
            heightClass="h-full"
            isFullScreen={fullscreenMap}
            onToggleFullScreen={() => setFullscreenMap(!fullscreenMap)}
          />
        </div>

        {/* Live Incident & Intervention Panel */}
        <div className="lg:col-span-4 h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h2 className="font-black text-sm text-white">سجل البلاغات والتدخل الفوري</h2>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl text-[10px]">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2 py-0.5 rounded-lg ${filterStatus === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterStatus('critical')}
                className={`px-2 py-0.5 rounded-lg ${filterStatus === 'critical' ? 'bg-red-500 text-white font-bold' : 'text-slate-400'}`}
              >
                حرج
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredIncidents.map(inc => (
              <div
                key={inc.id}
                className={`p-3 rounded-xl border transition-all ${
                  inc.resolved
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : inc.severity === 'critical'
                    ? 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-500/5'
                    : inc.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        inc.severity === 'critical'
                          ? 'bg-red-500 animate-ping'
                          : inc.severity === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span className="font-bold text-xs text-white">{inc.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{inc.timestamp}</span>
                </div>

                <p className="text-xs text-slate-300 mb-2 leading-relaxed">{inc.description}</p>

                {inc.location && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-2.5">
                    <Compass className="w-3 h-3 text-amber-400" />
                    <span>الموقع: {inc.location.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] font-mono text-slate-500">{inc.id}</div>
                  <div className="flex items-center gap-1.5">
                    {!inc.resolved ? (
                      <>
                        <button
                          onClick={() => handleResolveIncident(inc.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all"
                        >
                          معالجة وإغلاق
                        </button>
                        <button
                          onClick={() => alert(`الاتصال التلقائي بغرفة المتابعة للحادث ${inc.id}`)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] p-1 rounded-lg transition-all"
                          title="اتصال سريع"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        تمت المعالجة
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
