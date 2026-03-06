
import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '12121') {
      onLogin();
    } else {
      setError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      setPassword('');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 animate-fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-charcoal-800 p-10 rounded-3xl shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-charcoal-700">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl dark:shadow-blue-900/20 border border-blue-100 dark:border-blue-500/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">สำหรับร้านค้า</h2>
          <p className="text-gray-400 dark:text-charcoal-500 text-sm mt-2 font-bold uppercase tracking-widest">Management Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-400 dark:text-charcoal-500 uppercase tracking-widest ml-1">Admin Password</label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={`w-full px-6 py-4 bg-gray-50 dark:bg-charcoal-900 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 ${error ? 'border-red-500/50 bg-red-50 dark:bg-red-950/10' : 'border-gray-200 dark:border-charcoal-700 group-hover:border-gray-300 dark:group-hover:border-charcoal-600'}`}
                placeholder="กรอกรหัสผ่านเพื่อเข้าใช้งาน"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-charcoal-600 hover:text-gray-600 dark:hover:text-white transition"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.976 9.976 0 012.146-3.525m7.83-1.474a4.773 4.773 0 00-1.213-.132A4.815 4.815 0 008 12.07m3.999-1.93a4.87 4.87 0 011.59 1.59m3.954 3.954A9.97 9.97 0 0121.542 12c-1.274-4.057-5.064-7-9.542-7-1.274 0-2.483.257-3.59.721m7.127 7.127l-7.127-7.127" /></svg>
                )}
              </button>
            </div>
            {error && <p className="text-red-600 dark:text-red-500 text-xs mt-2 font-bold italic pl-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/40 transition-all duration-300 transform active:scale-[0.98] uppercase tracking-[0.2em] text-sm"
          >
            เข้าสู่ระบบร้านค้า
          </button>
        </form>

        <div className="mt-10 text-center border-t border-gray-100 dark:border-charcoal-700 pt-8">
            <p className="text-[10px] text-gray-400 dark:text-charcoal-600 font-bold uppercase tracking-widest">Forgot Password? Contact Support.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
