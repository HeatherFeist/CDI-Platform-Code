/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type Product = Product2D | Product3D;

export interface Product2D {
  type: '2d';
  id: number | string;
  name: string;
  imageUrl: string;
}

export interface Product3D {
  type: '3d';
  id: number | string;
  name: string;
  modelUrl: string;
  thumbnailUrl: string;
}

export interface PaintColor {
  name: string;
  hex: string;
}

export interface DesignPack {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  itemIds: {
    products: (string | number)[];
    paints: string[]; // using name as id
  };
}

export interface SavedDesign {
  id: string;
  dataUrl: string; // This will now be the public URL from Firebase Storage
  name: string;
  storagePath?: string; // Path to the file in Firebase Storage for deletion
}

export interface EstimateItem {
  item: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Estimate {
  materials: EstimateItem[];
  labor: EstimateItem[];
  totalMaterialCost: number;
  totalLaborCost: number;
  totalProjectCost: number;
  zipCode: string;
  notes: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  estimate?: Estimate;
}