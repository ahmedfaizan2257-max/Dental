/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Tooth, ToothType, DiamondSettings, DiamondPattern } from '../types';

export const DIAMOND_COLORS = [
  { name: 'VVS Ice Clear', hex: '#FFFFFF', colorVal: 0xffffff, emissive: 0x909090 },
  { name: 'Canary Yellow', hex: '#FFDF00', colorVal: 0xffe633, emissive: 0x5a4a00 },
  { name: 'Sweetheart Pink', hex: '#FFB7C5', colorVal: 0xff88a3, emissive: 0x5a1822 },
  { name: 'Siberian Blue', hex: '#7FFFD4', colorVal: 0x33e6ff, emissive: 0x004c5a },
  { name: 'Black Velvet', hex: '#1C1C1C', colorVal: 0x111111, emissive: 0x000000 },
];

/**
 * Creates a brilliant diamond material.
 */
export function createDiamondMaterial(colorHex: string, mode: 'wireframe' | 'shaded' = 'shaded'): THREE.MeshStandardMaterial {
  const isBlack = colorHex === '#1C1C1C' || colorHex === '#111111';
  const colorVal = isBlack ? 0x1a1a1a : parseInt(colorHex.replace('#', '0x')) || 0xffffff;
  
  return new THREE.MeshStandardMaterial({
    color: colorVal,
    roughness: 0.01,
    metalness: 0.1, // Glass-like dielectric refraction
    transparent: !isBlack,
    opacity: isBlack ? 1.0 : 0.88,
    emissive: isBlack ? 0x000000 : colorVal,
    emissiveIntensity: isBlack ? 0.0 : 0.45,
    wireframe: mode === 'wireframe',
  });
}

interface DiamondInstance {
  pos: THREE.Vector3;
  rot: THREE.Euler;
}

/**
 * Procedurally computes placement points for diamonds on the front-face of a specific tooth.
 * Coordinates are local to the tooth's space.
 */
function calculateDiamondPlacements(
  tooth: Tooth,
  idx: number,
  settings: DiamondSettings,
  grillThickness: number
): DiamondInstance[] {
  const instances: DiamondInstance[] = [];
  
  // Buccal (front face) bounds of the tooth crown
  const widthRange = tooth.width * 0.72;
  const heightRange = tooth.height * 0.58;
  const size = settings.size;
  const spacing = size * (1.1 + (1.0 - settings.density) * 0.8);
  
  // Depth (Z offset) - must sit on top of the grill cap
  // The buccal face of the tooth is at +Z
  let zOffset = (tooth.type === ToothType.MOLAR ? 5.0 : tooth.type === ToothType.PREMOLAR ? 4.3 : tooth.type === ToothType.CANINE ? 4.1 : 2.7);
  zOffset += grillThickness + size * 0.15; // sit embedded slightly
  
  if (settings.pattern === DiamondPattern.SINGLE_ROW) {
    // Single column down the middle
    const rows = Math.max(1, Math.floor(heightRange / spacing));
    for (let r = 0; r < rows; r++) {
      const y = (r - (rows - 1) / 2) * spacing + tooth.height * 0.45;
      const x = 0;
      
      // follow horizontal curvature of the tooth crown (rounded front face)
      const localZ = zOffset + (1.0 - Math.pow(x / (tooth.width/2), 2)) * 0.5;
      
      instances.push({
        pos: new THREE.Vector3(x, y, localZ),
        rot: new THREE.Euler(0.05, 0, 0),
      });
    }
  } else if (settings.pattern === DiamondPattern.GRID) {
    // Standard grid of stones
    const cols = Math.max(1, Math.floor(widthRange / spacing));
    const rows = Math.max(1, Math.floor(heightRange / spacing));
    
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * spacing;
      for (let r = 0; r < rows; r++) {
        const y = (r - (rows - 1) / 2) * spacing + tooth.height * 0.42;
        
        // Wrap slightly along buccal curve
        const localZ = zOffset + (1.0 - Math.pow(x / (tooth.width/2), 2)) * 0.8;
        
        // Calculate tangent angle of curve
        const rotY = -(x / (tooth.width / 2)) * 0.3;
        
        instances.push({
          pos: new THREE.Vector3(x, y, localZ),
          rot: new THREE.Euler(0.03, rotY, 0),
        });
      }
    }
  } else if (settings.pattern === DiamondPattern.BORDER_ONLY) {
    // Frame inset outline of the crown
    const pointsCount = 14;
    const w = widthRange * 0.95;
    const h = heightRange * 0.9;
    
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i / pointsCount) * Math.PI * 2;
      const x = (w / 2) * Math.sin(angle);
      const y = (h / 2) * Math.cos(angle) + tooth.height * 0.42;
      
      const localZ = zOffset + (1.0 - Math.pow(x / (tooth.width/2), 2)) * 0.6;
      const rotY = -(x / (tooth.width / 2)) * 0.45;
      const rotX = -(y - tooth.height * 0.42) / h * 0.2;
      
      instances.push({
        pos: new THREE.Vector3(x, y, localZ),
        rot: new THREE.Euler(rotX, rotY, 0),
      });
    }
  } else {
    // Pavé (dense honeycomb arrangement)
    const rows = Math.max(2, Math.floor(heightRange / (spacing * 0.86))); // cosine 30deg
    for (let r = 0; r < rows; r++) {
      const y = (r - (rows - 1) / 2) * (spacing * 0.86) + tooth.height * 0.42;
      const rowOffset = (r % 2) * (spacing * 0.5); // alternate shift for honeycomb
      
      // Width reduces slightly near the tip (top y is high)
      const narrowFactor = y > tooth.height * 0.5 ? 0.85 : 1.0;
      const adjustedWidth = widthRange * narrowFactor;
      
      const cols = Math.max(1, Math.floor((adjustedWidth - rowOffset) / spacing));
      
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * spacing + rowOffset - (spacing * 0.25 * (r % 2));
        
        // Skip if outside tooth boundary
        if (Math.abs(x) > adjustedWidth / 2) continue;
        
        const localZ = zOffset + (1.0 - Math.pow(x / (tooth.width/2), 2)) * 0.9;
        const rotY = -(x / (tooth.width / 2)) * 0.4;
        
        instances.push({
          pos: new THREE.Vector3(x, y, localZ),
          rot: new THREE.Euler(0.04, rotY, 0),
        });
      }
    }
  }
  
  return instances;
}

/**
 * Builds the complete 3D diamonds model on top of the grill mesh.
 */
export function createDiamondsMesh(
  teeth: Tooth[],
  settings: DiamondSettings,
  grillThickness: number,
  mode: 'wireframe' | 'shaded' = 'shaded'
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ProceduralDiamonds';
  
  if (!settings.enabled) return group;
  
  const stoneColor = settings.color;
  const mat = createDiamondMaterial(stoneColor, mode);
  
  teeth.forEach((tooth, idx) => {
    // Only place on selected teeth that have a grill cap!
    if (!tooth.selectedForGrill) return;
    
    // Get local coordinate placements
    const placements = calculateDiamondPlacements(tooth, idx, settings, grillThickness);
    
    // Low-poly octahedron (8 faces) replicates a beautiful brilliant diamond cut perfectly,
    // and compiles extremely fast in WebGL!
    const diamondGeom = new THREE.OctahedronGeometry(settings.size * 0.45, 0);
    // Flatten Z slightly for flat-cut profile
    diamondGeom.scale(1, 1, 0.65);
    
    placements.forEach((inst, i) => {
      const mesh = new THREE.Mesh(diamondGeom, mat.clone());
      mesh.position.copy(inst.pos);
      mesh.rotation.copy(inst.rot);
      
      // Store indexing data for custom sparkling offsets
      mesh.name = `Diamond_${tooth.id}_${i}`;
      mesh.userData = {
        toothId: tooth.id,
        index: i,
        baseEmissiveIntensity: mat.emissiveIntensity,
        sparkleOffset: Math.random() * Math.PI * 2, // randomized starting phase for glittering
      };
      
      // Create a tooth group container to rotation-align with teeth
      const container = new THREE.Group();
      container.position.copy(new THREE.Vector3(...tooth.position));
      
      const t = (idx - 7.5) / 7.5;
      const tangentAngle = t * Math.PI * 0.58;
      
      container.rotation.y = -tangentAngle;
      container.rotation.x = -t * 0.08;
      container.rotation.z = -t * 0.12;
      
      container.add(mesh);
      group.add(container);
    });
  });
  
  return group;
}

/**
 * Dynamically updates diamond emissive intensities to create a gorgeous organic glimmering/twinkling effect!
 */
export function animateDiamondsSparkle(
  diamondsGroup: THREE.Group,
  time: number,
  speedFactor: number
) {
  if (!diamondsGroup) return;
  
  diamondsGroup.children.forEach((container) => {
    container.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh && mesh.material && mesh.userData && mesh.userData.sparkleOffset !== undefined) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const phase = time * 4.2 * speedFactor + mesh.userData.sparkleOffset;
        
        // Twinkle waves (combining multiple frequencies for natural organic glitter)
        const intensity = 0.2 + Math.pow(Math.sin(phase) * 0.5 + Math.cos(phase * 2.3) * 0.3 + 0.2, 4) * 1.5;
        
        mat.emissiveIntensity = THREE.MathUtils.lerp(
          mesh.userData.baseEmissiveIntensity || 0.4,
          intensity,
          0.85
        );
      }
    });
  });
}

/**
 * Calculates carat specs of diamonds
 */
export function estimateDiamondSpecs(teeth: Tooth[], settings: DiamondSettings) {
  if (!settings.enabled) return { totalStones: 0, totalCarats: 0, addedCostUSD: 0 };
  
  const selectedTeeth = teeth.filter(t => t.selectedForGrill);
  let totalStones = 0;
  
  selectedTeeth.forEach((tooth, idx) => {
    const placements = calculateDiamondPlacements(tooth, idx, settings, 0.5);
    totalStones += placements.length;
  });
  
  // Convert mm diameter to carat weight
  // Standard round cut diamond carats by mm:
  // 1.0mm = 0.005 ct
  // 1.5mm = 0.015 ct
  // 2.0mm = 0.03 ct
  // 2.5mm = 0.06 ct
  const mm = settings.size;
  const ctPerStone = 0.003 * Math.pow(mm, 3); // volumetric approximation
  const totalCarats = Math.round(totalStones * ctPerStone * 100) / 100;
  
  // Cost pricing based on clarity and size
  let pricePerCarat = 1100; // SI1 standard
  if (settings.clarity === 'VS1 (Very Good)') pricePerCarat = 1500;
  if (settings.clarity === 'VVS1 (Excellent)') pricePerCarat = 2100;
  
  // Colored stones markup
  if (settings.color !== '#FFFFFF') {
    pricePerCarat *= 1.25; // Fancy colors are rarer!
  }
  
  // Stone setting labor fee ($25 per stone)
  const settingLabor = totalStones * 22;
  const addedCostUSD = Math.round(totalCarats * pricePerCarat + settingLabor);
  
  return {
    totalStones,
    totalCarats,
    addedCostUSD,
  };
}
