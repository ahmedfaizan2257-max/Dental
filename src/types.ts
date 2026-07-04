/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ToothType {
  INCISOR = 'Incisor',
  CANINE = 'Canine',
  PREMOLAR = 'Premolar',
  MOLAR = 'Molar',
}

export interface Tooth {
  id: number; // Universal numbering 1-16 (Upper Arch)
  fdiId: string; // FDI World Dental Federation notation (e.g., "11", "12", "13")
  name: string;
  type: ToothType;
  color: string; // Segmentation color
  width: number; // mm (simulated)
  height: number; // mm (simulated)
  curvature: number; // Surface curvature factor
  selectedForGrill: boolean;
  position: [number, number, number]; // Simulated center coordinate [x, y, z]
}

export enum GrillMaterial {
  YELLOW_GOLD_18K = '18K Yellow Gold',
  WHITE_GOLD_14K = '14K White Gold',
  ROSE_GOLD_18K = '18K Rose Gold',
  PLATINUM = 'Platinum (Pt950)',
  CHROME_COBALT = 'Chrome Cobalt (Dental)',
}

export enum GrillStyle {
  FULL_CAPS = 'Full Caps',
  WINDOW = 'Open Face (Window)',
  FANGS = 'Cap with Fangs',
  ICED_OUT = 'Fully Iced Out',
}

export interface GrillSettings {
  material: GrillMaterial;
  style: GrillStyle;
  thickness: number; // 0.3mm to 1.5mm
  extrustionOffset: number; // how far from tooth mesh surface (0.1 - 0.5mm)
  smoothness: number; // subdivision iterations
  openBorders: boolean; // open border/gaps simulation
}

export enum DiamondPattern {
  PAVE = 'Micro-Pavé (Dense)',
  GRID = 'Uniform Grid',
  BORDER_ONLY = 'Border Inset Outline',
  SINGLE_ROW = 'Single Middle Row',
}

export enum DiamondClarity {
  VVS1 = 'VVS1 (Excellent)',
  VS1 = 'VS1 (Very Good)',
  SI1 = 'SI1 (Slightly Included)',
}

export interface DiamondSettings {
  enabled: boolean;
  pattern: DiamondPattern;
  size: number; // Diamond diameter in mm (e.g., 1.0 - 2.5)
  density: number; // 0.1 to 1.0 (spacing factor)
  color: string; // Diamond hue/sparkle (Clear, Canary Yellow, Pink, Ice Blue)
  clarity: DiamondClarity;
  sparkleSpeed: number; // simulation speed for glittering
}

export interface DentalScan {
  name: string;
  fileSize: string;
  source: 'default' | 'uploaded';
  vertexCount: number;
  triangleCount: number;
  isLowerArch: boolean;
}
