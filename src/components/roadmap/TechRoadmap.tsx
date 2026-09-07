import React, { useState } from 'react';
import {
  Server,
  Layers,
  Cpu,
  Database,
  Smartphone,
  Globe,
  Shield,
  Zap,
  CheckCircle2,
  FileCode,
  ArrowRight,
  Code2,
  Terminal,
  Compass,
  CreditCard,
  Radio,
  Clock,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react';

export const TechRoadmap: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'stack' | 'database' | 'smart_addresses' | 'phases'>('architecture');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>دليل الهندسة المعمارية وخارطة الطريق 2026</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Microservices & High Scale</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100">
              الهيكلية التقنية الشاملة لمنصة النقل الذكي في العراق 🇮🇶
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              تصميم احترافي فائق القوة يجمع بين أفضل تجارب ‘بلي’ و’كريم’ مع تحسينات متقدمة للبيئة العراقية، معمارية Microservices تتحمل آلاف الطلبات في الثانية، وتكامل مع بوابات ZainCash و FastPay.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          {[
            { id: 'architecture', label: 'معمارية الـ Microservices', icon: Server },
            { id: 'stack', label: 'حزمة التقنيات (Tech Stack)', icon: Layers },
            { id: 'smart_addresses', label: 'محرك العناوين العراقي الذكي', icon: Compass },
            { id: 'database', label: 'قواعد البيانات (PostGIS & Redis)', icon: Database },
            { id: 'phases', label: 'مراحل التنفيذ الزمنية (Phases)', icon: Clock }
          ].map(t => {
            const Icon = t.icon;
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Microservices Architecture Diagram */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-400" />
                <span>هيكلية الخدمات المصغرة (Microservices Architecture Overview)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                فصل الوظائف إلى خدمات مستقلة لضمان عدم توقف النظام عند زيادة الضغط في أوقات الذروة
              </p>
            </div>

            {/* Architecture Visual Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Layer 1: Clients & API Gateway */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs pb-2 border-b border-slate-800">
                  <Smartphone className="w-4 h-4" />
                  <span>1. طبقة التطبيقات والـ Gateway</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200 block">تطبيقات الموبايل (Rider & Driver)</span>
                    <span className="text-[11px] text-slate-400">Flutter / React Native مع WebSockets</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200 block">لوحات التحكم (Admin & Support)</span>
                    <span className="text-[11px] text-slate-400">React + Tailwind + WebSockets HUD</span>
                  </div>
                  <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 text-amber-300">
                    <span className="font-bold block">API Gateway (Kong / Nginx)</span>
                    <span className="text-[10px] text-amber-400/80">Rate Limiting, SSL, Auth Guard, Load Balancer</span>
                  </div>
                </div>
              </div>

              {/* Layer 2: Core Microservices */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-blue-400 font-extrabold text-xs pb-2 border-b border-slate-800">
                  <Cpu className="w-4 h-4" />
                  <span>2. الخدمات المصغرة الأساسية</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200 block">🛰️ Ingestion & Telemetry Service</span>
                    <span className="text-[10px] text-slate-400">Socket.io + Redis Streams (مواقع السيارات كل ثانية)</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200 block">🎯 Matching & Dispatching Engine</span>
                    <span className="text-[10px] text-slate-400">خوارزمية Uber H3 Spatial & Nearest Driver</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200 block">🔥 Dynamic Surge Pricing Service</span>
                    <span className="text-[10px] text-slate-400">حساب معاملات الذروة لمناطق بغداد والمحافظات</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200 block">💳 Iraqi Payments & Wallets</span>
                    <span className="text-[10px] text-slate-400">ZainCash API, FastPay API, Qi Card Webhooks</span>
                  </div>
                </div>
              </div>

              {/* Layer 3: Persistence & Caching */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs pb-2 border-b border-slate-800">
                  <Database className="w-4 h-4" />
                  <span>3. قواعد البيانات والرسائل</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block">PostgreSQL + PostGIS</span>
                    <span className="text-[11px] text-slate-400">حفظ المعاملات، الحسابات، والبيانات الجغرافية</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-rose-400 block">Redis Cluster (In-Memory)</span>
                    <span className="text-[11px] text-slate-400">Geospatial Indexing (GEOADD/GEORADIUS) و Caching</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-purple-400 block">Apache Kafka / RabbitMQ</span>
                    <span className="text-[11px] text-slate-400">طوابير الأحداث (Trip Events, Push, Billing)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Socket.io Real-time Protocol Contract */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>بروتوكول الـ Socket.IO اللحظي (Low-Latency Telemetry Protocol)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">&lt; 80ms Latency</span>
              </div>
              <pre className="bg-slate-900 p-3 rounded-lg text-[11px] text-amber-300 font-mono overflow-x-auto leading-relaxed border border-slate-800" dir="ltr">
{`// 1. Driver transmits location pulse every 2 seconds
socket.emit("driver:telemetry:update", {
  driverId: "drv-102",
  coords: { lat: 33.3135, lng: 44.3540 },
  heading: 145.2,
  speedKmh: 42,
  status: "ONLINE_IDLE" // or "IN_TRIP"
});

// 2. Dispatcher engine assigns trip with 15s lock
socket.emit("trip:dispatch:offer", {
  tripId: "TRP-8821",
  pickup: { name: "مول المنصور", lat: 33.3135, lng: 44.3540 },
  dropoff: { name: "الكرادة داخل", lat: 33.3021, lng: 44.4285 },
  estimatedFareIQD: 8500,
  surgeMultiplier: 1.4,
  expiresInSec: 15
});`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tech Stack Recommendations */}
      {activeTab === 'stack' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Mobile Apps Stack */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-amber-400">
              <Smartphone className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-100">تطبيقات الموبايل (Flutter vs React Native)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">الخيار الموصى به رقم #1: Flutter</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  • أداء 60/120 إطار في الثانية (FPS) ثابت على أجهزة أندرويد الاقتصادية المنتشرة في العراق (Redmi, Infinix, Samsung A Series).
                  <br />• حزمة <code className="text-amber-300">google_maps_flutter</code> ممتازة مع دعم Marker Caching وتحريك سلس لأيقونة السيارة.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-blue-400 block mb-1">الخيار البديل: React Native + Expo</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  • سرعة تطوير عالية ومشاركة كود الـ Typescript المشترك بين لوحات التحكم وتطبيقات الموبايل.
                  <br />• استخدام <code className="text-blue-300">react-native-maps</code> مع Hermes Engine.
                </p>
              </div>
            </div>
          </div>

          {/* Backend Stack */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-emerald-400">
              <Server className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-100">الخلفية البرمجية (Backend Engine)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Node.js (NestJS / Express) + TypeScript</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  • أداء استثنائي في إدارة اتصالات WebSockets طويلة المدى (Long-lived WebSocket connections).
                  <br />• معمارية NestJS المنظمة تسهل كتابة Microservices بنظام الـ Event-Driven.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-purple-400 block mb-1">Go (Golang) لمحرك الـ Spatial Matching</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  • استخدام Go في خدمة مطابقة الكباتن والخرائط (Geohash Spatial Matcher) لتحقيق زمن استجابة أقل من 5 ميلي ثانية واستهلاك ذاكرة ضئيل.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Smart Iraqi Address Engine ("سر الخلطة") */}
      {activeTab === 'smart_addresses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <span className="text-amber-400 font-extrabold text-xs flex items-center gap-1.5 mb-1">
              <Compass className="w-4 h-4" />
              <span>سر تفوق تطبيق ‘بلي’ في العراق</span>
            </span>
            <h3 className="text-base font-black text-slate-100">
              محرك العناوين العراقي الذكي (Smart Pinned Points & Local Slang Engine)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              في شوارع العراق، العناوين الرسمية وأرقام المنازل نادراً ما تُستخدم. يعتمد المواطنون على نقاط دلالية (مثلجات، فلكة، تقاطع، جامع، مدرسة، مستشفى). تم تصميم هذا المحرك لترجمة الأسماء المحلية بدقة إلى إحداثيات GPS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="font-extrabold text-xs text-amber-400 block">
                1. أمثلة نقاط الدلالة المبرمجة جغرافياً في بغداد:
              </span>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span><b>المنصور:</b> تقاطع الرواد، شارع 14 رمضان، قرب مثلجات الرواد، مول بابلون</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span><b>الكرادة:</b> تقاطع المسبح، الكرادة داخل قرب مطعم صمد، ساحة كهرمانة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span><b>زيونة:</b> شارع الربيعي قرب دريم سيتي، ساحة ميسلون</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span><b>الجادرية:</b> بوابة جامعة بغداد البرج، شارع الوزراء</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="font-extrabold text-xs text-blue-400 block">
                2. آلية البحث الهجين (Hybrid Geocoding Pipeline):
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                يتم البحث أولاً في <b>قاعدة بيانات المعالم المحلية (Custom Pinned Points DB)</b>، وإذا لم يُعثر على الاسم يتم التمرير تلقائياً إلى <b>Google Maps Places API (New)</b> مع حصر النطاق الجغرافي داخل حدود جمهورية العراق (<code className="text-amber-300">components=country:iq</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Database Schema DDL */}
      {activeTab === 'database' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>مخطط قواعد البيانات (PostgreSQL + PostGIS Schema)</span>
              </h3>
              <p className="text-xs text-slate-400">جداول الرحلات، السائقين، المحافظ الإلكترونية بالدينار، والمناطق الجغرافية</p>
            </div>
            <button
              onClick={() => copyToClipboard(`-- PostgreSQL + PostGIS Taxi Schema DDL`, 'sql')}
              className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 font-bold"
            >
              {copiedSnippet === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>نسخ الكود</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-400 font-mono overflow-x-auto leading-relaxed border border-slate-800" dir="ltr">
{`-- Enable PostGIS Extension for High-Performance Spatial Queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. DRIVERS TABLE
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    car_plate_number VARCHAR(30) NOT NULL, -- e.g. 'بغداد 63921 خصوصي'
    car_model VARCHAR(50) NOT NULL,
    tier VARCHAR(20) DEFAULT 'economy', -- economy, comfort_vip, women_taxi
    wallet_balance_iqd NUMERIC(14, 2) DEFAULT 0.00,
    current_location GEOMETRY(Point, 4326),
    rating NUMERIC(3, 2) DEFAULT 5.00,
    is_online BOOLEAN DEFAULT false,
    kyc_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial Index for finding nearest drivers in < 2ms
CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);

-- 2. TRIPS TABLE
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID NOT NULL,
    driver_id UUID REFERENCES drivers(id),
    city_id VARCHAR(30) NOT NULL, -- baghdad, erbil, basra
    pickup_location GEOMETRY(Point, 4326) NOT NULL,
    dropoff_location GEOMETRY(Point, 4326) NOT NULL,
    pickup_address_text TEXT NOT NULL,
    dropoff_address_text TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'SEARCHING_DRIVER',
    tier VARCHAR(20) NOT NULL,
    base_fare_iqd NUMERIC(10, 2) NOT NULL,
    surge_multiplier NUMERIC(3, 2) DEFAULT 1.00,
    total_fare_iqd NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- cash, zaincash, fastpay, qi_card
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
          </pre>
        </div>
      )}

      {/* Tab 5: Implementation Roadmap Phases */}
      {activeTab === 'phases' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>خارطة طريق التنفيذ المرحلي للمشروع (Execution Timeline)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              جدول زمني مقترح من 4 مراحل لإطلاق منصة نقل ذكي بمستوى إنتاجي عالمي
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Phase 1 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400">المرحلة الأولى: الأساس وإطلاق الـ MVP</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">الأسابيع 1 - 6</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                • بناء واجهات تطبيق الراكب والكابتن (Flutter).
                <br />• إنشاء خادم Socket.IO التتبعي وقاعدة بيانات PostgreSQL + PostGIS.
                <br />• تجربة أولية لطلب الرحلات والدفع النقدي في بغداد (الكرادة والمنصور).
              </p>
            </div>

            {/* Phase 2 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-400">المرحلة الثانية: التوسع والمدفوعات العراقية</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">الأسابيع 7 - 12</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                • الربط المباشر مع بوابات ZainCash و FastPay و Qi Card.
                <br />• إطلاق نظام التسعير الديناميكي للذروة ومناطق الازدحام.
                <br />• إطلاق لوحة تحكم الموظفين والدعم الفوري لحل الشكاوى وتتبع المفقودات.
              </p>
            </div>

            {/* Phase 3 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400">المرحلة الثالثة: الأمان والذكاء الاصطناعي</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">الأسابيع 13 - 18</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                • تفعيل زر الطوارئ SOS والربط مع شرطة النجدة (104).
                <br />• محرك الذكاء الاصطناعي لاقتراح الأماكن الشائعة وتوقع أوقات الذروة مسبقاً.
                <br />• نظام مكافآت الكباتن ونقاط ولاء الركاب.
              </p>
            </div>

            {/* Phase 4 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-400">المرحلة الرابعة: التوسع لكافة محافظات العراق</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">الأسابيع 19 - 24</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                • التوسع الرسمي في أربيل، البصرة، النجف، كربلاء، السليمانية، والموصل.
                <br />• إطلاق خدمات B2B للشركات والفنادق والمطارات بحسابات موحدة.
                <br />• خدمة التوصيل السريع (مشوار إكسبرس) والدراجات النارية.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
