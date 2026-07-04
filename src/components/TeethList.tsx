/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Tooth, ToothType, GrillSettings, DiamondSettings 
} from '../types';
import { estimateGrillSpecs } from '../utils/grillGenerator';
import { estimateDiamondSpecs } from '../utils/diamondGenerator';
import { 
  Award, Layers, CheckSquare, Square, 
  Sparkles, DollarSign, Scale, Calendar, HelpCircle 
} from 'lucide-react';

interface TeethListProps {
  teeth: Tooth[];
  selectedToothId: number | null;
  hoveredToothId: number | null;
  onSelectTooth: (id: number | null) => void;
  onHoverTooth: (id: number | null) => void;
  onToggleToothGrill: (id: number) => void;
  onBatchSelect: (type: 'all' | 'front' | 'none') => void;
  grillSettings: GrillSettings;
  diamondSettings: DiamondSettings;
}

export const TeethList: React.FC<TeethListProps> = ({
  teeth,
  selectedToothId,
  hoveredToothId,
  onSelectTooth,
  onHoverTooth,
  onToggleToothGrill,
  onBatchSelect,
  grillSettings,
  diamondSettings,
}) => {
  // Find currently active tooth (defaults to first central incisor if none selected)
  const activeTooth = teeth.find(t => t.id === selectedToothId) || teeth[7]; // Tooth ID 8
  
  // Calculate pricing specs
  const grillSpecs = estimateGrillSpecs(teeth, grillSettings);
  const diamondSpecs = estimateDiamondSpecs(teeth, diamondSettings);
  
  const totalCost = grillSpecs.costUSD + (diamondSettings.enabled ? diamondSpecs.addedCostUSD : 0);
  const totalStones = diamondSettings.enabled ? diamondSpecs.totalStones : 0;
  const totalCarats = diamondSettings.enabled ? diamondSpecs.totalCarats : 0;

  return (
    <div className="w-full flex flex-col bg-[#0E1013] border border-zinc-800 rounded-2xl h-full shadow-xl overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 bg-[#0A0B0D] border-b border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200 font-serif">Dental Arch Mapping</span>
        <span className="text-[10px] text-zinc-400 font-mono">16 SENSORS ACTIVE</span>
      </div>

      {/* Batch Select Controls */}
      <div className="p-3 bg-[#0E1013] border-b border-zinc-800 flex gap-2">
        <button
          id="batch-all-btn"
          onClick={() => onBatchSelect('all')}
          className="flex-1 py-1 px-2 text-[10px] font-medium text-zinc-300 hover:text-white bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 rounded transition-colors"
        >
          Select All
        </button>
        <button
          id="batch-front-btn"
          onClick={() => onBatchSelect('front')}
          className="flex-1 py-1 px-2 text-[10px] font-medium text-zinc-300 hover:text-white bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 rounded transition-colors flex items-center justify-center gap-1"
        >
          <Award className="w-3 h-3 text-blue-400" />
          Front Smile (6-11)
        </button>
        <button
          id="batch-none-btn"
          onClick={() => onBatchSelect('none')}
          className="flex-1 py-1 px-2 text-[10px] font-medium text-zinc-300 hover:text-white bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 rounded transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-[#0E1013]">
        
        {/* Interactive Teeth Map Grid */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5 font-serif">
            Upper Dental Arch (Teeth 1 - 16)
          </label>
          
          <div className="grid grid-cols-4 gap-2">
            {teeth.map((tooth) => {
              const isSelected = selectedToothId === tooth.id;
              const isHovered = hoveredToothId === tooth.id;
              const isGrilled = tooth.selectedForGrill;
              
              return (
                <div
                  id={`tooth-item-${tooth.id}`}
                  key={tooth.id}
                  onClick={() => onSelectTooth(tooth.id)}
                  onMouseEnter={() => onHoverTooth(tooth.id)}
                  onMouseLeave={() => onHoverTooth(null)}
                  className={`p-2 rounded-xl border text-center cursor-pointer transition-all relative ${
                    isSelected 
                      ? 'bg-zinc-950 border-blue-500 shadow-md scale-[1.02] z-10' 
                      : isHovered
                        ? 'bg-zinc-950/80 border-zinc-700'
                        : 'bg-zinc-950/30 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Segmentation Color Pip */}
                  <span 
                    className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full border border-zinc-950/60"
                    style={{ backgroundColor: tooth.color }}
                    title={`Tooth ${tooth.id} Color Badge`}
                  />Parenthesis

                  {/* Grill Included checkbox */}
                  <button
                    id={`toggle-tooth-grill-${tooth.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleToothGrill(tooth.id);
                    }}
                    className="absolute top-1 right-1 p-0.5 text-zinc-500 hover:text-blue-400 transition-colors"
                  >
                    {isGrilled ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </button>

                  <div className="mt-2 text-xs font-mono font-bold text-zinc-200">#{tooth.id}</div>
                  <div className="text-[8px] text-zinc-500 font-medium font-sans truncate">{tooth.type}</div>
                  <div className="text-[9px] text-zinc-400 font-mono mt-1">FDI {tooth.fdiId}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Tooth Inspection Info */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-[10px] font-mono text-blue-400">SELECTED DIODE</span>
            <span className="text-[10px] font-mono text-zinc-500">UNIVERSAL #{activeTooth.id}</span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-200 font-serif">{activeTooth.name}</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">Classification: {activeTooth.type}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
            <div className="bg-[#0E1013] p-2 rounded border border-zinc-800/60">
              <p className="text-zinc-500">Mesiodistal Width</p>
              <p className="text-zinc-200 font-mono font-semibold mt-0.5">{activeTooth.width.toFixed(1)} mm</p>
            </div>
            <div className="bg-[#0E1013] p-2 rounded border border-zinc-800/60">
              <p className="text-zinc-500">Anatomical Height</p>
              <p className="text-zinc-200 font-mono font-semibold mt-0.5">{activeTooth.height.toFixed(1)} mm</p>
            </div>
            <div className="bg-[#0E1013] p-2 rounded border border-zinc-800/60">
              <p className="text-zinc-500">Surface Curvature</p>
              <p className="text-zinc-200 font-mono font-semibold mt-0.5">{(activeTooth.curvature * 100).toFixed(0)}%</p>
            </div>
            <div className="bg-[#0E1013] p-2 rounded border border-zinc-800/60 flex flex-col justify-between">
              <p className="text-zinc-500">Grill Coverage</p>
              <button
                id="toggle-active-tooth-grill-btn"
                onClick={() => onToggleToothGrill(activeTooth.id)}
                className={`py-0.5 px-1.5 rounded text-[9px] font-medium mt-1 w-fit transition-colors ${
                  activeTooth.selectedForGrill 
                    ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                }`}
              >
                {activeTooth.selectedForGrill ? 'Active Cap' : 'Excluded'}
              </button>
            </div>
          </div>
        </div>

        {/* Manufacturing Ledger */}
        <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 font-serif">
            Labor & Manufacturing Specs
          </label>

          <div className="space-y-2">
            {/* 1. Metal Weight */}
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Scale className="w-3.5 h-3.5 text-zinc-500" />
                <span>Estimated Metal Weight</span>
              </div>
              <span className="font-mono font-bold text-zinc-200">{grillSpecs.weightGrams}g</span>
            </div>

            {/* 2. Diamonds Spec */}
            {diamondSettings.enabled && (
              <>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Total Diamonds Placed</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-200">{totalStones} stones</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Layers className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Estimated Carat Weight</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-200">{totalCarats} ct</span>
                </div>
              </>
            )}

            {/* 3. Labor Timeline */}
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Production Duration</span>
              </div>
              <span className="font-mono font-bold text-zinc-200">{grillSpecs.productionDays} days</span>
            </div>

            {/* Horizontal Break */}
            <div className="border-t border-zinc-800/80 my-2 pt-2" />

            {/* 4. Pricing */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-zinc-200">Total Prototyping Cost</span>
              </div>
              <span className="font-mono text-lg font-extrabold text-blue-400">
                ${totalCost.toLocaleString()}
              </span>
            </div>
          </div>
          
          <p className="text-[9px] text-zinc-500 text-center italic mt-1 leading-snug">
            PoC Estimates based on average casting densities of {grillSettings.material.split(' ').pop()} and hand-setting gem settings.
          </p>
        </div>

      </div>

      {/* Clinical Disclaimer footer */}
      <div className="p-3 bg-[#0A0B0D] border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center gap-1.5">
        <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        <span>Calculations represent diagnostic estimation models, not medical prescriptions.</span>
      </div>
    </div>
  );
};
