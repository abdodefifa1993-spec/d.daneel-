import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleIraqiMap } from '../common/GoogleIraqiMap';
import {
  TrendingUp,
  Users,
  Car,
  DollarSign,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Sliders,
  FileSpreadsheet,
  RefreshCw,
  Eye
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    driversList,
    pastTrips,
    currentTrip,
    surgeZones,
    updateSurgeZoneMultiplier,
    selectedCityId
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'trips' | 'finance' | 'surge' | 'safety'>('overview');
  const [driverSearch, setDriverSearch] = useState('');
  const [tripSearch, setTripSearch] = useState('');

  // Financial aggregates
  const allTrips = currentTrip ? [currentTrip, ...pastTrips] : pastTrips;
  const totalGMV = allTrips.reduce((acc, t) => acc + t.totalPriceIQD, 14250000);
  const platformRevenueIQD = Math.round(totalGMV * 0.15);
  const activeDriversCount = driversList.filter(d => d.isOnline).length;
  const totalCompletedCount = pastTrips.filter(t => t.status === 'completed').length + 8420;

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5">
      
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
              📊
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100">
                لوحة القيادة والتحكم المركزية (Super Admin)
              </h2>
              <p className="text-xs text-slate-400">
                إدارة الأسطول العراقي، تسعير الذروة الديناميكي، والتحليلات المالية بالدينار العراقي (IQD)
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'نظرة عامة ورادار', icon: TrendingUp },
            { id: 'fleet', label: 'إدارة الكباتن', icon: Car },
            { id: 'trips', label: 'سجل الرحلات', icon: FileSpreadsheet },
            { id: 'finance', label: 'السجل المالي', icon: DollarSign },
            { id: 'surge', label: 'تسعير الذروة (Surge)', icon: Flame },
            { id: 'safety', label: 'الأمان والـ SOS', icon: ShieldCheck }
          ].map(t => {
            const Icon = t.icon;
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                id={`admin-tab-${t.id}`}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* GMV */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>إجمالي قيمة الرحلات (GMV)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
            {totalGMV.toLocaleString()} <span className="text-xs font-sans text-slate-400">د.ع</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">↗ +18.4% نمو أسبوعي في بغداد</span>
        </div>

        {/* Platform Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>أرباح المنصة الصافية (15%)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
            {platformRevenueIQD.toLocaleString()} <span className="text-xs font-sans text-slate-400">د.ع</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">توزيع عمولة مباشر</span>
        </div>

        {/* Active Fleet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>الكباتن النشطون على الطريق</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-100 font-mono">
            {activeDriversCount} / {driversList.length}
          </div>
          <span className="text-[10px] text-blue-400 mt-1 block">جاهزية التغطية: 94%</span>
        </div>

        {/* Completed Trips */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>إجمالي المشاوير المنجزة</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-purple-300 font-mono">
            {totalCompletedCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-purple-400/80 mt-1 block">متوسط التقييم 4.91 ★</span>
        </div>
      </div>

      {/* Tab 1: Overview & Live Iraqi Radar */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Radar Map (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>رادار الأسطول والتتبع المباشر (Iraqi Fleet Radar)</span>
                </h3>
                <p className="text-xs text-slate-400">مراقبة حية لحركة السيارات، مناطق الطلب المرتفع، ومسارات الرحلات</p>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-xl border border-slate-700 font-mono">
                تحديث حي عبر Socket.IO
              </span>
            </div>

            <div className="h-96 rounded-xl overflow-hidden border border-slate-800 relative">
              <GoogleIraqiMap showFleetFleetAll={true} showSurgeHeatmap={true} />
            </div>
          </div>

          {/* Quick High-Demand Zones List (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>مناطق الطلب النشطة (Hot Zones)</span>
            </h3>
            <p className="text-xs text-slate-400">تحديث فوري لمعاملات التسعير حسب نسبة الطلب للسيارات المتاحة</p>

            <div className="flex flex-col gap-2.5 mt-1 overflow-y-auto max-h-96 pr-1">
              {surgeZones.map(sz => (
                <div
                  key={sz.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{sz.zoneName}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        sz.multiplier >= 1.5
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {sz.multiplier}x معامل ذروة
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>طلبات نشطة: <b className="text-slate-200">{sz.activeOrdersCount}</b></span>
                    <span>كباتن متاحين: <b className="text-emerald-400">{sz.availableDriversCount}</b></span>
                  </div>

                  {/* Slider to adjust multiplier */}
                  <div className="pt-1 border-t border-slate-800/60 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 shrink-0">تعديل:</span>
                    <input
                      type="range"
                      min="1.0"
                      max="2.5"
                      step="0.1"
                      value={sz.multiplier}
                      onChange={e => updateSurgeZoneMultiplier(sz.id, parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-bold text-amber-400 font-mono w-8 text-left">{sz.multiplier}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Driver Fleet Management */}
      {activeTab === 'fleet' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100">أسطول الكباتن والتوثيق (Captain KYC)</h3>
              <p className="text-xs text-slate-400">إدارة حسابات السائقين، تقييماتهم، وتوثيق السنوية وإجازة السوق العراقية</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={driverSearch}
                onChange={e => setDriverSearch(e.target.value)}
                placeholder="بحث بالاسم أو رقم اللوحة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">الكابتن</th>
                  <th className="p-3">نوع السيارة واللوحة</th>
                  <th className="p-3">المدينة</th>
                  <th className="p-3">التقييم</th>
                  <th className="p-3">إجمالي الرحلات</th>
                  <th className="p-3">رصيد المحفظة</th>
                  <th className="p-3">الحالة والتوثيق</th>
                  <th className="p-3">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {driversList
                  .filter(d => !driverSearch || d.name.includes(driverSearch) || d.car.plateNumber.includes(driverSearch))
                  .map(drv => (
                    <tr key={drv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 flex items-center gap-2.5">
                        <img
                          src={drv.avatar}
                          alt={drv.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <span className="font-bold text-slate-200 block">{drv.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{drv.phone}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-200 block">
                          {drv.car.make} {drv.car.model}
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono">{drv.car.plateNumber}</span>
                      </td>
                      <td className="p-3 text-slate-300 capitalize">{drv.cityId}</td>
                      <td className="p-3">
                        <span className="text-amber-400 font-bold">★ {drv.rating}</span>
                      </td>
                      <td className="p-3 text-slate-300 font-mono">{drv.totalTrips}</td>
                      <td className="p-3 text-emerald-400 font-mono font-bold">
                        {drv.walletBalanceIQD.toLocaleString()} د.ع
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${drv.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`}
                          ></span>
                          <span className="text-[11px] text-slate-300">{drv.isOnline ? 'متصل' : 'أوفلاين'}</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            موثق ✓
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => alert(`تفاصيل الكابتن ${drv.name} وإجازة السوق معتمدة`)}
                          className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 font-bold"
                        >
                          معاينة
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Trips Ledger */}
      {activeTab === 'trips' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100">سجل المشاوير والعمليات المالية</h3>
              <p className="text-xs text-slate-400">تتبع جميع الرحلات المكتملة والنشطة وبوابات الدفع (ZainCash, FastPay, Cash)</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={tripSearch}
                onChange={e => setTripSearch(e.target.value)}
                placeholder="بحث برقم الرحلة أو اسم الزبون..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">رقم المشوار</th>
                  <th className="p-3">الراكب</th>
                  <th className="p-3">نقطة الانطلاق والوجهة</th>
                  <th className="p-3">الفئة</th>
                  <th className="p-3">الأجرة (IQD)</th>
                  <th className="p-3">بوابة الدفع</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allTrips
                  .filter(t => !tripSearch || t.id.includes(tripSearch) || t.passengerName.includes(tripSearch))
                  .map(trip => (
                    <tr key={trip.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-400">{trip.id}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-200 block">{trip.passengerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{trip.passengerPhone}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-slate-300">من: {trip.pickup.name}</span>
                          <span className="text-slate-400">إلى: {trip.dropoff.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">
                          {trip.tier}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-extrabold text-amber-400">
                        {trip.totalPriceIQD.toLocaleString()} د.ع
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-blue-400">
                          {trip.paymentMethod === 'zaincash' ? 'زين كاش' : trip.paymentMethod === 'fastpay' ? 'فاست بي' : 'كاش'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            trip.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400 animate-pulse'
                          }`}
                        >
                          {trip.status === 'completed' ? 'مكتملة ✓' : 'جارية الآن 🚕'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Financial Ledger */}
      {activeTab === 'finance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>السجل المالي وإدارة التسويات (Financial Ledger)</span>
              </h3>
              <p className="text-xs text-slate-400">
                تدقيق الحركات المالية، عمولة المنظومة (15%)، ومستحقات السائقين بالدينار العراقي (IQD)
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              عمولة المنظومة الحالية: 15%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">إجمالي الإيراد العام (GMV)</span>
              <span className="text-2xl font-black text-white font-mono">{totalGMV.toLocaleString()} د.ع</span>
              <span className="text-[10px] text-slate-500 block mt-1">القيمة الإجمالية لكافة المشاوير المنجزة</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">صافي أرباح المنظومة (15%)</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{platformRevenueIQD.toLocaleString()} د.ع</span>
              <span className="text-[10px] text-emerald-400 block mt-1">+14.2% نمو هذا الشهر</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">مستحقات السائقين المصروفة (85%)</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{(totalGMV - platformRevenueIQD).toLocaleString()} د.ع</span>
              <span className="text-[10px] text-blue-400 block mt-1">زين كاش / فاست بي / كاش</span>
            </div>
          </div>

          {/* Captain Balances Summary */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">الكابتن</th>
                  <th className="p-3">المدينة</th>
                  <th className="p-3">الرصيد المتاح</th>
                  <th className="p-3">أرباح اليوم</th>
                  <th className="p-3">المشاوير المنفذة</th>
                  <th className="p-3">حالة الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {driversList.slice(0, 8).map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-200">{d.name}</td>
                    <td className="p-3 text-slate-400">{d.cityId}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{d.walletBalanceIQD.toLocaleString()} د.ع</td>
                    <td className="p-3 font-mono text-amber-400">{d.todayEarningsIQD.toLocaleString()} د.ع</td>
                    <td className="p-3 text-slate-300">{d.totalTrips}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        منتظم ومسوى
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Dynamic Surge Config */}
      {activeTab === 'surge' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>محرك التسعير الديناميكي (Dynamic Pricing & Geofencing)</span>
              </h3>
              <p className="text-xs text-slate-400">
                التحكم بمعاملات التسعير حسب الظروف الجوية، الازدحامات، والمناسبات في العراق
              </p>
            </div>
            <button
              onClick={() => alert('تمت مزامنة معاملات التسعير مع جميع تطبيقات الكباتن والركاب')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs"
            >
              حفظ وتطبيق فوري
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surgeZones.map(sz => (
              <div key={sz.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-200">{sz.zoneName}</span>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                    {sz.multiplier}x
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">المعامل:</span>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.1"
                    value={sz.multiplier}
                    onChange={e => updateSurgeZoneMultiplier(sz.id, parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-400 w-10 text-left font-mono">{sz.multiplier}x</span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>الطلبات: {sz.activeOrdersCount}</span>
                  <span>السيارات المتوفرة: {sz.availableDriversCount}</span>
                  <span>نصف القطر: {sz.radiusKm} كم</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Safety & SOS Monitoring */}
      {activeTab === 'safety' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-6 h-6" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-100">مركز عمليات الأمان وحالات الطوارئ (SOS Command Center)</h3>
              <p className="text-xs text-slate-400">تتبع البلاغات الحرجة، الانحراف عن المسارات المحددة، وسرعة الاستجابة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">بلاغات SOS النشطة</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">0</span>
              <span className="text-[10px] text-emerald-400 block mt-1">جميع الرحلات آمنة تماماً</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">تنبيهات انحراف المسار (Geofence Alert)</span>
              <span className="text-2xl font-black text-slate-200 font-mono">1</span>
              <span className="text-[10px] text-slate-400 block mt-1">تحويلة بسبب أعمال صيانة</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">زمن استجابة غرفة العمليات</span>
              <span className="text-2xl font-black text-amber-400 font-mono">18 ثانية</span>
              <span className="text-[10px] text-slate-400 block mt-1">مطابق لمعايير الأمان العالمية</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
