// User interfaces
export interface IUser {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDoc {
  id: string;
  userId: string;
  title: string;
  messages: IMessage[];
  aiModel: string;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<ConversationDoc>;
}

export interface CustomWebSocket extends WebSocket {
  userId?: string;
}

export interface IUserDocument extends IUser {
  id: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Conversation interfaces
export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface IConversation {
  userId: string;
  title: string;
  messages: IMessage[];
  aiModel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationDocument extends IConversation {
  id: string;
}

// Authentication interfaces
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// API Response interfaces
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Chat interfaces
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionRequest {
  conversationId?: string;
  message: string;
  model?: string;
}

export interface ChatCompletionResponse {
  conversationId: string;
  message: IMessage;
  conversation: IConversationDocument;
}

// WebSocket interfaces
export interface WSMessage {
  type: "chat" | "ping" | "pong" | "error" | "auth";
  payload?: unknown;
  conversationId?: string;
  token?: string;
}

export interface WSChatPayload {
  message: string;
  conversationId?: string;
  model?: string;
}

export interface WSAuthenticatedClient {
  userId: string | null;
  isAlive: boolean;
}

// Configuration interfaces
export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  openaiApiKey: string;
  openaiModel: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  corsOrigin: string;
  wsHeartbeatInterval: number;
}

// OpenAI interfaces
export interface OpenAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenAICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
