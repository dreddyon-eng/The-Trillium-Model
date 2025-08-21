/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export enum MessageSender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface UrlContextMetadataItem {
  retrievedUrl: string;
  urlRetrievalStatus: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  isLoading?: boolean;
  urlContext?: UrlContextMetadataItem[];
}

export interface URLGroup {
  id: string;
  name: string;
}
