// components/RoomDesignOutput.tsx

import React, { useEffect, useRef } from 'react';
import { RoomDesignOutput as RoomDesignOutputType, SuggestedItem } from '../types';

interface RoomDesignOutputProps {
  designOutput: RoomDesignOutputType | null;
  onRedesign: (newPrompt: string, selectedItems: SuggestedItem[]) => void;
  isLoading: boolean;
  onBackToItemSelection: () => void;
}

const RoomDesignOutput: React.FC<RoomDesignOutputProps> = ({ designOutput, onRedesign, isLoading, onBackToItemSelection }) => {
  const pannellumViewerRef = useRef<PannellumViewer | null>(null);
  const redesignPromptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (designOutput?.generatedImageUrl) {
      // Destroy existing viewer if it exists
      if (pannellumViewerRef.current) {
        pannellumViewerRef.current.destroy();
        pannellumViewerRef.current = null;
      }

      // Initialize Pannellum viewer
      // The `panorama` property can be a URL or a Base64 data URI
      pannellumViewerRef.current = window.pannellum.viewer('panorama-viewer', {
        type: 'equirectangular', // Even if not a true equirectangular, this projects the wide image
        panorama: designOutput.generatedImageUrl,
        autoLoad: true,
        autoRotate: -2, // Gentle auto-rotation
        showZoomCtrl: false,
        showFullscreenCtrl: true,
        compass: true,
        // Removed `orientationOnByDefault` as it is not a valid Pannellum configuration property.
        // `compass: true` typically enables device motion controls on supported devices.
        friction: 0.1,
        draggable: true,
        mouseZoom: true,
        keyboardZoom: false,
        hfov: 100, // Horizontal field of view, adjust as needed for optimal look
      });
    }

    // Cleanup function
    return () => {
      if (pannellumViewerRef.current) {
        pannellumViewerRef.current.destroy();
        pannellumViewerRef.current = null;
      }
    };
  }, [designOutput?.generatedImageUrl]);


  const handleRedesignSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const newPrompt = redesignPromptRef.current?.value || '';
    if (newPrompt.trim()) {
      onRedesign(newPrompt, designOutput?.selectedItemsForFinalDesign || []);
    }
  };

  if (!designOutput) {
    return <div className="text-center p-4 text-gray-600">No design to display. Please generate one.</div>;
  }

  return (
    <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow-xl m-4 flex-shrink-0 flex flex-col">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your AI-Designed Room</h2>

      <div className="relative w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden mb-6 shadow-lg">
        <div id="panorama-viewer" className="w-full h-full"></div>
        <div className="absolute top-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-center text-sm">
          Drag or use your device's motion sensors to explore the room in 360°.
        </div>
      </div>

      <div className="space-y-4">
        <form onSubmit={handleRedesignSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <label htmlFor="redesign-prompt" className="block text-lg font-medium text-gray-700 mb-2">
            Want to refine your design?
          </label>
          <textarea
            ref={redesignPromptRef}
            id="redesign-prompt"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
            placeholder="Describe changes you'd like. E.g., 'Change the sofa to a vibrant blue', 'Add more plants', 'Make it brighter'."
            disabled={isLoading}
          ></textarea>
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={onBackToItemSelection}
              className="px-6 py-3 rounded-md text-gray-700 font-semibold bg-gray-200 hover:bg-gray-300 transition duration-200"
              disabled={isLoading}
            >
              Back to Item Selection
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-3 rounded-md text-white font-semibold shadow-md transition duration-200
                ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isLoading ? 'Redesigning...' : 'Redesign Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomDesignOutput;