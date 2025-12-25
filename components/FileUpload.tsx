
import React, { useState } from 'react';
import { DataPoint } from '../types';

interface FileUploadProps {
  onDataLoaded: (points: DataPoint[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const categoryColors: Record<string, string> = {};
    const colorPalette = [
      '#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', 
      '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#94a3b8'
    ];
    let colorIndex = 0;

    const points: DataPoint[] = lines.map((line, idx) => {
      const cols = line.split(',').map(c => c.trim());
      
      // We expect 5 columns: X, Y, Z, Label, Metadata/Misc
      const x = parseFloat(cols[0]) || 0;
      const y = parseFloat(cols[1]) || 0;
      const z = parseFloat(cols[2]) || 0;
      const label = cols[3] || 'Unlabeled';
      const metadata = cols[4] || '';

      if (!categoryColors[label]) {
        categoryColors[label] = colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
      }

      return {
        x, y, z, 
        label, 
        metadata,
        color: categoryColors[label]
      };
    });

    onDataLoaded(points);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCSV(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div 
      className={`relative group border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
        isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => processCSV(event.target?.result as string);
          reader.readAsText(file);
        }
      }}
    >
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center">
        <i className="fa-solid fa-file-csv text-3xl text-slate-400 group-hover:text-blue-400 mb-2 transition-colors"></i>
        <span className="text-slate-300 font-medium">Select or Drop CSV</span>
        <span className="text-slate-500 text-xs mt-1">Format: X, Y, Z, Category, Info</span>
      </div>
    </div>
  );
};

export default FileUpload;
