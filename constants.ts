
// IMPORTANT: To connect to your 'dealflow' database, you MUST provide valid Firebase Credentials below.
// The MongoDB connection string you have is for backend services. 
// For this frontend app, use the keys from: Firebase Console > Project Settings > General > Your Apps (Web)

export const FIREBASE_CONFIG = {
  // Real Firebase Configuration for DealFlow AI Price Negotiator
  apiKey: "AIzaSyCBxOAk9iNK4rKB2fDDjcetBi8VJn2E_Ac",
  authDomain: "dealflow-ai-price-negotiator.firebaseapp.com",
  projectId: "dealflow-ai-price-negotiator",
  storageBucket: "dealflow-ai-price-negotiator.firebasestorage.app",
  messagingSenderId: "1063573403862",
  appId: "1:1063573403862:web:1ec5697582ddf35bd2f177",
  measurementId: "G-CT5WV91R7V"
};

export const GEMINI_API_KEY = process.env.API_KEY || "";

export const PRODUCT_ANALYSIS_PROMPT = `
You are "DealFlow AI", an expert shopping assistant.
Analyze the provided product image and context.

Return ONLY a JSON object with this exact structure:
{
  "productName": "string",
  "extractedPrice": "string",
  "rating": "string",
  "keyFeatures": ["string"],
  "valueScore": number (0-100),
  "rationale": "string (one sentence)",
  "alternatives": [
    { "name": "string", "difference": "string", "price": "string (optional)" }
  ],
  "recommendation": "Buy Now" | "Wait for Sale" | "Don't Buy",
  "recommendationReason": ["string"],
  "negotiationMessage": "string (polite, copy-ready)",
  "negotiationMessageHindi": "string (optional)",
  "confidence": "High" | "Medium" | "Low"
}

Rules:
1. If price is unreadable, set extractedPrice to "Unreadable".
2. Be concise.
3. Use the Google Search tools provided to verify current market prices if needed.
`;
