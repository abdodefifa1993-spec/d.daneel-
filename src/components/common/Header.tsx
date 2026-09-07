import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IRAQI_CITIES } from '../../data/iraqLocations';
import { AppRole, IraqiCityId } from '../../types';
import { authService, AuthUser } from '../../services/auth';
import { AuthModal } from './AuthModal';
import {
  Smartphone,
  Car,
  LayoutDashboard,
  Headphones,
  FileCode2,
  Wallet,
  Bell,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  X,
  Radio,
  BarChart3,
  LifeBuoy,
  ShieldCheck,
  Flame,
  UserCheck,
  ShoppingBag
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    selectedCityId,
    setSelectedCityId,
    passengerWalletIQD,
    activeDriver,
    notifications,
    markNotificationRead,
    clearNotifications,
    currentTrip
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authService.getCurrentUser());

  // Listen to auth changes
  React.useEffect(() => {
    return authService.subscribe(user => setCurrentUser(user));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const currentCity = IRAQI_CITIES.find(c => c.id === selectedCityId) || IRAQI_CITIES[0];

  const roleTabs: Array<{ id: AppRole; labelAr: string; icon: React.FC<{ className?: string }>; badge?: string }> = [
    { id: 'passenger', labelAr: 'DANIEL', icon: Smartphone, badge: currentTrip ? 'مشوار نشط' : undefined },
    { id: 'driver', labelAr: 'Daniel Captain', icon: Car, badge: activeDriver.isOnline ? 'أونلاين' : 'أوفلاين' },
    { id: 'delivery', labelAr: 'دانيال للتوصيل', icon: ShoppingBag, badge: 'متاجر ومطاعم' },
    { id: 'owner', labelAr: 'Daniel Control Center', icon: ShieldCheck, badge: 'CEO / GMV' },
    { id: 'monitoring', labelAr: 'الرادار والعمليات', icon: Radio, badge: 'LIVE 60FPS' },
    { id: 'dispatcher', labelAr: 'الترحيل الذكي (Dispatch)', icon: MapPin },
    { id: 'admin', labelAr: 'الإدارة (Admin)', icon: LayoutDashboard },
    { id: 'manager', labelAr: 'إدارة العمليات', icon: BarChart3 },
    { id: 'call_center', labelAr: 'مركز الاتصال', icon: Headphones },
    { id: 'support', labelAr: 'الدعم والمساعدة', icon: LifeBuoy },
    { id: 'roadmap', labelAr: 'التوثيق والهندسة', icon: FileCode2 }
  ];

  return (
    <header id="main-header" className="bg-slate-900/95 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & City Picker */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl tracking-tighter">
              D
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-100 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">DANIEL</span>
                <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                  دانيال
                </span>
              </div>
              <p className="text-[11px] text-slate-400">شركة دانيال للنقل الذكي 🇮🇶</p>
            </div>
          </div>

          {/* City Selector dropdown */}
          <div className="relative">
            <button
              id="city-selector-btn"
              onClick={() => setShowCityMenu(!showCityMenu)}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">{currentCity.nameAr.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showCityMenu && (
              <div
                id="city-dropdown-menu"
                className="absolute left-0 sm:right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-right animate-in fade-in zoom-in-95"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800 mb-1">
                  اختر المحافظة / المدينة
                </div>
                {IRAQI_CITIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCityId(c.id);
                      setShowCityMenu(false);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      c.id === selectedCityId ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{c.nameAr}</span>
                    <span className="text-[10px] text-slate-500">{c.nameEn}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Role Navigation Switcher */}
        <nav id="role-switcher-nav" className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 w-full md:w-auto overflow-x-auto scrollbar-none">
          {roleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = role === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setRole(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 relative ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.labelAr}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-slate-950 text-amber-400'
                        : tab.badge === 'مشوار نشط'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Balance & Notifications */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Active Role Quick Balance */}
          {role === 'passenger' && (
            <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl px-3 py-1 flex items-center gap-2 text-xs">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-400 font-medium">رصيد المحفظة</span>
                <span className="font-extrabold text-emerald-300">
                  {passengerWalletIQD.toLocaleString()} <span className="text-[10px]">د.ع</span>
                </span>
              </div>
            </div>
          )}

          {role === 'driver' && (
            <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl px-3 py-1 flex items-center gap-2 text-xs">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-400 font-medium">أرباح اليوم</span>
                <span className="font-extrabold text-amber-300">
                  {activeDriver.todayEarningsIQD.toLocaleString()} <span className="text-[10px]">د.ع</span>
                </span>
              </div>
            </div>
          )}

          {/* Notifications button */}
          <div className="relative">
            <button
              id="notifications-toggle-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700/80 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                id="notifications-modal"
                className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-right animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="text-xs font-bold text-slate-200">الإشعارات ({notifications.length})</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      مسح الكل
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">لا توجد إشعارات حالياً</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          n.read
                            ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-slate-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-400 text-[11px]">{n.title}</span>
                          <span className="text-[10px] text-slate-500">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Firebase daneel-taxi-and-delivery Live Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <Flame className="w-3 h-3 text-amber-400" />
            <span className="font-bold">daneel-taxi-and-delivery</span>
          </div>

          {/* User Profile & Auth Modal Trigger */}
          <button
            id="auth-modal-btn"
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-xl transition-all shadow-sm group"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-lg object-cover border border-amber-500/40"
              />
            ) : (
              <UserCheck className="w-4 h-4 text-amber-400" />
            )}
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-black text-slate-200 group-hover:text-amber-300 transition-colors">
                {currentUser ? currentUser.name.split(' ')[0] : 'تسجيل الدخول'}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                {currentUser?.userRole || 'RBAC'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Unified RBAC & Phone Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onRoleChange={(newRole) => setRole(newRole)}
      />
    </header>
  );
};

