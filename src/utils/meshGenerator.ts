/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Tooth, ToothType } from '../types';

// Palette of highly distinct medical-CAD segmentation colors
export const SEGMENTATION_COLORS = [
  '#FF5252', // Red
  '#FF4081', // Pink
  '#E040FB', // Purple
  '#7C4DFF', // Deep Purple
  '#536DFE', // Indigo
  '#448AFF', // Blue
  '#40C4FF', // Light Blue
  '#18FFFF', // Cyan
  '#64FFDA', // Teal
  '#69F0AE', // Green
  '#B2FF59', // Light Green
  '#EEFF41', // Lime
  '#FFFF00', // Yellow
  '#FFD740', // Amber
  '#FFAB40', // Orange
  '#FF6E40', // Deep Orange
];

export const TOOTH_METADATA: { id: number; name: string; type: ToothType; fdiId: string }[] = [
  { id: 1, name: 'Third Molar (Upper Left)', type: ToothType.MOLAR, fdiId: '28' },
  { id: 2, name: 'Second Molar (Upper Left)', type: ToothType.MOLAR, fdiId: '27' },
  { id: 3, name: 'First Molar (Upper Left)', type: ToothType.MOLAR, fdiId: '26' },
  { id: 4, name: 'Second Premolar (Upper Left)', type: ToothType.PREMOLAR, fdiId: '25' },
  { id: 5, name: 'First Premolar (Upper Left)', type: ToothType.PREMOLAR, fdiId: '24' },
  { id: 6, name: 'Canine (Upper Left)', type: ToothType.CANINE, fdiId: '23' },
  { id: 7, name: 'Lateral Incisor (Upper Left)', type: ToothType.INCISOR, fdiId: '22' },
  { id: 8, name: 'Central Incisor (Upper Left)', type: ToothType.INCISOR, fdiId: '21' },
  { id: 9, name: 'Central Incisor (Upper Right)', type: ToothType.INCISOR, fdiId: '11' },
  { id: 10, name: 'Lateral Incisor (Upper Right)', type: ToothType.INCISOR, fdiId: '12' },
  { id: 11, name: 'Canine (Upper Right)', type: ToothType.CANINE, fdiId: '13' },
  { id: 12, name: 'First Premolar (Upper Right)', type: ToothType.PREMOLAR, fdiId: '14' },
  { id: 13, name: 'Second Premolar (Upper Right)', type: ToothType.PREMOLAR, fdiId: '15' },
  { id: 14, name: 'First Molar (Upper Right)', type: ToothType.MOLAR, fdiId: '16' },
  { id: 15, name: 'Second Molar (Upper Right)', type: ToothType.MOLAR, fdiId: '17' },
  { id: 16, name: 'Third Molar (Upper Right)', type: ToothType.MOLAR, fdiId: '18' },
];

/**
 * Calculates the center position of a tooth on a parabolic arch
 * @param index 0-15
 */
export function getToothPosition(index: number): THREE.Vector3 {
  const t = (index - 7.5) / 7.5; // -1.0 to 1.0
  const angle = t * Math.PI * 0.58; // Arch spread angle
  
  // Parabolic parameters
  const archWidth = 34; // mm radius
  const archDepth = 38; // mm depth
  
  const x = archWidth * Math.sin(angle);
  const z = archDepth * (Math.cos(angle) - 1) + 12; // offset to align with center
  const y = -x * x * 0.003 - (1 - Math.cos(angle)) * 2; // Curve of Spee (Y-dip in molars)
  
  return new THREE.Vector3(x, y, z);
}

/**
 * Generates initial teeth metadata list
 */
export function generateTeethList(): Tooth[] {
  return TOOTH_METADATA.map((meta, index) => {
    const pos = getToothPosition(index);
    
    // Set widths & heights based on tooth type
    let width = 6.0;
    let height = 7.5;
    let curvature = 0.5;
    
    switch (meta.type) {
      case ToothType.MOLAR:
        width = 8.5;
        height = 7.0;
        curvature = 0.85;
        break;
      case ToothType.PREMOLAR:
        width = 6.8;
        height = 7.8;
        curvature = 0.65;
        break;
      case ToothType.CANINE:
        width = 6.5;
        height = 9.2;
        curvature = 0.75;
        break;
      case ToothType.INCISOR:
        width = index === 7 || index === 8 ? 8.2 : 6.8; // Central incisors are wider
        height = 9.5;
        curvature = 0.45;
        break;
    }

    return {
      id: meta.id,
      fdiId: meta.fdiId,
      name: meta.name,
      type: meta.type,
      color: SEGMENTATION_COLORS[index],
      width,
      height,
      curvature,
      selectedForGrill: meta.id >= 6 && meta.id <= 11, // default select central teeth for grill
      position: [pos.x, pos.y, pos.z],
    };
  });
}

/**
 * Creates custom deformed geometries to represent realistic teeth shapes.
 */
function createToothGeometry(type: ToothType, width: number, height: number, depth: number): THREE.BufferGeometry {
  let geometry: THREE.BufferGeometry;
  
  if (type === ToothType.MOLAR) {
    // Molars: Boxy with 4 cusps on top
    geometry = new THREE.BoxGeometry(width, height, depth, 6, 6, 6);
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);
      
      // Taper roots (bottom y is negative)
      if (y < 0) {
        const factor = (y + height/2) / height; // 0 at bottom, 1 at middle
        x *= (0.55 + factor * 0.45);
        z *= (0.55 + factor * 0.45);
      } else {
        // Create 4 crown cusps
        const xDist = Math.abs(x) / (width / 2);
        const zDist = Math.abs(z) / (depth / 2);
        if (y > height * 0.3) {
          // Add peaks at the four corners
          const cuspHeight = height * 0.12;
          const peak = Math.sin(xDist * Math.PI / 2) * Math.sin(zDist * Math.PI / 2);
          y += peak * cuspHeight;
        }
        // Slightly bulge center
        const bulge = 1.05 - (y / height) * 0.05;
        x *= bulge;
        z *= bulge;
      }
      
      posAttr.setXYZ(i, x, y, z);
    }
  } else if (type === ToothType.PREMOLAR) {
    // Premolars: Boxy but smaller, with 2 cusps
    geometry = new THREE.BoxGeometry(width, height, depth, 5, 5, 5);
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);
      
      // Taper roots
      if (y < 0) {
        const factor = (y + height/2) / height;
        x *= (0.6 + factor * 0.4);
        z *= (0.6 + factor * 0.4);
      } else {
        // Create 2 crown cusps (buccal and lingual - along Z axis)
        const zDist = Math.abs(z) / (depth / 2);
        if (y > height * 0.2) {
          const peak = Math.sin(zDist * Math.PI);
          y += peak * height * 0.08;
        }
        // Rounded bulge
        const bulge = 1.08 - (y / height) * 0.08;
        x *= bulge;
        z *= bulge;
      }
      posAttr.setXYZ(i, x, y, z);
    }
  } else if (type === ToothType.CANINE) {
    // Canines: Tapered pyramid / pointed diamond shape
    geometry = new THREE.BoxGeometry(width, height, depth, 5, 5, 5);
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);
      
      const yNorm = (y + height / 2) / height; // 0 to 1
      
      if (y > 0) {
        // Pointy cusp at the top-center
        const factor = 1.0 - (y / (height / 2)); // 1 at center, 0 at top
        x *= (factor * 0.85 + 0.15);
        z *= (factor * 0.8 + 0.2);
        // Elevate middle tip
        if (Math.abs(x) < width * 0.2 && Math.abs(z) < depth * 0.2) {
          y += height * 0.08;
        }
      } else {
        // Taper roots
        const factor = yNorm; // 0 at bottom, 0.5 at middle
        x *= (0.6 + factor * 0.8);
        z *= (0.6 + factor * 0.8);
      }
      
      // Bulge crown equator
      if (yNorm > 0.4 && yNorm < 0.6) {
        x *= 1.1;
        z *= 1.1;
      }
      
      posAttr.setXYZ(i, x, y, z);
    }
  } else {
    // Incisors: Spade / wedge-like
    geometry = new THREE.BoxGeometry(width, height, depth, 5, 5, 5);
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);
      
      const yNorm = (y + height / 2) / height; // 0 to 1
      
      if (y > 0) {
        // Flatten along depth (Z) and widen along width (X) to create incisal edge
        const t = y / (height / 2); // 0 to 1
        z *= (1.0 - t * 0.65); // thinner at top
        x *= (1.0 + t * 0.15); // slightly wider spade-like
      } else {
        // Taper root
        const factor = yNorm;
        x *= (0.55 + factor * 0.9);
        z *= (0.65 + factor * 0.7);
      }
      
      posAttr.setXYZ(i, x, y, z);
    }
  }
  
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Creates the pink gingiva (gum) arch base
 */
export function createGingivaMesh(): THREE.Mesh {
  // We model the gums as a thick ribbon/spline curve extruded
  const curvePoints: THREE.Vector3[] = [];
  const resolution = 40;
  
  for (let i = 0; i <= resolution; i++) {
    const t = (i / resolution) * 2 - 1; // -1 to 1
    const angle = t * Math.PI * 0.6;
    
    const archWidth = 35.5; // slightly wider than teeth
    const archDepth = 39.5;
    
    const x = archWidth * Math.sin(angle);
    const z = archDepth * (Math.cos(angle) - 1) + 12;
    const y = -x * x * 0.003 - (1 - Math.cos(angle)) * 2 - 2.5; // lower than teeth crowns
    
    curvePoints.push(new THREE.Vector3(x, y, z));
  }
  
  // Generate a smooth tube or ribbon around these points
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  // We can create a custom extruded geometry using ExtrudeGeometry along a path
  // Or simpler, a TubeGeometry
  const tubeGeom = new THREE.TubeGeometry(curve, 60, 4.2, 12, false);
  
  // Deform tube geometry to flatten top-inner and make it look like gums
  const posAttr = tubeGeom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < posAttr.count; i++) {
    let x = posAttr.getX(i);
    let y = posAttr.getY(i);
    let z = posAttr.getZ(i);
    
    // Squeeze the top-inner slightly to sit nicely under teeth
    if (y > -2.0) {
      y -= 0.5;
    }
    
    posAttr.setXYZ(i, x, y, z);
  }
  tubeGeom.computeVertexNormals();
  
  // Soft matte pink gingiva material
  const material = new THREE.MeshStandardMaterial({
    color: 0xdf8188, // Medical pink gum color
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  
  const mesh = new THREE.Mesh(tubeGeom, material);
  mesh.name = 'Gingiva';
  return mesh;
}

/**
 * Builds the complete procedural dental arch group, with teeth separated as sub-meshes.
 * Each tooth sub-mesh has userData holding its Tooth ID.
 */
export function createProceduralDentalArch(
  teeth: Tooth[],
  mode: 'healthy' | 'segmented' | 'xray' | 'wireframe',
  hoveredToothId: number | null,
  selectedToothId: number | null
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'DentalArch';
  
  // Add gingiva gums
  const gums = createGingivaMesh();
  
  // Modify gums material for different view modes
  if (mode === 'xray') {
    (gums.material as THREE.MeshStandardMaterial).opacity = 0.25;
    (gums.material as THREE.MeshStandardMaterial).transparent = true;
    (gums.material as THREE.MeshStandardMaterial).depthWrite = false;
  } else if (mode === 'wireframe') {
    (gums.material as THREE.MeshStandardMaterial).wireframe = true;
  } else {
    (gums.material as THREE.MeshStandardMaterial).opacity = 1.0;
    (gums.material as THREE.MeshStandardMaterial).transparent = false;
    (gums.material as THREE.MeshStandardMaterial).depthWrite = true;
    (gums.material as THREE.MeshStandardMaterial).wireframe = false;
  }
  group.add(gums);
  
  // Add individual teeth
  teeth.forEach((tooth, idx) => {
    // Generate individual geometry
    const t = (idx - 7.5) / 7.5;
    const tangentAngle = t * Math.PI * 0.58; // orientation angle
    
    // Scale slightly by type
    const depth = tooth.type === ToothType.MOLAR ? 9.5 : tooth.type === ToothType.PREMOLAR ? 8.2 : tooth.type === ToothType.CANINE ? 7.8 : 5.0;
    const geom = createToothGeometry(tooth.type, tooth.width, tooth.height, depth);
    
    // Position
    const pos = new THREE.Vector3(...tooth.position);
    geom.translate(0, tooth.height / 2, 0); // shift origin to tooth base/gums level
    
    // Create material
    let toothColor = 0xfffcf5; // Standard healthy ivory dental shade
    let roughness = 0.15;
    let metalness = 0.1;
    let transparent = false;
    let opacity = 1.0;
    
    if (mode === 'segmented') {
      toothColor = parseInt(tooth.color.replace('#', '0x'));
      roughness = 0.4;
      metalness = 0.1;
    } else if (mode === 'xray') {
      toothColor = 0x88ccff;
      transparent = true;
      opacity = 0.4;
      roughness = 0.1;
      metalness = 0.8;
    }
    
    const mat = new THREE.MeshStandardMaterial({
      color: toothColor,
      roughness,
      metalness,
      transparent,
      opacity,
      depthWrite: mode !== 'xray',
      wireframe: mode === 'wireframe',
    });
    
    const toothMesh = new THREE.Mesh(geom, mat);
    toothMesh.position.copy(pos);
    
    // Rotate to face outward on dental arch curve
    // Normal to parabola is tangent angle + PI/2
    toothMesh.rotation.y = -tangentAngle;
    
    // Tilt teeth slightly inward for dental torque realism (Spee curve)
    toothMesh.rotation.x = -t * 0.08;
    toothMesh.rotation.z = -t * 0.12;
    
    // Store metadata
    toothMesh.name = `Tooth_${tooth.id}`;
    toothMesh.userData = {
      toothId: tooth.id,
      type: 'tooth',
      metadata: tooth,
    };
    
    // Highlight hovered or selected teeth
    const isSelected = selectedToothId === tooth.id;
    const isHovered = hoveredToothId === tooth.id;
    
    if (isSelected || isHovered) {
      // Add a subtle glowing wireframe or selection shell
      const outlineGeom = geom.clone();
      outlineGeom.scale(1.05, 1.05, 1.05);
      const outlineMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x22c55e : 0x3b82f6, // Green for selected, Blue for hovered
        wireframe: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
      outlineMesh.name = 'outline';
      toothMesh.add(outlineMesh);
    }
    
    group.add(toothMesh);
  });
  
  return group;
}

/**
 * Maps vertices of a generic loaded mesh to individual teeth regions based on our 16 parabolic coordinates.
 * This function colorizes the loaded STL/OBJ mesh vertices based on proximity to standard tooth coordinates,
 * implementing a high-fidelity visual segmentation simulation on ANY uploaded custom file!
 */
export function segmentUploadedMesh(
  mesh: THREE.Mesh,
  teeth: Tooth[]
): { segmentedMesh: THREE.Mesh; vertexToothMap: number[] } {
  const geometry = mesh.geometry.clone();
  
  // Make sure geometry has position attribute and color attribute
  const posAttr = geometry.attributes.position as THREE.BufferAttribute;
  if (!posAttr) {
    return { segmentedMesh: mesh, vertexToothMap: [] };
  }
  
  // Ensure the geometry has a colors attribute
  const colors: number[] = [];
  const vertexToothMap: number[] = [];
  
  // Compute loaded mesh bounds to normalize coordinates
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox!;
  const center = new THREE.Vector3();
  bounds.getCenter(center);
  
  // Create mapping matrix to align the scan to our dental model's coordinate frame
  const extents = new THREE.Vector3();
  bounds.getSize(extents);
  
  // Map vertices to closest tooth center
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    
    // Coordinate translation: shift to local origin
    const vPos = new THREE.Vector3(vx - center.x, vy - center.y, vz - center.z);
    
    // Scale mesh position to match standard 34x38mm arch size
    vPos.x *= (34 / (extents.x || 1));
    vPos.z *= (38 / (extents.z || 1));
    vPos.y *= (10 / (extents.y || 1));
    
    // Find closest tooth center among our 16 teeth
    let minDistance = Infinity;
    let closestToothIdx = -1;
    
    for (let tIdx = 0; tIdx < 16; tIdx++) {
      const toothPos = getToothPosition(tIdx);
      // Tooth coordinates are centered around 0, let's adjust Y slightly for crowns vs roots
      toothPos.y += 3.5; 
      
      const dist = vPos.distanceTo(toothPos);
      if (dist < minDistance) {
        minDistance = dist;
        closestToothIdx = tIdx;
      }
    }
    
    // Standard gums filter: if the vertex is too far down (low relative Y), categorize as Gums!
    const relY = (vy - bounds.min.y) / extents.y;
    let isGum = relY < 0.28 || minDistance > 18.0; // bottom 28% of model or far from arch is gums
    
    let colorObj = new THREE.Color(0xfffcf5); // tooth white
    if (isGum) {
      colorObj.setHex(0xdf8188); // Gum pink
      vertexToothMap.push(0); // 0 represents gums
    } else {
      const toothId = closestToothIdx + 1;
      vertexToothMap.push(toothId);
      
      // Get segmentation color for that tooth
      const colorStr = SEGMENTATION_COLORS[closestToothIdx];
      colorObj.setStyle(colorStr);
    }
    
    colors.push(colorObj.r, colorObj.g, colorObj.b);
  }
  
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  
  // Use a material that respects vertex colors
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0.15,
  });
  
  const segmentedMesh = new THREE.Mesh(geometry, material);
  segmentedMesh.name = 'SegmentedUploadedMesh';
  segmentedMesh.rotation.copy(mesh.rotation);
  segmentedMesh.position.copy(mesh.position);
  segmentedMesh.scale.copy(mesh.scale);
  
  return { segmentedMesh, vertexToothMap };
}
