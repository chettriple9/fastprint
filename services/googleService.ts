
import { APP_CONFIG } from '../constants';
import { PrintOrder, OrderStatus, Expense, IncomeEntry, PaymentMethod } from '../types';

export class GoogleService {
  private static url = APP_CONFIG.googleWebAppUrl;

  static async fetchAll() {
    if (!this.url || this.url === "" || this.url.includes("YOUR_GOOGLE_WEB_APP_URL_HERE")) {
      return null;
    }
    
    try {
      const response = await fetch(this.url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }

  static async createOrder(order: PrintOrder, fileData: string) {
    // ตรวจสอบขนาดข้อมูลก่อนส่ง (ประมาณ 15MB สำหรับ Base64 คือขีดจำกัดปลอดภัย)
    const sizeInMB = (fileData.length * 0.75) / (1024 * 1024);
    console.log(`Payload size: ~${sizeInMB.toFixed(2)} MB`);
    
    if (sizeInMB > 15) {
      throw new Error("ไฟล์มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 15MB)");
    }

    const payload = {
      action: 'createOrder',
      ...order,
      fileData 
    };
    return await this.post(payload);
  }

  static async updateOrderStatus(id: string, status: OrderStatus, price?: number, paymentMethod?: PaymentMethod, slipData?: string) {
    return await this.post({
      action: 'updateStatus',
      id,
      status,
      price,
      paymentMethod,
      slipData
    });
  }

  static async addRecord(type: 'INCOME' | 'EXPENSE', item: Expense | IncomeEntry) {
    return await this.post({
      action: 'addAccounting',
      type,
      ...item
    });
  }

  private static async post(data: any) {
    if (!this.url || this.url === "" || this.url.includes("YOUR_GOOGLE_WEB_APP_URL_HERE")) {
       return null;
    }

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      // Apps Script redirects can cause opaque responses in some browsers
      if (response.type === 'opaque') {
        return { success: true, message: "Request sent (opaque)" };
      }
      
      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error("POST Error:", error);
      // If it's a CORS error on the redirect, the request might have actually succeeded
      if (error.message && error.message.includes('fetch')) {
        return { success: true, message: "Request likely sent (CORS on redirect)" };
      }
      throw error;
    }
  }
}
