
import React, { useState, useRef } from 'react';
import { TrashIcon } from './icons/TrashIcon';
import { CameraIcon } from './icons/CameraIcon';
import { RecycleIcon } from './icons/RecycleIcon';
import { UploadIcon } from './icons/UploadIcon';

interface ZeroWasteFormProps {
  onGenerate: (images: string[]) => void;
  onBack: () => void;
  onTakePhoto: () => void;
  images: string[];
  onSetImages: (images: string[]) => void;
}

const ZeroWasteForm: React.FC<ZeroWasteFormProps> = ({ onGenerate, onBack, onTakePhoto, images, onSetImages }) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (event.target.files) {
      const files = Array.from(event.target.files);
      if (images.length + files.length > 3) {
        setError("You can upload a maximum of 3 images.");
        return;
      }

      const filePromises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises)
        .then(newImageUrls => {
          onSetImages([...images, ...newImageUrls]);
        })
        .catch(err => {
          console.error("Error reading files:", err);
          setError("There was an error uploading the images.");
        });
    }
  };

  const removeImage = (index: number) => {
    onSetImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (images.length < 1) {
      setError("Please upload at least one image.");
      return;
    }
    setError(null);
    onGenerate(images);
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card dark:bg-dark-card p-8 rounded-2xl shadow-2xl space-y-6 my-10">
        <button onClick={onBack} className="text-sm text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary">&larr; Back to Home</button>
        <div className="text-center">
            <RecycleIcon className="w-16 h-16 mx-auto text-primary dark:text-dark-primary" />
            <h1 className="text-5xl font-display text-center text-primary-dark dark:text-dark-primary-dark mt-2">Zero-Waste Optimizer</h1>
            <p className="text-center text-text-secondary dark:text-dark-text-secondary mt-2">Add 1-3 photos of your pantry or leftovers.</p>
        </div>
        
        {error && <div role="alert" className="p-3 bg-red-100 text-red-700 rounded-md text-center font-medium">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-h-[8rem]">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img src={image} alt={`upload-preview-${index + 1}`} className="w-full h-32 object-cover rounded-md" />
              <button 
                onClick={() => removeImage(index)} 
                aria-label={`Remove image ${index + 1}`}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {images.length < 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 px-4 py-3 text-md font-semibold text-primary-dark dark:text-dark-primary-dark transition-colors bg-card dark:bg-dark-card border-2 border-primary dark:border-dark-primary rounded-full hover:bg-primary-light dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <UploadIcon className="w-6 h-6" />
              Upload File
            </button>
            <button
              type="button"
              onClick={onTakePhoto}
              className="flex w-full items-center justify-center gap-2 px-4 py-3 text-md font-semibold text-primary-dark dark:text-dark-primary-dark transition-colors bg-card dark:bg-dark-card border-2 border-primary dark:border-dark-primary rounded-full hover:bg-primary-light dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <CameraIcon className="w-6 h-6" />
              Take Photo
            </button>
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        <button 
          onClick={handleSubmit} 
          disabled={images.length === 0}
          aria-disabled={images.length === 0}
          className="w-full py-3 px-4 bg-primary dark:bg-dark-primary text-white font-semibold text-lg rounded-full shadow-lg hover:bg-primary-dark dark:hover:bg-dark-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Generate Recipe
        </button>
      </div>
    </div>
  );
};

export default ZeroWasteForm;