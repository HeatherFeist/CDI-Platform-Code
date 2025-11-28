import { AppMode } from './types';

export const APP_MODES = [
  {
    id: AppMode.RENOVATION,
    label: 'Home Renovation',
    description: 'Visualize upgrades by installing products or analyzing project estimates.',
    icon: 'Home'
  },
  {
    id: AppMode.MARKETPLACE,
    label: 'Marketplace Studio',
    description: 'Create professional product backgrounds while keeping items true to life.',
    icon: 'ShoppingBag'
  },
  {
    id: AppMode.GENERAL,
    label: 'Creative Edit',
    description: 'General purpose AI image editing and transformation.',
    icon: 'Wand'
  }
];

export const PLACEHOLDER_IMAGE = 'https://picsum.photos/800/600';