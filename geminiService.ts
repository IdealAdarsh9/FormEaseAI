import { GoogleGenAI, Type } from "@google/genai";
import { FormAnalysisResponse } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Legal and Administrative Assistant. 
Your goal is to analyze a form (government, insurance, tax, legal, etc.) and help the user fill it out.

You must output a JSON object.

Step 1: Identify the document type and provide a 1-sentence summary.
Step 2: Check the "User Context" provided. 
   - If the form requires specific personal data (Name, SSN, Address, Income, etc.) to be filled effectively, AND the User Context is missing this data, your status is "NEEDS_DETAILS".
   - Generate a list of specific, polite questions to get this missing information.
   - NOTE: If the User Context explicitly says "Just explain the form" or "Generic guide", ignore missing details and set status to "COMPLETE".
Step 3: If the User Context is sufficient OR if you have received the answers to your previous questions, set status to "COMPLETE".
   - Generate a "markdownGuide" that tells them EXACTLY what to write.
   - Generate a "filledFields" array. For every visual field you identify in the form that needs user data, provide the value (based on user context) and the 2D bounding box [ymin, xmin, ymax, xmax] (scale 0-1000 or 0-1). 
   - The bounding box should cover the blank space where the text should be written.

MARKDOWN GUIDE FORMAT (for "markdownGuide" field):
# [Title of Document]
## 📄 Document Summary
[Summary]
## 🧠 Jargon Buster
* **[Term]**: [Simple definition]
## ✍️ Auto-Fill Guide
| Field Name | What to Write | Reasoning |
| :--- | :--- | :--- |
| [Label] | **[Value based on user info]** | [Reasoning] |
...
## ⚠️ Critical Checklist
* [Checklist items]
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    documentTitle: { type: Type.STRING },
    summary: { type: Type.STRING },
    status: { type: Type.STRING, enum: ["COMPLETE", "NEEDS_DETAILS"] },
    questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3-5 specific questions to ask the user if status is NEEDS_DETAILS. Empty if COMPLETE."
    },
    markdownGuide: {
      type: Type.STRING,
      description: "The full markdown guide if status is COMPLETE. Null/Empty if NEEDS_DETAILS."
    },
    filledFields: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, description: "The text value to write" },
          box_2d: { 
             type: Type.ARRAY, 
             items: { type: Type.NUMBER }, 
             description: "[ymin, xmin, ymax, xmax] coordinates (0-1000 scale preferred)"
          }
        }
      },
      description: "List of fields to overlay on the image. Only required if status is COMPLETE."
    }
  },
  required: ["documentTitle", "summary", "status"]
};

// Helper to clean base64 string
const cleanBase64 = (base64Data: string): { mimeType: string, data: string } => {
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return { mimeType: 'image/jpeg', data: base64Data.split(',')[1] || base64Data };
};

export const analyzeForm = async (
  base64Data: string, 
  userContext?: string, 
  qaHistory?: { question: string; answer: string }[]
): Promise<FormAnalysisResponse> => {
  try {
    const { mimeType, data } = cleanBase64(base64Data);

    const parts: any[] = [
      {
        inlineData: {
          mimeType: mimeType,
          data: data
        }
      }
    ];

    let promptText = "Analyze this form.";

    if (userContext) {
      promptText += `\n\nINITIAL USER CONTEXT:\n${userContext}`;
    } else {
      promptText += `\n\nINITIAL USER CONTEXT: None provided.`;
    }

    if (qaHistory && qaHistory.length > 0) {
      promptText += `\n\nFOLLOW-UP: The user has answered your request for more details.\n`;
      qaHistory.forEach((item, index) => {
        promptText += `Q${index + 1}: ${item.question}\nA: ${item.answer}\n`;
      });
      promptText += `\nBased on these answers, please generate the COMPLETE guide and FILLED FIELD coordinates now.`;
    } else {
      promptText += `\n\nINSTRUCTION: Check if you have enough info to fill the main fields. If not, ask questions. If yes, generate the guide and coordinates.`;
    }
    
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2, 
      }
    });

    if (!response.text) {
      throw new Error("No response received from AI.");
    }

    const result = JSON.parse(response.text) as FormAnalysisResponse;
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const askFormQuestion = async (
  base64Data: string,
  question: string,
  chatHistory: { role: 'user' | 'model', text: string }[]
): Promise<string> => {
  try {
    const { mimeType, data } = cleanBase64(base64Data);

    // Build history for the chat model
    const historyParts = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Add the image to the latest user message
    const userMessageWithImage = {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: data
          }
        },
        { text: `I have a question about this document: ${question}` }
      ]
    };

    // Construct the full prompt context for the stateless model call 
    // (Or use multi-turn chat if using chat.sendMessage, but generateContent is fine for this)
    const promptParts: any[] = [
      {
        inlineData: { mimeType, data }
      }
    ];

    // Add History to context text manually for simple single-turn mimic, 
    // OR ideally use `ai.chats.create` with history. 
    // Given the SDK, let's use generateContent with system instruction + image + question.
    
    // Construct a context-rich prompt
    let contextPrompt = "You are a helpful expert assistant for this specific document. Answer the user's question clearly, concisely, and accurately based on the visual document provided.";
    
    if (chatHistory.length > 0) {
       contextPrompt += "\n\nChat History:";
       chatHistory.forEach(msg => {
         contextPrompt += `\n${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`;
       });
    }

    contextPrompt += `\n\nUser Question: ${question}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: contextPrompt }
        ]
      }
    });

    return response.text || "I couldn't generate an answer. Please try again.";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I encountered an error while analyzing the document. Please try again.";
  }
};