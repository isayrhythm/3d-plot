
import React, { useState, useCallback, useRef } from 'react';
import { DataPoint, VisualizationState, CategoryStyle, PointShape } from './types';
import DataVisualizer, { DataVisualizerHandle } from './components/DataVisualizer';
import FileUpload from './components/FileUpload';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [state, setState] = useState<VisualizationState>({
    points: [],
    categories: [],
    categoryStyles: {},
    showAxes: true,
    isLoading: false,
    error: null,
  });

  const visualizerRef = useRef<DataVisualizerHandle>(null);

  const handleDataLoaded = useCallback((points: DataPoint[]) => {
    const categories = Array.from(new Set(points.map(p => p.label)));
    const styles: Record<string, CategoryStyle> = {};
    
    // Default palette
    const colorPalette = [
      '#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', 
      '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#94a3b8'
    ];

    categories.forEach((cat, i) => {
      styles[cat] = {
        color: colorPalette[i % colorPalette.length],
        shape: 'circle',
        visible: true,
      };
    });

    setState(prev => ({
      ...prev,
      points,
      categories,
      categoryStyles: styles,
      isLoading: false,
      error: null,
    }));
  }, []);

  const updateCategoryStyle = (category: string, updates: Partial<CategoryStyle>) => {
    setState(prev => ({
      ...prev,
      categoryStyles: {
        ...prev.categoryStyles,
        [category]: { ...prev.categoryStyles[category], ...updates }
      }
    }));
  };

  const toggleAxes = () => {
    setState(prev => ({ ...prev, showAxes: !prev.showAxes }));
  };

  const handleScreenshot = () => {
    visualizerRef.current?.takeScreenshot();
  };

  const clearData = () => {
    setState({
      points: [],
      categories: [],
      categoryStyles: {},
      showAxes: true,
      isLoading: false,
      error: null,
    });
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col md:flex-row">
      {/* 3D Viewport */}
      <div className="flex-grow h-full relative">
        {state.points.length > 0 ? (
          <DataVisualizer 
            ref={visualizerRef}
            points={state.points} 
            categoryStyles={state.categoryStyles}
            showAxes={state.showAxes}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="text-center p-8 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-2xl max-w-md mx-4">
              <div className="w-20 h-20 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-cube text-4xl animate-pulse"></i>
              </div>
              <h1 className="text-2xl font-bold mb-4 text-white">VoxNavigator 3D</h1>
              <p className="text-slate-400 mb-8">
                Upload your CSV data (X, Y, Z, Label, Metadata) to explore in 3D space.
              </p>
              <FileUpload onDataLoaded={handleDataLoaded} />
            </div>
          </div>
        )}

        {/* HUD Info */}
        {state.points.length > 0 && (
          <div className="absolute top-6 left-6 z-20 pointer-events-none space-y-2">
            <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
              <h2 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Active Dataset</h2>
              <p className="text-white text-lg font-mono leading-none">{state.points.length.toLocaleString()} Points</p>
            </div>
          </div>
        )}
      </div>

      {/* Control Sidebar */}
      <div className="w-full md:w-96 bg-slate-900/90 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col shadow-2xl">
        <Sidebar 
          state={state} 
          onUpdateStyle={updateCategoryStyle}
          onToggleAxes={toggleAxes}
          onScreenshot={handleScreenshot}
          onClear={clearData}
        />
      </div>
    </div>
  );
};

export default App;
