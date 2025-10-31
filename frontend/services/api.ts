import axios, { AxiosError } from 'axios';

import { AnswerPayload, QuestionPayload } from '../../../shared/types';

const DEFAULT_TIMEOUT_MS = 15000;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>; // detail matches FastAPI error schema
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    if (axiosError.code === AxiosError.ERR_NETWORK) {
      return 'Unable to reach the server. Check your connection and try again.';
    }
    return axiosError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while contacting the server.';
};

export const apiService = {
  async askQuestion(payload: QuestionPayload): Promise<AnswerPayload> {
    try {
      const response = await client.post<AnswerPayload>('/ask', payload);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};
