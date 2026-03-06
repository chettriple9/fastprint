
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeOrderRequest(prompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `คุณคือผู้ช่วยอัจฉริยะของร้าน FastPrint ช่วยวิเคราะห์และสรุปคำสั่งซื้อนี้เป็นภาษาไทยที่สุภาพ: ${prompt}`,
        config: {
          systemInstruction: "You are a helpful assistant for an online print shop named FastPrint. Be polite, professional, and clear in Thai.",
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "ขออภัย ระบบขัดข้องชั่วคราวในการประมวลผลคำสั่งซื้อ";
    }
  }

  async getPriceExplanation(pages: number, copies: number, isColor: boolean) {
    const type = isColor ? "สี" : "ขาวดำ";
    const prompt = `อธิบายรายละเอียดราคาสำหรับการปริ้นงาน ${type} จำนวน ${pages} หน้า ทั้งหมด ${copies} ชุด ให้ลูกค้าเข้าใจง่ายๆ พร้อมสรุปยอดรวม`;
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are a pricing assistant for FastPrint. Explain the breakdown of costs clearly in Thai.",
        }
      });
      return response.text;
    } catch (error) {
      return "ไม่สามารถดึงข้อมูลคำอธิบายราคาได้ในขณะนี้";
    }
  }
}

export const gemini = new GeminiService();
