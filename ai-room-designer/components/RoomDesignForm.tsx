// components/RoomDesignForm.tsx

import React, { useState, useEffect } from 'react';
import ImageInput from './ImageInput';
import { RoomDesignFormInputs } from '../types';

interface RoomDesignFormProps {
  onSubmit: (inputs: RoomDesignFormInputs) => void;
  isLoading: boolean;
  initialInputs?: RoomDesignFormInputs; // For re-populating form after back navigation
}

const RoomDesignForm: React.FC<RoomDesignFormProps> = ({ onSubmit, isLoading, initialInputs }) => {
  const [roomImage, setRoomImage] = useState<File | null>(initialInputs?.roomImage || null);
  const [existingObjects, setExistingObjects] = useState(initialInputs?.existingObjects || '');
  const [designPrompt, setDesignPrompt] = useState(initialInputs?.designPrompt || '');
  const [designVibe, setDesignVibe] = useState(initialInputs?.designVibe || '');

  useEffect(() => {
    if (initialInputs) {
      setRoomImage(initialInputs.roomImage);
      setExistingObjects(initialInputs.existingObjects);
      setDesignPrompt(initialInputs.designPrompt);
      setDesignVibe(initialInputs.designVibe);
    }
  }, [initialInputs]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ roomImage, existingObjects, designPrompt, designVibe });
  };

  return (
    <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow-xl m-4 flex-shrink-0">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Design Your Room</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ImageInput
          label="Upload Room Image (Optional)"
          onFileChange={setRoomImage}
          currentFile={roomImage}
        />

        <div>
          <label htmlFor="existing-objects" className="block text-sm font-medium text-gray-700 mb-2">
            Existing Objects (e.g., "Queen bed", "wooden desk", "wardrobe")
          </label>
          <textarea
            id="existing-objects"
            value={existingObjects}
            onChange={(e) => setExistingObjects(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
            placeholder="List any furniture or large objects already in the room."
          ></textarea>
        </div>

        <div>
          <label htmlFor="design-prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Design Goals / Specifics
          </label>
          <textarea
            id="design-prompt"
            value={designPrompt}
            onChange={(e) => setDesignPrompt(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
            placeholder="Describe what you want to achieve. E.g., 'Add a reading nook', 'Maximize storage', 'Improve lighting'."
          ></textarea>
        </div>

        <div>
          <label htmlFor="design-vibe" className="block text-sm font-medium text-gray-700 mb-2">
            Desired Vibe / Style
          </label>
          <input
            type="text"
            id="design-vibe"
            value={designVibe}
            onChange={(e) => setDesignVibe(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
            placeholder="E.g., 'Cozy and rustic', 'Modern minimalist', 'Vibrant bohemian'"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-6 py-3 rounded-md text-white font-semibold shadow-md transition duration-200
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {isLoading ? 'Getting Design Suggestions...' : 'Get Design Suggestions'}
        </button>
      </form>
    </div>
  );
};

export default RoomDesignForm;