import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IRAQI_LANDMARKS, RIDE_TIERS, IRAQI_CITIES } from '../../data/iraqLocations';
import { LandmarkPoint, RideTierId, ComplaintRecord } from '../../types';
import {
  PhoneCall,
  Search,
  PlusCircle,
  MessageSquare,
  AlertCircle,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  Car,
  Headphones,
  Send,
  Sparkles
} from 'lucide-react';

export const CallCenterDashboard: React.FC = () => {
  const {
    createManualDispatchedTrip,
    selectedCityId,
    setSelectedCityId,
    driversList,
    playAudioCue
  } = useApp();

  // Call intake state
  const [callerPhone, setCallerPhone] = useState('07712345678');
  const [callerName, setCallerName] = useState('عمر فاضل الجبوري');
  const [pickupId, setPickupId] = useState(IRAQI_LANDMARKS[0].id);
  const [dropoffId, setDropoffId] = useState(IRAQI_LANDMARKS[1].id);
  const [selectedTier, setSelectedTier] = useState<RideTierId>('economy');
  const [notes, setNotes] = useState('يرجى سائق هادئ، الراكب كبير في السن');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Complaints state
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([
    {
      id: 'CMP-501',
      tripId: 'TRP-1090',
      complainantName: 'مريم الراوي',
      complainantPhone: '07801122334',
      complainantRole: 'passenger',
      category: 'fare_dispute',
      description: 'تم احتساب 8,000 د.ع بدلاً من 6,500 د.ع ولم يتم تفعيل كود الخصم',
      status: 'OPEN',
      priority: 'high',
      createdAt: 'اليوم 15:10'
    },
    {
      id: 'CMP-502',
      tripId: 'TRP-1085',
      complainantName: 'كابتن وسام كريم',
      complainantPhone: '07703344556',
      complainantRole: 'driver',
      category: 'route_deviation',
      description: 'الراكب طلب التوقف عند 3 نقاط فرعية إضافية بدون تعديل الوجهة في التطبيق',
      status: 'IN_REVIEW',
      priority: 'medium',
      createdAt: 'اليوم 14:20'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'create_ride' | 'complaints'>('create_ride');
  const cityLandmarks = IRAQI_LANDMARKS.filter(lm => lm.cityId === selectedCityId);

  const handleCreateRide = (e: React.FormEvent) => {
    e.preventDefault();
    const pickup = IRAQI_LANDMARKS.find(l => l.id === pickupId) || IRAQI_LANDMARKS[0];
    const dropoff = IRAQI_LANDMARKS.find(l => l.id === dropoffId) || IRAQI_LANDMARKS[1];

    createManualDispatchedTrip(pickup, dropoff, callerName, callerPhone, selectedTier);
    setDispatchSuccess(true);
    playAudioCue('success');
    setTimeout(() => setDispatchSuccess(false), 4000);
  };

  const handleResolveComplaint = (id: string) => {
    setComplaints(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'RESOLVED', resolutionNotes: 'تم الاتصال بالطرفين وحل النزاع' } : c))
    );
    playAudioCue('success');
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">لوحة موظف مركز الاتصال (Call Center Agent)</h1>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                HOTLINE 6006
              </span>
            </div>
            <p className="text-xs text-slate-400">
              استقبال مكالمات الحجز الهاتفي، معالجة شكاوى الركاب والسائقين والرد الفوري
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('create_ride')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'create_ride' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>طلب رحلة هاتفية</span>
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'complaints' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>الشكاوى والنزاعات ({complaints.filter(c => c.status !== 'RESOLVED').length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'create_ride' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Quick Manual Booking Form (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-sm text-white">إنشاء حجز سريع لمكالمة هاتفية مباشرة</h2>
              </div>
              <span className="text-[11px] text-slate-400">توجيه آلي لأقرب كابتن متاح</span>
            </div>

            {dispatchSuccess && (
              <div className="mb-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>تم إرسال الطلب بنجاح وتعيين الكابتن المناسب فورياً!</span>
              </div>
            )}

            <form onSubmit={handleCreateRide} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">اسم المتصل / الراكب</label>
                  <input
                    type="text"
                    required
                    value={callerName}
                    onChange={e => setCallerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">رقم الهاتف (عراقي)</label>
                  <input
                    type="text"
                    required
                    value={callerPhone}
                    onChange={e => setCallerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-emerald-400 block mb-1">نقطة الانطلاق (Pickup)</label>
                  <select
                    value={pickupId}
                    onChange={e => setPickupId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {cityLandmarks.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.district})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-400 block mb-1">الوجهة المقصودة (Dropoff)</label>
                  <select
                    value={dropoffId}
                    onChange={e => setDropoffId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {cityLandmarks.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.district})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">فئة المركبة</label>
                  <select
                    value={selectedTier}
                    onChange={e => setSelectedTier(e.target.value as RideTierId)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {RIDE_TIERS.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nameAr} - {t.carModels}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">ملاحظات للكابتن</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الحجز الفوري وإشعار السائق</span>
              </button>
            </form>
          </div>

          {/* Available Fleet Sidebar (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>الكباتن الأقرب للطلب الحالي</span>
            </h3>

            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {driversList
                .filter(d => d.isOnline)
                .map(d => (
                  <div key={d.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-white">{d.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {d.car.make} {d.car.model} • {d.car.plateNumber}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-emerald-400 font-bold">⭐ {d.rating}</div>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                        جاهز للمهمة
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Complaints View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-black text-sm text-white">قائمة الشكاوى والاعتراضات المعلقة</h2>
            <span className="text-xs text-slate-400">زمن المعالجة المستهدف: أقل من 15 دقيقة</span>
          </div>

          <div className="space-y-3">
            {complaints.map(c => (
              <div key={c.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{c.complainantName}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {c.complainantPhone}
                    </span>
                    <span className="text-[10px] text-slate-500">• {c.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-300">{c.description}</p>
                  {c.resolutionNotes && (
                    <div className="text-[11px] text-emerald-400 font-medium mt-1">
                      الحل: {c.resolutionNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {c.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => handleResolveComplaint(c.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                    >
                      تسوية الشكوى
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      تمت التسوية
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
