
import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_API_KEY, PRODUCT_ANALYSIS_PROMPT } from "../constants";
import { AnalysisResult, AspectRatio } from "../types";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Analyze Product Image (Vision + Search Grounding)
export const analyzeProductImage = async (
  base64Image: string,
  mimeType: string,
  additionalContext: string = ""
): Promise<AnalysisResult> => {
  try {
    const modelId = "gemini-3-pro-preview"; // Use Pro for complex analysis

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            text: `${PRODUCT_ANALYSIS_PROMPT}\n\nAdditional User Context: ${additionalContext}`,
          },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }], // Enable Search Grounding for price checking
        // Defining schema strictly helps frontend consistency
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            extractedPrice: { type: Type.STRING },
            rating: { type: Type.STRING },
            keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            valueScore: { type: Type.NUMBER },
            rationale: { type: Type.STRING },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  difference: { type: Type.STRING },
                  price: { type: Type.STRING, nullable: true },
                },
              },
            },
            recommendation: { type: Type.STRING, enum: ["Buy Now", "Wait for Sale", "Don't Buy"] },
            recommendationReason: { type: Type.ARRAY, items: { type: Type.STRING } },
            negotiationMessage: { type: Type.STRING },
            negotiationMessageHindi: { type: Type.STRING, nullable: true },
            confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          },
          required: ["productName", "valueScore", "negotiationMessage", "recommendation"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text) as AnalysisResult;
    
    // Extract grounding chunks if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
       result.searchLinks = chunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    }

    return result;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// Chat with Thinking Mode or Standard (Supports Multimodal)
export const sendChatMessage = async (
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  message: string,
  image?: { data: string; mimeType: string },
  useThinking: boolean = false
) => {
  // Switch to Gemini 2.5 Flash for better reliability and speed
  const modelId = "gemini-2.5-flash"; 
  
  const config: any = {
    tools: [{ googleSearch: {} }],
    systemInstruction: "You are DealFlow AI, a smart shopping assistant. Help users negotiate prices, find deals, compare products, and analyze images. Be concise, professional, and money-savvy.",
  };

  if (useThinking) {
    // Gemini 2.5 Flash supports thinking config (max 24576)
    config.thinkingConfig = { thinkingBudget: 16000 };
  }

  // Prepare the current message contents
  const currentParts: any[] = [];
  
  // Always ensure there is some text, even if just a label for the image
  if (message.trim()) {
      currentParts.push({ text: message });
  } else if (image) {
      currentParts.push({ text: "Analyze this image." });
  }

  if (image) {
    currentParts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    });
  }

  // Sanitize history: 
  // 1. The API expects the first turn to be 'user'.
  // 2. Parts cannot be empty.
  let validHistory = history.map(item => ({
      role: item.role,
      parts: item.parts.filter(p => (p.text && p.text.trim().length > 0) || p.inlineData)
  })).filter(item => item.parts.length > 0);

  // Remove leading model turns
  while (validHistory.length > 0 && validHistory[0].role !== 'user') {
    validHistory.shift();
  }

  const chat = ai.chats.create({
    model: modelId,
    history: validHistory,
    config: config,
  });

  // Fix: sendMessage takes an object with a 'message' property for this SDK version
  const response = await chat.sendMessage({ message: currentParts });
  return response.text;
};

// Image Generation with Aspect Ratio
export const generateCustomImage = async (prompt: string, aspectRatio: AspectRatio) => {
  try {
    // Use gemini-2.5-flash-image via generateContent
    // This is the standard "General Image Generation" model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
          // Note: imageSize is NOT supported for Flash Image, only for Pro Image Preview
        },
      },
    });

    // Flash Image returns the generated image in the inlineData of the response candidate
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

// Helper to describe an image (used for Reference Image feature in Tools)
export const describeImageForGeneration = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: {
        parts: [
          { text: "Describe the artistic style, subject matter, lighting, and composition of this image in detail so it can be recreated by an image generator." },
          { inlineData: { data: base64Data, mimeType: mimeType } }
        ]
      }
    });
    return response.text || "";
  } catch (e) {
    console.error("Failed to describe reference image", e);
    return "";
  }
}
