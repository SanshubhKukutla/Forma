// constants.ts

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash';
export const GEMINI_MODEL_IMAGE = 'gemini-2.5-flash-image';
export const API_KEY = process.env.API_KEY || '';

export const PANORAMA_WIDTH = 1024; // Still useful as a reference, but Pannellum handles display
export const PANORAMA_HEIGHT = 576; // Still useful as a reference, but Pannellum handles display

// Max output tokens for JSON responses from text models
// Increased to allow for more detailed item suggestions and descriptions
export const MAX_OUTPUT_TOKENS_INITIAL_SUGGESTIONS = 8192; // For detectAndSuggestItems
export const MAX_OUTPUT_TOKENS_JSON = 1024; // For general JSON output from text models