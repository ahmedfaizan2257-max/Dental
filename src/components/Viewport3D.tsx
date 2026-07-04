/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import { Tooth, GrillSettings, DiamondSettings, DentalScan } from '../types';
import { createProceduralDentalArch, segmentUploadedMesh } from '../utils/meshGenerator';
import { createGrillMesh } from '../utils/grillGenerator';
import { createDiamondsMesh, animateDiamondsSparkle } from '../utils/diamondGenerator';
import { Maximize2, ShieldAlert, Sparkles, Orbit, Grid3X3, Eye } from 'lucide-react';

interface Viewport3DProps {
  teeth: Tooth[];
  selectedToothId: number | null;
  hoveredToothId: number | null;
  onSelectTooth: (id: number | null) => void;
  onHoverTooth: (id: number | null) => void;
  viewMode: 'healthy' | 'segmented' | 'xray' | 'wireframe';
  grillSettings: GrillSettings;
  diamondSettings: DiamondSettings;
  customScanFile: File | null;
  onScanLoaded: (scan: DentalScan | null) => void;
  showGingiva: boolean;
  showGrill: boolean;
  showDiamonds: boolean;
  showGrid: boolean;
  cameraPreset: 'front' | 'top' | 'left' | 'right' | null;
  onCameraPresetComplete: () => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  teeth,
  selectedToothId,
  hoveredToothId,
  onSelectTooth,
  onHoverTooth,
  viewMode,
  grillSettings,
  diamondSettings,
  customScanFile,
  onScanLoaded,
  showGingiva,
  showGrill,
  showDiamonds,
  showGrid,
  cameraPreset,
  onCameraPresetComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Refs to hold Three.js objects for manipulation across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  
  const dentalGroupRef = useRef<THREE.Group | null>(null);
  const customMeshRef = useRef<THREE.Mesh | null>(null);
  const grillGroupRef = useRef<THREE.Group | null>(null);
  const diamondsGroupRef = useRef<THREE.Group | null>(null);

  const [loadingProgress, setLoadingProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderStats, setRenderStats] = useState({ vertices: 0, triangles: 0, fps: 60 });

  // Camera animation interpolation targets
  const targetCamPos = useRef<THREE.Vector3 | null>(null);
  const targetControlsLookAt = useRef<THREE.Vector3 | null>(null);

  // Initial setup on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a0f); // Sleek interface background
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    // Position camera at an elegant isometric front angle
    camera.position.set(0, -32, 65);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Clean old children if any (hot reload safety)
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI * 0.75;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.minDistance = 20;
    controls.maxDistance = 180;
    controls.target.set(0, -3, 0); // Focus on the dental arch center
    controlsRef.current = controls;

    // LIGHTS (High-Fidelity Studio Setup)
    // 1. Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 2. Key light (golden warm primary)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    keyLight.position.set(30, 40, 50);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // 3. Fill light (cool blue shadow softener)
    const fillLight = new THREE.DirectionalLight(0xe8f4ff, 0.85);
    fillLight.position.set(-30, -10, 40);
    scene.add(fillLight);

    // 4. Rim light (rear high-intensity highlight)
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.1);
    rimLight.position.set(0, 30, -50);
    scene.add(rimLight);

    // 5. Bottom light (soft gold reflect)
    const bounceLight = new THREE.DirectionalLight(0xfff3db, 0.5);
    bounceLight.position.set(0, -50, 10);
    scene.add(bounceLight);

    // GRIDS & HELPERS
    const gridHelper = new THREE.GridHelper(120, 24, 0x334155, 0x1e293b);
    gridHelper.position.y = -18;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Create main dental arch group
    const dentalGroup = new THREE.Group();
    scene.add(dentalGroup);
    dentalGroupRef.current = dentalGroup;

    // Track FPS
    let lastTime = performance.now();
    let frameCount = 0;
    let clock = new THREE.Clock();

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: w, height: h } = entries[0].contentRect;
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    });
    resizeObserver.observe(mountRef.current);

    // RENDER LOOP
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // Damping update
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Smooth camera interpolation
      if (cameraRef.current && controlsRef.current) {
        if (targetCamPos.current) {
          cameraRef.current.position.lerp(targetCamPos.current, 0.08);
          if (cameraRef.current.position.distanceTo(targetCamPos.current) < 0.1) {
            targetCamPos.current = null;
          }
        }
        if (targetControlsLookAt.current) {
          controlsRef.current.target.lerp(targetControlsLookAt.current, 0.08);
          if (controlsRef.current.target.distanceTo(targetControlsLookAt.current) < 0.1) {
            targetControlsLookAt.current = null;
          }
        }
      }

      // Sparkle diamond materials
      if (diamondsGroupRef.current && showDiamonds) {
        animateDiamondsSparkle(diamondsGroupRef.current, time, diamondSettings.sparkleSpeed);
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // Stats calculation
      frameCount++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setRenderStats((prev) => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (now - lastTime)),
        }));
        frameCount = 0;
        lastTime = now;
      }
    };
    animate();

    // MOUSE EVENTS: Raycasting for Tooth Highlight/Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getMouseCoords = (e: MouseEvent) => {
      if (!rendererRef.current) return { x: 0, y: 0 };
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return { x, y };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!cameraRef.current || !dentalGroupRef.current || !sceneRef.current) return;
      
      const coords = getMouseCoords(e);
      mouse.x = coords.x;
      mouse.y = coords.y;

      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // Look inside dental arch
      const intersects = raycaster.intersectObjects(dentalGroupRef.current.children, true);
      
      let foundHoverId: number | null = null;
      
      if (intersects.length > 0) {
        // Find closest object representing a tooth
        for (let i = 0; i < intersects.length; i++) {
          let obj: THREE.Object3D | null = intersects[i].object;
          
          // bubble up to locate tooth mesh metadata
          while (obj && obj !== dentalGroupRef.current) {
            if (obj.userData && obj.userData.type === 'tooth') {
              foundHoverId = obj.userData.toothId;
              break;
            }
            obj = obj.parent;
          }
          if (foundHoverId !== null) break;
        }
      }
      
      if (foundHoverId !== hoveredToothId) {
        onHoverTooth(foundHoverId);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!cameraRef.current || !dentalGroupRef.current) return;
      
      const coords = getMouseCoords(e);
      mouse.x = coords.x;
      mouse.y = coords.y;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(dentalGroupRef.current.children, true);
      
      let foundSelectId: number | null = null;
      
      if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
          let obj: THREE.Object3D | null = intersects[i].object;
          while (obj && obj !== dentalGroupRef.current) {
            if (obj.userData && obj.userData.type === 'tooth') {
              foundSelectId = obj.userData.toothId;
              break;
            }
            obj = obj.parent;
          }
          if (foundSelectId !== null) break;
        }
      }
      
      // If clicked empty area, do not deselect if we want to keep selection
      if (foundSelectId !== null) {
        onSelectTooth(foundSelectId);
      }
    };

    const canvasElem = renderer.domElement;
    canvasElem.addEventListener('mousemove', handleMouseMove);
    canvasElem.addEventListener('click', handleClick);

    // CLEANUP ON UNMOUNT
    return () => {
      canvasElem.removeEventListener('mousemove', handleMouseMove);
      canvasElem.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Sync scene toggles (Grid)
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Handle Preset Camera Positions
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current || !cameraPreset) return;

    switch (cameraPreset) {
      case 'front':
        targetCamPos.current = new THREE.Vector3(0, -32, 65);
        targetControlsLookAt.current = new THREE.Vector3(0, -3, 0);
        break;
      case 'top': // Occlusal view
        targetCamPos.current = new THREE.Vector3(0, 55, 12);
        targetControlsLookAt.current = new THREE.Vector3(0, -5, 10);
        break;
      case 'left':
        targetCamPos.current = new THREE.Vector3(-45, -15, 30);
        targetControlsLookAt.current = new THREE.Vector3(-15, -4, 5);
        break;
      case 'right':
        targetCamPos.current = new THREE.Vector3(45, -15, 30);
        targetControlsLookAt.current = new THREE.Vector3(15, -4, 5);
        break;
    }

    onCameraPresetComplete();
  }, [cameraPreset]);

  // Redraw meshes when teeth array, viewMode, selection, or custom scan updates
  useEffect(() => {
    const scene = sceneRef.current;
    const dentalGroup = dentalGroupRef.current;
    if (!scene || !dentalGroup) return;

    // Wipe previous children
    while (dentalGroup.children.length > 0) {
      dentalGroup.remove(dentalGroup.children[0]);
    }

    // Wipe separate groups
    if (grillGroupRef.current) {
      scene.remove(grillGroupRef.current);
      grillGroupRef.current = null;
    }
    if (diamondsGroupRef.current) {
      scene.remove(diamondsGroupRef.current);
      diamondsGroupRef.current = null;
    }

    // If an external file is uploaded, render the custom model
    if (customScanFile) {
      if (customMeshRef.current) {
        // Render custom mesh with segmentation/wireframe/xray shaders
        const originalMesh = customMeshRef.current;
        
        let targetMesh: THREE.Mesh;
        if (viewMode === 'segmented') {
          // Perform full virtual color segmentation based on coordinates!
          const { segmentedMesh } = segmentUploadedMesh(originalMesh, teeth);
          targetMesh = segmentedMesh;
        } else {
          // Standard shades
          const geometry = originalMesh.geometry.clone();
          let matColor = 0xfffcf5; // Ivory
          let transparent = false;
          let opacity = 1.0;
          let roughness = 0.2;
          let metalness = 0.1;

          if (viewMode === 'xray') {
            matColor = 0x88ccff;
            transparent = true;
            opacity = 0.35;
            roughness = 0.05;
            metalness = 0.85;
          }

          const material = new THREE.MeshStandardMaterial({
            color: matColor,
            roughness,
            metalness,
            transparent,
            opacity,
            wireframe: viewMode === 'wireframe',
            depthWrite: viewMode !== 'xray',
          });
          targetMesh = new THREE.Mesh(geometry, material);
          targetMesh.rotation.copy(originalMesh.rotation);
          targetMesh.position.copy(originalMesh.position);
          targetMesh.scale.copy(originalMesh.scale);
        }

        // Make interactive: Add userData so click events map to it as a single tooth or segment
        targetMesh.userData = {
          type: 'tooth',
          toothId: selectedToothId || 8, // fall back to cental incisor if clicked
        };
        
        dentalGroup.add(targetMesh);
        
        // Add gums if requested
        if (showGingiva && viewMode !== 'wireframe') {
          const mockGums = originalMesh.clone();
          const gumMat = new THREE.MeshStandardMaterial({
            color: 0xdf8188,
            roughness: 0.6,
            metalness: 0.05,
            transparent: viewMode === 'xray',
            opacity: viewMode === 'xray' ? 0.2 : 1.0,
          });
          mockGums.material = gumMat;
          // translate lower to look like gums base
          mockGums.position.y -= 1.8;
          dentalGroup.add(mockGums);
        }
      }
    } else {
      // Otherwise, generate the stunning interactive procedural arch
      const archGroup = createProceduralDentalArch(teeth, viewMode, hoveredToothId, selectedToothId);
      
      // Toggle gums visibility
      if (!showGingiva) {
        const gumObj = archGroup.getObjectByName('Gingiva');
        if (gumObj) gumObj.visible = false;
      }
      
      dentalGroup.add(archGroup);
    }

    // Generate Grill Mesh if toggled
    if (showGrill && teeth.some(t => t.selectedForGrill)) {
      const modeString = viewMode === 'wireframe' ? 'wireframe' : 'shaded';
      const grillMesh = createGrillMesh(teeth, grillSettings, modeString);
      scene.add(grillMesh);
      grillGroupRef.current = grillMesh;

      // Generate Diamonds if toggled on top of Grill
      if (showDiamonds && diamondSettings.enabled) {
        const diamondsMesh = createDiamondsMesh(teeth, diamondSettings, grillSettings.thickness, modeString);
        scene.add(diamondsMesh);
        diamondsGroupRef.current = diamondsMesh;
      }
    }

    // Compute vertices and triangle stats for display
    let vertices = 0;
    let triangles = 0;
    scene.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const geom = node.geometry;
        if (geom.index) {
          triangles += geom.index.count / 3;
        } else if (geom.attributes.position) {
          triangles += geom.attributes.position.count / 3;
        }
        if (geom.attributes.position) {
          vertices += geom.attributes.position.count;
        }
      }
    });

    setRenderStats((prev) => ({
      ...prev,
      vertices: Math.round(vertices),
      triangles: Math.round(triangles),
    }));

  }, [teeth, viewMode, selectedToothId, hoveredToothId, showGingiva, showGrill, showDiamonds, grillSettings, diamondSettings, customScanFile]);

  // Custom File Loader Implementation
  useEffect(() => {
    if (!customScanFile) {
      // Clear custom mesh ref
      customMeshRef.current = null;
      onScanLoaded(null);
      setErrorMessage(null);
      return;
    }

    setLoadingProgress('Reading file...');
    setErrorMessage(null);

    const fileReader = new FileReader();

    // Check extension
    const extension = customScanFile.name.split('.').pop()?.toLowerCase();

    if (extension === 'stl') {
      fileReader.readAsArrayBuffer(customScanFile);
    } else if (extension === 'obj') {
      fileReader.readAsText(customScanFile);
    } else {
      setErrorMessage('Unsupported format. Please upload an STL or OBJ file.');
      setLoadingProgress(null);
      return;
    }

    fileReader.onload = (event) => {
      try {
        setLoadingProgress('Parsing dental geometry...');
        const result = event.target?.result;
        
        let geometry: THREE.BufferGeometry;

        if (extension === 'stl' && result instanceof ArrayBuffer) {
          const loader = new STLLoader();
          geometry = loader.parse(result);
        } else if (extension === 'obj' && typeof result === 'string') {
          const loader = new OBJLoader();
          const group = loader.parse(result);
          
          // Extract first available mesh geometry
          let firstMesh: THREE.Mesh | null = null;
          group.traverse((child) => {
            if (child instanceof THREE.Mesh && !firstMesh) {
              firstMesh = child;
            }
          });

          if (firstMesh) {
            geometry = (firstMesh as THREE.Mesh).geometry.clone();
          } else {
            throw new Error('No polygon mesh found in OBJ file');
          }
        } else {
          throw new Error('Invalid file buffer encoding');
        }

        // Align and center custom geometry
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        
        const bbox = geometry.boundingBox!;
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        
        // Offset to center
        geometry.translate(-center.x, -center.y, -center.z);
        
        // Rotate if loaded inverted (common in dental clinical axes where Z is up)
        const sizeVec = new THREE.Vector3();
        bbox.getSize(sizeVec);
        
        // Construct standard mesh
        const tempMat = new THREE.MeshStandardMaterial({ color: 0xfffcf5 });
        const customMesh = new THREE.Mesh(geometry, tempMat);
        
        // Rescale custom mesh to fit the 3D viewport bounding box smoothly
        const maxExtent = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
        const scaleFactor = 48 / (maxExtent || 1); // target width ~48mm
        customMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Align tilt (standard dental scans are often vertical)
        customMesh.rotation.x = -Math.PI * 0.45; 
        customMesh.position.y = -4;
        
        customMeshRef.current = customMesh;

        // Count stats
        const vertCount = geometry.attributes.position ? geometry.attributes.position.count : 0;
        const triCount = geometry.index ? geometry.index.count / 3 : vertCount / 3;

        // Callback metadata
        onScanLoaded({
          name: customScanFile.name,
          fileSize: (customScanFile.size / (1024 * 1024)).toFixed(2) + ' MB',
          source: 'uploaded',
          vertexCount: Math.round(vertCount),
          triangleCount: Math.round(triCount),
          isLowerArch: customScanFile.name.toLowerCase().includes('lower') || customScanFile.name.toLowerCase().includes('mandible'),
        });

        setLoadingProgress(null);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(`Geometry Parser Error: ${err?.message || 'Invalid 3D polygon headers'}`);
        setLoadingProgress(null);
      }
    };

    fileReader.onerror = () => {
      setErrorMessage('Failed to read local file from device.');
      setLoadingProgress(null);
    };

  }, [customScanFile]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-[#090a0f]">
      {/* 3D Container */}
      <div id="three-viewport" ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {loadingProgress && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090a0f]/80 backdrop-blur-md">
          <div className="flex flex-col items-center p-6 bg-[#0E1013] border border-zinc-800 rounded-2xl shadow-2xl max-w-sm text-center">
            <Sparkles className="w-10 h-10 text-blue-400 animate-pulse mb-3" />
            <h3 className="text-white font-medium mb-1 font-serif">Processing Geometry</h3>
            <p className="text-zinc-400 text-xs animate-pulse">{loadingProgress}</p>
            <div className="w-48 h-1 bg-zinc-850 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-500 animate-[loading-bar_1.5s_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090a0f]/90 backdrop-blur-sm px-6">
          <div className="flex flex-col items-center p-6 bg-[#0E1013] border border-red-500/30 rounded-2xl shadow-2xl max-w-md text-center">
            <ShieldAlert className="w-12 h-12 text-red-400 mb-3" />
            <h3 className="text-white font-semibold mb-1 font-serif">Clinical Mesh Parse Error</h3>
            <p className="text-zinc-400 text-xs mb-4">{errorMessage}</p>
            <button
              id="clear-error-btn"
              onClick={() => setErrorMessage(null)}
              className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 text-xs rounded-lg font-medium transition-colors"
            >
              Dismiss Warning
            </button>
          </div>
        </div>
      )}

      {/* Viewport Info Ribbon */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
        <div className="px-3 py-1.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-300 backdrop-blur-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span>RENDER: {renderStats.fps} FPS</span>
        </div>
        <div className="px-3 py-1.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-300 backdrop-blur-sm">
          POLYS: {renderStats.triangles.toLocaleString()}
        </div>
        <div className="px-3 py-1.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-300 backdrop-blur-sm">
          VERTS: {renderStats.vertices.toLocaleString()}
        </div>
      </div>

      {/* Mode Status Indicator */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="px-3 py-1.5 bg-zinc-950/95 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-200 backdrop-blur-sm shadow-lg flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {viewMode === 'healthy' && 'Natural Ivory'}
            {viewMode === 'segmented' && 'AI Segmented (Individual Teeth)'}
            {viewMode === 'xray' && 'X-Ray Translucent'}
            {viewMode === 'wireframe' && 'Clinical Wireframe Mesh'}
          </span>
        </div>
        {showGrill && (
          <div className="px-3 py-1.5 bg-zinc-950/95 border border-blue-500/20 rounded-lg text-xs font-medium text-blue-400 backdrop-blur-sm shadow-lg flex items-center gap-1.5 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Procedural Grill Active</span>
          </div>
        )}
      </div>

      {/* Instruction tooltip in corner */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 backdrop-blur-sm">
        <Orbit className="w-3.5 h-3.5 text-zinc-400" />
        <span>Drag to rotate · Scroll to zoom · Click tooth to select</span>
      </div>
    </div>
  );
};
