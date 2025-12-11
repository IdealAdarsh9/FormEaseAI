import React, { useRef, useState, useCallback } from 'react';
import { CameraIcon, UploadIcon, XIcon, DocumentIcon, PdfIcon } from './Icons';

interface Props {
  onImageSelected: (base64: string, fileName: string) => void;
  selectedImage: string | null;
  fileName?: string | null;
  onClear: () => void;
}

const ImageUploader: React.FC<Props> = ({ onImageSelected, selectedImage, fileName, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    // Check for image or PDF
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert("Please upload an image or a PDF file.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelected(reader.result as string, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  // Determine if the selected document is a PDF
  const isPdf = selectedImage?.startsWith('data:application/pdf');

  if (selectedImage) {
    return (
      <div className="relative w-full max-w-md mx-auto aspect-[3/4] md:aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 glass-panel flex flex-col items-center justify-center transition-all animate-fade-in bg-white dark:bg-slate-900/40">
        {isPdf ? (
            <div className="flex flex-col items-center text-slate-800 dark:text-slate-300 p-6">
                <PdfIcon className="w-20 h-20 text-red-500 mb-4 drop-shadow-lg" />
                <p className="font-bold text-lg text-center break-all px-4">{fileName || 'PDF Document'}</p>
            </div>
        ) : (
            <img 
            src={selectedImage} 
            alt="Document Preview" 
            className="w-full h-full object-contain" 
            />
        )}
        
        <button
          onClick={(e) => {
             e.preventDefault();
             onClear();
          }}
          className="absolute top-4 right-4 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors backdrop-blur-md shadow-lg border border-white/20"
          aria-label="Remove file"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer w-full max-w-md mx-auto h-72 
        rounded-[2rem] border-2 border-dashed transition-all duration-300 ease-out
        flex flex-col items-center justify-center p-6 text-center
        backdrop-blur-xl shadow-lg
        
        /* Light Mode Glass */
        bg-white/60 border-slate-400/60 hover:bg-white/80 hover:border-primary-500
        
        /* Dark Mode Glass */
        dark:bg-slate-900/40 dark:border-slate-700/60 dark:hover:bg-slate-800/60
        
        ${isDragging 
          ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-900/30 scale-[1.02] shadow-xl' 
          : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="bg-white/90 dark:bg-slate-800/70 p-5 rounded-full mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-slate-200 dark:border-white/10">
        <DocumentIcon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Upload Form or Document
      </h3>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-[220px] leading-relaxed">
        Drop your image or PDF here, or click to browse
      </p>

      {/* Decorative elements */}
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 group-hover:-translate-y-1">
        <UploadIcon className="w-6 h-6 text-slate-500 dark:text-slate-500" />
      </div>
    </div>
  );
};

export default ImageUploader;