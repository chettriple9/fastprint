
import React, { useState } from 'react';
import { PrintOrder, OrderStatus, PaymentMethod } from '../types';

interface StatusTrackerProps {
  orderId: string;
  orders: PrintOrder[];
  onSearch: (term: string) => void;
  onPay: (id: string, method: PaymentMethod, slip?: File) => void;
  shopQrCode: string | null;
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ orderId, orders, onSearch, onPay, shopQrCode }) => {
  const [searchQuery, setSearchQuery] = React.useState(orderId);
  const [activePaymentOrderId, setActivePaymentOrderId] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod | null>(null);
  const [slip, setSlip] = React.useState<File | null>(null);

  // Sync local searchQuery with orderId prop when it changes from outside
  React.useEffect(() => {
    if (orderId) {
      setSearchQuery(orderId);
    }
  }, [orderId]);

  const matchingOrders = React.useMemo(() => {
    if (!searchQuery) return [];
    
    const query = searchQuery.trim().toLowerCase();
    const queryClean = query.replace(/[^0-9]/g, '');

    return orders.filter(o => {
      if (!o) return false;
      const phone = String(o.phoneNumber || "").trim().toLowerCase();
      const phoneClean = phone.replace(/[^0-9]/g, '');
      const id = String(o.id || "").trim().toLowerCase();
      
      // Match exact ID, exact phone, or cleaned phone numbers
      return id === query || phone === query || (queryClean && phoneClean === queryClean);
    }).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [orders, searchQuery]);

  const handlePay = (id: string) => {
    if (paymentMethod) {
      onPay(id, paymentMethod, slip || undefined);
      setActivePaymentOrderId(null);
      setPaymentMethod(null);
      setSlip(null);
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.AWAITING_PRICING: return 'กำลังประเมินราคา...';
      case OrderStatus.AWAITING_PAYMENT: return 'รอการชำระเงิน';
      case OrderStatus.PAID: return 'แจ้งชำระเงินแล้ว';
      case OrderStatus.PRINTING: return 'กำลังปริ้นงาน';
      case OrderStatus.COMPLETED: return 'เสร็จสมบูรณ์';
      case OrderStatus.CANCELLED: return 'ยกเลิกแล้ว';
      default: return 'ไม่ระบุ';
    }
  };

  const getStatusStyles = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.COMPLETED: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case OrderStatus.CANCELLED: return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      case OrderStatus.AWAITING_PAYMENT: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case OrderStatus.AWAITING_PRICING: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-gray-100 dark:bg-charcoal-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-charcoal-600';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-charcoal-800 p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-charcoal-700">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ติดตามสถานะงานปริ้น</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">ตรวจสอบความคืบหน้าของงานของคุณได้ตลอดเวลา</p>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 mb-10">
          <div className="relative flex-grow">
            <input 
              type="tel" 
              placeholder="กรอกเบอร์โทรศัพท์มือถือ หรือ เลขที่ออเดอร์"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(searchQuery)}
              className="w-full px-6 py-4 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); onSearch(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <button 
            onClick={() => {
              onSearch(searchQuery);
              // Trigger a global refresh if possible
              window.dispatchEvent(new CustomEvent('refresh-orders'));
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black transition shadow-xl shadow-blue-900/40 uppercase tracking-widest text-sm"
          >
            ค้นหา
          </button>
        </div>

        {matchingOrders.length > 0 ? (
          <div className="space-y-8">
            {matchingOrders.map((order) => (
              <div key={order.id} className={`p-8 rounded-3xl border transition-all duration-300 ${
                order.status === OrderStatus.CANCELLED 
                ? 'bg-gray-50 dark:bg-charcoal-900/50 border-gray-200 dark:border-charcoal-700 opacity-60' 
                : 'bg-gray-50 dark:bg-charcoal-900/30 border-gray-200 dark:border-charcoal-700 hover:border-gray-300 dark:hover:border-charcoal-600 hover:bg-gray-100 dark:hover:bg-charcoal-700/20'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-3 leading-tight">{order.fileName}</p>
                    <p className="text-xs text-gray-400 dark:text-charcoal-500 mt-1 uppercase tracking-tighter">Ordered on {new Date(order.createdAt).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 dark:text-charcoal-500 font-black uppercase tracking-widest mb-1">Order #</p>
                    <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-500">{order.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400 mb-6 bg-white dark:bg-charcoal-800/50 p-5 rounded-2xl border border-gray-100 dark:border-charcoal-700">
                  <div className="space-y-1"><span className="block font-black text-gray-400 dark:text-charcoal-500 uppercase tracking-widest">Size</span> <span className="text-gray-900 dark:text-white font-bold">{order.paperSize}</span></div>
                  <div className="space-y-1"><span className="block font-black text-gray-400 dark:text-charcoal-500 uppercase tracking-widest">Type</span> <span className="text-gray-900 dark:text-white font-bold">{order.printColor === 'Black & White' ? 'ขาวดำ' : 'สี'}</span></div>
                  <div className="col-span-2 space-y-1"><span className="block font-black text-gray-400 dark:text-charcoal-500 uppercase tracking-widest">Paper</span> <span className="text-gray-900 dark:text-white font-bold">{order.paperType}</span></div>
                  <div className="space-y-1"><span className="block font-black text-gray-400 dark:text-charcoal-500 uppercase tracking-widest">Copies</span> <span className="text-gray-900 dark:text-white font-bold">{order.copies} ชุด</span></div>
                  <div className="space-y-1"><span className="block font-black text-gray-400 dark:text-charcoal-500 uppercase tracking-widest">Total Price</span> <span className="text-blue-600 dark:text-blue-400 font-black text-lg">{order.totalPrice > 0 ? `฿${order.totalPrice.toLocaleString()}` : 'รอยืนยัน'}</span></div>
                </div>

                {order.status === OrderStatus.AWAITING_PRICING && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30 text-center">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 animate-pulse italic">ร้านกำลังตรวจสอบไฟล์และประเมินราคา กรุณารอครู่เดียว...</p>
                  </div>
                )}

                {order.status === OrderStatus.AWAITING_PAYMENT && (
                  <div className="space-y-5">
                    {activePaymentOrderId !== order.id ? (
                      <button 
                        onClick={() => { setActivePaymentOrderId(order.id); setPaymentMethod(null); }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-blue-900/40 uppercase tracking-widest text-sm"
                      >
                        ชำระเงิน ฿{order.totalPrice.toLocaleString()}
                      </button>
                    ) : (
                      <div className="space-y-6 pt-2 animate-slide-in">
                        <div className="flex justify-between items-center px-1">
                           <p className="font-black text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest">เลือกวิธีชำระเงิน:</p>
                           <button onClick={() => setActivePaymentOrderId(null)} className="text-xs text-red-600 dark:text-red-500 font-bold hover:underline">ยกเลิก</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setPaymentMethod(PaymentMethod.PROMPTPAY)}
                            className={`p-4 border-2 rounded-2xl transition-all duration-200 flex flex-col items-center ${paymentMethod === PaymentMethod.PROMPTPAY ? 'border-blue-500 bg-blue-500/10' : 'border-gray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-gray-300 dark:hover:border-charcoal-600'}`}
                          >
                            <img src="https://img5.pic.in.th/file/secure-sv1/promptpay-logo.png" className="h-5 mb-3" alt="PromptPay" />
                            <span className="text-[11px] font-black text-gray-900 dark:text-white tracking-widest uppercase">พร้อมเพย์</span>
                          </button>
                          <button 
                            onClick={() => { setPaymentMethod(PaymentMethod.CASH); setSlip(null); }}
                            className={`p-4 border-2 rounded-2xl transition-all duration-200 flex flex-col items-center ${paymentMethod === PaymentMethod.CASH ? 'border-blue-500 bg-blue-500/10' : 'border-gray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-gray-300 dark:hover:border-charcoal-600'}`}
                          >
                            <svg className="w-5 h-5 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                            <span className="text-[11px] font-black text-gray-900 dark:text-white tracking-widest uppercase">เงินสด</span>
                          </button>
                        </div>

                        {paymentMethod === PaymentMethod.PROMPTPAY && (
                          <div className="bg-gray-50 dark:bg-charcoal-800 p-8 rounded-3xl border border-gray-200 dark:border-charcoal-700 space-y-6 animate-slide-in">
                            <div className="flex flex-col items-center">
                               {shopQrCode ? (
                                 <div className="p-3 bg-white rounded-2xl shadow-2xl">
                                    <img src={shopQrCode} alt="PromptPay QR" className="w-48 h-48 object-contain" />
                                 </div>
                               ) : (
                                 <div className="w-48 h-48 bg-white dark:bg-charcoal-900 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-charcoal-700">
                                   <p className="text-[10px] text-gray-400 dark:text-charcoal-600 font-bold text-center px-6">ร้านยังไม่ได้อัปโหลด QR Code พร้อมเพย์</p>
                                 </div>
                               )}
                               <p className="mt-4 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">SCAN TO PAY (฿{order.totalPrice.toLocaleString()})</p>
                            </div>
                            <div className="space-y-3">
                              <label className="block text-[10px] font-black text-gray-400 dark:text-charcoal-500 uppercase tracking-widest ml-1">แนบหลักฐานการโอน (สลิป)</label>
                              <div className="relative overflow-hidden group">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => setSlip(e.target.files?.[0] || null)}
                                  className="w-full text-xs text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:bg-blue-600/10 file:text-blue-600 dark:text-blue-400 cursor-pointer"
                                />
                                {slip && (
                                  <div className="mt-3 relative w-24 h-32 rounded-lg overflow-hidden border-2 border-blue-500/30 shadow-lg">
                                    <img 
                                      src={URL.createObjectURL(slip)} 
                                      className="w-full h-full object-cover" 
                                      alt="Slip Preview"
                                    />
                                    <button 
                                      onClick={() => setSlip(null)}
                                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <button 
                          disabled={!paymentMethod || (paymentMethod === PaymentMethod.PROMPTPAY && !slip)}
                          onClick={() => handlePay(order.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/30 transition disabled:opacity-10 uppercase tracking-widest text-sm"
                        >
                          {paymentMethod === PaymentMethod.CASH ? "ยืนยันจะชำระเงินสด" : "ส่งหลักฐานการชำระเงิน"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {order.status === OrderStatus.PAID && (
                   <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                     <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✅ แจ้งโอนสำเร็จ! รอดำเนินการพิมพ์งาน...</p>
                     {order.slipUrl && (
                       <button 
                         onClick={() => window.open(order.slipUrl, '_blank')}
                         className="mt-3 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center mx-auto font-black uppercase tracking-widest"
                       >
                         <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                         ดูสลิปที่ส่งไป
                       </button>
                     )}
                   </div>
                )}

                {order.status === OrderStatus.COMPLETED && (
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/30 text-center animate-pulse shadow-lg shadow-blue-900/20">
                     <p className="text-lg font-black text-blue-600 dark:text-blue-400">🔥 งานของคุณพร้อมรับแล้ว!</p>
                     <p className="text-xs text-blue-600/50 dark:text-blue-200/50 mt-1">กรุณามารับงานที่ร้านภายในวันและเวลาทำการ</p>
                   </div>
                )}

                {order.status === OrderStatus.CANCELLED && (
                   <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
                     <p className="text-xs font-bold text-red-600 dark:text-red-400">❌ รายการนี้ถูกยกเลิกแล้ว</p>
                   </div>
                )}
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-charcoal-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-charcoal-700">
            <p className="text-gray-400 dark:text-charcoal-500 italic font-medium">ไม่พบข้อมูลคำสั่งซื้อ... กรุณาตรวจสอบเบอร์โทรศัพท์อีกครั้ง</p>
          </div>
        ) : (
          <div className="text-center py-24 text-gray-300 dark:text-charcoal-700 border-2 border-dashed border-gray-200 dark:border-charcoal-800 rounded-[3rem]">
            <div className="w-20 h-20 bg-gray-50 dark:bg-charcoal-800/50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <p className="text-lg font-bold tracking-tight text-gray-400 dark:text-charcoal-700">ค้นหาสถานะงานของคุณได้ทันที</p>
          </div>
        )}
      </div>
    </div>

  );
};

export default StatusTracker;
