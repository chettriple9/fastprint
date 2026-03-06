
export enum OrderStatus {
  AWAITING_PRICING = 'AWAITING_PRICING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  PRINTING = 'PRINTING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaperSize {
  A4 = 'A4',
  A3 = 'A3',
  B5 = 'B5'
}

export enum PaperType {
  BOND = 'กระดาษปอนด์ (ทั่วไป/เอกสาร)',
  ART = 'กระดาษอาร์ต (มัน/ด้าน)',
  PHOTO = 'กระดาษโฟโต้ (ภาพถ่าย)'
}

export enum PrintColor {
  BW = 'Black & White',
  COLOR = 'Full Color'
}

export enum PaymentMethod {
  PROMPTPAY = 'PromptPay',
  CASH = 'Cash'
}

export interface PrintOrder {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  fileName: string;
  fileUrl: string;
  slipUrl?: string;
  paperSize: PaperSize;
  paperType: PaperType;
  printColor: PrintColor;
  isDoubleSided: boolean;
  copies: number;
  totalPrice: number; // Initially 0, set by Admin
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  note?: string;
}

export interface Pricing {
  bw: number;
  color: number;
  doubleSidedMultiplier: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface IncomeEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
}
