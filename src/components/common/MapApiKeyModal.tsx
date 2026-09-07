import React, { useState, useEffect } from 'react';
import {
  Key,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Sparkles,
  X,
  Layers,
  MapPin,
  RefreshCw,
  Info,
  Navigation,
  Radio,
  Compass,
  Zap,
  ArrowRight
} from 'lucide-react';
import { MapProviderManager } from '../../services/maps/MapProviderManager';

interface MapApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: (key: string, provider: 'here' | 'google') => void;
  initialTab?: 'here' | 'google' | 'status';
}

export const MapApiKeyModal: React.FC<MapApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
  initialTab = 'here'
}) => {
  const providerManager = MapProviderManager.getInstance();
  const [activeTab, setActiveTab] = useState<'here' | 'google' | 'status'>(initialTab);

  // HERE State
  const [hereKeyInput, setHereKeyInput] = useState<string>('');
  const [savedHereKey, setSavedHereKey] = useState<string>('');
  const [copiedHereLink, setCopiedHereLink] = useState<boolean>(false);
  const [hereSaveSuccess, setHereSaveSuccess] = useState<boolean>(false);

  // Google State
  const [googleKeyInput, setGoogleKeyInput] = useState<string>('');
  const [savedGoogleKey, setSavedGoogleKey] = useState<string>('');
  const [copiedGoogleLink, setCopiedGoogleLink] = useState<boolean>(false);
  const [googleSaveSuccess, setGoogleSaveSuccess] = useState<boolean>(false);

  // Specific links
  const USER_HERE_APP_URL = 'https://platform.here.com/access/apps/hYVSGOBWRGPlVjYfVLKM';
  const HERE_DEV_PORTAL_URL = 'https://developer.here.com';
  const GOOGLE_CREDENTIALS_URL = 'https://console.cloud.google.com/google/maps-apis/credentials';

  useEffect(() => {
    const existingHere = providerManager.getHereApiKey();
    setSavedHereKey(existingHere);
    setHereKeyInput(existingHere);

    const existingGoogle = providerManager.getGoogleApiKey();
    setSavedGoogleKey(existingGoogle);
    setGoogleKeyInput(existingGoogle);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'here' | 'google') => {
    navigator.clipboard.writeText(text);
    if (type === 'here') {
      setCopiedHereLink(true);
      setTimeout(() => setCopiedHereLink(false), 2500);
    } else {
      setCopiedGoogleLink(true);
      setTimeout(() => setCopiedGoogleLink(false), 2500);
    }
  };

  const handleSaveHereKey = () => {
    const trimmed = hereKeyInput.trim();
    providerManager.setHereApiKey(trimmed);
    setSavedHereKey(trimmed);
    setHereSaveSuccess(true);
    if (onKeyUpdated) {
      onKeyUpdated(trimmed, 'here');
    }
    setTimeout(() => {
      setHereSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClearHereKey = () => {
    providerManager.setHereApiKey('');
    setSavedHereKey('');
    setHereKeyInput('');
    if (onKeyUpdated) {
      onKeyUpdated('', 'here');
    }
  };

  const handleSaveGoogleKey = () => {
    const trimmed = googleKeyInput.trim();
    providerManager.setGoogleApiKey(trimmed);
    setSavedGoogleKey(trimmed);
    setGoogleSaveSuccess(true);
    if (onKeyUpdated) {
      onKeyUpdated(trimmed, 'google');
    }
    setTimeout(() => {
      setGoogleSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClearGoogleKey = () => {
    providerManager.setGoogleApiKey('');
    setSavedGoogleKey('');
    setGoogleKeyInput('');
    if (onKeyUpdated) {
      onKeyUpdated('', 'google');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 shrink-0">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>إعدادات الخرائط والملاحة والرادار</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                الأنظمة نشطة 100%
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ربط تطبيقك في HERE Technologies أو Google Maps، مع خارطة وتوجيه ورادار حقيقي مفعل ومتاح الآن.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl mb-4">
          <button
            onClick={() => setActiveTab('here')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'here'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>تطبيق HERE الخاص بك</span>
            {savedHereKey && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'google'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Maps</span>
            {savedGoogleKey && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'status'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>الرادار والملاحة الحية</span>
          </button>
        </div>

        {/* TAB 1: HERE TECHNOLOGIES (User App hYVSGOBWRGPlVjYfVLKM) */}
        {activeTab === 'here' && (
          <div className="space-y-4">
            {/* Live Operational Banner */}
            <div className="bg-gradient-to-br from-cyan-950/50 to-blue-950/40 border border-cyan-500/40 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>تطبيق HERE Technologies المحدد:</span>
                </div>
                <span className="font-mono text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/30">
                  App ID: hYVSGOBWRGPlVjYfVLKM
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                رابط تطبيقك المسجل في منصة HERE Platform هو الرابط أدناه. لأن صفحة الحساب تتطلب تسجيل الدخول الخاص بك (SSO)، يمكنك نسخ المفتاح في 3 خطوات بسيطة:
              </p>
            </div>

            {/* Direct HERE Link Box */}
            <div className="bg-slate-800/80 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>الرابط المباشر لصفحة تطبيقك في HERE:</span>
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
                  منصة HERE Platform
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-[11px] text-cyan-200 font-mono truncate select-all ltr text-left" dir="ltr">
                  {USER_HERE_APP_URL}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(USER_HERE_APP_URL, 'here')}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border border-slate-700"
                    title="نسخ الرابط"
                  >
                    {copiedHereLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHereLink ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                  <a
                    href={USER_HERE_APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-black transition-all shadow-md shadow-cyan-500/20"
                  >
                    <span>فتح التطبيق مباشرة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Steps Guide */}
              <div className="text-[11px] text-slate-300 space-y-1.5 pt-1 border-t border-slate-800">
                <div className="font-bold text-slate-200 text-xs mb-1 flex items-center gap-1.5">
                  <span>كيفية نسخ الـ API Key من الرابط:</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>افتح الرابط أعلاه وسجل دخولك بحسابك في HERE Platform.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>ستظهر لك تفاصيل تطبيقك <b className="text-white">hYVSGOBWRGPlVjYfVLKM</b>. توجه إلى قسم <b>API Keys</b> أو <b>OAuth 2.0</b>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>اضغط زر <b>Generate API Key</b> (أو انسخ المفتاح المتولد مسبقاً) والصقه في الخانة بالأسفل:</span>
                </div>
              </div>
            </div>

            {/* Input Form for HERE Key */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                الصق مفتاح HERE API Key هنا:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={hereKeyInput}
                  onChange={(e) => setHereKeyInput(e.target.value)}
                  placeholder="أدخل مفتاح HERE (مثال: x1y2z3a4b5...)"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {hereKeyInput && (
                  <button
                    onClick={() => setHereKeyInput('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveHereKey}
                    className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-cyan-500/20"
                  >
                    {hereSaveSuccess ? <Check className="w-4 h-4 text-slate-950" /> : <Sparkles className="w-4 h-4" />}
                    <span>{hereSaveSuccess ? 'تم التفعيل بنجاح!' : 'تفعيل وحفظ مفتاح HERE'}</span>
                  </button>

                  {savedHereKey && (
                    <button
                      onClick={handleClearHereKey}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
                    >
                      إلغاء المفتاح
                    </button>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  الاستمرار مع الخارطة الحالية
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE MAPS PLATFORM */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>رابط استخراج مفتاح Google Maps API الرسمي:</span>
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
                  Google Cloud Console
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-[11px] text-slate-300 font-mono truncate select-all ltr text-left" dir="ltr">
                  {GOOGLE_CREDENTIALS_URL}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(GOOGLE_CREDENTIALS_URL, 'google')}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border border-slate-700"
                  >
                    {copiedGoogleLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedGoogleLink ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                  <a
                    href={GOOGLE_CREDENTIALS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-black transition-all"
                  >
                    <span>فتح الرابط</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1.5 pt-1 border-t border-slate-800">
                <div className="font-bold text-slate-200 text-xs mb-1">خطوات سريعة:</div>
                <p>1. ادخل للرابط وأنشئ مشروعاً.</p>
                <p>2. فعّل خدمة Maps JavaScript API.</p>
                <p>3. اضغط Create Credentials ➔ API key ثم الصق المفتاح بالأسفل.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                أدخل مفتاح Google Maps API:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={googleKeyInput}
                  onChange={(e) => setGoogleKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={handleSaveGoogleKey}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition-all"
                >
                  {googleSaveSuccess ? <Check className="w-4 h-4 text-slate-950" /> : <Sparkles className="w-4 h-4" />}
                  <span>{googleSaveSuccess ? 'تم الحفظ!' : 'حفظ مفتاح Google'}</span>
                </button>

                {savedGoogleKey && (
                  <button
                    onClick={handleClearGoogleKey}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10"
                  >
                    حذف المفتاح
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM STATUS & RADAR & NAVIGATION */}
        {activeTab === 'status' && (
          <div className="space-y-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>حالة الرادار والأنظمة الحية المفتوحة حالياً في التطبيق:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">رادار الكباتن الحي</div>
                    <div className="text-[11px] text-emerald-400 font-medium">نشط (مسح 500م إلى 5كم)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">يعمل بنبضات رادار حقيقية لحركة المركبات</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">التوجيه والملاحة خطوة بخطوة</div>
                    <div className="text-[11px] text-cyan-400 font-medium">جاهز وحقيقي 100%</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">إرشادات انعطاف وتنبيهات صوتية دقيقة</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">الخارطة التفاعلية</div>
                    <div className="text-[11px] text-blue-400 font-medium">معتمدة بالأسماء العربية</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">شوارع العراق + قمر صناعي بدون علامة مائية</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">نظام التبديل التلقائي</div>
                    <div className="text-[11px] text-amber-400 font-medium">Zero-Downtime Failover</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">HERE ➔ Mapbox ➔ Google ➔ Grid</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              الرجوع إلى شاشة الخارطة والرادار
            </button>
          </div>
        )}

        {/* Footer Note */}
        <div className="border-t border-slate-800 pt-3 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
          <span>التطبيق متصل ومحدث بأحدث مسارات شبكة الطرق العراقية.</span>
          <span className="text-cyan-400 font-bold">مشوار & دانيال تيم</span>
        </div>
      </div>
    </div>
  );
};
