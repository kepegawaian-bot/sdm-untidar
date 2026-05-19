import { GoogleGenAI } from "@google/genai";
async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "test"
      }
    });
    const streamResponse = await chat.sendMessageStream({ message: "hello" });
    for await (const chunk of streamResponse) {
      console.log(chunk.text);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
