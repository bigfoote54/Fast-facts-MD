import axios from 'axios';
import { QuestionPayload, AnswerPayload } from '../../../shared/types';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const apiService = {
  async askQuestion(payload: QuestionPayload): Promise<AnswerPayload> {
    const response = await axios.post<AnswerPayload>(`${API_BASE_URL}/ask`, payload);
    return response.data;
  },
};
