import React from 'react';
import { Trip } from '../../types';
import {
  FileCheck,
  Download,
  Share2,
  CheckCircle2,
  Car,
  MapPin,
  Calendar,
  Clock,
  Printer,
  ShieldCheck,
  QrCode,
  X,
  CreditCard,
  Banknote
} from 'lucide-react';
import { motion } from 'motion/react';

interface TripReceiptModalProps {
  trip: Trip;
  onClose: () => void;
}

export const TripReceiptModal: React.FC<TripReceiptModalProps> = ({ trip, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `وصل رحلة مشوار العراق - رقم المشوار: ${trip.id}\nمن: ${trip.pickup.name}\nإلى: ${trip.dropoff.name}\nالأجرة: ${trip.totalPriceIQD.toLocaleString()} د.ع\nالكابتن: ${trip.driver?.name || 'كابتن معتمد'}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-right flex flex-col gap-4 text-slate-200"
      >
        {/* Header with Iraqi Crest styling */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg">
              🚕
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">وصل رحلة رسمي معتمد</h3>
              <span className="text-[10px] text-amber-400 font-mono">
                رقم الفاتورة: INV-{trip.id.replace('TRP-', '')}-IQ
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Official Iraqi Badge & Timestamp */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">تاريخ المشوار:</span>
            <span className="font-bold text-slate-200 font-mono">{trip.createdAt}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">فئة الخدمة:</span>
            <span className="font-bold text-amber-400 uppercase">{trip.tier}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">طريقة الدفع:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              {trip.paymentMethod === 'zaincash' && 'محفظة زين كاش (ZainCash)'}
              {trip.paymentMethod === 'fastpay' && 'محفظة فاست بي (FastPay)'}
              {trip.paymentMethod === 'cash' && 'نقدي كاش (Cash)'}
            </span>
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-2.5 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 mt-0.5 shrink-0"></div>
            <div>
              <span className="text-[10px] text-slate-400 block">نقطة الانطلاق:</span>
              <span className="font-bold text-slate-200">{trip.pickup.name} ({trip.pickup.district})</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-3 h-3 rounded-full bg-rose-400 mt-0.5 shrink-0"></div>
            <div>
              <span className="text-[10px] text-slate-400 block">الوجهة المقصودة:</span>
              <span className="font-bold text-slate-200">{trip.dropoff.name} ({trip.dropoff.district})</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>المسافة المقطوعة: <b className="text-slate-200 font-mono">{trip.distanceKm} كم</b></span>
            <span>المدة التقديرية: <b className="text-slate-200 font-mono">{trip.estimatedMinutes} دقيقة</b></span>
          </div>
        </div>

        {/* Driver Snapshot */}
        {trip.driver && (
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <img
                src={trip.driver.avatar}
                alt={trip.driver.name}
                className="w-10 h-10 rounded-xl object-cover border border-amber-500/30"
              />
              <div>
                <span className="font-bold text-xs text-slate-200 block">{trip.driver.name}</span>
                <span className="text-[10px] text-slate-400">
                  {trip.driver.car.make} {trip.driver.car.model} • {trip.driver.car.plateNumber}
                </span>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-bold">★ {trip.driver.rating}</span>
          </div>
        )}

        {/* Financial Breakdown Table */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>فتح العداد الأساسي:</span>
            <span className="font-mono text-slate-200">1,500 د.ع</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>أجرة المسافة ({trip.distanceKm} كم):</span>
            <span className="font-mono text-slate-200">
              {Math.max(1000, Math.round(trip.distanceKm * 650)).toLocaleString()} د.ع
            </span>
          </div>
          {trip.surgeMultiplier > 1.0 && (
            <div className="flex justify-between text-amber-400">
              <span>تسعير أوقات الذروة ({trip.surgeMultiplier}x):</span>
              <span className="font-mono">
                +{(Math.round(trip.totalPriceIQD * (1 - 1 / trip.surgeMultiplier))).toLocaleString()} د.ع
              </span>
            </div>
          )}
          {trip.tipAmountIQD && trip.tipAmountIQD > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>إكرامية الكابتن:</span>
              <span className="font-mono">+{trip.tipAmountIQD.toLocaleString()} د.ع</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-extrabold">
            <span className="text-slate-100">المبلغ الإجمالي المدفوع:</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {trip.totalPriceIQD.toLocaleString()} <span className="text-xs">د.ع</span>
            </span>
          </div>
        </div>

        {/* Official Stamp & QR Code */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] font-bold text-slate-300 block">مرخص من النقل والمرور العراقي</span>
              <span className="text-[9px] text-slate-500 font-mono">Digital Signature ID: #IQ-8849-OK</span>
            </div>
          </div>
          <div className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleShareWhatsApp}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة عبر واتساب</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الوصل</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
