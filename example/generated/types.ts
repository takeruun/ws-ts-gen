// Type definitions generated from AsyncAPI schema

export interface PingMessage {
  type: 'ping';
}

export interface PongMessage {
  type: 'pong';
  timestamp?: number; // Unix timestamp
}

export interface ErrorMessage {
  type: 'error';
  error: string; // Error message
  details?: any; // Additional error details
}

export type MessageType = 'ping' | 'pong' | 'error';

export type AsyncApiMessage =
  PingMessage |
  PongMessage |
  ErrorMessage;
