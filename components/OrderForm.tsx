
import React, { useState } from 'react';
import { PaperSize, PaperType, PrintColor, OrderStatus, PrintOrder } from '../types';

interface OrderFormProps {
  onOrderComplete: (order: PrintOrder, fileBase64?: string) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onOrderComplete }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paperSize, setPaperSize] = useState<PaperSize>(PaperSize.A4);
  const [paperType, setPaperType] = useState<PaperType>(PaperType.BOND);
  const [printColor, setPrintColor] = useState<PrintColor>(PrintColor.BW);
  const [copies, setCopies] = useState(1);
  const [note, setNote] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // จำกัดขนาดไฟล์ไม่เกิน 10MB เพื่อความเสถียรของระบบ
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 10MB) กรุณาใช้ไฟล์ที่มีความละเอียดต่ำลง หรือย่อขนาดไฟล์");
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleSubmitOrder = async () => {
    if (!file) return;
    if (!customerName || !phoneNumber) {
      alert("กรุณากรอกข้อมูลติดต่อให้ครบถ้วน");
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const fileBase64 = await toBase64(file);
      
      const newOrder: PrintOrder = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        customerName,
        phoneNumber,
        email: '', 
        fileName: file.name,
        fileUrl: '', 
        paperSize,
        paperType,
        printColor,
        isDoubleSided: false,
        copies,
        totalPrice: 0, 
        status: OrderStatus.AWAITING_PRICING, 
        createdAt: new Date().toISOString(),
        note
      };

      await onOrderComplete(newOrder, fileBase64);
    } catch (e: any) {
      alert("เกิดข้อผิดพลาด: " + (e.message || "ไม่สามารถส่งออเดอร์ได้"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-charcoal-700 max-w-2xl mx-auto transition-colors duration-300">
      <div className="bg-gray-50 dark:bg-charcoal-700/50 px-8 py-6 flex justify-between items-center border-b border-gray-200 dark:border-charcoal-700">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              step >= s 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
              : 'bg-gray-200 dark:bg-charcoal-600 text-gray-400 dark:text-gray-500'
            }`}>
              {s}
            </div>
            {s < 2 && <div className={`h-1.5 w-24 mx-3 rounded-full transition-all duration-500 ${step > s ? 'bg-blue-600' : 'bg-gray-200 dark:bg-charcoal-600'}`} />}
          </div>
        ))}
      </div>

      <div className="p-10">
        {step === 1 && (
          <div className="space-y-8 animate-slide-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. ข้อมูลลูกค้า</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">กรอกข้อมูลติดต่อเบื้องต้นเพื่อประเมินราคา</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-colors" 
                  placeholder="เช่น คุณสมชาย"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-colors" 
                  placeholder="08X-XXX-XXXX"
                />
              </div>
            </div>

            <div className="group relative border-2 border-dashed border-gray-300 dark:border-charcoal-600 rounded-3xl p-12 text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition duration-300 cursor-pointer overflow-hidden">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer relative z-10">
                <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition duration-300">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">{file ? file.name : "เลือกไฟล์งานของคุณ"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">PDF, Word, หรือไฟล์รูปภาพ (JPG, PNG)</p>
                {file && <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-2">ขนาดไฟล์: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
              </label>
            </div>

            <button 
              disabled={!file || !customerName || !phoneNumber}
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-charcoal-700 disabled:text-gray-400 dark:disabled:text-gray-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-900/30 transition duration-300 flex items-center justify-center space-x-3"
            >
              <span>ถัดไป: ตั้งค่าการปริ้น</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-slide-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. ตั้งค่าความต้องการ</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">ปรับแต่งรายละเอียดงานของคุณให้สมบูรณ์</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">ขนาดกระดาษ</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(PaperSize).map(size => (
                      <button 
                        key={size}
                        onClick={() => setPaperSize(size)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                          paperSize === size 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' 
                          : 'bg-gray-50 dark:bg-charcoal-900 border-gray-200 dark:border-charcoal-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-charcoal-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">ชนิดกระดาษ</label>
                  <div className="space-y-2">
                    {Object.values(PaperType).map(type => (
                      <button 
                        key={type}
                        onClick={() => setPaperType(type)}
                        className={`w-full py-4 px-5 text-left rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                          paperType === type 
                          ? 'bg-blue-600/10 border-blue-500/50 text-blue-600 dark:text-blue-400' 
                          : 'bg-gray-50 dark:bg-charcoal-900 border-gray-200 dark:border-charcoal-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-charcoal-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">รูปแบบสี</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: PrintColor.BW, label: 'ขาวดำ' },
                      { val: PrintColor.COLOR, label: 'สี' }
                    ].map(opt => (
                      <button 
                        key={opt.val}
                        onClick={() => setPrintColor(opt.val)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                          printColor === opt.val 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' 
                          : 'bg-gray-50 dark:bg-charcoal-900 border-gray-200 dark:border-charcoal-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-charcoal-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">จำนวนชุด</label>
                    <input 
                      type="number" 
                      min="1"
                      value={copies}
                      onChange={e => setCopies(parseInt(e.target.value) || 1)}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                    />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">หมายเหตุ</label>
                  <textarea 
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 text-sm transition-colors" 
                    placeholder="เช่น เข้าเล่ม, รายละเอียดเพิ่มเติม..."
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button disabled={isSubmitting} onClick={() => setStep(1)} className="flex-1 bg-gray-100 dark:bg-charcoal-700 hover:bg-gray-200 dark:hover:bg-charcoal-600 text-gray-600 dark:text-gray-300 font-bold py-5 rounded-2xl transition duration-200">ย้อนกลับ</button>
              <button 
                onClick={handleSubmitOrder} 
                disabled={isSubmitting}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-900/40 transition duration-200 flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    กำลังอัปโหลดไฟล์...
                  </span>
                ) : "ส่งคำขอประเมินราคา"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderForm;
