// types.ts

export enum AppView {
  FORM = 'form',
  ITEM_SELECTION = 'item_selection',
  DESIGN_OUTPUT = 'design_output',
}

export interface ItemOption {
  optionName: string; // e.g., "Modern White"
  description: string; // e.g., "Sleek, low-profile sofa in white leather."
}

export interface SuggestedItem {
  name: string;
  description: string;
  estimatedPriceRange: string; // e.g., "$100 - $200", "$150"
  searchQuery: string; // e.g., "modern white sofa"
}

export interface InitialSuggestedItem extends SuggestedItem {
  options: ItemOption[];
}

export interface RoomDesignFormInputs {
  roomImage: File | null;
  existingObjects: string;
  designPrompt: string;
  designVibe: string;
}

export interface GeneratedImage {
  imageBytes: string;
  mimeType: string;
}

export interface RoomDesignOutput {
  generatedImageUrl: string;
  // designSummary: string; // Removed as per user request
  // suggestedItems: SuggestedItem[]; // Removed as per user request
  selectedItemsForFinalDesign: SuggestedItem[]; // These are the items the user chose to include
}

// Global window object augmentation for Pannellum, needed for direct JS calls
declare global {
  interface Window {
    pannellum: {
      viewer: (
        container: string | HTMLElement,
        config: {
          type?: string;
          panorama?: string;
          hfov?: number;
          vfov?: number;
          minHfov?: number;
          maxHfov?: number;
          minVfov?: number;
          maxVfov?: number;
          minPitch?: number;
          maxPitch?: number;
          maxLevel?: number;
          northOffset?: number;
          pitch?: number;
          yaw?: number;
          roll?: number;
          autoLoad?: boolean;
          autoRotate?: number;
          compass?: boolean;
          friction?: number;
          verticalPan?: boolean;
          verticalViewLimiting?: boolean;
          showFullscreenCtrl?: boolean;
          showZoomCtrl?: boolean;
          hotSpotDebug?: boolean;
          doubleClickZoom?: boolean;
          keyboardZoom?: boolean;
          mouseZoom?: boolean;
          draggable?: boolean;
          speed?: number;
          basePath?: string;
          preview?: string;
          author?: string;
          title?: string;
          sceneFadeDuration?: number;
          'static'?: boolean;
          dynamic?: boolean;
          dynamicUpdate?: boolean;
          dynamicParameters?: {
            baseURI?: string;
            jsonp?: boolean;
            jsonpPrefix?: string;
          };
          hotSpots?: Array<{
            pitch: number;
            yaw: number;
            type: string;
            text: string;
            URL?: string;
            cssClass?: string;
            createTooltipFunc?: (hotSpotDiv: HTMLElement, args: any) => void;
            clickHandlerFunc?: (evt: Event, hotSpotId: string, args: any) => void;
            sceneId?: string;
            targetYaw?: number;
            targetPitch?: number;
            targetHfov?: number;
          }>;
        }
      ) => PannellumViewer;
    };
  }

  interface PannellumViewer {
    setPanorama: (panoramaId: string, initialConfig?: object) => void;
    load: (panoramaId: string, initialConfig?: object, callback?: () => void) => void;
    destroy: () => void;
    getPitch: () => number;
    setPitch: (pitch: number, animated?: boolean) => void;
    getYaw: () => number;
    setYaw: (yaw: number, animated?: boolean) => void;
getHfov: () => number;
setHfov: (hfov: number, animated?: boolean) => void;
  }
}
