
import React, { useState } from 'react';
import { APP_CONFIG } from '../constants.tsx';

interface HeaderProps {
  view: 'customer' | 'admin' | 'tracking';
  setView: (view: 'customer' | 'admin' | 'tracking') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  appLogo: string | null;
}

const Header: React.FC<HeaderProps> = ({ view, setView, theme, toggleTheme, appLogo }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-md border-b border-gray-200 dark:border-charcoal-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div 
          className="flex items-center cursor-pointer group"
          onClick={() => setView('customer')}
        >
          {/* Container สำหรับโลโก้ที่มีขนาดคงที่เพื่อลดการกระพริบ/ขยับของ UI */}
          <div className="relative h-12 min-w-[120px] flex items-center">
            {appLogo ? (
              <img 
                src={appLogo} 
                alt="FastPrint Online" 
                className="h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
              />
            ) : !logoError ? (
              <img 
                src={theme === 'dark' ? "https://img5.pic.in.th/file/secure-sv1/fastprint-logo-custom.png" : "https://img5.pic.in.th/file/secure-sv1/fastprint-logo-custom.png"} 
                alt="FastPrint Online" 
                className={`h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105 ${theme === 'light' ? 'filter invert' : ''}`}
                onError={() => {
                  console.warn("Logo failed to load, switching to fallback");
                  setLogoError(true);
                }}
              />
            ) : (
              // โลโก้สำรอง (Fallback) ที่สวยงามและเข้ากับแบรนด์
              <div className="flex items-center space-x-3 animate-fade-in">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:bg-blue-500 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">FastPrint</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Online</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-2 text-sm font-semibold">
            {[
              { id: 'customer', label: 'สั่งปริ้นงาน' },
              { id: 'tracking', label: 'ติดตามสถานะ' },
              { id: 'admin', label: 'สำหรับร้านค้า' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  view === item.id 
                  ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-charcoal-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-gray-200 dark:border-charcoal-600"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <div className="md:hidden">
            <select 
              className="bg-gray-100 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={view}
              onChange={(e) => setView(e.target.value as any)}
            >
              <option value="customer">สั่งปริ้น</option>
              <option value="tracking">ติดตาม</option>
              <option value="admin">หลังบ้าน</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
