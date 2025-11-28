
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Product, PaintColor, DesignPack } from './types';

export const STOCK_PRODUCTS: Product[] = [
  {
    type: '2d',
    id: 1,
    name: 'Modern Gray Sofa',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/generative-ai-app-builder/constructive_designs/modern_gray_sofa.png',
  },
  {
    type: '2d',
    id: 2,
    name: 'Bohemian Wall Art',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/generative-ai-app-builder/constructive_designs/bohemian_wall_art.png',
  },
  {
    type: '2d',
    id: 3,
    name: 'Industrial Coffee Table',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/generative-ai-app-builder/constructive_designs/industrial_coffee_table.png',
  },
  {
    type: '2d',
    id: 4,
    name: 'Potted Snake Plant',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/generative-ai-app-builder/constructive_designs/potted_snake_plant.png',
  },
  {
    type: '3d',
    id: 5,
    name: 'Eames Lounge Chair',
    thumbnailUrl: 'https://storage.googleapis.com/aistudio-hosting/generative-ai-app-builder/constructive_designs/eames_chair_thumb.png',
    modelUrl: 'https://storage.googleapis.com/aistudio-hosting/generative-ai-app-builder/constructive_designs/eames_chair.glb',
  }
];

export const STOCK_PAINTS: PaintColor[] = [
  { name: 'Swiss Coffee', hex: '#F5F3EB' },
  { name: 'Hale Navy', hex: '#4F5A67' },
  { name: 'Revere Pewter', hex: '#D0CFC8' },
  { name: 'Sea Salt', hex: '#D2D5CD' },
  { name: 'Guilford Green', hex: '#C6C8B5' },
  { name: 'Urbane Bronze', hex: '#5E5A54' },
];

export const DESIGN_PACKS: DesignPack[] = [
  {
    id: 'mid-century-modern',
    name: 'Mid-Century Modern',
    description: 'A curated pack of iconic furniture and earthy tones for a classic mid-century look.',
    thumbnailUrl: 'https://storage.googleapis.com/aistudio-hosting/generative-ai-app-builder/constructive_designs/pack_mid_century.png',
    itemIds: {
      products: [1, 5],
      paints: ['Urbane Bronze', 'Guilford Green'],
    }
  }
];
