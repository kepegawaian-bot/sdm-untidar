import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, contextData } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key not configured" });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const systemInstruction = `Anda adalah asisten virtual (AI) untuk Portal SDM dan Tata Laksana Kepegawaian (TLK) Universitas Tidar (Untidar). 
ATURAN SANGAT PENTING: 
1. Anda HANYA BOLEH fokus dan menjawab pertanyaan seputar konteks layanan kepegawaian dan data yang tersedia di sistem portal ini.
2. JANGAN PERNAH memberikan jawaban di luar konteks kepegawaian Untidar atau berhalusinasi informasi. 
3. Jika ditanya hal yang tidak relevan dengan layanan kepegawaian, tolak dengan sopan bahwa Anda hanya melayani pertanyaan terkait Kepegawaian Universitas Tidar.
4. Jika ada pertanyaan mengenai detil layanan yang tidak ada di dalam konteks, sarankan untuk menghubungi Penanggung Jawab (PIC) terkait atau kirim email ke: kepegawaian@untidar.ac.id. 

Konteks Portal Saat Ini:
${contextData ? JSON.stringify(contextData) : 'SISTER, SIMPEG, E-Kinerja, Presensi, Cuti, Mutasi, dan layanan lainnya.'}

Referensi Umum: Untidar masuk di bawah Kemendiktisaintek. Alamat: Jl. Kapten Suparman No.39, Magelang. Kontak: kepegawaian@untidar.ac.id | (0293) 364113.`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction
      });

      const chat = model.startChat({
        history: history || [],
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      res.json({ text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
