export type ConversationRole = 'user' | 'assistant';

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
}

export interface QuestionPayload {
  question: string;
  conversation?: ConversationMessage[];
}

export interface AnswerPayload {
  response: string;
}