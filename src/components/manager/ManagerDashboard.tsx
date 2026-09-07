import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IRAQI_CITIES, RIDE_TIERS } from '../../data/iraqLocations';
import {
  BarChart3,
  TrendingUp,
  Users,
  Car,
  Clock,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { pastTrips, driversList, selectedCityId, setSelectedCityId, surgeZones } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'this_week' | 'this_month'>('today');

  const currentCity = IRAQI_CITIES.find(c => c.id === selectedCityId) || IRAQI_CITIES[0];

  // Performance calculations
  const totalRides = pastTrips.length + 142;
  const completedRate = 97.4;
  const avgAcceptanceSec = 4.8;
  const grossRevenueIQD = 38450000;
  const companyCommissionIQD = Math.round(grossRevenueIQD * 0.15);

  const tierBreakdown = [
    { tier: 'اقتصادي (Economy)', count: 98, percent: '68%', revenue: '14,750,000 د.ع' },
    { tier: 'كومفورت VIP', count: 24, percent: '17%', revenue: '8,200,000 د.ع' },
    { tier: 'تاكسي سيدات', count: 12, percent: '8%', revenue: '3,800,000 د.ع' },
    { tier: 'توصيل طلبات', count: 10, percent: '7%', revenue: '2,100,000 د.ع' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">لوحة المدير العام وإدارة العمليات (Operations Manager)</h1>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                MANAGEMENT & SLA
              </span>
            </div>
            <p className="text-xs text-slate-400">
              تقارير الأداء التنفيذي، معدلات قبول الطلبات، الإيرادات وعمولات المنصة في عموم المحافظات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPeriod === 'today' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setSelectedPeriod('this_week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPeriod === 'this_week' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => setSelectedPeriod('this_month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPeriod === 'this_month' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              الشهر الحالي
            </button>
          </div>

          <button
            onClick={() => alert('تم تصدير تقرير العمليات بصيغة Excel / CSV')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-2 rounded-xl transition-all font-bold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">تصدير التقرير</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>إجمالي الإيرادات (Gross Revenue)</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{grossRevenueIQD.toLocaleString('ar-IQ')} د.ع</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+14.8% مقارنة بالأسبوع الماضي</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>عمولة المنصة الصافية (15%)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{companyCommissionIQD.toLocaleString('ar-IQ')} د.ع</div>
          <div className="text-xs text-slate-400 mt-1">دخل التطبيق الصافي</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>نسبة إكمال الرحلات (Fulfillment Rate)</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{completedRate}%</div>
          <div className="text-xs text-blue-400 mt-1">ضمن معايير الجودة العالمية</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>متوسط وقت مطابقة السائق (SLA)</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{avgAcceptanceSec} ثانية</div>
          <div className="text-xs text-emerald-400 mt-1">أسرع بنسبة 25% من الهدف</div>
        </div>
      </div>

      {/* Grid: Tier Distribution + Driver Quality Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tier Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <h2 className="text-sm font-black text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>توزيع الرحلات حسب فئة المركبة</span>
          </h2>

          <div className="space-y-3">
            {tierBreakdown.map((t, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white">{t.tier}</span>
                  <span className="text-amber-400 font-extrabold">{t.revenue}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span>{t.count} رحلة منجزة</span>
                  <span>{t.percent} من إجمالي الحركة</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: t.percent }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Drivers Monitoring */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <h2 className="text-sm font-black text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>مراقبة التزام وجودة الكباتن في {currentCity.nameAr}</span>
          </h2>

          <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
            {driversList.map(driver => (
              <div
                key={driver.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400">
                    {driver.rating}⭐
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>كابتن {driver.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        {driver.car.plateNumber}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {driver.car.make} {driver.car.model} • {driver.totalTrips} رحلة منجزة
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-xs font-bold text-emerald-400">
                    {(driver.todayEarningsIQD || 45000).toLocaleString('ar-IQ')} د.ع
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      driver.isOnline
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {driver.isOnline ? 'نشط أونلاين' : 'أوفلاين'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
