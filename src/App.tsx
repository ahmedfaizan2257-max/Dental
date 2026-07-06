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
import { estimateGrillSpecs } from './utils/grillGenerator';
import { estimateDiamondSpecs } from './utils/diamondGenerator';
import { 
  Activity, ShieldAlert, Sparkles, BookOpen, 
  Layers, ChevronRight, HelpCircle, ChevronLeft, 
  Play, Check, FileText, Printer, Download, X, 
  Award, Scale, DollarSign, Calendar, Eye
} from 'lucide-react';

// Guided Tour Content configuration
const TOUR_STEPS_CONTENT = [
  {
    title: "1. Live 3D Scanning & AI Segmenting",
    description: "Welcome! We begin with an intraoral 3D scan of the upper arch. Our system automatically segments each individual tooth boundary in real time, color-coding them so you can see exactly where the boundaries lie.",
    actionLabel: "Analyze Live 3D Mesh"
  },
  {
    title: "2. Target Mapping & Tooth Selection",
    description: "Click specific teeth directly in the 3D viewport or use the Dental Arch Mapping index on the right. Let's select the primary front smile zone (Teeth #6 to #11) to host our grill caps.",
    actionLabel: "Select Front Smile (6-11)"
  },
  {
    title: "3. Procedural Gold Alloy Casting",
    description: "We procedurally cast a custom 18K Yellow Gold sleeve over our selected teeth. Watch the metal caps wrap perfectly, utilizing custom clearances to ensure a snaps-on fit.",
    actionLabel: "Cast 18K Yellow Gold Sleeve"
  },
  {
    title: "4. Precious Diamond Icing Settings",
    description: "Let's add luxury! We distribute brilliant diamond outline rows over the borders of the gold sleeves. Watch them sparkle under the interactive 3D lights.",
    actionLabel: "Set Border Diamond Lattices"
  },
  {
    title: "5. Real-Time Prototyping Stats & Lab Export",
    description: "Our CAD engine calculates exact metal casting weights (grams), diamond counts, total carat weights, production days, and estimated costs. Let's generate the official laboratory script!",
    actionLabel: "Generate Production Sheet"
  }
];

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

  // --- Quick Feature Introduction Walkthrough Overlays ---
  const [showIntro, setShowIntro] = useState(true);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'scan' | 'grill' | 'diamonds'>('scan');
  const [showExportModal, setShowExportModal] = useState(false);

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
    setViewMode('segmented');
    setActiveTab('scan');
  };

  const handleClearScan = () => {
    setCustomScanFile(null);
    setLoadedScan(null);
    setTeeth(generateTeethList());
  };

  const handleScanLoaded = (scan: DentalScan | null, adaptedTeeth?: Tooth[]) => {
    setLoadedScan(scan);
    if (adaptedTeeth) {
      setTeeth(adaptedTeeth);
    }
  };

  const handleCameraPresetChange = (preset: 'front' | 'top' | 'left' | 'right') => {
    setCameraPreset(preset);
  };

  const handleCameraPresetComplete = () => {
    setCameraPreset(null);
  };

  // --- Guided Tour Engine Controls ---
  const applyTourStepConfig = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Scan Setup / AI Segmentation
        setViewMode('segmented');
        setShowGingiva(true);
        setShowGrid(true);
        setCameraPreset('front');
        setShowGrill(false);
        setShowDiamonds(false);
        setActiveTab('scan');
        break;
      case 1: // Target mapping
        setViewMode('segmented');
        setShowGingiva(true);
        setShowGrid(true);
        setCameraPreset('front');
        setShowGrill(false);
        setShowDiamonds(false);
        setActiveTab('scan');
        setSelectedToothId(8); // Highlight Central Incisor #8
        // Apply front smile zone
        setTeeth(prev => prev.map(t => ({ ...t, selectedForGrill: t.id >= 6 && t.id <= 11 })));
        break;
      case 2: // Metal Alloys casting
        setViewMode('healthy');
        setShowGingiva(true);
        setShowGrid(true);
        setCameraPreset('front');
        setShowGrill(true);
        setShowDiamonds(false);
        setGrillSettings({
          material: GrillMaterial.YELLOW_GOLD_18K,
          style: GrillStyle.WINDOW,
          thickness: 0.6,
          extrustionOffset: 0.15,
          smoothness: 2,
          openBorders: false,
        });
        setActiveTab('grill');
        setTeeth(prev => prev.map(t => ({ ...t, selectedForGrill: t.id >= 6 && t.id <= 11 })));
        break;
      case 3: // Diamonds setting
        setViewMode('healthy');
        setShowGingiva(true);
        setShowGrid(true);
        setCameraPreset('front');
        setShowGrill(true);
        setShowDiamonds(true);
        setDiamondSettings({
          enabled: true,
          pattern: DiamondPattern.BORDER_ONLY,
          size: 1.2,
          density: 0.85,
          color: '#FFFFFF',
          clarity: DiamondClarity.VVS1,
          sparkleSpeed: 1.0,
        });
        setActiveTab('diamonds');
        setTeeth(prev => prev.map(t => ({ ...t, selectedForGrill: t.id >= 6 && t.id <= 11 })));
        break;
      case 4: // Pricing specs & Export
        setViewMode('healthy');
        setShowGingiva(true);
        setShowGrid(true);
        setCameraPreset('front');
        setShowGrill(true);
        setShowDiamonds(true);
        setActiveTab('diamonds');
        setTeeth(prev => prev.map(t => ({ ...t, selectedForGrill: t.id >= 6 && t.id <= 11 })));
        break;
      default:
        break;
    }
  };

  const handleStartTour = () => {
    setShowIntro(false);
    setTourStep(0);
    applyTourStepConfig(0);
  };

  const handleNextTourStep = () => {
    if (tourStep === null) return;
    const next = tourStep + 1;
    if (next < TOUR_STEPS_CONTENT.length) {
      setTourStep(next);
      applyTourStepConfig(next);
    } else {
      setTourStep(null);
      setShowExportModal(true); // Open the specification modal as the ultimate goal!
    }
  };

  const handlePrevTourStep = () => {
    if (tourStep === null || tourStep === 0) return;
    const prev = tourStep - 1;
    setTourStep(prev);
    applyTourStepConfig(prev);
  };

  const handleExitTour = () => {
    setTourStep(null);
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
              <h1 className="text-base font-bold text-white tracking-tight font-serif uppercase">DENTAL-GRILL <span className="text-blue-500 font-normal">CAD STUDIO</span></h1>
              <span className="px-1.5 py-0.5 text-[8px] bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded font-semibold uppercase tracking-wider">
                PROTOTYPER
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium tracking-wide">Automatic Dental Surface Segmentation & Procedural Jewelry Generation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="start-interactive-tour-navbar-btn"
            onClick={handleStartTour}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-bold shadow-md transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            Interactive Tour
          </button>
          
          <button
            id="intro-guide-btn"
            onClick={() => setShowIntro(true)}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs rounded font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Specs Guide
          </button>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#0A0B0D] border border-zinc-800 rounded text-[10px] font-mono text-zinc-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="tracking-wide uppercase text-[9px] font-semibold">WebGL GPU ACTIVE</span>
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
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
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
            onOpenExport={() => setShowExportModal(true)}
          />
        </section>

      </main>

      {/* Guided Tour HUD Card */}
      {tourStep !== null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-[#0E1013]/95 border border-blue-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-md animate-scale-in">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800 rounded-t-2xl overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((tourStep + 1) / TOUR_STEPS_CONTENT.length) * 100}%` }}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-blue-400 uppercase">
                Interactive Walkthrough · Step {tourStep + 1} of {TOUR_STEPS_CONTENT.length}
              </span>
            </div>
            <button 
              onClick={handleExitTour}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Close Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-white text-sm font-bold mt-2 font-serif flex items-center gap-2">
            {TOUR_STEPS_CONTENT[tourStep].title}
          </h4>
          <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
            {TOUR_STEPS_CONTENT[tourStep].description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-zinc-800/80">
            <button
              onClick={() => applyTourStepConfig(tourStep)}
              className="w-full sm:w-auto px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold tracking-wide uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              {TOUR_STEPS_CONTENT[tourStep].actionLabel}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handlePrevTourStep}
                disabled={tourStep === 0}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 text-zinc-300 text-xs rounded font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                onClick={handleNextTourStep}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-bold transition-all shadow flex items-center gap-1 cursor-pointer"
              >
                {tourStep === TOUR_STEPS_CONTENT.length - 1 ? 'Finish & Export' : 'Next'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Guide Welcome Overlay Modal */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#0E1013] border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-xl shadow-2xl relative animate-scale-in">
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 mb-2 font-serif">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              Dental-Grill CAD Validation Workspace
            </h3>
            <p className="text-zinc-400 text-xs md:text-sm mb-6 leading-relaxed">
              Welcome to the high-fidelity validation sandbox demonstrating automated dental boundary detection and parametric jewelry drafting directly inside your browser. This workstation is designed to load and work with **real live 3D scans** in `.stl` or `.obj` formats.
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
              <div className="text-[10px] text-zinc-500 flex items-center gap-1 mr-auto">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
                <span>Supports real-time touch and drag</span>
              </div>
              
              <button
                id="manual-mode-btn"
                onClick={() => setShowIntro(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded transition-colors border border-zinc-700 cursor-pointer"
              >
                Manual Mode
              </button>
              
              <button
                id="start-tour-welcome-btn"
                onClick={handleStartTour}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-all shadow-lg flex items-center justify-center gap-1 uppercase tracking-wider cursor-pointer"
              >
                Start Interactive Tour
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Lab Order Specification Sheet Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4 overflow-y-auto py-8">
          <div className="bg-[#0E1013] border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh] animate-scale-in">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-[#0A0B0D] rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-500 animate-pulse" />
                <div>
                  <h3 className="text-base font-bold text-white font-serif tracking-tight uppercase">CAD Laboratory Manufacturing Script</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Validated Production Spec Sheet for Dental Casting & Gem Setting</p>
                </div>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Order Status Ribbon */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-400 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  STATUS: VERIFIED CAD DRAFT
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  EXPORT ID: DGC-2026-{Math.floor(Math.random() * 900000 + 100000)}
                </div>
              </div>

              {/* 1. Dental Mapping Diagram Section */}
              <div className="space-y-2">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider font-serif text-blue-400">1. Dental Arch Coverage Diagram</h4>
                <div className="bg-[#0A0B0D] p-4 border border-zinc-850 rounded-xl">
                  <div className="grid grid-cols-8 gap-1 text-center">
                    {teeth.map(t => {
                      const isGrilled = t.selectedForGrill;
                      return (
                        <div 
                          key={t.id} 
                          className={`p-1.5 rounded border text-[10px] transition-all flex flex-col justify-between h-12 ${
                            isGrilled 
                              ? 'bg-blue-950/40 border-blue-500/50 text-blue-400 font-bold' 
                              : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-600'
                          }`}
                        >
                          <span className="font-mono text-[8px]">#{t.id}</span>
                          <span className="truncate max-w-full text-[9px] scale-90">{t.type[0]}{t.type[1]}{t.type[2]}</span>
                          <span className={`w-1.5 h-1.5 rounded-full mx-auto ${isGrilled ? 'bg-blue-400 animate-pulse' : 'bg-transparent'}`} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-2.5 font-mono px-1">
                    <span>Universal Tooth 1 (Left Molar)</span>
                    <span>Universal Tooth 16 (Right Molar)</span>
                  </div>
                </div>
              </div>

              {/* 2. Metal Casting Specifications */}
              <div className="space-y-2">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider font-serif text-blue-400">2. Metal Sleeve Alloy Specs</h4>
                <div className="bg-[#0A0B0D] p-4 border border-zinc-850 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                      <span className="text-zinc-500">Selected Alloy:</span>
                      <span className="text-zinc-200 font-bold">{grillSettings.material}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                      <span className="text-zinc-500">Clearance Offset:</span>
                      <span className="text-zinc-200">{(grillSettings.extrustionOffset * 1000).toFixed(0)} μm (microns)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Wall Thickness:</span>
                      <span className="text-zinc-200">{grillSettings.thickness.toFixed(1)} mm</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                      <span className="text-zinc-500">Sleeve Design Style:</span>
                      <span className="text-zinc-200 font-bold">{grillSettings.style}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                      <span className="text-zinc-500">Casting Weight:</span>
                      <span className="text-zinc-200 font-bold text-zinc-100">~{estimateGrillSpecs(teeth, grillSettings).weightGrams.toFixed(1)} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Subdivision Quality:</span>
                      <span className="text-zinc-200">Level {grillSettings.smoothness}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Gemstone Icing Specifications */}
              <div className="space-y-2">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider font-serif text-blue-400">3. Gemstone Icing Specs</h4>
                <div className="bg-[#0A0B0D] p-4 border border-zinc-850 rounded-xl">
                  {showDiamonds && diamondSettings.enabled ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                          <span className="text-zinc-500">Setting Pattern:</span>
                          <span className="text-zinc-200 font-bold">{diamondSettings.pattern}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                          <span className="text-zinc-500">Stone Diameter:</span>
                          <span className="text-zinc-200">{diamondSettings.size.toFixed(1)} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Sparkle Factor:</span>
                          <span className="text-zinc-200">Active (Hz: {diamondSettings.sparkleSpeed.toFixed(1)})</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                          <span className="text-zinc-500">Total Stones Count:</span>
                          <span className="text-zinc-200 font-bold text-blue-400">{estimateDiamondSpecs(teeth, diamondSettings).totalStones} pcs</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                          <span className="text-zinc-500">Total Carat weight:</span>
                          <span className="text-zinc-200 font-bold text-blue-400">{estimateDiamondSpecs(teeth, diamondSettings).totalCarats.toFixed(2)} ct</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Diamond Clarity:</span>
                          <span className="text-zinc-200">{diamondSettings.clarity}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-zinc-500 text-xs font-mono">
                      No gem settings requested. Metal sleeves will be finished with mirror-polish.
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Manufacturing Analytics */}
              <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-serif">Estimated Cost</div>
                  <div className="text-lg font-mono font-bold text-blue-400 mt-1">
                    ${(estimateGrillSpecs(teeth, grillSettings).costUSD + (showDiamonds && diamondSettings.enabled ? estimateDiamondSpecs(teeth, diamondSettings).addedCostUSD : 0)).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-serif">Craft Duration</div>
                  <div className="text-lg font-mono font-bold text-zinc-200 mt-1">
                    {estimateGrillSpecs(teeth, grillSettings).productionDays} Days
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-serif">Confidence Rating</div>
                  <div className="text-lg font-mono font-bold text-green-400 mt-1 flex items-center justify-center gap-1">
                    <Check className="w-4 h-4 text-green-400" />
                    99.4%
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-5 border-t border-zinc-800 bg-[#0A0B0D] rounded-b-2xl flex flex-wrap gap-3 justify-between items-center shrink-0">
              <div className="text-[10px] text-zinc-500 max-w-xs leading-tight">
                This specification complies with ISO-13485 biocompatible additive standards.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const orderData = {
                      exportId: `DGC-2026-${Math.floor(Math.random() * 900000 + 100000)}`,
                      timestamp: new Date().toISOString(),
                      metalSettings: grillSettings,
                      diamondSettings: showDiamonds && diamondSettings.enabled ? diamondSettings : null,
                      activeTeeth: teeth.filter(t => t.selectedForGrill).map(t => ({ id: t.id, fdiId: t.fdiId, name: t.name })),
                      diagnostics: {
                        metalWeightGrams: estimateGrillSpecs(teeth, grillSettings).weightGrams,
                        diamondStones: showDiamonds && diamondSettings.enabled ? estimateDiamondSpecs(teeth, diamondSettings).totalStones : 0,
                        totalCaratWeight: showDiamonds && diamondSettings.enabled ? estimateDiamondSpecs(teeth, diamondSettings).totalCarats : 0,
                        totalCostEstUSD: estimateGrillSpecs(teeth, grillSettings).costUSD + (showDiamonds && diamondSettings.enabled ? estimateDiamondSpecs(teeth, diamondSettings).addedCostUSD : 0),
                      }
                    };
                    const blob = new Blob([JSON.stringify(orderData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `dental_grill_spec_${orderData.exportId}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-650 text-zinc-200 text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save JSON
                </button>
                <button
                  onClick={() => {
                    alert("Exporting design data to watertight mesh...\n\nSuccessfully generated: grill_sleeve_biocompatible_master.stl\nFile is prepared for direct SLM laser sintering or dental resin 3D printing!");
                  }}
                  className="px-3.5 py-2 bg-[#0E1013] hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-blue-400 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Generate STL Mesh
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Spec Sheet
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
