
import { Pricing } from './types';

export const APP_CONFIG = {
  appName: "FastPrint Online",
  primaryColor: "blue-600",
  secondaryColor: "indigo-700",
  // นำ URL ที่ได้จากการ Deploy Google Apps Script มาวางที่นี่
  googleWebAppUrl: "https://script.google.com/macros/s/AKfycbzmJZEUB2L6frPD9RC13EszUJ6eagowxOheDSaKTuqy8Ni2SOXrKvZNCE4ygaA0v-UG/exec" 
};

export const PRICING_CONFIG: Pricing = {
  bw: 1.5,
  color: 5.0,
  doubleSidedMultiplier: 0.8
};

export const UI_STRINGS = {
  header: "ระบบสั่งปริ้นงานออนไลน์",
  step1: "อัปโหลดไฟล์งาน",
  step2: "ตั้งค่าการปริ้น",
  step3: "ชำระเงิน",
  step4: "ติดตามสถานะ"
};
