/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Viewport3D } from './components/Viewport3D';
import { ControlPanel } from './components/ControlPanel';
import { TeethList } from './components/TeethList';
import { 
  Tooth, GrillSettings, DiamondSettings, DentalScan, 
  GrillMaterial, GrillStyle, DiamondPattern, DiamondClarity 
} from './types';
import { generateTeethList } from './utils/meshGenerator';
import { 
  Activity, ShieldAlert, Sparkles, BookOpen, 
  Layers, ChevronRight, HelpCircle 
} from 'lucide-react';

export default function App() {
  // --- Core Application State ---
  const [teeth, setTeeth] = useState<Tooth[]>(() => generateTeethList());
  const [selectedToothId, setSelectedToothId] = useState<number | null>(8); // Default to Central Incisor #8
  const [hoveredToothId, setHoveredToothId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'healthy' | 'segmented' | 'xray' | 'wireframe'>('segmented'); // Start with segmented for high impact!
  
  // --- Custom File Upload State ---
  const [customScanFile, setCustomScanFile] = useState<File | null>(null);
  const [loadedScan, setLoadedScan] = useState<DentalScan | null>(null);

  // --- Grill Engine Settings State ---
  const [showGrill, setShowGrill] = useState(true);
  const [grillSettings, setGrillSettings] = useState<GrillSettings>({
    material: GrillMaterial.YELLOW_GOLD_18K,
    style: GrillStyle.WINDOW, // Start with beautiful open window design!
    thickness: 0.6, // mm
    extrustionOffset: 0.15, // tightness factor (150μm)
    smoothness: 2,
    openBorders: false,
  });

  // --- Diamond Icing Settings State ---
  const [showDiamonds, setShowDiamonds] = useState(true);
  const [diamondSettings, setDiamondSettings] = useState<DiamondSettings>({
    enabled: true,
    pattern: DiamondPattern.BORDER_ONLY, // Fits perfectly on Open Face style!
    size: 1.2, // mm diameter
    density: 0.85, // close arrangement
    color: '#FFFFFF', // Canary yellow highlight looks beautiful on gold!
    clarity: DiamondClarity.VVS1,
    sparkleSpeed: 1.0,
  });

  // --- Environmental Shading ---
  const [showGingiva, setShowGingiva] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // --- Camera Commands ---
  const [cameraPreset, setCameraPreset] = useState<'front' | 'top' | 'left' | 'right' | null>(null);

  // --- Quick Feature Introduction Walkthrough Overlay ---
  const [showIntro, setShowIntro] = useState(true);

  // --- Callbacks / Operations ---
  
  const handleSelectTooth = (id: number | null) => {
    setSelectedToothId(id);
  };

  const handleHoverTooth = (id: number | null) => {
    setHoveredToothId(id);
  };

  const handleToggleToothGrill = (id: number) => {
    setTeeth((prevTeeth) =>
      prevTeeth.map((tooth) =>
        tooth.id === id ? { ...tooth, selectedForGrill: !tooth.selectedForGrill } : tooth
      )
    );
  };

  const handleBatchSelectTeeth = (type: 'all' | 'front' | 'none') => {
    setTeeth((prevTeeth) =>
      prevTeeth.map((tooth) => {
        if (type === 'all') {
          return { ...tooth, selectedForGrill: true };
        } else if (type === 'none') {
          return { ...tooth, selectedForGrill: false };
        } else if (type === 'front') {
          // FDI Central/Lateral/Canines (Universal IDs 6 to 11)
          const isFront = tooth.id >= 6 && tooth.id <= 11;
          return { ...tooth, selectedForGrill: isFront };
        }
        return tooth;
      })
    );
  };

  const handleFileUpload = (file: File) => {
    setCustomScanFile(file);
    // Switch shader mode to standard Ivory or Segmented to analyze
    setViewMode('segmented');
  };

  const handleClearScan = () => {
    setCustomScanFile(null);
    setLoadedScan(null);
  };

  const handleScanLoaded = (scan: DentalScan | null) => {
    setLoadedScan(scan);
  };

  const handleCameraPresetChange = (preset: 'front' | 'top' | 'left' | 'right') => {
    setCameraPreset(preset);
  };

  const handleCameraPresetComplete = () => {
    setCameraPreset(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-zinc-300 flex flex-col font-sans select-none antialiased">
      {/* Primary CAD Workstation Navigation Bar */}
      <header className="bg-[#0E1013] border-b border-zinc-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shadow-inner">
            <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight font-serif">DENTAL-GRILL <span className="text-blue-500 font-normal">CAD STUDIO</span></h1>
              <span className="px-1.5 py-0.5 text-[8px] bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded font-semibold uppercase tracking-wider">
                PoC Validator
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium tracking-wide">Automatic Dental Surface Segmentation & Procedural Jewelry Generation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="intro-guide-btn"
            onClick={() => setShowIntro(true)}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs rounded font-medium transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Guide
          </button>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#0A0B0D] border border-zinc-800 rounded text-[10px] font-mono text-zinc-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="tracking-wide uppercase text-[9px] font-semibold">GPU PIPELINE: ACCELERATED</span>
          </div>
        </div>
      </header>

      {/* Main CAD Layout Panel */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden bg-[#0A0B0D]">
        
        {/* LEFT COLUMN: Controls Config (4 spans) */}
        <section className="lg:col-span-3 flex flex-col h-[400px] lg:h-full min-h-[300px]">
          <ControlPanel
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            grillSettings={grillSettings}
            onGrillSettingsChange={setGrillSettings}
            showGrill={showGrill}
            onToggleGrill={setShowGrill}
            diamondSettings={diamondSettings}
            onDiamondSettingsChange={setDiamondSettings}
            showDiamonds={showDiamonds}
            onToggleDiamonds={setShowDiamonds}
            loadedScan={loadedScan}
            onFileUpload={handleFileUpload}
            onClearScan={handleClearScan}
            showGingiva={showGingiva}
            onToggleGingiva={setShowGingiva}
            showGrid={showGrid}
            onToggleGrid={setShowGrid}
            cameraPreset={cameraPreset}
            onCameraPresetChange={handleCameraPresetChange}
          />
        </section>

        {/* CENTER COLUMN: 3D Viewport (5 spans) */}
        <section className="lg:col-span-6 flex flex-col h-[500px] lg:h-full min-h-[350px]">
          <Viewport3D
            teeth={teeth}
            selectedToothId={selectedToothId}
            hoveredToothId={hoveredToothId}
            onSelectTooth={handleSelectTooth}
            onHoverTooth={handleHoverTooth}
            viewMode={viewMode}
            grillSettings={grillSettings}
            diamondSettings={diamondSettings}
            customScanFile={customScanFile}
            onScanLoaded={handleScanLoaded}
            showGingiva={showGingiva}
            showGrill={showGrill}
            showDiamonds={showDiamonds}
            showGrid={showGrid}
            cameraPreset={cameraPreset}
            onCameraPresetComplete={handleCameraPresetComplete}
          />
        </section>

        {/* RIGHT COLUMN: Mapping Index (3 spans) */}
        <section className="lg:col-span-3 flex flex-col h-[400px] lg:h-full min-h-[300px]">
          <TeethList
            teeth={teeth}
            selectedToothId={selectedToothId}
            hoveredToothId={hoveredToothId}
            onSelectTooth={handleSelectTooth}
            onHoverTooth={handleHoverTooth}
            onToggleToothGrill={handleToggleToothGrill}
            onBatchSelect={handleBatchSelectTeeth}
            grillSettings={grillSettings}
            diamondSettings={diamondSettings}
          />
        </section>

      </main>

      {/* Feature Guide Overlay Modal */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#0E1013] border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-xl shadow-2xl relative animate-scale-in">
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 mb-2 font-serif">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              Dental-Grill CAD Validation Workspace
            </h3>
            <p className="text-zinc-400 text-xs md:text-sm mb-6 leading-relaxed">
              Welcome to the high-fidelity validation sandbox demonstrating automated dental boundary detection and parametric jewelry drafting directly inside your browser.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">
                  1
                </div>
                <div>
                  <h4 className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">Automated Segmentation</h4>
                  <p className="text-zinc-400 text-xs mt-1">
                    Toggle <strong className="text-zinc-300">AI Segmentation</strong> in Shaders. The engine parses custom STL/OBJ uploads or our preloaded model, automatically tracing parabolic boundary curves to group vertices into 16 universal teeth regions.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">
                  2
                </div>
                <div>
                  <h4 className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">Interactive Raycasting Selection</h4>
                  <p className="text-zinc-400 text-xs mt-1">
                    Hover and click directly on the 3D model to select specific teeth. Use the right sidebar matrix to add/remove caps or instantly template the front smile zone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">
                  3
                </div>
                <div>
                  <h4 className="text-zinc-200 text-xs font-semibold uppercase tracking-wider">Procedural Jewelry Sleeve Drafts</h4>
                  <p className="text-zinc-400 text-xs mt-1">
                    Configure metal alloys, wrap clearances, and shell styles (Full Caps, Open Windows, canine Vampire Fangs) to render precise dental sleeves embedded with real-time glittering diamond lattices.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-end border-t border-zinc-800 pt-5">
              <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
                <span>Supports mouse and touch rotation</span>
              </div>
              <button
                id="close-intro-btn"
                onClick={() => setShowIntro(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded transition-all shadow-lg flex items-center justify-center gap-1 uppercase tracking-wider"
              >
                Launch CAD Simulator
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
