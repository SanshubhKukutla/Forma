
import React from 'react';
import ImageInput from './ImageInput';
import { RoomDesignFormInputs } from '../types';

interface RoomDesignFormProps {
  onSubmit: (inputs: RoomDesignFormInputs) => void;
  isLoading: boolean;
}

const RoomDesignForm: React.FC<RoomDesignFormProps> = ({ onSubmit, isLoading }) => {
  const [roomImage, setRoomImage] = React.useState<File | null>(null);
  const [roomDimensions, setRoomDimensions] = React.useState<string>('e.g., 10ft x 12ft, or a sketch with dimensions');
  const [existingObjects, setExistingObjects] = React.useState<string>('e.g., bed, wardrobe, desk, chair');
  const [designPrompt, setDesignPrompt] = React.useState<string>('e.g., a cozy reading nook, modern minimalist living room');
  const [designVibe, setDesignVibe] = React.useState<string>('e.g., warm & inviting, sleek & futuristic, rustic farmhouse');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ roomImage, roomDimensions, existingObjects, designPrompt, designVibe });
  };

  return (
    <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow-xl m-4 flex-shrink-0">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Design Your Dream Room</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageInput
          label="Upload Room Image (Optional for Redesign)"
          onFileChange={setRoomImage}
          currentFile={roomImage}
        />

        <div>
          <label htmlFor="roomDimensions" className="block text-sm font-medium text-gray-700 mb-2">
            Room Dimensions <span className="text-gray-500 text-xs">(e.g., 10ft x 12ft, or a sketch with dimensions)</span>
          </label>
          <input
            type="text"
            id="roomDimensions"
            value={roomDimensions}
            onChange={(e) => setRoomDimensions(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out bg-white"
          />
        </div>

        <div>
          <label htmlFor="existingObjects" className="block text-sm font-medium text-gray-700 mb-2">
            Existing Objects (Comma-separated, e.g., bed, wardrobe, desk)
          </label>
          <textarea
            id="existingObjects"
            rows={3}
            value={existingObjects}
            onChange={(e) => setExistingObjects(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out resize-y bg-white"
            placeholder="List any major furniture or decor you want to keep or account for..."
          ></textarea>
        </div>

        <div>
          <label htmlFor="designPrompt" className="block text-sm font-medium text-gray-700 mb-2">
            Design Prompt <span className="text-gray-500 text-xs">(e.g., a cozy reading nook, modern minimalist living room)</span>
          </label>
          <textarea
            id="designPrompt"
            rows={4}
            value={designPrompt}
            onChange={(e) => setDesignPrompt(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out resize-y bg-white"
            placeholder="Describe your ideal room design, specific elements, or functional needs."
          ></textarea>
        </div>

        <div>
          <label htmlFor="designVibe" className="block text-sm font-medium text-gray-700 mb-2">
            Design Vibe <span className="text-gray-500 text-xs">(e.g., warm & inviting, sleek & futuristic, rustic farmhouse)</span>
          </label>
          <input
            type="text"
            id="designVibe"
            value={designVibe}
            onChange={(e) => setDesignVibe(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-md text-white font-semibold shadow-md transition duration-200 ease-in-out
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'}`}
        >
          {isLoading ? 'Generating Design...' : 'Generate Design'}
        </button>
      </form>
    </div>
  );
};

export default RoomDesignForm;
