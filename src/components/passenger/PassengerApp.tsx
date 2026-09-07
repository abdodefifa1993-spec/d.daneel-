import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IRAQI_LANDMARKS, RIDE_TIERS, PAYMENT_METHODS } from '../../data/iraqLocations';
import { GoogleIraqiMap } from '../common/GoogleIraqiMap';
import { TripReceiptModal } from './TripReceiptModal';
import { LandmarkPoint, RideTierId, PaymentMethodType } from '../../types';
import {
  MapPin,
  Navigation,
  Sparkles,
  Car,
  HeartHandshake,
  Users,
  PackageCheck,
  CreditCard,
  Banknote,
  Smartphone,
  Zap,
  Wallet,
  Tag,
  ShieldCheck,
  Phone,
  MessageSquare,
  Star,
  Clock,
  ArrowRightLeft,
  X,
  AlertOctagon,
  Share2,
  CheckCircle2,
  Plus,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  sendFirebaseChatMessage,
  listenToTripChat,
  broadcastFirebaseEmergencyAlert,
  FirebaseChatMessage
} from '../../services/firebase';

export const PassengerApp: React.FC = () => {
  const {
    selectedCityId,
    pickupPoint,
    setPickupPoint,
    dropoffPoint,
    setDropoffPoint,
    selectedTier,
    setSelectedTier,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    passengerWalletIQD,
    topUpPassengerWallet,
    promoCode,
    setPromoCode,
    discountAmountIQD,
    applyPromoCode,
    currentTrip,
    requestRide,
    cancelTrip,
    rateTrip,
    surgeZones,
    createNewTicket,
    setRole,
    simulateDriverAcceptanceForDemo,
    passengerVerificationPin,
    driverArrivalDetected
  } = useApp();

  const [tripNotes, setTripNotes] = useState('');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isCardCollapsed, setIsCardCollapsed] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(10000);
  const [topUpMethod, setTopUpMethod] = useState<'zaincash' | 'fastpay' | 'qi_card'>('zaincash');
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Review states
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('سائق محترم والرحلة ممتازة وسريعة');
  const [selectedTip, setSelectedTip] = useState<number>(1000);

  // SOS Modal
  const [showSosModal, setShowSosModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'passenger' | 'driver'; text: string; time: string }>>([
    { sender: 'driver', text: 'أهلاً بك، أنا في الطريق إليك ووصلت قرب التقاطع', time: 'الآن' }
  ]);

  const cityLandmarks = IRAQI_LANDMARKS.filter(lm => lm.cityId === selectedCityId);

  // Quick landmark search & colloquial pinpoints
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [activeSearchField, setActiveSearchField] = useState<'pickup' | 'dropoff' | null>(null);

  // Calculate pricing estimates
  const currentTierObj = RIDE_TIERS.find(t => t.id === selectedTier) || RIDE_TIERS[0];
  const dLat = pickupPoint && dropoffPoint ? (dropoffPoint.lat - pickupPoint.lat) * 111 : 0;
  const dLng = pickupPoint && dropoffPoint ? (dropoffPoint.lng - pickupPoint.lng) * 93 : 0;
  const estDistanceKm = Math.max(2.4, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10);
  const estDurationMins = Math.max(6, Math.round(estDistanceKm * 2.8));

  // Check surge in area
  const activeSurge = pickupPoint
    ? surgeZones.find(
        sz => sz.cityId === selectedCityId && Math.hypot((sz.lat - pickupPoint.lat) * 111, (sz.lng - pickupPoint.lng) * 93) <= sz.radiusKm
      )
    : null;
  const surgeMultiplier = activeSurge ? activeSurge.multiplier : 1.0;

  const baseFare = currentTierObj.baseFareIQD + estDistanceKm * currentTierObj.perKmFareIQD + estDurationMins * currentTierObj.perMinFareIQD;
  const roundedBase = Math.round(baseFare / 250) * 250;
  const totalWithSurge = Math.round((roundedBase * surgeMultiplier) / 250) * 250;
  const finalEstimateIQD = Math.max(2500, totalWithSurge - discountAmountIQD);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const ok = applyPromoCode(promoInput);
    if (ok) {
      setPromoCode(promoInput);
      setPromoMessage({ text: 'تم تطبيق كود الخصم بنجاح! (-2,000 د.ع)', ok: true });
    } else {
      setPromoMessage({ text: 'كود الخصم غير صالح أو منتهي الصلاحية', ok: false });
    }
  };

  const handleSwapLocations = () => {
    const temp = pickupPoint;
    setPickupPoint(dropoffPoint);
    setDropoffPoint(temp);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const timeNow = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'passenger', text: chatInput, time: timeNow }]);
    setChatInput('');
    // Auto driver response simulation
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'driver', text: 'تمام، أنا واصل الآن وشغلت الفلشرات', time: 'الآن' }
      ]);
    }, 1500);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4.5rem)] overflow-hidden">
      
      {/* 1. Full-Screen Map (Map First Design) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <GoogleIraqiMap
          interactiveSelection={!currentTrip}
          showSurgeHeatmap={true}
          isFullScreen={false}
        />
      </div>

      {/* 2. Floating Docked Bottom Booking & Status Card */}
      <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:right-6 sm:w-[440px] z-20 pointer-events-auto transition-all duration-300 max-h-[86vh] flex flex-col justify-end">
        {/* If Card is Collapsed: Show minimal floating pill */}
        {isCardCollapsed ? (
          <button
            onClick={() => setIsCardCollapsed(false)}
            className="w-full flex items-center justify-between bg-slate-900/95 hover:bg-slate-900 backdrop-blur-xl border border-amber-500/50 rounded-2xl px-4 py-3 shadow-2xl text-white transition-all group active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                <Car className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white group-hover:text-amber-300">
                  {currentTrip ? 'متابعة تفاصيل الرحلة المباشرة' : `حجز مشوار: ${currentTierObj.nameAr}`}
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentTrip ? `الحالة: ${currentTrip.status}` : `${finalEstimateIQD.toLocaleString()} د.ع • اضغط لفتح الخيارات`}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold bg-amber-500 text-slate-950 px-2.5 py-1 rounded-xl shadow">
              فتح اللوحة ⬆
            </span>
          </button>
        ) : (
          <div className="h-full overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[80vh]">
            {/* Minimal Header with Collapse button */}
            <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow">
              <span className="font-bold flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {currentTrip ? 'الرحلة جارية ومباشرة' : 'حجز كابتن بلي'}
              </span>
              <button
                onClick={() => setIsCardCollapsed(true)}
                className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-0.5 rounded-lg transition-all"
                title="طي اللوحة لفتح الخريطة بالكامل"
              >
                طي اللوحة للخريطة ⬇
              </button>
            </div>
        
        {/* State 1: New Ride Planning */}
        {!currentTrip && (
          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
            
            {/* Header & Smart Iraqi Address search */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>طلب مشوار جديد</span>
                </h2>
                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                  🇮🇶 تسعير مباشر بالدينار
                </span>
              </div>
              <p className="text-xs text-slate-400">حدد نقطة الانطلاق والوجهة من الأماكن الشائعة أو على الخريطة</p>
            </div>

            {/* Pickup & Dropoff Inputs */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 relative">
              
              {/* Pickup location */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0"></div>
                  <div className="flex-1">
                    <label className="text-[10px] text-emerald-400 font-bold block">نقطة الانطلاق (أين أنت الآن؟)</label>
                    <input
                      id="pickup-address-input"
                      type="text"
                      value={pickupSearch || (pickupPoint ? pickupPoint.name : '')}
                      onChange={e => {
                        setPickupSearch(e.target.value);
                        setActiveSearchField('pickup');
                      }}
                      onFocus={() => setActiveSearchField('pickup')}
                      placeholder="ابحث عن منطقة، مول، أو شارع في العراق..."
                      className="w-full bg-transparent text-xs text-slate-200 font-medium focus:outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Divider & Swap Button */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 my-0.5 relative">
                <div className="w-full border-b border-dashed border-slate-800"></div>
                <button
                  id="swap-locations-btn"
                  onClick={handleSwapLocations}
                  title="تبديل نقطة الانطلاق والوجهة"
                  className="absolute left-1/2 -translate-x-1/2 bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full text-slate-300 border border-slate-700 shadow-md transition-transform hover:scale-105"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>

              {/* Dropoff location */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20 shrink-0"></div>
                  <div className="flex-1">
                    <label className="text-[10px] text-rose-400 font-bold block">الوجهة المقصودة (إلى أين؟)</label>
                    <input
                      id="dropoff-address-input"
                      type="text"
                      value={dropoffSearch || (dropoffPoint ? dropoffPoint.name : '')}
                      onChange={e => {
                        setDropoffSearch(e.target.value);
                        setActiveSearchField('dropoff');
                      }}
                      onFocus={() => setActiveSearchField('dropoff')}
                      placeholder="اختر وجهتك أو معلم معروف (مثل: مول بابلون)..."
                      className="w-full bg-transparent text-xs text-slate-200 font-medium focus:outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Smart Autocomplete Dropdown */}
              {activeSearchField && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-40 max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-400 border-b border-slate-800">
                    <span>نقاط ونقاط دلالة شهيرة في {selectedCityId === 'baghdad' ? 'بغداد' : 'المدينة'}</span>
                    <button
                      onClick={() => setActiveSearchField(null)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {cityLandmarks
                      .filter(lm => {
                        const term = activeSearchField === 'pickup' ? pickupSearch : dropoffSearch;
                        return !term || lm.name.includes(term) || (lm.popularLocalName && lm.popularLocalName.includes(term));
                      })
                      .map(lm => (
                        <button
                          key={lm.id}
                          onClick={() => {
                            if (activeSearchField === 'pickup') {
                              setPickupPoint(lm);
                              setPickupSearch('');
                            } else {
                              setDropoffPoint(lm);
                              setDropoffSearch('');
                            }
                            setActiveSearchField(null);
                          }}
                          className="text-right p-2 rounded-lg hover:bg-slate-800 text-xs flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-200">{lm.name}</span>
                              {lm.popularLocalName && (
                                <span className="text-[10px] text-slate-400">💡 {lm.popularLocalName}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                            {lm.district}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Surge Demand Warning if active */}
            {activeSurge && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-300">منطقة طلب مرتفع ({activeSurge.zoneName})</span>
                    <p className="text-[11px] text-amber-400/80">
                      معامل تسعير ديناميكي {activeSurge.multiplier}x بسبب كثافة الطلبات لضمان توفير كابتن سريع
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Ride Tiers Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 block">اختر فئة الرحلة المناسبة</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RIDE_TIERS.map(tier => {
                  const isSelected = selectedTier === tier.id;
                  const tierBase = tier.baseFareIQD + estDistanceKm * tier.perKmFareIQD + estDurationMins * tier.perMinFareIQD;
                  const tierPrice = Math.round((tierBase * surgeMultiplier) / 250) * 250;

                  return (
                    <button
                      key={tier.id}
                      id={`tier-select-${tier.id}`}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-slate-100 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'}`}>
                            {tier.id === 'economy' && <Car className="w-4 h-4" />}
                            {tier.id === 'comfort_vip' && <Sparkles className="w-4 h-4" />}
                            {tier.id === 'women_taxi' && <HeartHandshake className="w-4 h-4" />}
                            {tier.id === 'family' && <Users className="w-4 h-4" />}
                            {tier.id === 'delivery' && <PackageCheck className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{tier.nameAr}</span>
                            <span className="text-[10px] text-slate-400">{tier.estimatedArrivalMins} دقائق وصول</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-extrabold text-amber-400 block">
                            {tierPrice.toLocaleString()} <span className="text-[9px]">د.ع</span>
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{tier.descriptionAr}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector & Wallet Top-up */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300">طريقة الدفع</label>
                <button
                  id="topup-wallet-btn"
                  onClick={() => setShowWalletModal(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>شحن المحفظة</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.slice(0, 3).map(pm => {
                  const isSelected = selectedPaymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      id={`payment-method-${pm.id}`}
                      onClick={() => setSelectedPaymentMethod(pm.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      {pm.id === 'cash' && <Banknote className="w-4 h-4 text-emerald-400" />}
                      {pm.id === 'zaincash' && <Smartphone className="w-4 h-4 text-blue-400" />}
                      {pm.id === 'fastpay' && <Zap className="w-4 h-4 text-amber-400" />}
                      <span className="text-[11px] block">{pm.nameAr.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Promo Code input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value)}
                  placeholder="كود خصم (جرب: BAGHDAD)"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                id="apply-promo-btn"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl font-bold transition-colors border border-slate-700"
              >
                تطبيق
              </button>
            </form>
            {promoMessage && (
              <span className={`text-[11px] font-medium ${promoMessage.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {promoMessage.text}
              </span>
            )}

            {/* Trip Notes for Captain */}
            <input
              type="text"
              value={tripNotes}
              onChange={e => setTripNotes(e.target.value)}
              placeholder="ملاحظات للكابتن (مثال: انتظرني قرب الصيدلية)"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />

            {/* Price Summary & Request Button */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">السعر التقديري الشامل</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-amber-400">{finalEstimateIQD.toLocaleString()}</span>
                  <span className="text-xs text-slate-300 font-bold">د.ع</span>
                  {discountAmountIQD > 0 && (
                    <span className="text-[10px] text-emerald-400 line-through mr-1">
                      {(finalEstimateIQD + discountAmountIQD).toLocaleString()} د.ع
                    </span>
                  )}
                </div>
              </div>

              <button
                id="request-ride-btn"
                onClick={() => requestRide(tripNotes)}
                disabled={!pickupPoint || !dropoffPoint}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <span>طلب الكابتن الآن</span>
                <Car className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 2: Active Trip in Progress / Waiting for Driver */}
        {currentTrip && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
            
            {/* Status Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100">
                    {currentTrip.status === 'searching_driver' && 'جاري البحث عن أقرب كابتن عبر محرك دانيال...'}
                    {currentTrip.status === 'driver_assigned' && 'تم قبول المشوار! الكابتن في الطريق'}
                    {currentTrip.status === 'driver_arriving' && 'الكابتن وصل نقطة الانطلاق 📍'}
                    {currentTrip.status === 'trip_in_progress' && 'الرحلة جارية نحو الوجهة 🚕'}
                    {currentTrip.status === 'completed' && 'وصلت بحمد الله إلى وجهتك 🎉'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">رقم المشوار: {currentTrip.id}</span>
                </div>
              </div>

              {/* Cancel Button */}
              {currentTrip.status !== 'completed' && (
                <button
                  id="cancel-trip-btn"
                  onClick={cancelTrip}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              )}
            </div>

            {/* Live Dispatch Engine Radar Status */}
            {currentTrip.status === 'searching_driver' && (
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 text-center space-y-3">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full border border-amber-400/50 animate-pulse"></div>
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg font-black shadow-lg">
                    🚕
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-200">
                    محرك الترحيل الذكي (DANIEL Dispatch Engine)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    يتم إرسال العرض تباعاً لأقرب كابتن مرخص مع نافذة 15 ثانية للقبول
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    id="passenger-test-accept-btn"
                    onClick={simulateDriverAcceptanceForDemo}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    قبول فوري ككابتن تجريبي ✓
                  </button>
                  <button
                    id="passenger-switch-driver-role-btn"
                    onClick={() => setRole('driver')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition-all"
                  >
                    فتح واجهة الكابتن 🚖
                  </button>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {currentTrip.status !== 'searching_driver' && currentTrip.status !== 'completed' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-300">
                  <span>تقدم المشوار</span>
                  <span className="text-amber-400">{currentTrip.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${currentTrip.progressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Arrival Notification Alert */}
            {(driverArrivalDetected || currentTrip.status === 'driver_arriving') && (
              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-black">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-300">الكابتن وصل الآن إلى نقطة الانطلاق!</h4>
                  <p className="text-[11px] text-emerald-400/90">
                    يرجى التوجه إلى السيارة ومشاركة رمز الأمان (PIN) مع الكابتن
                  </p>
                </div>
              </div>
            )}

            {/* Safety Verification PIN Display */}
            {(currentTrip.status === 'driver_assigned' || currentTrip.status === 'driver_arriving') && (
              <div className="bg-slate-950 border border-amber-500/50 rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-100 block">
                      رمز أمان المشوار (PIN)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      شاركه مع الكابتن عند صعود السيارة لبدء الرحلة
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border-2 border-amber-500 px-3.5 py-1.5 rounded-xl text-center shadow-inner">
                  <span className="text-base font-black text-amber-400 font-mono tracking-widest block">
                    {passengerVerificationPin}
                  </span>
                  <span className="text-[8px] text-slate-400 block">كود التحقق</span>
                </div>
              </div>
            )}

            {/* Matched Driver Card */}
            {currentTrip.driver && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentTrip.driver.avatar}
                      alt={currentTrip.driver.name}
                      className="w-12 h-12 rounded-xl object-cover border border-amber-500/40 shadow"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-100">{currentTrip.driver.name}</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {currentTrip.driver.rating}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {currentTrip.driver.car.make} {currentTrip.driver.car.model} • {currentTrip.driver.car.color}
                      </span>
                    </div>
                  </div>

                  {/* Iraqi Plate Badge */}
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-center shadow-inner">
                    <span className="text-[9px] text-slate-400 block">العراق - لوحة التسجيل</span>
                    <span className="text-xs font-black text-amber-400 font-mono tracking-wider">
                      {currentTrip.driver.car.plateNumber}
                    </span>
                  </div>
                </div>

                {/* Driver Actions (Call, Chat, SOS) */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                  <button
                    id="call-driver-btn"
                    onClick={() => alert(`جاري الاتصال بالكابتن عبر الرقم المشفّر: ${currentTrip.driver?.phone}`)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اتصال</span>
                  </button>

                  <button
                    id="chat-driver-btn"
                    onClick={() => setShowChatModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors relative"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>دردشة</span>
                    <span className="w-2 h-2 rounded-full bg-blue-400 absolute top-1.5 right-1.5"></span>
                  </button>

                  <button
                    id="sos-passenger-btn"
                    onClick={() => setShowSosModal(true)}
                    className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    <span>طوارئ SOS</span>
                  </button>
                </div>
              </div>
            )}

            {/* Trip Details Card */}
            <div className="bg-slate-950/50 rounded-xl p-3 text-xs space-y-2 border border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="text-slate-400">الانطلاق:</span>
                <span className="font-bold text-slate-200 truncate">{currentTrip.pickup.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                <span className="text-slate-400">الوجهة:</span>
                <span className="font-bold text-slate-200 truncate">{currentTrip.dropoff.name}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-300">
                <span>طريقة الدفع: <span className="font-bold text-amber-400">{currentTrip.paymentMethod === 'cash' ? 'نقدي كاش' : currentTrip.paymentMethod}</span></span>
                <span className="font-extrabold text-amber-400 text-sm">{currentTrip.totalPriceIQD.toLocaleString()} د.ع</span>
              </div>
            </div>

            {/* State: Trip Completed Review Box */}
            {currentTrip.status === 'completed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-b from-amber-500/10 to-slate-950 border border-amber-500/40 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="text-center">
                  <span className="text-2xl">🌟</span>
                  <h4 className="font-extrabold text-sm text-slate-100 mt-1">تقييم رحلتك مع الكابتن</h4>
                  <p className="text-[11px] text-slate-400">رأيك يساهم في تحسين جودة خدمات النقل في العراق</p>
                </div>

                {/* Stars */}
                <div className="flex justify-center gap-2 my-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setReviewStars(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewStars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Iraqi Tip Selector */}
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1.5 text-center">
                    إكرامية للكابتن (Tip) بالدينار العراقي
                  </label>
                  <div className="flex justify-center gap-2">
                    {[500, 1000, 2500, 5000].map(tip => (
                      <button
                        key={tip}
                        onClick={() => setSelectedTip(selectedTip === tip ? 0 : tip)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          selectedTip === tip
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        +{tip.toLocaleString()} د.ع
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="أضف تعليقاً على المشوار..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>عرض الوصل الرسمي</span>
                  </button>

                  <button
                    id="submit-review-btn"
                    onClick={() => rateTrip(reviewStars, reviewComment, selectedTip)}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all"
                  >
                    إرسال التقييم وإنهاء
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
          </div>
        )}
      </div>

      {/* Wallet Top-Up Modal (ZainCash, FastPay, QiCard) */}
      <AnimatePresence>
        {showWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl text-right"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-sm text-slate-100">شحن محفظة مشوار العراق</h3>
                </div>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Gateways */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">اختر بوابة الدفع المحلية</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTopUpMethod('zaincash')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        topUpMethod === 'zaincash' ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold ring-1 ring-blue-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                      <span className="text-xs block">زين كاش</span>
                    </button>

                    <button
                      onClick={() => setTopUpMethod('fastpay')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        topUpMethod === 'fastpay' ? 'bg-amber-600/20 border-amber-500 text-amber-400 font-bold ring-1 ring-amber-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Zap className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                      <span className="text-xs block">فاست بي</span>
                    </button>

                    <button
                      onClick={() => setTopUpMethod('qi_card')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        topUpMethod === 'qi_card' ? 'bg-purple-600/20 border-purple-500 text-purple-400 font-bold ring-1 ring-purple-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                      <span className="text-xs block">كي كارد / ماستر</span>
                    </button>
                  </div>
                </div>

                {/* Amount presets */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">المبلغ بالدينار العراقي (IQD)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[5000, 10000, 25000, 50000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setTopUpAmount(amt)}
                        className={`py-2 rounded-lg text-xs font-bold border ${
                          topUpAmount === amt ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                  <div className="flex justify-between mb-1">
                    <span>الرصيد الحالي:</span>
                    <span className="font-bold text-slate-200">{passengerWalletIQD.toLocaleString()} د.ع</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>الرصيد بعد الشحن:</span>
                    <span>{(passengerWalletIQD + topUpAmount).toLocaleString()} د.ع</span>
                  </div>
                </div>

                <button
                  id="confirm-topup-btn"
                  onClick={() => {
                    topUpPassengerWallet(topUpAmount, topUpMethod === 'zaincash' ? 'زين كاش' : topUpMethod === 'fastpay' ? 'فاست بي' : 'كي كارد');
                    setShowWalletModal(false);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition-all"
                >
                  تأكيد الشحن الفوري (+{topUpAmount.toLocaleString()} د.ع)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App Live Chat Modal with Captain */}
      <AnimatePresence>
        {showChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-sm w-full shadow-2xl flex flex-col h-96 text-right"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">الدردشة مع الكابتن {currentTrip?.driver?.name}</span>
                </div>
                <button onClick={() => setShowChatModal(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col text-xs ${msg.sender === 'passenger' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`p-2.5 rounded-xl max-w-[80%] ${
                        msg.sender === 'passenger'
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="اكتب رسالتك للكابتن..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleSendChat}
                  className="bg-amber-500 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs"
                >
                  إرسال
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SOS Emergency Modal */}
      <AnimatePresence>
        {showSosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-rose-600 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-right"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-3">
                <AlertOctagon className="w-8 h-8 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100">زر الطوارئ والحماية (SOS العراق)</h3>
                  <span className="text-[10px] text-rose-400">ميزة الحماية والأمان على مدار 24 ساعة</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                عند الضغط، يتم إرسال موقعك المباشر لغرفة عمليات مشوار العراق ومشاركة تتبع الرحلة مع جهات الطوارئ الرسمية.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    alert('جاري الاتصال بشرطة النجدة العراقية (104)...');
                    createNewTicket('نداء استغاثة SOS', 'تم إطلاق نداء استغاثة من الراكب أثناء الرحلة', 'urgent');
                    setShowSosModal(false);
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
                >
                  <Phone className="w-4 h-4" />
                  <span>الاتصال بشرطة النجدة (104)</span>
                </button>

                <button
                  onClick={() => {
                    alert('تم نسخ رابط التتبع المباشر للرحلة لمشاركته مع العائلة عبر واتساب');
                    setShowSosModal(false);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>مشاركة رابط التتبع المباشر مع الأهل</span>
                </button>

                <button
                  onClick={() => setShowSosModal(false)}
                  className="w-full text-slate-400 hover:text-slate-200 text-xs py-2 font-medium"
                >
                  إلغاء والعودة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official Iraqi Ride Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && currentTrip && (
          <TripReceiptModal
            trip={currentTrip}
            onClose={() => setShowReceiptModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
