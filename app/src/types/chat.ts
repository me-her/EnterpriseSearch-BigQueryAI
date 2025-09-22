export interface ChatMessage {
  id: string;
  message: string;
  events: AgentEvent[];
  timestamp: Date;
}

// API Types based on actual responses
export interface CreateSessionResponse {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
  events: AgentEvent[];
  lastUpdateTime: number;
}

export interface AgentEvent {
  id: string;
  timestamp: number;
  author: string;
  content: {
    role: string;
    parts: Array<{
      text?: string;
      thoughtSignature?: string;
      functionCall?: {
        id: string;
        name: string;
        args: Record<string, unknown>;
      };
      functionResponse?: {
        id: string;
        name: string;
        response: {
          status: string;
          rows?: Array<Record<string, unknown>>;
          [key: string]: unknown;
        };
      };
    }>;
  };
  finishReason?: string;
  usageMetadata?: {
    candidatesTokenCount: number;
    candidatesTokensDetails?: Array<{ modality: string; tokenCount: number }>;
    promptTokenCount: number;
    promptTokensDetails?: Array<{ modality: string; tokenCount: number }>;
    thoughtsTokenCount?: number;
    totalTokenCount: number;
    cachedContentTokenCount?: number;
    cacheTokensDetails?: Array<{ modality: string; tokenCount: number }>;
    trafficType?: string;
  };
  invocationId: string;
  actions?: {
    stateDelta: Record<string, unknown>;
    artifactDelta: Record<string, unknown>;
    requestedAuthConfigs?: Record<string, unknown>;
    requestedToolConfirmations?: Record<string, unknown>;
  };
  longRunningToolIds?: string[];
}
