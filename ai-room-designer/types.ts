
import { Type as GenAIType } from "@google/genai";

export interface GeneratedImage {
  id: string;
  base64Data: string;
  alt: string;
}

export interface SuggestedItem {
  name: string;
  description: string;
  estimatedPriceRange?: string; // e.g., "$100 - $200"
  searchQuery?: string; // Still useful for user to search later
}

export interface DesignResult {
  images: GeneratedImage[];
  designSummary: string;
  suggestedItems: SuggestedItem[]; // Changed from purchaseLinks
  selectedItems: SuggestedItem[]; // To store selected items for potential future redesigns
}

export interface RoomDesignFormInputs {
  roomImage: File | null;
  roomDimensions: string;
  existingObjects: string;
  designPrompt: string;
  designVibe: string;
}

export interface SchemaProperty {
  type: GenAIType;
  description?: string;
  properties?: { [key: string]: SchemaProperty };
  items?: SchemaProperty;
  required?: string[];
  propertyOrdering?: string[];
}
