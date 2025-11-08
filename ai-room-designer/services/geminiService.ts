import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { API_KEY, GEMINI_MODEL_TEXT, GEMINI_MODEL_IMAGE, PANORAMA_WIDTH, PANORAMA_HEIGHT } from "../constants";
import { GeneratedImage, SuggestedItem } from "../types";

const MAX_OUTPUT_TOKENS_TEXT = 800;
const MAX_OUTPUT_TOKENS_JSON = 1500; // Increased for more detailed item descriptions

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Helper to instantiate GoogleGenAI right before a call
const getGeminiClient = () => new GoogleGenAI({ apiKey: API_KEY });

export async function generateRoomDesign(
  roomImageFile: File | null,
  roomDimensions: string,
  existingObjects: string,
  designPrompt: string,
  designVibe: string,
  // New parameter for selected items for iterative redesign
  selectedItemsForRedesign: SuggestedItem[] = [],
): Promise<{ images: GeneratedImage[], designSummary: string, suggestedItems: SuggestedItem[] }> {
  try {
    const ai = getGeminiClient();

    let imageParts = [];
    if (roomImageFile) {
      const base64Image = await fileToBase64(roomImageFile);
      imageParts.push({
        inlineData: {
          mimeType: roomImageFile.type,
          data: base64Image,
        },
      });
    }

    const selectedItemsInstruction = selectedItemsForRedesign.length > 0
      ? `**Crucially, visually incorporate the following specific items into the design, ensuring they are prominent and align with their descriptions**: ${selectedItemsForRedesign.map(item => `${item.name} (${item.description})`).join('; ')}. If these items were part of a previous design, refine their placement or style as needed.`
      : '';

    // --- Step 1: Generate Panoramic Image ---
    const imageGenerationPrompt = `
      Create a realistic, high-quality, 360-degree panoramic view of a room. The view should be from the very center of the room looking outwards, covering a full 360-degree horizontal perspective.
      Ensure all objects, furniture, and decor are arranged logically and realistically within the specified dimensions and strictly according to the design prompt. Pay close attention to spatial relationships and scale.
      
      ${roomImageFile ? "Analyze the existing room image to understand the current layout and style, then seamlessly integrate the new design concepts while respecting the existing structure." : "Design a room from scratch, focusing intently on the following details and creating a cohesive space."}
      Room Dimensions: ${roomDimensions}
      Existing Objects to consider: ${existingObjects || "None specified, assume a blank canvas if no image provided."}
      Design Prompt: ${designPrompt}
      Design Vibe: ${designVibe}
      ${selectedItemsInstruction}

      Generate a single, seamless panoramic image that can be horizontally scrolled to simulate a full 360-degree walk-through from the room's center.
      Do not include any text, overlays, watermarks, or artificial borders within the image. The image must accurately reflect the arrangement of objects and the overall design described.
    `;

    console.log("Image generation prompt:", imageGenerationPrompt);

    const imageResponse: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_IMAGE,
      contents: { parts: [...imageParts, { text: imageGenerationPrompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const generatedImages: GeneratedImage[] = [];
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        generatedImages.push({
          id: `panorama-${Date.now()}`,
          base64Data: part.inlineData.data,
          alt: `AI-generated panoramic room design for '${designPrompt}'`,
        });
      }
    }

    if (generatedImages.length === 0) {
      throw new Error("Failed to generate any room design images.");
    }

    // --- Step 2: Generate Design Summary and suggested items for purchase ---
    // Refined prompt for strict JSON output
    const summaryAndItemsPrompt = `
      Your *entire* response *must be* a JSON object that adheres strictly to the following schema. Do not include any other text, explanations, or formatting outside of the JSON.
      
      Based on the following room design request and the generated panoramic image (imagine it visually):
      Room Dimensions: ${roomDimensions}
      Existing Objects: ${existingObjects || "None specified"}
      Design Prompt: ${designPrompt}
      Design Vibe: ${designVibe}
      ${selectedItemsInstruction}

      1. Provide a concise textual summary of the design. Focus on the overall aesthetic, key features, and how it addresses the prompt and vibe.
      2. Identify 3-5 key new furniture or decor items that are central to this design. For each item, provide a brief description, an estimated price range (e.g., "$1200 - $2500", "$300 - $800", "around $150"), and a relevant search query for finding similar items online. If an item was explicitly selected or requested by the user, ensure it is included in this list and its description highlights its presence in the design.
      
      Example of desired JSON structure:
      {
        "summary": "This design features a modern minimalist aesthetic with a focus on natural light and open space. Key elements include a large sectional sofa, a floating entertainment unit, and a sculptural floor lamp.",
        "suggestedItems": [
          {"name": "Sectional Sofa", "description": "A spacious, L-shaped sectional sofa in a neutral tone, providing ample seating for guests.", "estimatedPriceRange": "$1200 - $2500", "searchQuery": "modern sectional sofa neutral color"},
          {"name": "Floating Entertainment Unit", "description": "A sleek, wall-mounted entertainment unit with hidden storage, maintaining a clean aesthetic.", "estimatedPriceRange": "$300 - $800", "searchQuery": "floating media console white"},
          {"name": "Sculptural Floor Lamp", "description": "A tall, artistic floor lamp with an abstract design, adding a touch of elegance and ambient light.", "estimatedPriceRange": "$100 - $300", "searchQuery": "contemporary sculptural floor lamp"},
          {"name": "Large Fiddle Leaf Fig Tree", "description": "A vibrant indoor plant to add a touch of nature and improve air quality.", "estimatedPriceRange": "$50 - $150", "searchQuery": "large fiddle leaf fig tree potted"}
        ]
      }
    `;

    console.log("Summary and items prompt:", summaryAndItemsPrompt);

    const summaryResponse: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: { parts: [{ text: summaryAndItemsPrompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Textual summary of the room design.' },
            suggestedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Name of the item.' },
                  description: { type: Type.STRING, description: 'Brief description of the item.' },
                  estimatedPriceRange: { type: Type.STRING, description: 'Estimated price range of the item (e.g., "$100 - $200" or "$150").' },
                  searchQuery: { type: Type.STRING, description: 'Search query for finding the item online.' },
                },
                required: ['name', 'description', 'estimatedPriceRange', 'searchQuery'],
                propertyOrdering: ['name', 'description', 'estimatedPriceRange', 'searchQuery'],
                additionalProperties: false, // Strictly enforce properties for items
              },
            },
          },
          required: ['summary', 'suggestedItems'],
          propertyOrdering: ['summary', 'suggestedItems'],
          additionalProperties: false, // Strictly enforce top-level properties
        },
        maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
      },
    });

    if (!summaryResponse.text) {
      console.error("Gemini API did not return text for summary and items.");
      throw new Error("AI response was empty or malformed. Please try again.");
    }

    const jsonStr = summaryResponse.text.trim();
    let designData: { summary: string; suggestedItems: SuggestedItem[] };
    try {
      designData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", jsonStr, parseError);
      // Re-throw with a more specific message that includes the raw response for debugging
      throw new Error(`AI response was not valid JSON. Please try again. Raw response (truncated): ${jsonStr.substring(0, 500)}`);
    }

    const designSummary = designData.summary;
    const suggestedItems = designData.suggestedItems;

    return { images: generatedImages, designSummary, suggestedItems };

  } catch (error) {
    console.error("Error in generateRoomDesign:", error);
    throw error;
  }
}