
import React, { useState, useEffect, useMemo } from 'react';
import { PrintOrder, OrderStatus, Expense, IncomeEntry, PaymentMethod } from '../types';
import { GoogleService } from '../services/googleService';

interface AdminDashboardProps {
  orders: PrintOrder[];
  onUpdateStatus: (id: string, status: OrderStatus, price?: number) => void;
  onLogout: () => void;
  shopQrCode: string | null;
  onUpdateQrCode: (base64: string | null) => void;
  appLogo: string | null;
  onUpdateLogo: (base64: string | null) => void;
  onRefresh: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, onUpdateStatus, onLogout, shopQrCode, onUpdateQrCode, appLogo, onUpdateLogo, onRefresh }) => {
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  
  // Accounting State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<string>('');

  const [manualIncomes, setManualIncomes] = useState<IncomeEntry[]>([]);
  const [newIncomeDesc, setNewIncomeDesc] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState<string>('');

  const [summaryType, setSummaryType] = useState<'daily' | 'monthly'>('daily');
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
       const data = await GoogleService.fetchAll();
       if (data && data.accounting) {
         const exp = data.accounting.filter((i: any) => i.type === 'EXPENSE');
         const inc = data.accounting.filter((i: any) => i.type === 'INCOME');
         setExpenses(exp);
         setManualIncomes(inc);
       }
    };
    fetchData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || !newExpenseAmount) return;
    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      description: newExpenseDesc,
      amount: parseFloat(newExpenseAmount),
      date: new Date().toISOString()
    };
    await GoogleService.addRecord('EXPENSE', expense);
    setExpenses([expense, ...expenses]);
    setNewExpenseDesc('');
    setNewExpenseAmount('');
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncomeDesc || !newIncomeAmount) return;
    const income: IncomeEntry = {
      id: Math.random().toString(36).substr(2, 9),
      description: newIncomeDesc,
      amount: parseFloat(newIncomeAmount),
      date: new Date().toISOString()
    };
    await GoogleService.addRecord('INCOME', income);
    setManualIncomes([income, ...manualIncomes]);
    setNewIncomeDesc('');
    setNewIncomeAmount('');
  };

  const removeExpense = (id: string) => {
    if(window.confirm('ฟีเจอร์ลบต้องดำเนินการใน Google Sheets โดยตรงเพื่อความปลอดภัย')) return;
  };

  const removeIncome = (id: string) => {
    if(window.confirm('ฟีเจอร์ลบต้องดำเนินการใน Google Sheets โดยตรงเพื่อความปลอดภัย')) return;
  };

  // Memoized Summarized Data
  const summaryData = useMemo(() => {
    const data: Record<string, { income: number; expense: number }> = {};
    orders
      .filter(o => [OrderStatus.PAID, OrderStatus.PRINTING, OrderStatus.COMPLETED].includes(o.status))
      .forEach(o => {
        const date = new Date(o.createdAt);
        const key = summaryType === 'daily' 
          ? date.toLocaleDateString('th-TH') 
          : `${date.getMonth() + 1}/${date.getFullYear() + 543}`;
        if (!data[key]) data[key] = { income: 0, expense: 0 };
        data[key].income += Number(o.totalPrice) || 0;
      });

    manualIncomes.forEach(i => {
      const date = new Date(i.date);
      const key = summaryType === 'daily' ? date.toLocaleDateString('th-TH') : `${date.getMonth() + 1}/${date.getFullYear() + 543}`;
      if (!data[key]) data[key] = { income: 0, expense: 0 };
      data[key].income += Number(i.amount);
    });

    expenses.forEach(e => {
      const date = new Date(e.date);
      const key = summaryType === 'daily' ? date.toLocaleDateString('th-TH') : `${date.getMonth() + 1}/${date.getFullYear() + 543}`;
      if (!data[key]) data[key] = { income: 0, expense: 0 };
      data[key].expense += Number(e.amount);
    });

    return Object.entries(data)
      .map(([period, values]) => ({ period, ...values, profit: values.income - values.expense }))
      .sort((a, b) => b.period.localeCompare(a.period));
  }, [orders, manualIncomes, expenses, summaryType]);

  const exportToExcel = () => {
    const headers = ["ช่วงเวลา", "รายรับทั้งหมด", "รายจ่ายทั้งหมด", "กำไร/ขาดทุน"];
    const csvRows = summaryData.map(d => [d.period, d.income.toFixed(2), d.expense.toFixed(2), d.profit.toFixed(2)]);
    const csvContent = "\uFEFF" + [headers, ...csvRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FastPrint_Report_${summaryType}.csv`);
    link.click();
  };

  const exportOrdersToCsv = () => {
    const headers = ["ID", "วันที่", "ลูกค้า", "เบอร์โทร", "ชื่อไฟล์", "ขนาดกระดาษ", "สี/ขาวดำ", "ประเภทกระดาษ", "จำนวนชุด", "ราคา", "สถานะ", "โน้ต"];
    const csvRows = filteredAndSortedOrders.map(o => [
      `"${o.id}"`,
      `"${new Date(o.createdAt).toLocaleString('th-TH')}"`,
      `"${o.customerName}"`,
      `"${o.phoneNumber}"`,
      `"${o.fileName}"`,
      `"${o.paperSize}"`,
      `"${o.printColor}"`,
      `"${o.paperType}"`,
      o.copies,
      o.totalPrice,
      `"${o.status}"`,
      `"${(o.note || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers, ...csvRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FastPrint_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const orderRevenue = orders
    .filter(o => [OrderStatus.PAID, OrderStatus.PRINTING, OrderStatus.COMPLETED].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  
  const manualRevenue = manualIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalRevenue = orderRevenue + manualRevenue;
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const profit = totalRevenue - totalExpenses;

  const stats = [
    { name: 'รอราคา', value: orders.filter(o => o.status === OrderStatus.AWAITING_PRICING).length, color: '#94A3B8' },
    { name: 'รอจ่าย', value: orders.filter(o => o.status === OrderStatus.AWAITING_PAYMENT).length, color: '#F59E0B' },
    { name: 'กำลังปริ้น', value: orders.filter(o => o.status === OrderStatus.PRINTING).length, color: '#3B82F6' },
    { name: 'สำเร็จ', value: orders.filter(o => o.status === OrderStatus.COMPLETED).length, color: '#10B981' },
    { name: 'ยกเลิก', value: orders.filter(o => o.status === OrderStatus.CANCELLED).length, color: '#EF4444' },
  ];

  const filteredAndSortedOrders = useMemo(() => {
    return orders
      .filter(o => filter === 'ALL' || o.status === filter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, filter]);

  return (
    <div className="space-y-10 animate-fade-in pb-12 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">แผงควบคุมหลังบ้าน</h1>
          <button onClick={onRefresh} className="text-xs text-blue-600 dark:text-blue-500 hover:underline flex items-center mt-2">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ดึงข้อมูลล่าสุดจาก Google Sheets
          </button>
          <p className="text-[9px] text-gray-400 mt-1 italic">
            *หากไม่เห็นสลิปหรือข้อมูลใหม่ กรุณาอัปเดตโค้ดใน Google Apps Script และเพิ่มคอลัมน์ paymentMethod, slipUrl ในชีต Orders
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full md:w-auto">
          <button 
            onClick={() => { setShowAccount(!showAccount); setShowSettings(false); }} 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-md ${showAccount ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-white dark:bg-charcoal-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-charcoal-700 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            บัญชี
          </button>
          <button 
            onClick={() => { setShowSettings(!showSettings); setShowAccount(false); }} 
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-md ${showSettings ? 'bg-blue-600 text-white shadow-blue-900/40' : 'bg-white dark:bg-charcoal-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-charcoal-700 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            ตั้งค่า
          </button>
          <button 
            type="button" 
            onClick={onLogout} 
            className="px-4 py-2 rounded-xl bg-red-600/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/30 text-xs font-bold hover:bg-red-600 hover:text-white transition flex items-center justify-center col-span-2 sm:col-span-1 shadow-md"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            ออกจากระบบ
          </button>
        </div>
      </div>

      {showAccount && (
        <div className="space-y-8 animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl border border-gray-200 dark:border-emerald-900/20 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 -mr-8 -mt-8 rounded-full blur-2xl"></div>
              <p className="text-emerald-600 dark:text-emerald-500 text-xs font-black uppercase tracking-widest mb-2">รายรับทั้งหมด (ออเดอร์+อื่นๆ)</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">฿{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl border border-gray-200 dark:border-red-900/20 shadow-xl relative">
              <p className="text-red-600 dark:text-red-500 text-xs font-black uppercase tracking-widest mb-2">รายจ่ายทั้งหมด</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">฿{totalExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl border border-gray-200 dark:border-blue-900/20 shadow-xl relative">
              <p className="text-blue-600 dark:text-blue-500 text-xs font-black uppercase tracking-widest mb-2">กำไร/ขาดทุน สุทธิ</p>
              <p className={`text-4xl font-bold ${profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>฿{profit.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl border border-gray-200 dark:border-emerald-900/20 shadow-xl">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6">บันทึกรายรับอื่นๆ</h3>
                <form onSubmit={handleAddIncome} className="space-y-4">
                  <input type="text" value={newIncomeDesc} onChange={e => setNewIncomeDesc(e.target.value)} className="w-full px-5 py-4 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-gray-900 dark:text-white outline-none" placeholder="รายการรายรับ" />
                  <input type="number" value={newIncomeAmount} onChange={e => setNewIncomeAmount(e.target.value)} className="w-full px-5 py-4 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-gray-900 dark:text-white outline-none" placeholder="จำนวนเงิน" />
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition">บันทึกรายรับ</button>
                </form>
              </div>
              <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl border border-gray-200 dark:border-red-900/20 shadow-xl">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6">บันทึกรายจ่าย</h3>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <input type="text" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} className="w-full px-5 py-4 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-gray-900 dark:text-white outline-none" placeholder="รายการรายจ่าย" />
                  <input type="number" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} className="w-full px-5 py-4 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-gray-900 dark:text-white outline-none" placeholder="จำนวนเงิน" />
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl transition">บันทึกรายจ่าย</button>
                </form>
              </div>
            </div>

            <div className="bg-white dark:bg-charcoal-800 p-8 rounded-[2.5rem] border border-gray-200 dark:border-blue-900/20 shadow-2xl relative overflow-hidden flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">รายงานสรุป</h3>
                  <div className="flex bg-gray-100 dark:bg-charcoal-900 p-1 rounded-xl">
                    <button onClick={() => setSummaryType('daily')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${summaryType === 'daily' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>DAILY</button>
                    <button onClick={() => setSummaryType('monthly')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${summaryType === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>MONTHLY</button>
                  </div>
               </div>
               <div className="overflow-y-auto max-h-[500px] flex-grow">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-charcoal-900 text-[10px] font-black uppercase text-gray-500 tracking-widest sticky top-0">
                      <tr><th className="px-5 py-3">ช่วงเวลา</th><th className="px-5 py-3 text-right">รายรับ</th><th className="px-5 py-3 text-right">รายจ่าย</th><th className="px-5 py-3 text-right">กำไร</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-charcoal-700/50">
                      {summaryData.map(row => (
                        <tr key={row.period} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition text-xs">
                          <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">{row.period}</td>
                          <td className="px-5 py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">฿{row.income.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right text-red-600 dark:text-red-400 font-bold">฿{row.expense.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right font-black text-blue-600 dark:text-blue-400">฿{row.profit.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
               <button onClick={exportToExcel} className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-xs font-black">ดาวน์โหลดรายงาน (.csv)</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="bg-white dark:bg-charcoal-800 p-8 rounded-3xl border border-gray-200 dark:border-blue-900/20 shadow-xl animate-slide-in">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">ตั้งค่าร้านค้า</h3>
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-64">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">QR Code สำหรับรับชำระเงิน</p>
                <p className="text-xs text-gray-500 mb-4">อัปโหลดรูปภาพ QR Code (PromptPay หรืออื่นๆ) เพื่อให้ลูกค้าสามารถสแกนจ่ายเงินได้หลังจากที่คุณแจ้งราคาแล้ว</p>
                
                <div className="relative group">
                  <div className="w-full aspect-square bg-gray-50 dark:bg-charcoal-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-charcoal-700 flex items-center justify-center overflow-hidden">
                    {shopQrCode ? (
                      <img src={shopQrCode} alt="Shop QR Code" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="w-8 h-8 text-gray-300 dark:text-charcoal-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                        <span className="text-gray-400 dark:text-gray-600 text-[10px] font-bold uppercase tracking-widest">ยังไม่มี QR Code</span>
                      </div>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onUpdateQrCode(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold transition">
                    {shopQrCode ? 'เปลี่ยนรูป QR Code' : 'อัปโหลด QR Code'}
                  </button>
                  {shopQrCode && (
                    <button 
                      onClick={() => onUpdateQrCode(null)}
                      className="w-full bg-red-600/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/30 py-3 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition"
                    >
                      ลบ QR Code
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full md:w-64">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">โลโก้ร้านค้า</p>
                <p className="text-xs text-gray-500 mb-4">อัปโหลดโลโก้ร้านค้าของคุณเพื่อแสดงที่มุมซ้ายบนของเว็บไซต์ แทนที่โลโก้เริ่มต้น</p>
                
                <div className="relative group">
                  <div className="w-full aspect-video bg-gray-50 dark:bg-charcoal-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-charcoal-700 flex items-center justify-center overflow-hidden">
                    {appLogo ? (
                      <img src={appLogo} alt="App Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="w-8 h-8 text-gray-300 dark:text-charcoal-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span className="text-gray-400 dark:text-gray-600 text-[10px] font-bold uppercase tracking-widest">ยังไม่มีโลโก้</span>
                      </div>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onUpdateLogo(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold transition">
                    {appLogo ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'}
                  </button>
                  {appLogo && (
                    <button 
                      onClick={() => onUpdateLogo(null)}
                      className="w-full bg-red-600/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/30 py-3 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition"
                    >
                      ลบโลโก้
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-gray-50 dark:bg-charcoal-900/50 p-6 rounded-2xl border border-gray-200 dark:border-charcoal-700">
                <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">คำแนะนำ</h4>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-3 list-disc pl-4">
                  <li>แนะนำให้ใช้รูปภาพ QR Code ที่มีขนาดจัตุรัส</li>
                  <li>สำหรับโลโก้ แนะนำให้ใช้รูปภาพที่มีพื้นหลังโปร่งใส (PNG) และมีสัดส่วนแนวนอน</li>
                  <li>รูปภาพจะถูกบันทึกไว้ในเบราว์เซอร์นี้ (Local Storage)</li>
                  <li>ลูกค้าจะเห็น QR Code นี้ในหน้า "ติดตามสถานะ" เมื่อคำสั่งซื้ออยู่ในสถานะ "รอชำระเงิน"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        {stats.map(s => (
          <div key={s.name} className="bg-white dark:bg-charcoal-800 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-charcoal-700/50">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{s.name}</p>
            <p className="text-4xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-charcoal-700 overflow-hidden">
        <div className="p-8 border-b border-gray-200 dark:border-charcoal-700 flex flex-col md:flex-row justify-between items-center bg-gray-50 dark:bg-charcoal-700/20 gap-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">รายการคำสั่งซื้อ</h2>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button 
              onClick={exportOrdersToCsv}
              className="px-4 py-3 bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-charcoal-600 transition flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export รายการ
            </button>
            <select className="w-full md:w-56 px-4 py-3 bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-sm text-gray-900 dark:text-white outline-none" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
              <option value="ALL">รายการทั้งหมด</option>
              {Object.values(OrderStatus).map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-charcoal-900 text-gray-400 dark:text-charcoal-500 text-[11px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">ลูกค้า / ข้อมูลไฟล์</th>
                <th className="px-8 py-5">สเปคงาน</th>
                <th className="px-8 py-5">ยอดรวม (฿)</th>
                <th className="px-8 py-5">การชำระเงิน</th>
                <th className="px-8 py-5 text-right">แอคชั่น</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-700/50 text-sm">
              {filteredAndSortedOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-charcoal-700/30 transition">
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-900 dark:text-white">{order.customerName}</div>
                    <div className="text-[10px] text-gray-500 font-medium mb-1">{order.phoneNumber}</div>
                    {order.fileUrl && !order.fileUrl.startsWith('ERROR') ? (
                      <a href={order.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-500 hover:underline flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        {order.fileName}
                      </a>
                    ) : (
                      <div className="text-xs text-red-500 flex flex-col">
                        <span className="font-bold">⚠️ {order.fileName}</span>
                        <span className="text-[10px] opacity-70">{order.fileUrl || 'ไม่พบลิงก์ไฟล์ (กำลังซิงค์...)'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-gray-500 dark:text-gray-400 text-xs">
                    <div>{order.paperSize} • {order.printColor} • {order.copies} ชุด</div>
                    {order.note && (
                      <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-500/80 bg-amber-500/5 px-2 py-1 rounded border border-amber-200 dark:border-amber-500/10 italic">
                        <span className="font-black mr-1">NOTE:</span> {order.note}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {order.status === OrderStatus.AWAITING_PRICING ? (
                      <input type="number" placeholder="0" className="w-20 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded p-1 text-gray-900 dark:text-white" onChange={(e) => setPrices({...prices, [order.id]: parseFloat(e.target.value)})} />
                    ) : <span className="font-bold text-blue-600 dark:text-blue-400">฿{order.totalPrice}</span>}
                  </td>
                  <td className="px-8 py-6">
                    {order.paymentMethod ? (
                      <div className="flex flex-col space-y-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border w-fit ${
                          order.paymentMethod === PaymentMethod.PROMPTPAY 
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}>
                          {order.paymentMethod === PaymentMethod.PROMPTPAY ? 'โอนเงิน' : 'เงินสด'}
                        </span>
                        {order.paymentMethod === PaymentMethod.PROMPTPAY && (
                          order.slipUrl ? (
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => setSelectedSlipUrl(order.slipUrl!)}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center font-bold text-left"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ดูสลิป
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] text-red-400 italic flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              ไม่พบไฟล์สลิป
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 dark:text-charcoal-600 font-bold uppercase tracking-widest italic">ยังไม่ชำระ</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {order.status === OrderStatus.AWAITING_PRICING && (
                      <button onClick={() => onUpdateStatus(order.id, OrderStatus.AWAITING_PAYMENT, prices[order.id])} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white">ส่งราคา</button>
                    )}
                    {order.status === OrderStatus.PAID && (
                      <button onClick={() => onUpdateStatus(order.id, OrderStatus.PRINTING)} className="px-4 py-2 bg-emerald-600 rounded-lg text-xs font-bold text-white">เริ่มพิมพ์</button>
                    )}
                    {order.status === OrderStatus.PRINTING && (
                      <button onClick={() => onUpdateStatus(order.id, OrderStatus.COMPLETED)} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white">เสร็จแล้ว</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Preview Modal */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedSlipUrl(null)}>
          <div className="relative max-w-lg w-full bg-white dark:bg-charcoal-800 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 dark:border-charcoal-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">หลักฐานการโอนเงิน</h3>
              <button onClick={() => setSelectedSlipUrl(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-charcoal-700 rounded-full transition">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-charcoal-900 flex items-center justify-center min-h-[300px]">
              <img 
                src={selectedSlipUrl} 
                alt="Payment Slip" 
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://picsum.photos/seed/error/400/600?blur=2';
                  console.error("Failed to load slip image");
                }}
              />
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href={selectedSlipUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-charcoal-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-charcoal-600 transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                เปิดในหน้าต่างใหม่
              </a>
              <a 
                href={selectedSlipUrl.replace('export=view', 'export=download')} 
                download="payment-slip.jpg"
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                ดาวน์โหลดสลิป
              </a>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default AdminDashboard;
