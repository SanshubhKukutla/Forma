
import React, { useState, useCallback } from 'react';
import RoomDesignForm from './components/RoomDesignForm';
import RoomDesignOutput from './components/RoomDesignOutput';
import { generateRoomDesign } from './services/geminiService';
import { RoomDesignFormInputs, DesignResult, SuggestedItem } from './types';

const App: React.FC = () => {
  const [designResult, setDesignResult] = useState<DesignResult | null>(null);
  const [formInputs, setFormInputs] = useState<RoomDesignFormInputs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDesign = useCallback(async (inputs: RoomDesignFormInputs) => {
    setIsLoading(true);
    setError(null);
    setFormInputs(inputs); // Store inputs for redesigns

    try {
      const result = await generateRoomDesign(
        inputs.roomImage,
        inputs.roomDimensions,
        inputs.existingObjects,
        inputs.designPrompt,
        inputs.designVibe,
        [], // No selected items for initial generation
      );
      setDesignResult({ ...result, selectedItems: [] }); // Initialize selectedItems
    } catch (err: unknown) {
      console.error("Failed to generate design:", err);
      setError((err as Error).message || "An unknown error occurred while generating the design. Please try again.");
      setDesignResult(null); // Clear previous design on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRedesign = useCallback(async (newPrompt: string, selectedItems: SuggestedItem[]) => {
    if (!formInputs || !designResult) {
      setError("No initial design to refine. Please generate a design first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Combine original design prompt with the new refinement prompt
    const updatedDesignPrompt = `${formInputs.designPrompt}. ${newPrompt}`;
    // Also consider the selected items as part of the new prompt instruction
    const itemsToIncorporate = selectedItems.length > 0
      ? `Ensure the following items are incorporated into the design: ${selectedItems.map(item => item.name).join(', ')}.`
      : '';
    const finalPrompt = `${updatedDesignPrompt} ${itemsToIncorporate}`.trim();

    try {
      const result = await generateRoomDesign(
        formInputs.roomImage,
        formInputs.roomDimensions,
        formInputs.existingObjects,
        finalPrompt, // Use the combined prompt with selected items
        formInputs.designVibe,
        selectedItems, // Pass selected items to the service for explicit prompting
      );
      setDesignResult({ ...result, selectedItems }); // Preserve selected items state
      // Update the stored form inputs to reflect the new prompt for further refinements
      setFormInputs(prevInputs => prevInputs ? { ...prevInputs, designPrompt: finalPrompt } : null);
    } catch (err: unknown) {
      console.error("Failed to refine design:", err);
      setError((err as Error).message || "An unknown error occurred while refining the design. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [formInputs, designResult]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-blue-100">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-5xl font-extrabold text-indigo-800 leading-tight">AI Room Designer</h1>
        <p className="mt-3 text-lg text-indigo-600">Transform your space with intelligent design suggestions.</p>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 w-full max-w-3xl" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      <main className="flex flex-col md:flex-row w-full max-w-6xl items-start justify-center">
        <RoomDesignForm onSubmit={handleGenerateDesign} isLoading={isLoading && !designResult} />

        {designResult && (
          <RoomDesignOutput
            designResult={designResult}
            onRedesign={handleRedesign}
            isLoading={isLoading && !!designResult}
          />
        )}
      </main>

      {/* Sticky Call-to-Action for potential future use or if more interaction points are added */}
      <footer className="fixed bottom-0 left-0 right-0 bg-indigo-700 text-white p-4 text-center shadow-lg">
        <p className="text-sm">Powered by Google Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
