
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  initials?: string;
}

export interface AnalysisResult {
  id?: string;
  timestamp?: number;
  productName: string;
  extractedPrice: string;
  valueScore: number;
  rating: string;
  keyFeatures: string[];
  rationale: string;
  recommendation: 'Buy Now' | 'Wait for Sale' | 'Don\'t Buy';
  recommendationReason: string[];
  alternatives: {
    name: string;
    difference: string;
    price?: string;
  }[];
  negotiationMessage: string;
  negotiationMessageHindi?: string;
  confidence: 'High' | 'Medium' | 'Low';
  searchLinks?: { title: string; uri: string }[];
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT_3_4 = '3:4',
  LANDSCAPE_4_3 = '4:3',
  PORTRAIT_9_16 = '9:16',
  LANDSCAPE_16_9 = '16:9',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
  attachment?: string; // Base64 or URL of uploaded image
}

export interface ChatSession {
  id: string;
  timestamp: number;
  lastMessage: string;
  messages: ChatMessage[];
  title?: string;
}

export interface GenerationHistory {
  id: string;
  timestamp: number;
  prompt: string;
  aspectRatio?: string;
  mode: 'standard' | 'ui-placeholder';
  imageData?: string; // Base64 or URL
  refImage?: string;
}
