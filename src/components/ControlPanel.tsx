/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  Upload, Sparkles, Layers, Sliders, Gem, Eye, 
  Trash2, RefreshCw, Grid, Info, HardDrive, ShieldCheck 
} from 'lucide-react';
import { 
  GrillMaterial, GrillStyle, GrillSettings, 
  DiamondPattern, DiamondClarity, DiamondSettings, DentalScan 
} from '../types';
import { DIAMOND_COLORS } from '../utils/diamondGenerator';

interface ControlPanelProps {
  viewMode: 'healthy' | 'segmented' | 'xray' | 'wireframe';
  onViewModeChange: (mode: 'healthy' | 'segmented' | 'xray' | 'wireframe') => void;
  
  grillSettings: GrillSettings;
  onGrillSettingsChange: (settings: GrillSettings) => void;
  showGrill: boolean;
  onToggleGrill: (show: boolean) => void;

  diamondSettings: DiamondSettings;
  onDiamondSettingsChange: (settings: DiamondSettings) => void;
  showDiamonds: boolean;
  onToggleDiamonds: (show: boolean) => void;

  loadedScan: DentalScan | null;
  onFileUpload: (file: File) => void;
  onClearScan: () => void;

  showGingiva: boolean;
  onToggleGingiva: (show: boolean) => void;
  showGrid: boolean;
  onToggleGrid: (show: boolean) => void;

  cameraPreset: 'front' | 'top' | 'left' | 'right' | null;
  onCameraPresetChange: (preset: 'front' | 'top' | 'left' | 'right') => void;

  activeTab?: 'scan' | 'grill' | 'diamonds';
  onActiveTabChange?: (tab: 'scan' | 'grill' | 'diamonds') => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  viewMode,
  onViewModeChange,
  grillSettings,
  onGrillSettingsChange,
  showGrill,
  onToggleGrill,
  diamondSettings,
  onDiamondSettingsChange,
  showDiamonds,
  onToggleDiamonds,
  loadedScan,
  onFileUpload,
  onClearScan,
  showGingiva,
  onToggleGingiva,
  showGrid,
  onToggleGrid,
  cameraPreset,
  onCameraPresetChange,
  activeTab: externalActiveTab,
  onActiveTabChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localActiveTab, setLocalActiveTab] = useState<'scan' | 'grill' | 'diamonds'>('scan');

  const activeTab = externalActiveTab !== undefined ? externalActiveTab : localActiveTab;
  const setActiveTab = onActiveTabChange !== undefined ? onActiveTabChange : setLocalActiveTab;

  // Drag and Drop files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'stl' || ext === 'obj') {
        onFileUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const selectPresetCamera = (preset: 'front' | 'top' | 'left' | 'right') => {
    onCameraPresetChange(preset);
  };

  return (
    <div className="w-full flex flex-col bg-[#0E1013] border border-zinc-800 rounded-2xl h-full shadow-xl overflow-hidden">
      {/* CAD Branding Banner */}
      <div className="p-4 bg-[#0A0B0D] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200 font-serif">Dental-Grill CAD Engine</span>
        </div>
        <span className="px-2 py-0.5 bg-zinc-850 border border-zinc-700 text-[10px] font-mono text-blue-400 rounded">v0.9.0-PoC</span>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex bg-[#0E1013] border-b border-zinc-800">
        <button
          id="tab-scan"
          onClick={() => setActiveTab('scan')}
          className={`flex-1 py-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'scan'
              ? 'border-blue-500 text-white bg-zinc-900/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          Scan Setup
        </button>
        <button
          id="tab-grill"
          onClick={() => setActiveTab('grill')}
          className={`flex-1 py-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'grill'
              ? 'border-blue-500 text-white bg-zinc-900/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Grill Specs
        </button>
        <button
          id="tab-diamonds"
          onClick={() => setActiveTab('diamonds')}
          className={`flex-1 py-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'diamonds'
              ? 'border-blue-500 text-white bg-zinc-900/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10'
          }`}
        >
          <Gem className="w-3.5 h-3.5" />
          Diamond Icing
        </button>
      </div>

      {/* Scrolling Config Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-[#0E1013]">
        
        {/* ================= SCAN SETUP TAB ================= */}
        {activeTab === 'scan' && (
          <div className="space-y-5 animate-fade-in">
            {/* File upload box */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-serif">
                1. Load Dental Arch Mesh
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-500/10'
                    : loadedScan 
                      ? 'border-blue-500/30 bg-zinc-950/30 hover:border-blue-500/50' 
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".stl,.obj"
                  className="hidden"
                />
                
                {loadedScan ? (
                  <>
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 mb-2">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <p className="text-zinc-200 text-xs font-medium line-clamp-1 px-2">{loadedScan.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{loadedScan.fileSize}</p>
                    <div className="flex gap-2 mt-3 w-full max-w-[180px]">
                      <button
                        id="clear-scan-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearScan();
                        }}
                        className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-medium rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Reset Arch
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-zinc-600 mb-2.5" />
                    <p className="text-zinc-200 text-xs font-medium">Drag & Drop 3D Scan</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Accepts raw STL or OBJ files</p>
                    <p className="text-[9px] text-zinc-500 mt-1 italic">Or interact with our high-fidelity preloaded demo arch</p>
                  </>
                )}
              </div>
            </div>

            {/* Diagnostic View Modes */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-serif">
                2. Clinical Shader Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'healthy', label: 'Ivory Shaded', desc: 'Standard teeth surface' },
                  { id: 'segmented', label: 'AI Segmentation', desc: 'Individual teeth highlights' },
                  { id: 'xray', label: 'Diagnostic X-Ray', desc: 'Translucent roots' },
                  { id: 'wireframe', label: 'Polygon Mesh', desc: 'Clinical wireframe structure' }
                ].map((mode) => (
                  <button
                    id={`view-mode-${mode.id}`}
                    key={mode.id}
                    onClick={() => onViewModeChange(mode.id as any)}
                    className={`p-2.5 border rounded-xl text-left transition-all relative ${
                      viewMode === mode.id
                        ? 'bg-blue-500/10 border-blue-500 text-white shadow'
                        : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <p className="text-[11px] font-semibold">{mode.label}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">{mode.desc}</p>
                    {viewMode === mode.id && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                  </button>
                ))}
              </div>
              
              {viewMode === 'segmented' && (
                <div className="mt-2.5 p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>The dental mesh has been parsed. Each color represents a segmented single tooth ID (FDI World Dental Federation standard). Click teeth directly on the mesh or in the right sidebar.</span>
                </div>
              )}
            </div>

            {/* Camera View Presets */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-serif">
                3. Camera View Angles
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'front', label: 'Front' },
                  { id: 'top', label: 'Occlusal' },
                  { id: 'left', label: 'Left' },
                  { id: 'right', label: 'Right' },
                ].map((preset) => (
                  <button
                    id={`camera-preset-${preset.id}`}
                    key={preset.id}
                    onClick={() => selectPresetCamera(preset.id as any)}
                    className="py-1.5 px-2 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded text-[10px] font-medium transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical Base Toggles */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-serif">
                4. View Toggles
              </label>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">Render Gingiva (Gums Base)</span>
                  <input
                    id="toggle-gingiva"
                    type="checkbox"
                    checked={showGingiva}
                    onChange={(e) => onToggleGingiva(e.target.checked)}
                    className="w-8 h-4 rounded-full appearance-none bg-zinc-800 checked:bg-blue-500 relative before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-zinc-100 before:top-0.5 before:left-0.5 checked:before:left-4.5 before:transition-all cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">Clinical Horizontal Floor Grid</span>
                  <input
                    id="toggle-grid"
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => onToggleGrid(e.target.checked)}
                    className="w-8 h-4 rounded-full appearance-none bg-zinc-800 checked:bg-blue-500 relative before:content-[''] before:absolute before:w-3 before:h-3 before:rounded-full before:bg-zinc-100 before:top-0.5 before:left-0.5 checked:before:left-4.5 before:transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PROCEDURAL GRILL Specs TAB ================= */}
        {activeTab === 'grill' && (
          <div className="space-y-5 animate-fade-in">
            {/* Grill Layer Toggle */}
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-xs font-semibold text-zinc-200">Enable Grill Sleeve Layer</span>
                  <p className="text-[10px] text-zinc-400">Renders custom generated surface</p>
                </div>
              </div>
              <input
                id="toggle-grill"
                type="checkbox"
                checked={showGrill}
                onChange={(e) => onToggleGrill(e.target.checked)}
                className="w-10 h-5 rounded-full appearance-none bg-zinc-800 checked:bg-blue-500 relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-zinc-100 before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all cursor-pointer"
              />
            </div>

            {showGrill ? (
              <>
                {/* 1. Metal Material Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-serif">
                    1. Metal Alloy Formula
                  </label>
                  <select
                    id="select-grill-material"
                    value={grillSettings.material}
                    onChange={(e) => onGrillSettingsChange({ ...grillSettings, material: e.target.value as GrillMaterial })}
                    className="w-full bg-[#0A0B0D] border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {Object.values(GrillMaterial).map((mat) => (
                      <option key={mat} value={mat}>
                        {mat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Grill Design Style */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-serif">
                    2. Surface Shell Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(GrillStyle).map((style) => (
                      <button
                        id={`grill-style-${style}`}
                        key={style}
                        onClick={() => onGrillSettingsChange({ ...grillSettings, style })}
                        className={`p-2 border rounded-xl text-left transition-all ${
                          grillSettings.style === style
                            ? 'bg-blue-500/10 border-blue-500 text-white'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-[11px] font-medium">{style}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Physical Thickness */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-serif">
                      3. Wall Shell Thickness
                    </label>
                    <span className="text-xs font-mono font-medium text-blue-400">
                      {grillSettings.thickness.toFixed(1)} mm
                    </span>
                  </div>
                  <input
                    id="input-grill-thickness"
                    type="range"
                    min="0.3"
                    max="1.5"
                    step="0.1"
                    value={grillSettings.thickness}
                    onChange={(e) => onGrillSettingsChange({ ...grillSettings, thickness: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                    <span>Ultra-thin (0.3mm)</span>
                    <span>Thick Cap (1.5mm)</span>
                  </div>
                </div>

                {/* 4. Fit Offset */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-serif">
                      4. Internal Fit Clearance (Tightness)
                    </label>
                    <span className="text-xs font-mono font-medium text-blue-400">
                      {(grillSettings.extrustionOffset * 1000).toFixed(0)} μm
                    </span>
                  </div>
                  <input
                    id="input-grill-clearance"
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={grillSettings.extrustionOffset}
                    onChange={(e) => onGrillSettingsChange({ ...grillSettings, extrustionOffset: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                    <span>Clinical Snap (100μm)</span>
                    <span>Loose Slip (500μm)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center border border-zinc-800 bg-zinc-950/20 rounded-2xl flex flex-col items-center justify-center">
                <Sliders className="w-10 h-10 text-zinc-700 mb-2" />
                <p className="text-zinc-400 text-xs">Grill Layer Disabled</p>
                <p className="text-[10px] text-zinc-500 mt-1">Toggle the sleeve layer on to configure custom CAD metal offsets.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= DIAMOND ICING TAB ================= */}
        {activeTab === 'diamonds' && (
          <div className="space-y-5 animate-fade-in">
            {/* Diamonds Layer Toggle */}
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-xs font-semibold text-zinc-200">Iced Out Settings</span>
                  <p className="text-[10px] text-zinc-400">Add sparkling diamonds on grill</p>
                </div>
              </div>
              <input
                id="toggle-diamonds"
                type="checkbox"
                disabled={!showGrill}
                checked={showDiamonds}
                onChange={(e) => onToggleDiamonds(e.target.checked)}
                className="w-10 h-5 rounded-full appearance-none bg-zinc-800 checked:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-zinc-100 before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all cursor-pointer"
              />
            </div>

            {!showGrill ? (
              <div className="p-8 text-center border border-zinc-800 bg-zinc-950/20 rounded-2xl flex flex-col items-center justify-center">
                <Sliders className="w-10 h-10 text-zinc-700 mb-2" />
                <p className="text-zinc-400 text-xs">Grill Sleeve Inactive</p>
                <p className="text-[10px] text-zinc-500 mt-1">You must enable the Grill Spec sleeve before placing custom diamonds.</p>
              </div>
            ) : showDiamonds ? (
              <>
                {/* 1. Placement Pattern */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-serif">
                    1. Diamond Distribution Matrix
                  </label>
                  <select
                    id="select-diamond-pattern"
                    value={diamondSettings.pattern}
                    onChange={(e) => onDiamondSettingsChange({ ...diamondSettings, pattern: e.target.value as DiamondPattern })}
                    className="w-full bg-[#0A0B0D] border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {Object.values(DiamondPattern).map((pat) => (
                      <option key={pat} value={pat}>
                        {pat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Diamond Cut Carat Size */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-serif">
                      2. Gem Carat Diameter
                    </label>
                    <span className="text-xs font-mono font-medium text-blue-400">
                      Ø {diamondSettings.size.toFixed(1)} mm
                    </span>
                  </div>
                  <input
                    id="input-diamond-size"
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.1"
                    value={diamondSettings.size}
                    onChange={(e) => onDiamondSettingsChange({ ...diamondSettings, size: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                    <span>Micro Accent (1.0mm)</span>
                    <span>Large Solitaire (2.5mm)</span>
                  </div>
                </div>

                {/* 3. Diamond Density */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-serif">
                      3. Inter-Stone Placement Spacing
                    </label>
                    <span className="text-xs font-mono font-medium text-blue-400">
                      {(diamondSettings.density * 100).toFixed(0)} %
                    </span>
                  </div>
                  <input
                    id="input-diamond-density"
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={diamondSettings.density}
                    onChange={(e) => onDiamondSettingsChange({ ...diamondSettings, density: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                    <span>Sparse Spacing</span>
                    <span>Ultra-Tight Pavé</span>
                  </div>
                </div>

                {/* 4. Gemstone Color Tone */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-serif">
                    4. Colored Gemstone selection
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIAMOND_COLORS.map((col) => (
                      <button
                        id={`diamond-color-${col.name}`}
                        key={col.name}
                        onClick={() => onDiamondSettingsChange({ ...diamondSettings, color: col.hex })}
                        className={`p-2 border rounded-xl text-left transition-all flex items-center gap-2 ${
                          diamondSettings.color === col.hex
                            ? 'bg-blue-500/10 border-blue-500 text-white'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0" 
                          style={{ backgroundColor: col.colorVal === 0xffffff ? '#F3F4F6' : col.hex }}
                        />
                        <span className="text-[10px] font-medium leading-none truncate">{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Glimmer Sparkle Speed */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-serif">
                      5. Real-time Reflection Twinkle Speed
                    </label>
                    <span className="text-xs font-mono font-medium text-blue-400">
                      {diamondSettings.sparkleSpeed.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    id="input-diamond-sparkle"
                    type="range"
                    min="0.1"
                    max="2.5"
                    step="0.1"
                    value={diamondSettings.sparkleSpeed}
                    onChange={(e) => onDiamondSettingsChange({ ...diamondSettings, sparkleSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                    <span>Clinical Static</span>
                    <span>Hyper Sparkle (2.5x)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center border border-zinc-800 bg-zinc-950/20 rounded-2xl flex flex-col items-center justify-center">
                <Gem className="w-10 h-10 text-zinc-700 mb-2" />
                <p className="text-zinc-400 text-xs">Diamonds Layer Disabled</p>
                <p className="text-[10px] text-zinc-500 mt-1">Toggle the Iced Out settings on to distribute custom precious stones on the metal caps.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CAD Diagnostic Footnote */}
      <div className="p-3.5 bg-[#0A0B0D] border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between font-mono">
        <span>GRID SNAP: CALIBRATED</span>
        <span>AXES: EPSG:4978 (XYZ)</span>
      </div>
    </div>
  );
};
