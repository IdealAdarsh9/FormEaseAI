import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { FilledField } from '../types';
import { DocumentIcon } from './Icons';

interface Props {
  imageSrc: string;
  isPdf: boolean;
  fields?: FilledField[];
  fileName?: string | null;
}

const FilledFormPreview: React.FC<Props> = ({ imageSrc, isPdf, fields, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      if (isPdf) {
        // Fallback for PDFs: Generate a text-only data sheet
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text("Filled Form Data Sheet", 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Reference for: ${fileName || 'Document'}`, 20, 30);
        
        doc.setFontSize(10);
        doc.text("Attach this sheet to your original form.", 20, 40);
        
        let yPos = 55;
        
        fields?.forEach((field) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          const val = field.value.length > 80 ? field.value.substring(0, 80) + '...' : field.value;
          doc.text(`• ${val}`, 20, yPos);
          yPos += 10;
        });

        doc.save(`filled_${fileName || 'form'}.pdf`);

      } else {
        // For Images: Generate visual overlay PDF
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'a4'
        });

        // Load image to get dimensions
        const img = new Image();
        img.src = imageSrc;
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Fit image to A4 (approx 446x630 px at default 72dpi, but jspdf uses different scaling)
        // A4 in px (1px = 1/96 inch) is approx 794x1123
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        doc.addImage(imageSrc, 'JPEG', 0, 0, pageWidth, pageHeight);

        // Overlay Text
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); // Black text

        if (fields) {
            fields.forEach(field => {
                if (field.box_2d) {
                    const [ymin, xmin, ymax, xmax] = field.box_2d;
                    // Coordinate scaling (gemini returns 0-1000 usually, sometimes 0-1. Normalize to 0-1)
                    let nY = ymin;
                    let nX = xmin;
                    
                    // Basic heuristic to detect 1000 scale
                    if (ymin > 1) nY = ymin / 1000;
                    if (xmin > 1) nX = xmin / 1000;

                    const finalX = nX * pageWidth;
                    const finalY = nY * pageHeight;
                    
                    // Small offset to center in box approximately or align bottom-left
                    // Adding a small background to text to make it readable?
                    // doc.setFillColor(255, 255, 255);
                    // doc.rect(finalX, finalY, 50, 10, 'F');
                    
                    // Adjust Y slightly to align with baseline (approx)
                    doc.text(field.value, finalX, finalY + 5); 
                }
            });
        }

        doc.save(`filled_${fileName || 'form'}.pdf`);
      }
    } catch (e) {
      console.error("PDF Generation failed", e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden mt-8 transition-colors">
      <div className="bg-slate-800 dark:bg-slate-950 px-6 py-4 border-b border-slate-700 dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
           <DocumentIcon className="w-5 h-5 text-green-400" />
           {isPdf ? "Form Data Sheet" : "Visual Auto-Fill Preview"}
        </h2>
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          {isGenerating ? "Generating..." : "Download PDF"}
        </button>
      </div>
      
      <div className="p-6 bg-slate-100 dark:bg-slate-950 flex justify-center transition-colors">
        {isPdf ? (
             <div className="bg-white dark:bg-slate-900 p-8 rounded shadow max-w-lg w-full text-center border border-slate-200 dark:border-slate-800">
                <p className="text-slate-800 dark:text-slate-300 mb-4 font-medium">
                    Since this is a PDF, we cannot overlay text directly in the browser.
                </p>
                <p className="font-bold text-slate-900 dark:text-white">
                    Click "Download PDF" to get a data sheet with all your answers formatted clearly.
                </p>
             </div>
        ) : (
            <div className="relative shadow-lg max-w-full" ref={containerRef}>
                <img src={imageSrc} alt="Form" className="max-w-full h-auto block rounded" />
                {fields?.map((field, idx) => {
                    if (!field.box_2d) return null;
                    const [ymin, xmin, ymax, xmax] = field.box_2d;
                    // Normalize coords
                    let top = ymin;
                    let left = xmin;
                    if (top > 1) top = top / 1000;
                    if (left > 1) left = left / 1000;

                    return (
                        <div
                            key={idx}
                            className="absolute bg-green-100/80 border border-green-500 text-green-900 text-[10px] md:text-xs px-1 rounded flex items-center whitespace-nowrap overflow-hidden font-medium"
                            style={{
                                top: `${top * 100}%`,
                                left: `${left * 100}%`,
                                transform: 'translateY(-50%)', // Center vertically on the line
                            }}
                            title={field.value}
                        >
                            {field.value}
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};

export default FilledFormPreview;