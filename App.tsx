
import React, { useState, useEffect } from 'react';
import { 
  OrderStatus, 
  PrintOrder, 
  PaymentMethod 
} from './types';
import { APP_CONFIG, UI_STRINGS } from './constants.tsx';
import Header from './components/Header';
import OrderForm from './components/OrderForm';
import AdminDashboard from './components/AdminDashboard';
import StatusTracker from './components/StatusTracker';
import AdminLogin from './components/AdminLogin';
import { GoogleService } from './services/googleService';

const App: React.FC = () => {
  const [view, setView] = useState<'customer' | 'admin' | 'tracking'>('customer');
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [currentTrackingQuery, setCurrentTrackingQuery] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [shopQrCode, setShopQrCode] = useState<string | null>(null);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await GoogleService.fetchAll();
      if (data) {
        if (data.error) {
          throw new Error(data.error);
        }
        if (data.orders) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      } else {
        setError("ไม่ได้รับข้อมูลจาก Google Apps Script: กรุณาตรวจสอบว่าคุณได้ Deploy เป็น 'Anyone' และนำ URL มาใส่ใน constants.tsx แล้ว");
        console.warn("No data returned from Google Service.");
      }
    } catch (e: any) {
      console.error("Connection error:", e);
      setError(e.message || "ไม่สามารถเชื่อมต่อ Google Apps Script ได้: กรุณาตรวจสอบว่าคุณได้ Deploy เป็น 'Anyone' และ URL ถูกต้อง");
      
      // Fallback to local storage if available
      const saved = localStorage.getItem('fastprint_orders');
      if (saved) {
        try {
          setOrders(JSON.parse(saved));
        } catch (parseError) {
          console.error("Failed to parse saved orders", parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const handleRefresh = () => refreshData();
    window.addEventListener('refresh-orders', handleRefresh);

    const savedQr = localStorage.getItem('fastprint_shop_qr');
    if (savedQr) setShopQrCode(savedQr);
    
    const savedLogo = localStorage.getItem('fastprint_app_logo');
    if (savedLogo) setAppLogo(savedLogo);

    if (sessionStorage.getItem('admin_auth') === 'true') setIsAdminAuthenticated(true);

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => window.removeEventListener('refresh-orders', handleRefresh);
  }, []);

  const saveOrder = async (newOrder: PrintOrder, fileBase64: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await GoogleService.createOrder(newOrder, fileBase64);
      if (result && result.fileUrl) {
        newOrder.fileUrl = result.fileUrl;
      }
      setOrders(prev => [newOrder, ...prev]);
      // Save to local storage as backup
      const currentOrders = [newOrder, ...orders];
      localStorage.setItem('fastprint_orders', JSON.stringify(currentOrders.slice(0, 50)));
      return true;
    } catch (e: any) {
      setError(e.message || "บันทึกข้อมูลไม่สำเร็จ: ตรวจสอบสิทธิ์การเข้าถึงโฟลเดอร์ใน Google Drive");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, price?: number) => {
    setIsLoading(true);
    try {
      await GoogleService.updateOrderStatus(id, status, price);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status, totalPrice: price ?? o.totalPrice } : o));
    } catch (e) {
      setError("อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerPayment = async (id: string, method: PaymentMethod, slip?: File) => {
    setIsLoading(true);
    try {
      let slipData = '';
      if (slip) {
        slipData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(slip);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      }

      const result = await GoogleService.updateOrderStatus(id, OrderStatus.PAID, undefined, method, slipData);
      const serverSlipUrl = result?.slipUrl;
      
      setOrders(prev => prev.map(o => o.id === id ? { 
        ...o, 
        status: OrderStatus.PAID, 
        paymentMethod: method,
        slipUrl: serverSlipUrl || o.slipUrl 
      } : o));
      
      if (!serverSlipUrl) {
        refreshData(); // Fallback to full refresh if URL wasn't returned
      }
    } catch (e) {
      setError("แจ้งชำระเงินไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQrCode = (base64Image: string | null) => {
    setShopQrCode(base64Image);
    if (base64Image) {
      localStorage.setItem('fastprint_shop_qr', base64Image);
    } else {
      localStorage.removeItem('fastprint_shop_qr');
    }
  };

  const handleUpdateLogo = (base64Image: string | null) => {
    setAppLogo(base64Image);
    if (base64Image) {
      localStorage.setItem('fastprint_app_logo', base64Image);
    } else {
      localStorage.removeItem('fastprint_app_logo');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-[var(--text-primary)] bg-[var(--bg-primary)] dark:text-gray-100 dark:bg-charcoal-900 transition-colors duration-300">
      <Header view={view} setView={setView} theme={theme} toggleTheme={toggleTheme} appLogo={appLogo} />
      
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center backdrop-blur-sm">
           <div className="bg-charcoal-800 p-8 rounded-3xl border border-charcoal-700 flex flex-col items-center shadow-2xl">
              <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-white font-bold animate-pulse">กำลังซิงค์ข้อมูลกับ Google...</p>
           </div>
        </div>
      )}

      {error && (
        <div className="bg-red-600/20 border-b border-red-500/50 p-4 text-center sticky top-[72px] z-40 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex items-center justify-center px-4">
            <p className="text-red-400 text-sm font-bold flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{error}</span>
            </p>
            <button onClick={refreshData} className="ml-4 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition">ลองใหม่</button>
            <button onClick={() => setError(null)} className="ml-2 text-gray-500 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {view === 'customer' && (
          <div className="animate-fade-in text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{UI_STRINGS.header}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-12 text-lg">ส่งไฟล์ประเมินราคา รับงานปริ้นคุณภาพสูงในราคาเป็นกันเอง</p>
            <OrderForm onOrderComplete={async (order, fileBase64) => {
              const success = await saveOrder(order, fileBase64!);
              if (success) {
                setCurrentTrackingQuery(order.phoneNumber);
                setView('tracking');
              }
            }} />
          </div>
        )}

        {view === 'tracking' && (
          <StatusTracker 
            orderId={currentTrackingQuery} 
            orders={orders} 
            onSearch={setCurrentTrackingQuery}
            onPay={handleCustomerPayment}
            shopQrCode={shopQrCode}
          />
        )}

        {view === 'admin' && (
          !isAdminAuthenticated ? (
            <AdminLogin onLogin={() => { setIsAdminAuthenticated(true); sessionStorage.setItem('admin_auth', 'true'); }} />
          ) : (
            <AdminDashboard 
              orders={orders} 
              onUpdateStatus={updateOrderStatus} 
              onLogout={() => { setIsAdminAuthenticated(false); sessionStorage.removeItem('admin_auth'); setView('customer'); }}
              shopQrCode={shopQrCode}
              onUpdateQrCode={handleUpdateQrCode}
              appLogo={appLogo}
              onUpdateLogo={handleUpdateLogo}
              onRefresh={refreshData}
            />
          )
        )}
      </main>

      <footer className="bg-charcoal-800 border-t border-charcoal-700 py-10 text-center text-gray-500 text-sm mt-12">
        <p className="font-medium text-gray-400">© 2026 {APP_CONFIG.appName}.</p>
        <div className="mt-2 flex items-center justify-center space-x-2 text-xs opacity-50 italic">
          <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
          <span>{error ? 'Disconnected' : 'Connected to Cloud'}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
