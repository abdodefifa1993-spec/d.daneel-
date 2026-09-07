import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SupportTicket, DriverDocument } from '../../types';
import {
  LifeBuoy,
  MessageSquare,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  User,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const SupportDashboard: React.FC = () => {
  const { supportTickets, addSupportMessage, resolveTicket, playAudioCue } = useApp();

  const [activeTab, setActiveTab] = useState<'tickets' | 'documents' | 'refunds'>('tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(supportTickets[0]?.id || '');
  const [replyText, setReplyText] = useState('');

  // Driver Verification Documents state
  const [documents, setDocuments] = useState<DriverDocument[]>([
    {
      id: 'DOC-1',
      driverId: 'drv-1',
      type: 'driver_license',
      title: 'إجازة سوق عمومي نافذة',
      status: 'APPROVED',
      expiryDate: '2028-11-20',
      documentNumber: 'IQ-DL-992182'
    },
    {
      id: 'DOC-2',
      driverId: 'drv-2',
      type: 'car_registration',
      title: 'سنوية المركبة (أجرة بغداد)',
      status: 'PENDING',
      expiryDate: '2027-05-14',
      documentNumber: 'IQ-REG-55421'
    },
    {
      id: 'DOC-3',
      driverId: 'drv-3',
      type: 'security_clearance',
      title: 'شهادة عدم محكومية وتصريح أمني',
      status: 'PENDING',
      expiryDate: '2026-12-31',
      documentNumber: 'SEC-IQ-88129'
    }
  ]);

  // Refund requests
  const [refundRequests, setRefundRequests] = useState([
    {
      id: 'REF-101',
      passenger: 'فاطمة الحسن',
      phone: '07701234567',
      amountIQD: 4500,
      reason: 'إلغاء الرحلة بسبب تأخر السائق لأكثر من 15 دقيقة',
      gateway: 'ZainCash',
      status: 'PENDING'
    },
    {
      id: 'REF-102',
      passenger: 'أحمد شاكر',
      phone: '07809988776',
      amountIQD: 7000,
      reason: 'خصم مضاعف من محفظة التطبيق لرحلة واحدة',
      gateway: 'App Wallet',
      status: 'PENDING'
    }
  ]);

  const selectedTicket = supportTickets.find(t => t.id === selectedTicketId) || supportTickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    addSupportMessage(selectedTicket.id, replyText, 'agent');
    setReplyText('');
    playAudioCue('success');
  };

  const handleDocumentAction = (docId: string, status: 'APPROVED' | 'REJECTED') => {
    setDocuments(prev => prev.map(d => (d.id === docId ? { ...d, status } : d)));
    playAudioCue('success');
  };

  const handleApproveRefund = (refId: string) => {
    setRefundRequests(prev =>
      prev.map(r => (r.id === refId ? { ...r, status: 'APPROVED' } : r))
    );
    playAudioCue('success');
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">لوحة الدعم الفني وتدقيق الوثائق (Support & Verification)</h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                TIER 2 SUPPORT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              تذاكر الدعم المباشرة، اعتماد وثائق الكباتن الرسمية ومعالجة طلبات استرجاع الأموال
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'tickets' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>تذاكر الدعم</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'documents' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>تدقيق الوثائق</span>
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'refunds' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>استرجاع الأموال</span>
          </button>
        </div>
      </div>

      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[550px]">
          {/* Tickets List (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 mb-2 px-1">التذاكر النشطة</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {supportTickets.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-right p-3 rounded-xl border transition-all ${
                    selectedTicket?.id === t.id
                      ? 'bg-amber-500/10 border-amber-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <span className="font-bold text-white">{t.userName}</span>
                    <span className="text-slate-500 font-mono">{t.createdAt}</span>
                  </div>
                  <p className="text-xs font-medium truncate">{t.subject}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        t.priority === 'urgent'
                          ? 'bg-red-500/20 text-red-400'
                          : t.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        t.status === 'resolved' ? 'text-emerald-400' : 'text-blue-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Messages View & Reply (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
            {selectedTicket ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">{selectedTicket.subject}</h2>
                    <div className="text-[11px] text-slate-400">
                      المستخدم: {selectedTicket.userName} ({selectedTicket.userRole === 'driver' ? 'كابتن' : 'راكب'})
                    </div>
                  </div>
                  {selectedTicket.status !== 'resolved' && (
                    <button
                      onClick={() => resolveTicket(selectedTicket.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                    >
                      إغلاق التذكرة بنجاح
                    </button>
                  )}
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 mb-3">
                  {selectedTicket.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${m.sender === 'agent' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs ${
                          m.sender === 'agent'
                            ? 'bg-amber-500 text-slate-950 font-medium'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 px-1">{m.time}</span>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="اكتب رد الدعم الفني هنا..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-2.5 rounded-xl font-bold transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                اختر تذكرة لعرض التفاصيل
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-white">اعتماد وتدقيق وثائق الكباتن الرسمية</h2>
              <p className="text-xs text-slate-400">فحص هوية الأحوال، إجازة السوق، سنوية السيارة وعدم المحكومية</p>
            </div>
            <span className="text-xs text-amber-400 font-bold">
              {documents.filter(d => d.status === 'PENDING').length} وثيقة بانتظار الفحص
            </span>
          </div>

          <div className="space-y-3">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-2">
                      <span>{doc.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">({doc.documentNumber})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      تاريخ النفاذ: {doc.expiryDate} • معرف السائق: {doc.driverId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleDocumentAction(doc.id, 'APPROVED')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                      >
                        قبول واعتماد
                      </button>
                      <button
                        onClick={() => handleDocumentAction(doc.id, 'REJECTED')}
                        className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                      >
                        رفض
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl ${
                        doc.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {doc.status === 'APPROVED' ? 'تمت الموافقة ✓' : 'مرفوض ✗'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'refunds' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-white">طلبات استرجاع المبالغ (Refunds Queue)</h2>
              <p className="text-xs text-slate-400">إعادة الرصيد إلى محفظة الراكب أو بوابات الدفع الإلكترونية</p>
            </div>
          </div>

          <div className="space-y-3">
            {refundRequests.map(r => (
              <div
                key={r.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{r.passenger}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({r.phone})</span>
                    <span className="text-amber-400 font-extrabold text-xs">
                      {r.amountIQD.toLocaleString('ar-IQ')} د.ع
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">السبب: {r.reason}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">عبر: {r.gateway}</span>
                </div>

                <div>
                  {r.status === 'PENDING' ? (
                    <button
                      onClick={() => handleApproveRefund(r.id)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                    >
                      موافقة وتحويل فوري
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold">تم تحويل المبلغ ✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
