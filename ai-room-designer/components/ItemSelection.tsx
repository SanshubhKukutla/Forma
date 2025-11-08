// components/ItemSelection.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { InitialSuggestedItem, SuggestedItem, ItemOption, RoomDesignFormInputs } from '../types';

interface ItemSelectionProps {
  initialItems: InitialSuggestedItem[];
  onSubmit: (selectedItems: SuggestedItem[]) => void;
  onBack: () => void;
  isLoading: boolean;
  formInputs: RoomDesignFormInputs; // To potentially use when navigating back
}

const ItemSelection: React.FC<ItemSelectionProps> = ({ initialItems, onSubmit, onBack, isLoading, formInputs }) => {
  // State to hold the currently selected option for each item
  const [selections, setSelections] = useState<{ [itemName: string]: ItemOption | null }>({});

  // Initialize selections with the first option for each item or null
  useEffect(() => {
    const initialSelections: { [itemName: string]: ItemOption | null } = {};
    initialItems.forEach(item => {
      if (item.options && item.options.length > 0) {
        initialSelections[item.name] = item.options[0]; // Select the first option by default
      } else {
        initialSelections[item.name] = null; // No options available
      }
    });
    setSelections(initialSelections);
  }, [initialItems]);

  const handleOptionChange = (itemName: string, option: ItemOption) => {
    setSelections(prev => ({ ...prev, [itemName]: option }));
  };

  const calculateTotalEstimatedCost = useMemo(() => {
    let minTotal = 0;
    let maxTotal = 0;

    initialItems.forEach(item => {
      const selectedOption = selections[item.name];
      if (selectedOption && item.estimatedPriceRange) {
        // Parse the price range, e.g., "$100 - $200" or "$150"
        const cleanedRange = item.estimatedPriceRange.replace(/[$,]/g, '').trim();
        const parts = cleanedRange.split('-').map(p => parseFloat(p.trim()));

        if (parts.length === 1 && !isNaN(parts[0])) {
          minTotal += parts[0];
          maxTotal += parts[0];
        } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          minTotal += parts[0];
          maxTotal += parts[1];
        }
      }
    });
    return minTotal === 0 && maxTotal === 0
      ? "N/A"
      : `$${minTotal.toFixed(0)} - $${maxTotal.toFixed(0)}`;
  }, [initialItems, selections]);


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const finalSelectedItems: SuggestedItem[] = initialItems.map(item => {
      const selectedOption = selections[item.name];
      if (selectedOption) {
        return {
          name: item.name,
          description: selectedOption.description, // Use option description for the AI prompt
          estimatedPriceRange: item.estimatedPriceRange, // Keep base item's price range
          searchQuery: item.searchQuery, // Keep base item's search query
        };
      }
      // Fallback if no option is explicitly selected (should not happen with default selection)
      return {
        name: item.name,
        description: item.description, // Use the base item's description
        estimatedPriceRange: item.estimatedPriceRange,
        searchQuery: item.searchQuery,
      };
    });

    onSubmit(finalSelectedItems);
  };

  return (
    <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow-xl m-4 flex-shrink-0">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Refine Design Selections</h2>
      <p className="text-gray-700 mb-6 text-center">
        Choose your preferred style for each suggested item below. These selections will be used to generate your final room design.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {initialItems.map((item) => (
          <div key={item.name} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{item.name}</h3>
            <p className="text-sm text-gray-600 mb-2">Base Item: {item.description}</p>
            <p className="text-sm text-gray-600 mb-4">Estimated Price: {item.estimatedPriceRange}</p>

            {item.options && item.options.length > 0 ? (
              <div className="space-y-3">
                {item.options.map((option, index) => (
                  <label key={option.optionName} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`item-${item.name}`}
                      value={option.optionName}
                      checked={selections[item.name]?.optionName === option.optionName}
                      onChange={() => handleOptionChange(item.name, option)}
                      className="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-1"
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{option.optionName}</span>
                      <p className="text-sm text-gray-700">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No specific options available for this item. Using base description.</p>
            )}
          </div>
        ))}

        <div className="text-lg font-bold text-gray-800 text-right mt-6 pr-2">
          Total Estimated Cost: {calculateTotalEstimatedCost}
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-md text-gray-700 font-semibold bg-gray-200 hover:bg-gray-300 transition duration-200"
            disabled={isLoading}
          >
            Back to Form
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 rounded-md text-white font-semibold shadow-md transition duration-200
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isLoading ? 'Generating Final Design...' : 'Generate Final Design'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemSelection;