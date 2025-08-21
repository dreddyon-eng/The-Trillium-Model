/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
import type { QuizQuestion } from '../types';

const API_KEY = process.env.API_KEY;

// Initialize the AI client. If API_KEY is not set, `ai` will be null.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const modelName = "gemini-2.5-flash";

/**
 * Checks if the API key is configured.
 * @returns An error message string if the key is missing, otherwise null.
 */
const checkApiKey = (): string | null => {
    if (!ai) {
        const errorMessage = "API Key is not configured. Please set up the process.env.API_KEY environment variable.";
        console.error(errorMessage);
        return errorMessage;
    }
    return null;
}

export const generateSummary = async (sectionTitle: string, sectionContent: string): Promise<string> => {
  const apiKeyError = checkApiKey();
  if (apiKeyError) return apiKeyError;

  const prompt = `Summarize the following section from a theoretical physics report in a concise paragraph. Do not use markdown headers or titles. Do not introduce the summary with phrases like "This section is about" or "In this section...". Just provide the summary.

Section Title: ${sectionTitle}
Section Content: ${sectionContent}`;

  try {
    const response = await ai!.models.generateContent({
        model: modelName,
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Failed to generate summary.';
  }
};

export const answerQuestion = async (reportText: string, question: string): Promise<string> => {
    const apiKeyError = checkApiKey();
    if (apiKeyError) return apiKeyError;

  const prompt = `Based on the following document, answer the user's question. If the information is not in the document, state that you cannot answer.

Document:
${reportText}

Question: ${question}`;
  
  try {
    const response = await ai!.models.generateContent({
        model: modelName,
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error answering question:', error);
    return 'Failed to get an answer. Please try again.';
  }
};

export const generateQuiz = async (reportText: string): Promise<{quiz: QuizQuestion[]}> => {
    const apiKeyError = checkApiKey();
    if (apiKeyError) throw new Error(apiKeyError);

    const prompt = `Create a 5-question multiple-choice quiz based on the following document. The response must be a valid JSON object with a single 'quiz' key. The value of 'quiz' should be an array of objects. Each object in the array must have the following keys: 'question' (string), 'options' (array of strings, exactly 4 options), and 'correctAnswer' (string, the correct option). Do not include any other text in the response, just the JSON.

Document:
${reportText}`;
    
    try {
        const response = await ai!.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        "quiz": {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    "question": { type: Type.STRING },
                                    "options": {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING },
                                    },
                                    "correctAnswer": { type: Type.STRING }
                                },
                                propertyOrdering: ["question", "options", "correctAnswer"]
                            }
                        }
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        if (!jsonText.startsWith('{') && !jsonText.startsWith('[')) {
            console.error("Received non-JSON response for quiz generation:", jsonText);
            throw new Error("Invalid response format from API.");
        }
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('Error generating quiz:', error);
        throw new Error('Failed to generate quiz. Please try again.');
    }
};
