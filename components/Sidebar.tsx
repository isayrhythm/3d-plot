
import React, { useState } from 'react';
import { VisualizationState, CategoryStyle, PointShape } from '../types';

interface SidebarProps {
  state: VisualizationState;
  onUpdateStyle: (category: string, updates: Partial<CategoryStyle>) => void;
  onToggleAxes: () => void;
  onScreenshot: () => void;
  onClear: () => void;
}

const SHAPES: PointShape[] = ['circle', 'square', 'diamond', 'cross'];
const PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
  '#64748b', '#ffffff'
];

const Sidebar: React.FC<SidebarProps> = ({ state, onUpdateStyle, onToggleAxes, onScreenshot, onClear }) => {
  const { points, categories, categoryStyles, showAxes } = state;
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (points.length === 0) {
    return (
      <div className="p-12 h-full flex flex-col justify-center items-center text-center opacity-40">
        <i className="fa-solid fa-database text-4xl mb-4 text-slate-700"></i>
        <p className="text-slate-500 text-sm">No active data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-sliders text-blue-500 text-sm"></i>
          Controls
        </h2>
        <div className="flex gap-2">
           <button 
            onClick={onToggleAxes}
            className={`p-2 rounded-lg transition-colors border ${showAxes ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            title="Toggle Axes"
          >
            <i className="fa-solid fa-arrows-up-down-left-right"></i>
          </button>
          <button 
            onClick={onScreenshot}
            className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
            title="Take High-Res Screenshot"
          >
            <i className="fa-solid fa-camera"></i>
          </button>
          <button 
            onClick={onClear}
            className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Clear Data"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Categories & Styling</h3>
          <div className="space-y-2">
            {categories.map((cat) => {
              const style = categoryStyles[cat];
              const isExpanded = expandedCategory === cat;
              
              return (
                <div key={cat} className="rounded-xl border border-slate-800 overflow-hidden transition-all duration-200 bg-slate-900/40">
                  <div 
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/50 ${isExpanded ? 'bg-slate-800/80' : ''}`}
                    onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-sm shadow-inner" 
                        style={{ backgroundColor: style.color }}
                      />
                      <span className="text-sm font-medium text-slate-200">{cat}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUpdateStyle(cat, { visible: !style.visible }); }}
                        className={`text-xs ${style.visible ? 'text-blue-500' : 'text-slate-600'}`}
                      >
                        <i className={`fa-solid ${style.visible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                      <i className={`fa-solid fa-chevron-down text-[10px] text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-slate-950/30 border-t border-slate-800 animate-in slide-in-from-top-2 duration-200">
                      {/* Color Picker */}
                      <div className="mb-4">
                        <label className="text-[10px] text-slate-500 block mb-2 font-bold uppercase">Color</label>
                        <div className="grid grid-cols-6 gap-2">
                          {PALETTE.map(color => (
                            <div 
                              key={color} 
                              onClick={() => onUpdateStyle(cat, { color })}
                              className={`w-full aspect-square rounded cursor-pointer border-2 transition-transform hover:scale-110 ${style.color === color ? 'border-white' : 'border-transparent'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Shape Selection */}
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-2 font-bold uppercase">Marker Shape</label>
                        <div className="flex gap-3">
                          {SHAPES.map(shape => (
                            <button
                              key={shape}
                              onClick={() => onUpdateStyle(cat, { shape })}
                              className={`flex-grow p-2 rounded border text-xs transition-colors ${style.shape === shape ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                              <i className={`fa-solid ${
                                shape === 'circle' ? 'fa-circle' : 
                                shape === 'square' ? 'fa-square' : 
                                shape === 'diamond' ? 'fa-diamond' : 'fa-plus'
                              }`}></i>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-slate-950/50 border-t border-white/5">
        <div className="flex justify-between text-[10px] font-mono text-slate-600">
          <span>WEBGL 2.0 ACTIVE</span>
          <span>FPS: 60</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
