import type { AgentEvent } from '../types/chat';

// Session response type
interface SessionResponse {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
  events: AgentEvent[];
  lastUpdateTime: number;
}

const API_BASE_URL = 'http://localhost:8080';

// Simple storage helpers
function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

// Generate a simple user ID
function generateUserId(): string {
  return `user-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

// Get or create user ID
function getUserId(): string {
  const key = 'chat_user_id';
  let userId = getStorageItem(key);
  if (!userId) {
    userId = generateUserId();
    setStorageItem(key, userId);
  }
  return userId;
}

// API functions based on actual endpoints
export const chatApi = {
  async listApps(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/list-apps`);
    if (!response.ok) {
      throw new Error(`Failed to list apps: ${response.status}`);
    }
    return response.json();
  },

  // Create a new session (clears any existing session)
  async createNewSession(): Promise<string> {
    let appName = 'sec-filings'; // Default fallback
    try {
      const apps = await this.listApps();
      appName = apps[0] || 'sec-filings';
    } catch (error) {
      console.warn('Failed to list apps, using default app name:', error);
    }
    const userId = getUserId();

    // Clear existing session from storage
    const sessionKey = `chat_session_${appName}_${userId}`;
    localStorage.removeItem(sessionKey);

    // Create new session (server generates the session ID)
    const session = await this.createSession(appName, userId);
    setStorageItem(sessionKey, session.id);

    return session.id;
  },

  // Check if there's an active session
  async hasActiveSession(): Promise<boolean> {
    try {
      let appName = 'sec-filings'; // Default fallback
      try {
        const apps = await this.listApps();
        appName = apps[0] || 'sec-filings';
      } catch (error) {
        console.warn('Failed to list apps, using default app name:', error);
      }
      const userId = getUserId();
      const sessionKey = `chat_session_${appName}_${userId}`;
      return getStorageItem(sessionKey) !== null;
    } catch {
      return false;
    }
  },

  async createSession(appName: string, userId: string): Promise<SessionResponse> {
    const response = await fetch(`${API_BASE_URL}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Empty body - let server generate session ID
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }

    return response.json();
  },

  async sendMessage(message: string, forceNewSession: boolean = false): Promise<AgentEvent[]> {
    // Get app name (use first available app, fallback to default)
    let appName = 'sec-filings'; // Default fallback
    try {
      const apps = await this.listApps();
      appName = apps[0] || 'sec-filings';
    } catch (error) {
      console.warn('Failed to list apps, using default app name:', error);
    }

    // Get user ID
    const userId = getUserId();
    
    // Get or create session
    const sessionKey = `chat_session_${appName}_${userId}`;
    let sessionId = getStorageItem(sessionKey);
    
    if (!sessionId || forceNewSession) {
      if (forceNewSession) {
        // Clear existing session
        localStorage.removeItem(sessionKey);
      }
      // Create new session (server generates the session ID)
      const session = await this.createSession(appName, userId);
      sessionId = session.id;
      setStorageItem(sessionKey, sessionId);
    }

    // Send message
    const response = await fetch(`${API_BASE_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName,
        userId,
        sessionId,
        newMessage: {
          role: 'user',
          parts: [{ text: message }],
        },
        streaming: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }

    const events: AgentEvent[] = await response.json();
    return events;
  },
};