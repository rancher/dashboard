/* eslint-disable no-unused-vars */
export enum Settings {
  EMBEDDINGS_MODEL = 'EMBEDDINGS_MODEL',
  ENABLE_RAG = 'ENABLE_RAG',
  GOOGLE_API_KEY = 'GOOGLE_API_KEY',
  LANGFUSE_HOST = 'LANGFUSE_HOST',
  LANGFUSE_PUBLIC_KEY = 'LANGFUSE_PUBLIC_KEY',
  LANGFUSE_SECRET_KEY = 'LANGFUSE_SECRET_KEY',
  MODEL = 'MODEL',
  OLLAMA_URL = 'OLLAMA_URL',
  OPENAI_API_KEY = 'OPENAI_API_KEY',
  SYSTEM_PROMPT = 'SYSTEM_PROMPT',
  ACTIVE_CHATBOT = 'ACTIVE_CHATBOT',
}

export interface FormData {
  [Settings.EMBEDDINGS_MODEL]?: string;
  [Settings.ENABLE_RAG]?: string;
  [Settings.GOOGLE_API_KEY]?: string;
  [Settings.LANGFUSE_HOST]?: string;
  [Settings.LANGFUSE_PUBLIC_KEY]?: string;
  [Settings.LANGFUSE_SECRET_KEY]?: string;
  [Settings.MODEL]?: string;
  [Settings.OLLAMA_URL]?: string;
  [Settings.OPENAI_API_KEY]?: string;
  [Settings.SYSTEM_PROMPT]?: string;
  [Settings.ACTIVE_CHATBOT]?: string;
}
