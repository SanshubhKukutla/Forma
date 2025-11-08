// services/geminiService.ts

import { GoogleGenAI, Type, Modality, GenerateContentResponse } from '@google/genai';
import {
  RoomDesignFormInputs,
  InitialSuggestedItem,
  SuggestedItem,
  GeneratedImage,
  ItemOption,
} from '../types';
import {
  GEMINI_MODEL_TEXT,
  GEMINI_MODEL_IMAGE,
  MAX_OUTPUT_TOKENS_INITIAL_SUGGESTIONS,
  MAX_OUTPUT_TOKENS_JSON,
} from '../constants';

/**
 * Initializes the GoogleGenAI client.
 * As per guidelines, this should be called right before making an API call
 * to ensure it always uses the most up-to-date API key from the environment.
 */
function initializeGenAI(): GoogleGenAI {
  // Ensure process.env.API_KEY is available and valid.
  // The API key is obtained exclusively from process.env.API_KEY.
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set. Please provide a valid API key.');
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

/**
 * Converts a File object to a Base64 encoded string.
 * @param file The File object to convert.
 * @returns A Promise that resolves with the Base64 string, or null if file is null.
 */
async function fileToBase64(file: File | null): Promise<string | null> {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the 'data:image/png;base64,' part if present
      const base64String = reader.result?.toString().split(',')[1] || null;
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Detects existing objects in a room image (if provided) and suggests new items,
 * along with multiple style/option suggestions and estimated price ranges.
 *
 * @param roomImage The uploaded image of the room (optional).
 * @param existingObjects A description of existing objects in the room.
 * @param designPrompt The user's specific design goals.
 * @param designVibe The desired aesthetic or style for the room.
 * @returns A promise that resolves to an array of InitialSuggestedItem objects.
 */
export async function detectAndSuggestItems(
  roomImage: File | null,
  existingObjects: string,
  designPrompt: string,
  designVibe: string,
): Promise<InitialSuggestedItem[]> {
  const ai = initializeGenAI();
  const imageBase64 = await fileToBase64(roomImage);

  const parts: any[] = [];

  // Add room image if provided
  if (imageBase64 && roomImage) {
    parts.push({
      inlineData: {
        mimeType: roomImage.type,
        data: imageBase64,
      },
    });
  }

  // Construct the text prompt
  let prompt = `Analyze the provided room image (if any) and the following descriptions.
    Identify key existing furniture/objects and then suggest 3-5 new furniture or decor items that would fit the user's design goals and desired vibe.
    For each suggested item, provide a base description, an estimated price range, and a good search query for an e-commerce site.
    Additionally, for each suggested item, provide 2-3 distinct style options. Each option should have a short name (e.g., "Modern White") and a brief description.

    Existing Objects: ${existingObjects || 'None specified.'}
    Design Goals: ${designPrompt || 'No specific goals.'}
    Desired Vibe/Style: ${designVibe || 'Unspecified.'}

    Return the response as a JSON array of objects, strictly adhering to the following TypeScript interface structure:
    interface ItemOption {
      optionName: string; // e.g., "Modern White"
      description: string; // e.g., "Sleek, low-profile sofa in white leather."
    }

    interface InitialSuggestedItem {
      name: string; // e.g., "Sofa", "Coffee Table"
      description: string; // Base description of the item
      estimatedPriceRange: string; // e.g., "$100 - $200", "$150"
      searchQuery: string; // e.g., "modern white sofa"
      options: ItemOption[]; // 2-3 distinct style options for this item
    }

    Ensure the response is a valid JSON array of InitialSuggestedItem objects. Do not include any other text or markdown outside the JSON.
    `;
  parts.push({ text: prompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: { parts: parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedPriceRange: { type: Type.STRING },
              searchQuery: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    optionName: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  propertyOrdering: ['optionName', 'description'],
                },
              },
            },
            required: ['name', 'description', 'estimatedPriceRange', 'searchQuery', 'options'],
            propertyOrdering: ['name', 'description', 'estimatedPriceRange', 'searchQuery', 'options'],
          },
        },
        maxOutputTokens: MAX_OUTPUT_TOKENS_INITIAL_SUGGESTIONS,
        thinkingConfig: { thinkingBudget: Math.floor(MAX_OUTPUT_TOKENS_INITIAL_SUGGESTIONS / 2) }, // Reserve tokens for output
        temperature: 0.8, // Allow for some creativity
      },
    });

    const jsonStr = response.text.trim();
    // Validate that the response starts and ends with JSON array brackets
    if (!jsonStr.startsWith('[') || !jsonStr.endsWith(']')) {
      console.error('Invalid JSON structure:', jsonStr);
      throw new Error('Model did not return a valid JSON array.');
    }
    const suggestions: InitialSuggestedItem[] = JSON.parse(jsonStr);
    return suggestions;
  } catch (error: any) {
    console.error('Error in detectAndSuggestItems:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse model response as JSON. Please try again.');
    }
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generates a new room design image based on user inputs and selected items.
 *
 * @param roomImage The uploaded image of the room (optional, for editing).
 * @param existingObjects A description of existing objects in the room.
 * @param designPrompt The user's specific design goals or refinement requests.
 * @param designVibe The desired aesthetic or style.
 * @param selectedItems An array of SuggestedItem objects that the user has selected.
 * @returns A promise that resolves to a GeneratedImage object.
 */
export async function generateRoomDesign(
  roomImage: File | null,
  existingObjects: string,
  designPrompt: string,
  designVibe: string,
  selectedItems: SuggestedItem[],
): Promise<GeneratedImage> {
  const ai = initializeGenAI();
  const imageBase64 = await fileToBase64(roomImage);

  const parts: any[] = [];

  // Add original room image if provided, for image editing capability
  if (imageBase64 && roomImage) {
    parts.push({
      inlineData: {
        mimeType: roomImage.type,
        data: imageBase64,
      },
    });
  }

  // Construct the text prompt for image generation
  const selectedItemsDescriptions = selectedItems
    .map((item) => `- ${item.name}: ${item.description}`)
    .join('\n');

  let prompt = `Generate a realistic room design image.
    Incorporate the following elements and design principles:

    Existing Objects to consider: ${existingObjects || 'None.'}
    Design Goals: ${designPrompt || 'No specific goals.'}
    Desired Vibe/Style: ${designVibe || 'Unspecified.'}

    Key items to include/change based on user selection:
    ${selectedItemsDescriptions || 'No new items selected.'}

    Make sure the generated image reflects a cohesive and aesthetically pleasing design based on these instructions.
    If an input image is provided, integrate these new items and changes into the existing room structure,
    otherwise, generate a new room design from scratch with the specified items and vibe.
    Focus on creating a high-quality, wide-angle interior view suitable for a 360 viewer.
    `;
  parts.push({ text: prompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_IMAGE, // Use the image generation model
      contents: { parts: parts },
      config: {
        responseModalities: [Modality.IMAGE], // Request an image as output
        temperature: 0.7, // Keep it grounded to the prompt but allow some creative rendering
      },
    });

    const generatedImagePart = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!generatedImagePart) {
      throw new Error('No image data found in the model response.');
    }

    return {
      imageBytes: generatedImagePart.data,
      mimeType: generatedImagePart.mimeType,
    };
  } catch (error: any) {
    console.error('Error in generateRoomDesign:', error);
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}
