
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { Message, ModelType } from "../types";

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public async *streamChat(
    modelName: ModelType,
    history: Message[],
    userMessage: string,
    systemInstruction?: string
  ) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    try {
      const response = await ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        },
      });

      for await (const chunk of response) {
        const c = chunk as GenerateContentResponse;
        yield c.text || "";
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  public async generateImage(prompt: string): Promise<{ text?: string, imageData?: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let text = "";
      let imageData = "";

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          text += part.text;
        }
      }

      return { text, imageData };
    } catch (error) {
      console.error("Image Generation Error:", error);
      throw error;
    }
  }

  public async generateSpeech(text: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (error) {
      console.error("Speech Generation Error:", error);
      throw error;
    }
  }

  public async generateTitle(message: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a very short, concise title (max 5 words) for a chat that starts with this message: "${message}". Respond ONLY with the title text. Do not use quotes or markdown.`,
      });
      const rawTitle = response.text || "New Conversation";
      return rawTitle.replace(/["#*]/g, '').trim() || "New Conversation";
    } catch (error) {
      return "New Conversation";
    }
  }
}
