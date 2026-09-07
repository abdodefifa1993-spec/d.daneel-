import React, { useState } from 'react';
import {
  X,
  Phone,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  User,
  Car,
  LayoutDashboard,
  Radio,
  Headphones,
  LifeBuoy,
  LogOut,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { authService, AuthUser, DEFAULT_PLATFORM_ACCOUNTS } from '../../services/auth';
import { AppRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleChange: (role: AppRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onRoleChange }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [mode, setMode] = useState<'switch_role' | 'phone_login' | 'otp_verify'>('switch_role');
  const [phoneNumber, setPhoneNumber] = useState<string>('07701234567');
  const [otpCode, setOtpCode] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('passenger');
  const [fullName, setFullName] = useState<string>('محمد علي');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage('يرجى إدخال رقم هاتف عراقي صحيح مكون من 11 رقماً (مثال: 07701234567)');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await authService.sendOtp(phoneNumber, selectedRole, fullName);
      setStatusMessage(res.message);
      setOtpCode('5821'); // Pre-fill test code for ultra-fast verification
      setMode('otp_verify');
    } catch {
      setErrorMessage('حدث خطأ أثناء إرسال رمز التحقق. يرجى المحاولة ثانية.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await authService.verifyOtp(phoneNumber, otpCode);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        onRoleChange(res.user.role);
        onClose();
      } else {
        setErrorMessage(res.error || 'رمز التحقق غير صحيح');
      }
    } catch {
      setErrorMessage('تعذر التحقق من الرمز.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleSwitch = (role: AppRole) => {
    const updated = authService.switchAccount(role);
    setCurrentUser(updated);
    onRoleChange(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
                <span>نظام المصادقة والدخول الموحد</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Phase 4 RBAC
                </span>
              </h2>
              <p className="text-xs text-slate-400">تسجيل الدخول برقم الهاتف العراقي والتبديل بين الصلاحيات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Current Active Account Card */}
          {currentUser && (
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-xl object-cover border border-amber-500/30 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-100">{currentUser.name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{currentUser.phone}</span>
                  </div>
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-400">الرصيد المتاح</div>
                <div className="text-xs font-bold text-emerald-400">
                  {currentUser.walletBalanceIQD?.toLocaleString() || '0'} د.ع
                </div>
              </div>
            </div>
          )}

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setMode('switch_role')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'switch_role'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>التبديل الفوري بين الحسابات</span>
            </button>
            <button
              onClick={() => setMode('phone_login')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'phone_login' || mode === 'otp_verify'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>تسجيل رقم جديد (OTP)</span>
            </button>
          </div>

          {/* Mode 1: Quick Role Switcher Grid */}
          {mode === 'switch_role' && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 mb-2">اختر الحساب المطلوب للتبديل الفوري:</div>
              <div className="grid grid-cols-1 gap-2">
                {DEFAULT_PLATFORM_ACCOUNTS.map((acc) => {
                  const isCurrent = currentUser?.id === acc.id || currentUser?.role === acc.role;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => handleQuickRoleSwitch(acc.role)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-right ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="text-xs font-black flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900 border border-slate-700 font-mono text-slate-400">
                              {acc.userRole}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{acc.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                            <CheckCircle2 className="w-4 h-4" />
                            الحساب النشط
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 hover:text-amber-300">تبديل ➔</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Phone Login */}
          {mode === 'phone_login' && (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="مثال: أحمد البغدادي"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف العراقي (+964)</label>
                <div className="relative flex items-center">
                  <span className="absolute right-3 text-slate-500 text-xs font-mono">🇮🇶 +964</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-16 pl-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="7701234567"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نوع الحساب / الصلاحية</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as AppRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="passenger">راكب (Passenger)</option>
                  <option value="driver">كابتن / سائق (Captain)</option>
                  <option value="dispatcher">مرحّل رحلات (Dispatcher)</option>
                  <option value="call_center">مركز اتصال (Call Center)</option>
                  <option value="support">دعم فني (Support)</option>
                  <option value="admin">مدير نظام (Admin)</option>
                  <option value="owner">مالك المنصة (Owner)</option>
                </select>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                <span>{loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق SMS'}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </form>
          )}

          {/* Mode 3: OTP Verification */}
          {mode === 'otp_verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {statusMessage}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رمز التحقق المكون من 4 أرقام</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono font-black bg-slate-950 border border-slate-700 rounded-xl py-3 text-amber-400 focus:outline-none focus:border-amber-500"
                  placeholder="5821"
                  required
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>{loading ? 'جاري التحقق...' : 'تأكيد الرمز وبدء الجلسة'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setMode('phone_login')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1"
              >
                العودة لتعديل رقم الهاتف
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 text-xs text-slate-400">
          <span>مشروع Firebase: <strong className="text-slate-200 font-mono">daneel-taxi-and-delivery</strong></span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
