import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IRAQI_LANDMARKS, RIDE_TIERS } from '../../data/iraqLocations';
import { LandmarkPoint, RideTierId, SupportTicket } from '../../types';
import {
  Headphones,
  PhoneCall,
  MessageSquare,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Plus,
  Car,
  User,
  MapPin,
  Sparkles,
  Gift
} from 'lucide-react';

export const DispatcherPortal: React.FC = () => {
  const {
    supportTickets,
    addSupportMessage,
    resolveTicket,
    createNewTicket,
    createManualDispatchedTrip,
    currentTrip,
    selectedCityId
  } = useApp();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(supportTickets[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [activeView, setActiveView] = useState<'support' | 'manual_dispatch' | 'lost_found'>('support');

  // Manual Dispatch Form state
  const [callerName, setCallerName] = useState('حسين علي الخفاجي');
  const [callerPhone, setCallerPhone] = useState('07709988776');
  const [manualPickupId, setManualPickupId] = useState(IRAQI_LANDMARKS[0].id);
  const [manualDropoffId, setManualDropoffId] = useState(IRAQI_LANDMARKS[1].id);
  const [manualTier, setManualTier] = useState<RideTierId>('economy');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Lost & Found Items mock
  const [lostItems, setLostItems] = useState([
    {
      id: 'LF-101',
      item: 'حقيبة يد نسائية جلد أسود',
      tripId: 'TRP-1092',
      passenger: 'سارة خالد',
      driver: 'كابتن مصطفى السعدي',
      status: 'تم الاسترجاع',
      date: 'اليوم 14:30'
    },
    {
      id: 'LF-102',
      item: 'موبايل iPhone 15 Pro Max',
      tripId: 'TRP-1081',
      passenger: 'عمر التميمي',
      driver: 'كابتن حيدر الكرخي',
      status: 'قيد التنسيق',
      date: 'أمس 20:15'
    }
  ]);

  const activeTicket = supportTickets.find(t => t.id === selectedTicketId) || supportTickets[0];
  const cityLandmarks = IRAQI_LANDMARKS.filter(lm => lm.cityId === selectedCityId);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    addSupportMessage(activeTicket.id, replyText, 'agent');
    setReplyText('');
  };

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const pickup = IRAQI_LANDMARKS.find(l => l.id === manualPickupId) || IRAQI_LANDMARKS[0];
    const dropoff = IRAQI_LANDMARKS.find(l => l.id === manualDropoffId) || IRAQI_LANDMARKS[1];

    createManualDispatchedTrip(pickup, dropoff, callerName, callerPhone, manualTier);
    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-blue-500 text-slate-950 font-black">
            🎧
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-100">
              لوحة الموظفين وخدمة العملاء (Support & Dispatcher Portal)
            </h2>
            <p className="text-xs text-slate-400">
              الحجز الهاتفي السريع، حل نزاعات الرحلات، متابعة المفقودات، والدعم الفوري
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveView('support')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'support' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>تذاكر الدعم المباشر ({supportTickets.filter(t => t.status !== 'resolved').length})</span>
          </button>

          <button
            onClick={() => setActiveView('manual_dispatch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'manual_dispatch' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>حجز هاتفي مباشر (Dispatcher)</span>
          </button>

          <button
            onClick={() => setActiveView('lost_found')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'lost_found' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>سجل المفقودات</span>
          </button>
        </div>
      </div>

      {/* View 1: Support Tickets Console */}
      {activeView === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Tickets list (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-2 flex flex-col max-h-[560px] overflow-y-auto">
            <span className="text-xs font-extrabold text-slate-300 px-2 py-1 block">
              التذاكر الواردة ({supportTickets.length})
            </span>

            {supportTickets.map(ticket => {
              const isSel = ticket.id === activeTicket?.id;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`text-right p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isSel
                      ? 'bg-blue-600/15 border-blue-500 text-slate-100 ring-1 ring-blue-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">{ticket.userName}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        ticket.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : ticket.priority === 'urgent' || ticket.priority === 'high'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ticket.status === 'resolved' ? 'محلولة ✓' : ticket.priority === 'urgent' ? 'طارئة 🚨' : 'قيد المتابعة'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{ticket.subject}</p>
                  <span className="text-[9px] text-slate-500">{ticket.createdAt} • {ticket.userRole === 'driver' ? 'كابتن' : 'راكب'}</span>
                </button>
              );
            })}
          </div>

          {/* Ticket Messages & Resolution Panel (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-[560px]">
            {activeTicket ? (
              <>
                {/* Header info */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-100">{activeTicket.subject}</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {activeTicket.id}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      صاحب البلاغ: <b className="text-slate-200">{activeTicket.userName}</b> ({activeTicket.userRole === 'driver' ? 'كابتن' : 'راكب'})
                    </span>
                  </div>

                  {activeTicket.status !== 'resolved' && (
                    <button
                      onClick={() => resolveTicket(activeTicket.id)}
                      className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/40 transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>إغلاق وحل المشكلة</span>
                    </button>
                  )}
                </div>

                {/* Messages conversation */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {activeTicket.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col text-xs ${m.sender === 'agent' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-500 mb-1 px-1">
                        {m.sender === 'agent' ? 'موظف الدعم (أنت)' : activeTicket.userName} • {m.time}
                      </div>
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                          m.sender === 'agent'
                            ? 'bg-blue-600 text-white font-medium rounded-br-none'
                            : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Compensation tools */}
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs my-2">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>إجراء تعويضي سريع:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        addSupportMessage(activeTicket.id, 'تم إضافة رصيد تعويضي بقيمة 2,500 د.ع في محفظتكم.', 'agent');
                        alert('تم إرسال التعويض للمحفظة بنجاح');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-700"
                    >
                      +2,500 د.ع رصيد هدية
                    </button>
                    <button
                      onClick={() => {
                        addSupportMessage(activeTicket.id, 'تم إلغاء عمولة الرحلة للكابتن كبادرة حسن نية.', 'agent');
                        alert('تم استرداد العمولة');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-700"
                    >
                      إعفاء من العمولة
                    </button>
                  </div>
                </div>

                {/* Message input */}
                <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="اكتب رد الدعم الفني للزبون أو الكابتن..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>إرسال</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center my-auto text-slate-500 text-xs">لا توجد تذكرة محددة</div>
            )}
          </div>
        </div>
      )}

      {/* View 2: Manual Phone Dispatcher */}
      {activeView === 'manual_dispatch' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <PhoneCall className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-100">نظام استقبال وحجز الرحلات الهاتفية (Phone Dispatcher)</h3>
              <p className="text-xs text-slate-400">مخصص لتسجيل مشاوير الزبائن المتصلين عبر الهاتف المباشر وإرسالها لأقرب كابتن</p>
            </div>
          </div>

          {dispatchSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>تم إرسال المشوار بنجاح لنظام المطابقة وتم إشعار أقرب كابتن!</span>
            </div>
          )}

          <form onSubmit={handleCreateManualBooking} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم الزبون المتصل</label>
                <input
                  type="text"
                  value={callerName}
                  onChange={e => setCallerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">رقم الهاتف العراقي</label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={e => setCallerPhone(e.target.value)}
                  placeholder="0770XXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">نقطة الانطلاق (Pickup)</label>
                <select
                  value={manualPickupId}
                  onChange={e => setManualPickupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {IRAQI_LANDMARKS.map(lm => (
                    <option key={lm.id} value={lm.id}>
                      {lm.name} ({lm.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">الوجهة (Dropoff)</label>
                <select
                  value={manualDropoffId}
                  onChange={e => setManualDropoffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {IRAQI_LANDMARKS.map(lm => (
                    <option key={lm.id} value={lm.id}>
                      {lm.name} ({lm.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">الفئة المطلوبة</label>
              <div className="grid grid-cols-3 gap-2">
                {RIDE_TIERS.slice(0, 3).map(tier => (
                  <button
                    type="button"
                    key={tier.id}
                    onClick={() => setManualTier(tier.id)}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      manualTier === tier.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {tier.nameAr}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="submit-manual-dispatch-btn"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all mt-3"
            >
              تأكيد وإرسال الرحلة للكباتن 🚕
            </button>
          </form>
        </div>
      )}

      {/* View 3: Lost & Found Registry */}
      {activeView === 'lost_found' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100">سجل المفقودات والأمانات (Lost & Found)</h3>
              <p className="text-xs text-slate-400">تتبع الأغراض المنسية من قبل الركاب والتنسيق مع الكباتن لتسليمها</p>
            </div>
            <button
              onClick={() => {
                const item = prompt('أدخل وصف الغرض المفقود:');
                if (item) {
                  setLostItems(prev => [
                    {
                      id: `LF-${Math.floor(100 + Math.random() * 900)}`,
                      item,
                      tripId: 'TRP-1099',
                      passenger: 'زبون مشوار',
                      driver: 'كابتن حيدر',
                      status: 'قيد التنسيق',
                      date: 'الآن'
                    },
                    ...prev
                  ]);
                }
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل مفقود جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lostItems.map(item => (
              <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-slate-200">{item.item}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.status === 'تم الاسترجاع'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>الراكب: <b className="text-slate-300">{item.passenger}</b></div>
                  <div>الكابتن: <b className="text-slate-300">{item.driver}</b></div>
                  <div className="text-[10px] text-slate-500">رقم الرحلة: {item.tripId} • {item.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
