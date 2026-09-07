import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleIraqiMap } from '../common/GoogleIraqiMap';
import { gpsService } from '../../services/gps';
import {
  Car,
  Power,
  TrendingUp,
  Wallet,
  Star,
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  Phone,
  MessageSquare,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Clock,
  Banknote,
  Smartphone,
  ChevronRight,
  Layers,
  History,
  Award,
  Compass,
  KeyRound,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type DriverCockpitTab = 'radar' | 'queue' | 'earnings' | 'performance' | 'history';

export const DriverApp: React.FC = () => {
  const {
    activeDriver,
    toggleDriverOnline,
    incomingDriverRequest,
    incomingDriverOffer,
    activeOfferRemainingSeconds,
    acceptTripAsDriver,
    rejectTripAsDriver,
    currentTrip,
    advanceDriverTripStep,
    withdrawDriverWallet,
    tripRequestsQueue,
    acceptOfferFromQueue,
    rejectOfferFromQueue,
    passengerVerificationPin,
    verifyPassengerPin,
    driverArrivalDetected,
    confirmDriverArrivalAtPickup,
    pastTrips
  } = useApp();

  const [activeTab, setActiveTab] = useState<DriverCockpitTab>('radar');
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50000);
  const [withdrawGateway, setWithdrawGateway] = useState<'zaincash' | 'fastpay' | 'superqi'>('zaincash');
  const [driverSpeed, setDriverSpeed] = useState<number>(45);
  const [isCardCollapsed, setIsCardCollapsed] = useState<boolean>(false);

  // Verification PIN state
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [pinSuccess, setPinSuccess] = useState<boolean>(false);

  // Active single offer fallback
  const activeOffer = incomingDriverOffer || (incomingDriverRequest ? {
    rideId: incomingDriverRequest.id,
    driverId: activeDriver.id,
    passengerName: incomingDriverRequest.passengerName,
    passengerPhone: incomingDriverRequest.passengerPhone,
    passengerRating: incomingDriverRequest.passengerRating || 4.95,
    pickup: {
      name: incomingDriverRequest.pickup.name,
      district: incomingDriverRequest.pickup.district,
      lat: incomingDriverRequest.pickup.lat,
      lng: incomingDriverRequest.pickup.lng
    },
    dropoff: {
      name: incomingDriverRequest.dropoff.name,
      district: incomingDriverRequest.dropoff.district,
      lat: incomingDriverRequest.dropoff.lat,
      lng: incomingDriverRequest.dropoff.lng
    },
    distanceKm: incomingDriverRequest.estimatedDistanceKm,
    durationMins: incomingDriverRequest.estimatedDurationMins,
    timeToPickupMins: 4,
    tier: incomingDriverRequest.tier,
    fareIQD: Math.round(incomingDriverRequest.totalPriceIQD * 0.85),
    totalPriceIQD: incomingDriverRequest.totalPriceIQD,
    surgeMultiplier: incomingDriverRequest.surgeMultiplier || 1.0,
    countdownSeconds: activeOfferRemainingSeconds || 15,
    timestamp: Date.now()
  } : null);

  // STEP 6: Real GPS 3-second heartbeat updates to RTDB and Firestore
  useEffect(() => {
    if (activeDriver.isOnline) {
      gpsService.startDriverTracking(
        activeDriver.id,
        activeDriver.currentLocation,
        currentTrip?.id
      );
    } else {
      gpsService.stopDriverTracking();
    }
    return () => {
      gpsService.stopDriverTracking();
    };
  }, [activeDriver.isOnline, activeDriver.id, currentTrip?.id]);

  // Subtle speed fluctuation
  useEffect(() => {
    if (currentTrip?.status === 'trip_in_progress') {
      const interval = setInterval(() => {
        setDriverSpeed(Math.floor(35 + Math.random() * 25));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentTrip?.status]);

  // Distance calculation to pickup if active
  const distanceToPickupMeters = currentTrip && (currentTrip.status === 'driver_assigned' || currentTrip.status === 'driver_arriving')
    ? Math.round(Math.hypot((activeDriver.currentLocation.lat - currentTrip.pickup.lat) * 111, (activeDriver.currentLocation.lng - currentTrip.pickup.lng) * 93) * 1000)
    : 0;

  const handleVerifyPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin) return;
    const ok = verifyPassengerPin(enteredPin);
    if (ok) {
      setPinSuccess(true);
      setPinError(false);
      setTimeout(() => {
        advanceDriverTripStep();
        setPinSuccess(false);
        setEnteredPin('');
      }, 1000);
    } else {
      setPinError(true);
      setPinSuccess(false);
    }
  };

  const handleInstantStartBypass = () => {
    advanceDriverTripStep();
    setEnteredPin('');
    setPinError(false);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4.5rem)] overflow-hidden">
      
      {/* 1. Full-Screen Map (Map First Architecture) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <GoogleIraqiMap
          interactiveSelection={false}
          showSurgeHeatmap={true}
          isFullScreen={false}
        />

        {/* Turn-by-Turn GPS HUD Overlay if trip in progress or arriving */}
        {currentTrip && (currentTrip.status === 'driver_assigned' || currentTrip.status === 'driver_arriving' || currentTrip.status === 'trip_in_progress') && (
          <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-6 z-20 pointer-events-none">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl flex items-center justify-between pointer-events-auto max-w-xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Navigation className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {currentTrip.status === 'trip_in_progress'
                      ? 'بعد 250 متر: توجه نحو جسر الجادرية'
                      : currentTrip.status === 'driver_arriving'
                      ? 'وصلت إلى نقطة التقاط الراكب - بانتظار الركوب'
                      : `توجه نحو نقطة التقاط الراكب (يبعد ${distanceToPickupMeters} م)`}
                  </div>
                  <span className="text-[11px] text-amber-400 font-medium">
                    {currentTrip.status === 'trip_in_progress' ? currentTrip.dropoff.name : currentTrip.pickup.name}
                  </span>
                </div>
              </div>

              {/* Speedometer */}
              <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                <span className="text-base font-black text-slate-100 block font-mono">{driverSpeed}</span>
                <span className="text-[9px] text-slate-400">كم / ساعة</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Floating Docked Bottom Driver Cockpit Card */}
      <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:right-6 sm:w-[460px] z-20 pointer-events-auto transition-all duration-300 max-h-[88vh] flex flex-col justify-end">
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
                  {currentTrip ? 'إدارة المشوار الجاري' : 'قمرة القيادة (الكابتن)'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {activeDriver.isOnline ? '🟢 متصل وجاهز للطلبات' : '⚪ غير متصل'} • {activeDriver.walletBalanceIQD.toLocaleString()} د.ع
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tripRequestsQueue.length > 0 && (
                <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full animate-bounce">
                  {tripRequestsQueue.length} طلب متاح
                </span>
              )}
              <span className="text-[10px] font-extrabold bg-amber-500 text-slate-950 px-2.5 py-1 rounded-xl shadow">
                فتح القمرة ⬆
              </span>
            </div>
          </button>
        ) : (
          <div className="h-full overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[84vh]">
            {/* Header with online state and collapse toggle */}
            <div className="flex items-center justify-between bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeDriver.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span className="font-extrabold text-xs text-slate-100">
                  {activeDriver.isOnline ? 'الكابتن متصل ومتاح لاستقبال الرحلات' : 'الكابتن غير متصل (أوفلاين)'}
                </span>
              </div>
              <button
                onClick={() => setIsCardCollapsed(true)}
                className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-all"
                title="طي اللوحة لفتح الخريطة بالكامل"
              >
                طي اللوحة للخريطة ⬇
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-5 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('radar')}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  activeTab === 'radar' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5 mb-0.5" />
                <span>الرادار</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                className={`relative flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  activeTab === 'queue' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 mb-0.5" />
                <span>الطلبات</span>
                {tripRequestsQueue.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {tripRequestsQueue.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('earnings')}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  activeTab === 'earnings' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 mb-0.5" />
                <span>الأرباح</span>
              </button>

              <button
                onClick={() => setActiveTab('performance')}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  activeTab === 'performance' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5 mb-0.5" />
                <span>الأداء</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  activeTab === 'history' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5 mb-0.5" />
                <span>السجل</span>
              </button>
            </div>
        
            {/* TAB 1: RADAR & COCKPIT CONTROLS */}
            {activeTab === 'radar' && (
              <>
                {/* Driver Profile & Online Switch */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={activeDriver.avatar}
                          alt={activeDriver.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500/40"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                            activeDriver.isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                        ></span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-slate-100">{activeDriver.name}</h3>
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {activeDriver.rating}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span>{activeDriver.car.make} {activeDriver.car.model}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-mono font-bold">{activeDriver.car.plateNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Online / Offline Toggle Button */}
                    <button
                      id="driver-toggle-online-btn"
                      onClick={toggleDriverOnline}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md ${
                        activeDriver.isOnline
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      <span>{activeDriver.isOnline ? 'أنت أونلاين' : 'أوفلاين'}</span>
                    </button>
                  </div>

                  {/* Verification Badge */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-slate-300">سنوية المرور وهوية الكابتن</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                      معتمد وموثق 🇮🇶
                    </span>
                  </div>
                </div>

                {/* Active Trip Driver Actions */}
                {currentTrip && currentTrip.status !== 'completed' && (
                  <div className="bg-slate-900 border border-amber-500/60 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Car className="w-4 h-4" />
                        <span>
                          {currentTrip.status === 'driver_assigned' && 'توجه نحو الراكب'}
                          {currentTrip.status === 'driver_arriving' && 'وصلت إلى نقطة الانطلاق'}
                          {currentTrip.status === 'trip_in_progress' && 'الرحلة جارية نحو الوجهة'}
                        </span>
                      </span>
                      <span className="text-xs font-extrabold text-slate-100">{currentTrip.totalPriceIQD.toLocaleString()} د.ع</span>
                    </div>

                    {/* Passenger Info & Direct Dial */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{currentTrip.passengerName}</span>
                        <span className="text-[10px] text-slate-400">
                          طريقة الدفع: {currentTrip.paymentMethod === 'cash' ? 'نقدي كاش' : currentTrip.paymentMethod}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alert(`الاتصال بالزبون: ${currentTrip.passengerPhone}`)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg flex items-center gap-1 text-xs font-bold"
                        >
                          <Phone className="w-4 h-4" />
                          <span>اتصال</span>
                        </button>
                      </div>
                    </div>

                    {/* Arrival Detection & Proximity Alert */}
                    {(currentTrip.status === 'driver_assigned' || currentTrip.status === 'driver_arriving') && (
                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        driverArrivalDetected || currentTrip.status === 'driver_arriving'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                      }`}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <div>
                            <span className="font-bold block">
                              {driverArrivalDetected || currentTrip.status === 'driver_arriving'
                                ? 'تم رصد الوصول لنقطة الراكب ✓'
                                : `المسافة المتبقية للراكب: ${distanceToPickupMeters} متر`}
                            </span>
                            <span className="text-[10px] opacity-80">
                              {driverArrivalDetected || currentTrip.status === 'driver_arriving'
                                ? 'أنت الآن بالقرب من موقع الانطلاق'
                                : 'النظام يرصد قربك تلقائياً ضمن نطاق 150 متر'}
                            </span>
                          </div>
                        </div>

                        {currentTrip.status === 'driver_assigned' && (
                          <button
                            onClick={confirmDriverArrivalAtPickup}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-lg shadow whitespace-nowrap"
                          >
                            وصلت للراكب 📍
                          </button>
                        )}
                      </div>
                    )}

                    {/* Passenger Verification (PIN) Security Check before starting */}
                    {currentTrip.status === 'driver_arriving' && (
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/50 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                          <KeyRound className="w-4 h-4" />
                          <span>التحقق من هوية الراكب (رمز الأمان PIN)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          اطلب رمز التحقق المكون من 4 أرقام من الراكب للتأكد من هويته وبدء المشوار بأمان
                        </p>

                        <form onSubmit={handleVerifyPinSubmit} className="flex gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            value={enteredPin}
                            onChange={e => setEnteredPin(e.target.value)}
                            placeholder="أدخل الرمز (مثال: 5821)"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-black font-mono tracking-widest text-slate-100 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-2 rounded-xl text-xs transition-all shadow"
                          >
                            تحقق ✓
                          </button>
                        </form>

                        {pinError && (
                          <p className="text-[11px] text-rose-400 font-bold">
                            ⚠️ الرمز غير صحيح! الرمز الصحيح يظهر على شاشة الراكب
                          </p>
                        )}
                        {pinSuccess && (
                          <p className="text-[11px] text-emerald-400 font-bold">
                            ✓ تم التحقق بنجاح! جاري بدء المشوار...
                          </p>
                        )}

                        <div className="pt-1 flex justify-between items-center text-[10px] text-slate-500">
                          <span>رمز الراكب الحالي: {passengerVerificationPin}</span>
                          <button
                            type="button"
                            onClick={handleInstantStartBypass}
                            className="text-amber-400 hover:underline font-bold"
                          >
                            تخطي التحقق والبدء فورا ⏩
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Locations Route */}
                    <div className="space-y-1.5 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                        <span className="text-slate-400 text-[11px]">الانطلاق:</span>
                        <span className="text-slate-200 font-medium truncate">{currentTrip.pickup.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></div>
                        <span className="text-slate-400 text-[11px]">الوجهة:</span>
                        <span className="text-slate-200 font-medium truncate">{currentTrip.dropoff.name}</span>
                      </div>
                    </div>

                    {/* Step Action Button */}
                    <button
                      id="advance-driver-trip-btn"
                      onClick={advanceDriverTripStep}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all flex items-center justify-center gap-2"
                    >
                      {currentTrip.status === 'driver_assigned' && 'تأكيد الوصول لنقطة التقاط الراكب 📍'}
                      {currentTrip.status === 'driver_arriving' && 'بدء الرحلة مع الراكب 🚕'}
                      {currentTrip.status === 'trip_in_progress' && 'إنهاء المشوار وتحصيل الأجرة ✅'}
                    </button>
                  </div>
                )}

                {/* Quick Daily Stats Strip */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-400 block mb-0.5">أرباح اليوم</span>
                    <span className="text-sm font-black text-amber-400">
                      {activeDriver.todayEarningsIQD.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 block">د.ع</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-400 block mb-0.5">نسبة القبول</span>
                    <span className="text-sm font-black text-emerald-400">{activeDriver.acceptanceRate}%</span>
                    <span className="text-[9px] text-slate-500 block">ممتاز</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-400 block mb-0.5">الرحلات المنجزة</span>
                    <span className="text-sm font-black text-slate-200">{activeDriver.totalTrips}</span>
                    <span className="text-[9px] text-slate-500 block">مشوار</span>
                  </div>
                </div>

                {/* Pending Requests Tray Reminder if Queue has items */}
                {tripRequestsQueue.length > 0 && (
                  <div
                    onClick={() => setActiveTab('queue')}
                    className="cursor-pointer bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/40 rounded-xl p-3 flex items-center justify-between shadow-lg group hover:border-rose-500 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                        <Radio className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">
                          توجد {tripRequestsQueue.length} طلبات بانتظارك في قائمة الانتظار
                        </span>
                        <span className="text-[10px] text-rose-300">
                          انقر هنا لمراجعة وقبول المشاوير قبل انتهاء المهلة
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </>
            )}

            {/* TAB 2: TRIP REQUESTS QUEUE */}
            {activeTab === 'queue' && (
              <div className="space-y-2.5">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-amber-400" />
                      <span>قائمة طلبات الرحلات المتاحة (Requests Queue)</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      تتلقى العروض تلقائياً من محرك التوزيع التلقائي بناءً على موقعك
                    </span>
                  </div>
                  <span className="text-xs font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    {tripRequestsQueue.length} طلب
                  </span>
                </div>

                {tripRequestsQueue.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-xl">
                      🚖
                    </div>
                    <p className="text-xs font-bold text-slate-300">لا توجد طلبات في قائمة الانتظار حالياً</p>
                    <p className="text-[11px] text-slate-500">
                      {activeDriver.isOnline
                        ? 'ابق في وضع الاتصال وسيقوم الرادار بتحويل أقرب الطلبات إليك تلقائياً'
                        : 'قم بتفعيل وضع "أونلاين" لتتمكن من استلام طلبات المشاوير'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tripRequestsQueue.map((offer) => (
                      <div
                        key={offer.rideId}
                        className="bg-slate-900 border border-amber-500/40 hover:border-amber-500 rounded-2xl p-3.5 shadow-xl space-y-2.5 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">
                              🚕
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-100">{offer.passengerName}</span>
                                <span className="text-[10px] text-amber-400 flex items-center">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  {offer.passengerRating}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                مسافة {offer.distanceKm} كم • {offer.durationMins} دقيقة
                              </span>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className="text-sm font-black text-emerald-400 block">
                              {offer.fareIQD.toLocaleString()} د.ع
                            </span>
                            {offer.surgeMultiplier > 1.0 && (
                              <span className="text-[9px] text-amber-400 font-bold">
                                بونص {offer.surgeMultiplier}x
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Route landmarks */}
                        <div className="bg-slate-950 p-2 rounded-xl text-[11px] space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            <span className="text-slate-400 text-[10px]">من:</span>
                            <span className="text-slate-200 truncate">{offer.pickup.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                            <span className="text-slate-400 text-[10px]">إلى:</span>
                            <span className="text-slate-200 truncate">{offer.dropoff.name}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => rejectOfferFromQueue(offer.rideId, 'declined_by_driver')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs border border-slate-700 transition-colors"
                          >
                            تخطي
                          </button>
                          <button
                            onClick={() => acceptOfferFromQueue(offer.rideId)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2 rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            قبول المشوار ✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: EARNINGS DASHBOARD & WITHDRAWAL */}
            {activeTab === 'earnings' && (
              <div className="space-y-3">
                {/* Wallet Balance Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-extrabold text-slate-100">محفظة الكابتن والسحب الفوري</h4>
                    </div>
                    <button
                      id="open-driver-withdraw-btn"
                      onClick={() => setShowWithdrawModal(true)}
                      className="text-[11px] font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 px-3 py-1 rounded-lg shadow font-black transition-all"
                    >
                      سحب الأرباح
                    </button>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">الرصيد القابل للسحب الفوري</span>
                      <span className="text-xl font-black text-emerald-400">
                        {activeDriver.walletBalanceIQD.toLocaleString()} <span className="text-xs">د.ع</span>
                      </span>
                    </div>
                    <div className="text-left text-[10px] text-slate-400">
                      <span>عمولة التطبيق: 15%</span>
                      <span className="block text-emerald-400 font-bold">بدون رسوم سحب</span>
                    </div>
                  </div>
                </div>

                {/* Earnings Breakdown */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">أرباح اليوم الصافية</span>
                    <span className="text-base font-black text-amber-400">
                      {activeDriver.todayEarningsIQD.toLocaleString()} د.ع
                    </span>
                    <span className="text-[9px] text-emerald-400 block mt-0.5">+14% عن أمس</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">متوسط سعر المشوار</span>
                    <span className="text-base font-black text-slate-200">
                      {(Math.round(activeDriver.todayEarningsIQD / Math.max(1, activeDriver.totalTrips))).toLocaleString()} د.ع
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">تسعير مباشر</span>
                  </div>
                </div>

                {/* Payout Options Overview */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">بوابات السحب المعتمدة في العراق:</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-slate-300 font-bold">
                      زين كاش (ZainCash)
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-slate-300 font-bold">
                      فاست بي (FastPay)
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-slate-300 font-bold">
                      سوبر كي (SuperQi)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PERFORMANCE METRICS */}
            {activeTab === 'performance' && (
              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>مؤشرات أداء الكابتن والجودة</span>
                    </span>
                    <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                      كابتن ماسي 💎
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">تقييم الزبائن الإجمالي</span>
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" /> {activeDriver.rating} / 5.0
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(activeDriver.rating / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">نسبة قبول المشاوير</span>
                        <span className="font-bold text-emerald-400">{activeDriver.acceptanceRate}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${activeDriver.acceptanceRate}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">نسبة الإلغاء</span>
                        <span className="font-bold text-slate-300">1.2% (ممتاز)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `12%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Tips */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
                  <span className="font-bold text-slate-200 block text-[11px]">💡 كيف تزيد أرباحك مع دانيال:</span>
                  <p className="text-[11px]">
                    • التواجد قرب المراكز التجارية (مول المنصور، الكرادة، زيونة) يرفع فرصة تلقي طلبات متتابعة.
                  </p>
                  <p className="text-[11px]">
                    • نسبة القبول فوق 90% تمنحك الأولوية في طلبات رحلات المطار والـ VIP.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: TRIP HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-2">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">سجل المشاوير المكتملة</span>
                  <span className="text-[10px] text-slate-400">{pastTrips.length} رحلات مسجلة</span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {pastTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{trip.passengerName}</span>
                        <span className="font-black text-amber-400">{trip.totalPriceIQD.toLocaleString()} د.ع</span>
                      </div>
                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div className="truncate">📍 {trip.pickup.name} ← {trip.dropoff.name}</div>
                        <div className="flex justify-between text-slate-500 pt-0.5">
                          <span>طريقة الدفع: {trip.paymentMethod === 'cash' ? 'كاش' : trip.paymentMethod}</span>
                          <span>مكتمل ✓</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Incoming Dispatch Offer Modal */}
      <AnimatePresence>
        {activeOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-right flex flex-col gap-4"
            >
              {/* Countdown Bar & Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black animate-bounce">
                      🚕
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100">طلب مشوار جديد من دانيال!</h3>
                      <span className="text-[10px] text-amber-400">
                        ينتهي العرض خلال {activeOfferRemainingSeconds} ثانية
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {activeOfferRemainingSeconds}s
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-1000"
                    style={{ width: `${Math.max(0, (activeOfferRemainingSeconds / 15) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Price & Surge */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">صافي أرباح الكابتن</span>
                  <span className="text-xl font-black text-emerald-400">
                    {activeOffer.fareIQD.toLocaleString()} <span className="text-xs">د.ع</span>
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {activeOffer.passengerRating} (تقييم الراكب)
                  </span>
                  {activeOffer.surgeMultiplier > 1.0 && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-lg font-bold">
                      🔥 بونص ذروة {activeOffer.surgeMultiplier}x
                    </span>
                  )}
                </div>
              </div>

              {/* Route Points */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      نقطة الانطلاق (يبعد {activeOffer.distanceKm} كم)
                    </span>
                    <span className="font-bold text-slate-200">{activeOffer.pickup.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">الوجهة</span>
                    <span className="font-bold text-slate-200">{activeOffer.dropoff.name}</span>
                  </div>
                </div>
              </div>

              {/* Accept / Decline Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  id="driver-reject-btn"
                  onClick={rejectTripAsDriver}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs transition-colors border border-slate-700"
                >
                  تخطي المشوار
                </button>

                <button
                  id="driver-accept-btn"
                  onClick={acceptTripAsDriver}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95"
                >
                  قبول المشوار ✓
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdrawal Modal (ZainCash / FastPay / SuperQi) */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-right"
            >
              <h3 className="text-sm font-extrabold text-slate-100 mb-3">سحب أرباح الكابتن الفورية</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">اختر المحفظة المستلمة</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setWithdrawGateway('zaincash')}
                      className={`p-2 rounded-xl border text-center text-xs font-bold ${
                        withdrawGateway === 'zaincash' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      زين كاش
                    </button>
                    <button
                      onClick={() => setWithdrawGateway('fastpay')}
                      className={`p-2 rounded-xl border text-center text-xs font-bold ${
                        withdrawGateway === 'fastpay' ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      فاست بي
                    </button>
                    <button
                      onClick={() => setWithdrawGateway('superqi')}
                      className={`p-2 rounded-xl border text-center text-xs font-bold ${
                        withdrawGateway === 'superqi' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      سوبر كي
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">المبلغ المطلوب سحبه</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(Number(e.target.value))}
                    step={10000}
                    max={activeDriver.walletBalanceIQD}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    الحد الأقصى المتاح: {activeDriver.walletBalanceIQD.toLocaleString()} د.ع
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    id="confirm-driver-withdraw-btn"
                    onClick={() => {
                      withdrawDriverWallet(withdrawAmount, withdrawGateway === 'zaincash' ? 'زين كاش' : withdrawGateway === 'fastpay' ? 'فاست بي' : 'سوبر كي');
                      setShowWithdrawModal(false);
                    }}
                    className="flex-1 bg-emerald-500 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                  >
                    تأكيد التحويل
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
