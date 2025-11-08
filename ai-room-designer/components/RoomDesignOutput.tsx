import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DesignResult, SuggestedItem } from '../types';
import { PANORAMA_WIDTH, PANORAMA_HEIGHT } from '../constants';

interface RoomDesignOutputProps {
  designResult: DesignResult;
  onRedesign: (newPrompt: string, selectedItems: SuggestedItem[]) => void; // Updated signature
  isLoading: boolean;
}

const RoomDesignOutput: React.FC<RoomDesignOutputProps> = ({ designResult, onRedesign, isLoading }) => {
  const { images, designSummary, suggestedItems: initialSuggestedItems } = designResult; // Renamed for clarity
  const [redesignPrompt, setRedesignPrompt] = useState('');
  const [selectedItems, setSelectedItems] = useState<SuggestedItem[]>(designResult.selectedItems || []); // Initialize with previously selected
  const panoramaRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0); // State for slider 0-100%
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);


  // Effect to update selected items if designResult changes (e.g., new generation)
  useEffect(() => {
    setSelectedItems(designResult.selectedItems || []);
    // Reset scroll position to 0 when a new design result comes in
    setScrollPosition(0);
    if (panoramaRef.current) {
      panoramaRef.current.scrollLeft = 0;
    }
  }, [designResult.selectedItems, designResult.images]); // Added designResult.images to trigger on new image

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(event.target.value, 10);
    setScrollPosition(newPosition);
    if (panoramaRef.current) {
      const maxScroll = panoramaRef.current.scrollWidth - panoramaRef.current.clientWidth;
      if (maxScroll > 0) { // Only scroll if there's actual scrollable content
        panoramaRef.current.scrollLeft = (newPosition / 100) * maxScroll;
      }
    }
  };

  // Sync internal slider state with actual scroll position if user drags
  const handleScroll = useCallback(() => {
    if (panoramaRef.current) {
      const maxScroll = panoramaRef.current.scrollWidth - panoramaRef.current.clientWidth;
      if (maxScroll > 0) {
        const currentPercentage = (panoramaRef.current.scrollLeft / maxScroll) * 100;
        setScrollPosition(Math.round(currentPercentage));
      } else {
        setScrollPosition(0);
      }
    }
  }, []); // No dependencies for useCallback, as it only reads ref.current which is stable

  const handleMouseDown = (e: React.MouseEvent) => {
    if (panoramaRef.current) {
      setIsDragging(true);
      dragStartX.current = e.pageX - panoramaRef.current.offsetLeft;
      scrollStartX.current = panoramaRef.current.scrollLeft;
      panoramaRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !panoramaRef.current) return;
    e.preventDefault(); // Prevent text selection during drag
    const x = e.pageX - panoramaRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5; // Adjust scroll speed
    panoramaRef.current.scrollLeft = scrollStartX.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (panoramaRef.current) {
      panoramaRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (panoramaRef.current) {
        panoramaRef.current.style.cursor = 'grab';
      }
    }
  };

  useEffect(() => {
    const panoramaElement = panoramaRef.current;
    if (panoramaElement) {
      panoramaElement.addEventListener('scroll', handleScroll);
      // Initialize slider position based on current scroll
      handleScroll();
      return () => {
        panoramaElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll, panoramaRef]); // Added panoramaRef to dependencies for useEffect, it's a ref object, but its .current can change

  const handleToggleItem = (item: SuggestedItem) => {
    setSelectedItems(prev =>
      prev.some(selected => selected.name === item.name)
        ? prev.filter(selected => selected.name !== item.name)
        : [...prev, item]
    );
  };

  const calculateTotalEstimatedCost = (): string => {
    let totalMin = 0;
    let totalMax = 0;
    let hasRange = false; 

    selectedItems.forEach(item => {
      if (item.estimatedPriceRange) {
        // Extract numbers, allowing for decimals
        const priceNumbers = item.estimatedPriceRange.match(/\d+(\.\d{1,2})?/g);
        if (priceNumbers && priceNumbers.length > 0) {
          const numbers = priceNumbers.map(s => parseFloat(s)).filter(n => !isNaN(n));

          if (numbers.length > 0) {
            // If only one number, min and max are the same
            const minPrice = numbers.length === 1 ? numbers[0] : Math.min(...numbers);
            const maxPrice = numbers.length === 1 ? numbers[0] : Math.max(...numbers);

            totalMin += minPrice;
            totalMax += maxPrice;

            if (minPrice !== maxPrice) {
              hasRange = true;
            }
          }
        }
      }
    });

    if (totalMin === 0 && totalMax === 0) {
      return "N/A";
    }

    // Format output based on whether a range was detected or if min/max are different
    if (hasRange && totalMin !== totalMax) {
      return `$${totalMin.toFixed(0)} - $${totalMax.toFixed(0)}`;
    } else {
      return `$${totalMin.toFixed(0)}`; // If no range, or min/max are same, just show single value
    }
  };

  const handleRedesignSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (redesignPrompt.trim()) {
      onRedesign(redesignPrompt, selectedItems); // Pass selected items
      setRedesignPrompt('');
    }
  };

  const panoramaImage = images.length > 0 ? images[0] : null;
  const totalCost = calculateTotalEstimatedCost();

  return (
    <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow-xl m-4 flex-shrink-0">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your AI-Designed Room</h2>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="ml-4 text-xl text-indigo-700">Refining Design...</p>
        </div>
      )}

      {panoramaImage && (
        <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden relative">
          <p className="text-sm text-gray-600 text-center mb-2">Use the slider or drag to explore the 360° view</p>
          <div
            ref={panoramaRef}
            className="overflow-x-scroll no-scrollbar scroll-smooth"
            style={{
              width: '100%',
              height: `${PANORAMA_HEIGHT}px`,
              whiteSpace: 'nowrap',
              position: 'relative',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={`data:image/jpeg;base64,${panoramaImage.base64Data}`}
              alt={panoramaImage.alt}
              className="inline-block" // Removed object-cover
              style={{
                width: `${PANORAMA_WIDTH * 8}px`, // Increased width for better 360 effect
                height: '100%',
                maxWidth: 'none', // Ensure image doesn't shrink
                userSelect: 'none',
              }}
              draggable="false"
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={scrollPosition}
            onChange={handleSliderChange}
            className="w-full mt-4 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-xl dark:bg-gray-700"
            aria-label="360 view slider"
          />
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Design Summary</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{designSummary}</p>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Suggested Items</h3>
        {initialSuggestedItems.length === 0 ? (
          <p className="text-gray-600">No specific items were suggested for this design.</p>
        ) : (
          <ul className="space-y-4">
            {initialSuggestedItems.map((item, index) => (
              <li key={item.name + index} className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm">
                <input
                  type="checkbox"
                  id={`item-${item.name}-${index}`}
                  checked={selectedItems.some(selected => selected.name === item.name)}
                  onChange={() => handleToggleItem(item)}
                  className="mt-1 mr-3 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor={`item-${item.name}-${index}`} className="text-lg font-medium text-gray-900 cursor-pointer">
                    {item.name}
                  </label>
                  <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Estimated Price: <span className="font-semibold">{item.estimatedPriceRange || "N/A"}</span>
                    {item.searchQuery && (
                        <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(item.searchQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-indigo-600 hover:text-indigo-800 underline text-xs"
                        >
                            (Search Online)
                        </a>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg text-lg font-bold text-indigo-800">
          Total Estimated Cost for Selected Items: {totalCost}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Redesign / Refine</h3>
        <form onSubmit={handleRedesignSubmit} className="space-y-4">
          <textarea
            rows={3}
            value={redesignPrompt}
            onChange={(e) => setRedesignPrompt(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out resize-y bg-white"
            placeholder="Tell me what you'd like to change or add (e.g., 'Make the sofa a different color', 'Add a large plant in the corner', 'Change to a minimalist style')."
            disabled={isLoading}
          ></textarea>
          <button
            type="submit"
            disabled={isLoading || !redesignPrompt.trim()}
            className={`w-full py-3 px-6 rounded-md text-white font-semibold shadow-md transition duration-200 ease-in-out
              ${isLoading || !redesignPrompt.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'}`}
          >
            {isLoading ? 'Applying Changes...' : 'Refine Design'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomDesignOutput;