// Type definitions generated from AsyncAPI schema

export type PingMessage = { type: 'ping'; timestamp: number };

export type PongMessage = { type: 'pong'; timestamp: number };

export type ErrorMessage = {
  type: 'error';
  error: string;
  details?: Record<string, any>;
};

export type MessageType = 'ping' | 'pong' | 'error';

export type AsyncApiMessage =
  { type: 'ping'; payload: PingMessage } |
  { type: 'pong'; payload: PongMessage } |
  { type: 'error'; payload: ErrorMessage };