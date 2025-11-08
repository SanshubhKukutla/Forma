
import React, { useState } from 'react';

interface ImageInputProps {
  label: string;
  onFileChange: (file: File | null) => void;
  currentFile: File | null;
}

const ImageInput: React.FC<ImageInputProps> = ({ label, onFileChange, currentFile }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFile ? URL.createObjectURL(currentFile) : null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      onFileChange(null);
      setPreviewUrl(null);
    }
  };

  const handleClear = () => {
    onFileChange(null);
    setPreviewUrl(null);
    const inputElement = document.getElementById(label.replace(/\s+/g, '-').toLowerCase()) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = ''; // Clear the file input
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="file"
        id={label.replace(/\s+/g, '-').toLowerCase()}
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
      />
      {previewUrl && (
        <div className="mt-4 flex flex-col items-center">
          <img src={previewUrl} alt="Image preview" className="max-w-xs h-auto rounded-lg shadow-md" />
          <button
            onClick={handleClear}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-sm"
          >
            Clear Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageInput;
