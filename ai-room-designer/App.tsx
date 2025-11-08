// App.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { RoomDesignFormInputs, SuggestedItem, AppView, InitialSuggestedItem, RoomDesignOutput as RoomDesignOutputType } from './types';
import { detectAndSuggestItems, generateRoomDesign } from './services/geminiService';
import RoomDesignForm from './components/RoomDesignForm';
import ItemSelection from './components/ItemSelection';
import RoomDesignOutput from './components/RoomDesignOutput';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.FORM);
  const [formInputs, setFormInputs] = useState<RoomDesignFormInputs | null>(null);
  const [initialSuggestedItems, setInitialSuggestedItems] = useState<InitialSuggestedItem[] | null>(null);
  const [roomDesignOutput, setRoomDesignOutput] = useState<RoomDesignOutputType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemsFromSelection, setSelectedItemsFromSelection] = useState<SuggestedItem[]>([]); // Items chosen in ItemSelection

  // The `window.aistudio` APIs are typically for specific environments
  // where user-selected keys are managed. For this app, we rely on the env var.
  // The `GoogleGenAI` initialization has been moved into the service functions
  // to ensure it uses the most up-to-date `process.env.API_KEY` for each call.
  // No explicit `checkApiKey` is needed here for non-Veo models.

  // Handler for the first step: Form Submission -> Item Selection
  const handleInitialSubmission = useCallback(async (inputs: RoomDesignFormInputs) => {
    setIsLoading(true);
    setError(null);
    setFormInputs(inputs); // Store form inputs for later use
    try {
      const suggestions = await detectAndSuggestItems(
        inputs.roomImage,
        inputs.existingObjects,
        inputs.designPrompt,
        inputs.designVibe
      );
      setInitialSuggestedItems(suggestions);
      setCurrentView(AppView.ITEM_SELECTION);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to get design suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler for Item Selection -> Final Image Generation
  const handleItemSelectionSubmit = useCallback(async (selectedItems: SuggestedItem[]) => {
    if (!formInputs) {
      setError("Form inputs are missing. Please go back and resubmit the form.");
      setCurrentView(AppView.FORM);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSelectedItemsFromSelection(selectedItems); // Store selected items for redesigns

    try {
      const result = await generateRoomDesign(
        formInputs.roomImage,
        formInputs.existingObjects,
        formInputs.designPrompt,
        formInputs.designVibe,
        selectedItems,
      );
      setRoomDesignOutput({
        generatedImageUrl: `data:${result.mimeType};base64,${result.imageBytes}`,
        selectedItemsForFinalDesign: selectedItems, // Pass through the selected items
      });
      setCurrentView(AppView.DESIGN_OUTPUT);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate final room design. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [formInputs]);

  // Handler for Redesign (from Output Page)
  const handleRedesign = useCallback(async (newPrompt: string, currentSelectedItems: SuggestedItem[]) => {
    if (!formInputs) {
      setError("Form inputs are missing. Please go back and resubmit the form.");
      setCurrentView(AppView.FORM);
      return;
    }
    setIsLoading(true);
    setError(null);

    // Update the designPrompt with the new prompt for redesign
    const updatedFormInputs: RoomDesignFormInputs = {
      ...formInputs,
      designPrompt: newPrompt, // Use the new prompt for redesign
    };
    setFormInputs(updatedFormInputs); // Persist updated prompt for potential future redesigns

    try {
      const result = await generateRoomDesign(
        updatedFormInputs.roomImage,
        updatedFormInputs.existingObjects,
        updatedFormInputs.designPrompt,
        updatedFormInputs.designVibe,
        currentSelectedItems, // Use the already selected items
      );
      setRoomDesignOutput({
        generatedImageUrl: `data:${result.mimeType};base64,${result.imageBytes}`,
        selectedItemsForFinalDesign: currentSelectedItems,
      });
      // Stay on DESIGN_OUTPUT view
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to redesign room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [formInputs]);

  const handleBackToItemSelection = useCallback(() => {
    setCurrentView(AppView.ITEM_SELECTION);
    setError(null); // Clear errors
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case AppView.FORM:
        return (
          <RoomDesignForm
            onSubmit={handleInitialSubmission}
            isLoading={isLoading}
            initialInputs={formInputs || undefined}
          />
        );
      case AppView.ITEM_SELECTION:
        if (initialSuggestedItems && formInputs) {
          return (
            <ItemSelection
              initialItems={initialSuggestedItems}
              onSubmit={handleItemSelectionSubmit}
              onBack={() => {
                setCurrentView(AppView.FORM);
                setError(null);
              }}
              isLoading={isLoading}
              formInputs={formInputs} // Pass formInputs to ItemSelection if needed for back button context
            />
          );
        }
        return <p className="text-center text-red-500 p-4">Error: Missing item suggestions. Please go back to the form.</p>;
      case AppView.DESIGN_OUTPUT:
        if (roomDesignOutput) {
          return (
            <RoomDesignOutput
              designOutput={roomDesignOutput}
              onRedesign={handleRedesign}
              isLoading={isLoading}
              onBackToItemSelection={handleBackToItemSelection}
            />
          );
        }
        return <p className="text-center text-red-500 p-4">Error: No final design to display. Please go back.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-extrabold text-indigo-800 my-8">Forma</h1>
      <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl">
        Transform your space with intelligent design suggestions.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 w-full max-w-2xl" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-white text-xl flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing your request...
          </div>
        </div>
      )}

      <main className="flex flex-col md:flex-row w-full max-w-6xl items-start justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;