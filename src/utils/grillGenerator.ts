/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Tooth, ToothType, GrillSettings, GrillMaterial, GrillStyle } from '../types';
import { getToothPosition } from './meshGenerator';

/**
 * Returns PBR material properties for dental metals.
 */
export function getGrillMaterial(material: GrillMaterial, mode: 'wireframe' | 'shaded' = 'shaded'): THREE.MeshStandardMaterial {
  let color = 0xd4af37; // Default 18k Yellow Gold
  let roughness = 0.12;
  let metalness = 0.95;
  
  switch (material) {
    case GrillMaterial.YELLOW_GOLD_18K:
      color = 0xdda832; // Rich gold
      roughness = 0.08;
      metalness = 0.98;
      break;
    case GrillMaterial.WHITE_GOLD_14K:
      color = 0xeeebe2; // Slightly warm white silver
      roughness = 0.09;
      metalness = 0.95;
      break;
    case GrillMaterial.ROSE_GOLD_18K:
      color = 0xe09b82; // Warm rose copper
      roughness = 0.08;
      metalness = 0.96;
      break;
    case GrillMaterial.PLATINUM:
      color = 0xf5f7fa; // Ultra bright silver
      roughness = 0.06;
      metalness = 0.99;
      break;
    case GrillMaterial.CHROME_COBALT:
      color = 0x98a0a6; // Darker tech steel
      roughness = 0.18;
      metalness = 0.90;
      break;
  }
  
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    roughnessMap: null,
    metalnessMap: null,
    wireframe: mode === 'wireframe',
    side: THREE.DoubleSide,
    shadowSide: THREE.DoubleSide,
  });
}

/**
 * Procedurally generates a grill cap geometry for a specific tooth.
 */
function generateCapGeometry(
  tooth: Tooth,
  idx: number,
  settings: GrillSettings
): THREE.BufferGeometry {
  const t = (idx - 7.5) / 7.5;
  const w = tooth.width * (1.0 + settings.extrustionOffset * 2);
  const h = tooth.height * 0.72; // covers crown up to gums, not roots
  
  let d = (tooth.type === ToothType.MOLAR ? 10.0 : tooth.type === ToothType.PREMOLAR ? 8.6 : tooth.type === ToothType.CANINE ? 8.2 : 5.4);
  d *= (1.0 + settings.extrustionOffset * 2);

  let geom: THREE.BufferGeometry;

  if (settings.style === GrillStyle.WINDOW) {
    // Open Face (Window): Construct a hollow bezel frame
    // We can do this by constructing a box with a central hollow cut-out (manually stitched)
    const bezel = 1.35; // 1.35mm border thickness
    const frameGeom = new THREE.BoxGeometry(w, h, d, 4, 4, 4);
    const posAttr = frameGeom.attributes.position as THREE.BufferAttribute;
    
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      // Hollow out the center of the outer (front-facing) Z-face
      // Local front is +Z (positive depth)
      if (z > d * 0.25) {
        // If vertex is in the middle 65% of X and Y, push it back to create a recess/window
        const isMiddleX = Math.abs(x) < (w / 2 - bezel);
        const isMiddleY = Math.abs(y) < (h / 2 - bezel);
        if (isMiddleX && isMiddleY) {
          z -= d * 0.75; // hollow in
        }
      }

      // Smooth outer crown edges
      if (y > 0) {
        if (tooth.type === ToothType.INCISOR) {
          z *= 0.55; // taper top of incisor wedge
        }
      } else {
        // taper bottom towards gums
        x *= 0.88;
        z *= 0.88;
      }
      
      posAttr.setXYZ(i, x, y, z);
    }
    geom = frameGeom;
  } else if (settings.style === GrillStyle.FANGS && tooth.type === ToothType.CANINE) {
    // Canine Fang: Create a pointy extended cap pointing downwards
    const fangHeight = h * 1.45; // extend tooth height by 45% for the vampire look!
    geom = new THREE.BoxGeometry(w, fangHeight, d, 6, 6, 6);
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      const yNorm = (y + fangHeight / 2) / fangHeight; // 0 to 1 (0 = root, 1 = crown tip)
      
      // Upper teeth project downward. The crown tip is at negative Y in dental coords, 
      // but in local box geometry Y > 0 is crown tip if we translate it.
      // Let's taper Y > 0 to a sharp point
      if (y > 0) {
        const factor = 1.0 - (y / (fangHeight / 2)); // 1 at center, 0 at top
        x *= (factor * 0.65 + 0.05); // sharp X taper
        z *= (factor * 0.65 + 0.05); // sharp Z taper
        
        // Elongate the tip
        if (Math.abs(x) < w * 0.1 && Math.abs(z) < d * 0.1) {
          y += fangHeight * 0.18; // extend point
        }
      } else {
        // Taper roots / base fitting
        x *= (0.75 + yNorm * 0.25);
        z *= (0.75 + yNorm * 0.25);
      }
      
      posAttr.setXYZ(i, x, y, z);
    }
  } else {
    // Full Caps or standard capped teeth (e.g. non-canines in Fang mode, or iced out)
    geom = new THREE.BoxGeometry(w, h, d, 5, 5, 5);
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      const yNorm = (y + h / 2) / h;
      
      // Shape crown contour
      if (y > 0) {
        if (tooth.type === ToothType.INCISOR) {
          z *= 0.45; // wedge
          x *= 1.05;
        } else if (tooth.type === ToothType.MOLAR) {
          // Keep cusped top
          const xDist = Math.abs(x) / (w / 2);
          const zDist = Math.abs(z) / (d / 2);
          y += Math.sin(xDist * Math.PI / 2) * Math.sin(zDist * Math.PI / 2) * h * 0.05;
        }
      } else {
        // taper base
        x *= 0.82;
        z *= 0.82;
      }
      
      posAttr.setXYZ(i, x, y, z);
    }
  }

  // Offset slightly along buccal (front +Z) normal to give outer shell depth
  geom.translate(0, h / 2 + 0.15, settings.extrustionOffset * 1.5);
  
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds the complete 3D Grill mesh covering all selected teeth.
 */
export function createGrillMesh(
  teeth: Tooth[],
  settings: GrillSettings,
  mode: 'wireframe' | 'shaded' = 'shaded'
): THREE.Group {
  const grillGroup = new THREE.Group();
  grillGroup.name = 'ProceduralGrill';
  
  const grillMaterial = getGrillMaterial(settings.material, mode);
  
  teeth.forEach((tooth, idx) => {
    // Only generate grill on selected teeth
    if (!tooth.selectedForGrill) return;
    
    // Generate cap geometry
    const geom = generateCapGeometry(tooth, idx, settings);
    
    // Position matching the tooth
    const pos = new THREE.Vector3(...tooth.position);
    const t = (idx - 7.5) / 7.5;
    const tangentAngle = t * Math.PI * 0.58;
    
    const capMesh = new THREE.Mesh(geom, grillMaterial);
    capMesh.position.copy(pos);
    
    // Rotation matching the tooth
    capMesh.rotation.y = -tangentAngle;
    capMesh.rotation.x = -t * 0.08;
    capMesh.rotation.z = -t * 0.12;
    
    // Scale slightly larger than tooth for physical sleeve fit
    const fitFactor = 1.02 + settings.thickness * 0.08;
    capMesh.scale.set(fitFactor, 1.0, fitFactor);
    
    capMesh.name = `GrillCap_${tooth.id}`;
    capMesh.userData = {
      toothId: tooth.id,
      type: 'grill_cap',
    };
    
    // Add realistic bevel seams / metal lip borders if requested
    if (settings.openBorders) {
      const tDepth = tooth.type === ToothType.MOLAR ? 9.5 : tooth.type === ToothType.PREMOLAR ? 8.2 : tooth.type === ToothType.CANINE ? 7.8 : 5.0;
      const borderGeom = new THREE.BoxGeometry(tooth.width * 1.08, 0.6, tDepth * 1.08, 1, 1, 1);
      const borderMat = new THREE.MeshStandardMaterial({
        color: grillMaterial.color,
        roughness: 0.22,
        metalness: 0.9,
      });
      const lipMesh = new THREE.Mesh(borderGeom, borderMat);
      lipMesh.position.set(0, 0.2, 0);
      capMesh.add(lipMesh);
    }
    
    grillGroup.add(capMesh);
  });
  
  return grillGroup;
}

/**
 * Helper to calculate weight (grams) and manufacturing cost (USD) of the generated grill
 */
export function estimateGrillSpecs(teeth: Tooth[], settings: GrillSettings) {
  const selectedCount = teeth.filter(t => t.selectedForGrill).length;
  if (selectedCount === 0) return { weightGrams: 0, costUSD: 0, productionDays: 0 };
  
  // Weight calculation based on thickness, material density and size
  let densityFactor = 19.3; // Gold 18k density in g/cm³
  let baseCostPerGram = 75; // Gold value
  
  switch (settings.material) {
    case GrillMaterial.YELLOW_GOLD_18K:
      densityFactor = 15.6;
      baseCostPerGram = 82;
      break;
    case GrillMaterial.WHITE_GOLD_14K:
      densityFactor = 13.5;
      baseCostPerGram = 68;
      break;
    case GrillMaterial.ROSE_GOLD_18K:
      densityFactor = 15.4;
      baseCostPerGram = 84;
      break;
    case GrillMaterial.PLATINUM:
      densityFactor = 21.4; // heavy!
      baseCostPerGram = 95;
      break;
    case GrillMaterial.CHROME_COBALT:
      densityFactor = 8.3; // lightweight
      baseCostPerGram = 12; // much cheaper base metal
      break;
  }
  
  // Grill volume factor
  let volumeFactor = 0.16; // cm³ per tooth (approximate crown shell volume)
  if (settings.style === GrillStyle.WINDOW) {
    volumeFactor = 0.085; // hollow frame uses ~50% less metal
  } else if (settings.style === GrillStyle.FANGS) {
    volumeFactor = 0.22; // extra metal for fangs
  }
  
  const totalVolume = selectedCount * volumeFactor * (settings.thickness / 0.8);
  const weightGrams = Math.round(totalVolume * densityFactor * 10) / 10;
  
  // Custom design fee + material cost + detailing labor
  let designFee = 250; // base modeling setup
  if (settings.style === GrillStyle.WINDOW) designFee += 100; // harder to hand-bevel windows
  if (settings.style === GrillStyle.FANGS) designFee += 120;
  
  const laborCostPerTooth = settings.material === GrillMaterial.CHROME_COBALT ? 75 : 120;
  const materialCost = weightGrams * baseCostPerGram;
  const costUSD = Math.round(designFee + materialCost + selectedCount * laborCostPerTooth);
  
  // Custom CAD time
  const productionDays = 4 + Math.round(selectedCount * 0.5) + (settings.style === GrillStyle.WINDOW ? 2 : 0);
  
  return {
    weightGrams,
    costUSD,
    productionDays,
  };
}
