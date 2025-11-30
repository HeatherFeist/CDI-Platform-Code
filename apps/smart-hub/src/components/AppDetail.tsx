import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface AppMeta {
  title: string;
  device: string;
  description: string;
  stats: Record<string, string>;
  fundingBreakdown: Record<string, string>;
  checklist: string[];
  planUrl: string;
  token: string;
  previewImage: string;
}

const APPS_META: Record<string, AppMeta> = {
  'seasonal-greetings': {
    title: 'Seasonal Greetings',
    device: 'Holiday Pop-Up Shop',
    description:
      'A festive seasonal retail experience with curated gifts, luminous decor, point-of-sale theatrics, and community-first energy.',
    stats: {
      'Fundraising Goal': '$2,000',
      'Earn Rate': '1 coin per $1',
      'Redemption': '1%',
      'Deadline': '60 days',
    },
    fundingBreakdown: {
      Inventory: '$800',
      Display: '$500',
      'Point of Sale': '$400',
      Signage: '$200',
      'Working Capital': '$100',
    },
    checklist: [
      'Square POS System (Point of Sale) — $300, essential',
      'iPad for POS (Point of Sale) — $100, essential',
      'Display Tables (6ft) — 3 units, essential',
      'Wire Display Racks — 5 units, essential',
      'Holiday Decorations Bulk — essential',
      'Gift Items Inventory — essential',
      'Illuminated Signage — important',
      'Gift Bags & Wrapping — important',
    ],
    planUrl: 'https://docs.google.com/document/d/seasonal-greetings-5yr-plan',
    token: 'Holiday Tokens 🎄',
    previewImage: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200',
  },
  'gemstone-trails': {
    title: 'Gemstone Trails',
    device: 'Guided Nature Tours',
    description:
      'Expert-led hikes that uncover Ohio’s natural gems, blending education, sustainability, and family-friendly adventure.',
    stats: {
      'Fundraising Goal': '$1,500',
      'Earn Rate': '1 coin per $1',
      'Redemption': '1%',
      'Deadline': '45 days',
    },
    fundingBreakdown: {
      Equipment: '$600',
      Insurance: '$400',
      Marketing: '$300',
      Permits: '$150',
      'Working Capital': '$50',
    },
    checklist: [
      'Professional First Aid Kits — essential',
      'Two-Way Radios — essential',
      'Trail Guides & Maps — essential',
      'Liability Insurance — essential',
      'Hiking Poles (Loaner Set) — important',
      'Branded Backpacks — important',
      'Website & Booking System — essential',
      'Park Permits & Licenses — essential',
    ],
    planUrl: 'https://docs.google.com/document/d/gemstone-trails-5yr-plan',
    token: 'Trail Tokens 💎',
    previewImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
  },
  'picnic-perfect': {
    title: 'Picnic Perfect',
    device: 'Luxury Pop-Up Events',
    description:
      'Gourmet picnic services with premium linens, curated menus, and Instagram-worthy environments for celebrations.',
    stats: {
      'Fundraising Goal': '$2,000',
      'Earn Rate': '1 coin per $1',
      'Redemption': '1%',
      'Deadline': '60 days',
    },
    fundingBreakdown: {
      'Picnic Sets': '$800',
      Decor: '$500',
      Transport: '$400',
      Marketing: '$200',
      'Working Capital': '$100',
    },
    checklist: [
      'Premium Picnic Baskets — essential',
      'Low Picnic Tables — essential',
      'Luxury Blankets & Pillows — essential',
      'String Lights & Lanterns — important',
      'Reusable Tableware Set — essential',
      'Cargo Van Rental (3 months) — essential',
      'Photography Props — important',
      'Social Media Marketing — important',
    ],
    planUrl: 'https://docs.google.com/document/d/picnic-perfect-5yr-plan',
    token: 'Picnic Points 🧺',
    previewImage: 'https://images.unsplash.com/photo-1511689985-44fb0d3c9a81?w=1200',
  },
  'dayton-micro-farms': {
    title: 'Dayton Micro-Farms',
    device: 'Indoor Vertical Farms',
    description:
      'Sustainable microgreens farm providing nutrient-dense produce to restaurants and families through vertical growing towers.',
    stats: {
      'Fundraising Goal': '$2,200',
      'Earn Rate': '1 coin per $1',
      'Redemption': '1%',
      'Deadline': '90 days',
    },
    fundingBreakdown: {
      'Grow Systems': '$1,000',
      Seeds: '$300',
      Lighting: '$400',
      Packaging: '$200',
      Licenses: '$200',
      'Working Capital': '$100',
    },
    checklist: [
      'Vertical Grow Racks (4-tier) — 2 units',
      'LED Grow Lights — essential',
      'Growing Trays (10x20) — 50 units',
      'Organic Seed Variety Pack — essential',
      'Misting System — important',
      'Food Handler License — essential',
      'Business Permits — essential',
      'Compostable Packaging — essential',
      'Growing Medium (Soil) — essential',
    ],
    planUrl: 'https://docs.google.com/document/d/dayton-micro-farms-5yr-plan',
    token: 'MicroFarm Coins 🌱',
    previewImage: 'https://images.unsplash.com/photo-1484981138541-3d074aa97716?w=1200',
  },
};

export const AppDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const meta = slug ? APPS_META[slug] : null;

  if (!meta) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-2xl text-center p-8">
          <h2 className="text-2xl font-bold">App not found</h2>
          <p className="text-gray-400 mt-4">We couldn't locate that app.</p>
          <button onClick={() => navigate(-1)} className="mt-6 bg-primary-500 px-4 py-2 rounded-md">Go Back</button>
        </div>
      </div>
    );
  }

  return (
        <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-12">
          <div className="max-w-4xl mx-auto bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden">
            <div
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(20,24,40,0.1), rgba(20,24,40,0.9)), url(${meta.previewImage})` }}
            />
            <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">{meta.title}</h1>
                <div className="text-sm text-gray-400">{meta.device}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg bg-gray-700 text-white">Back</button>
                <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-primary-500 text-white flex items-center gap-2">
                  Dashboard
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <p className="text-gray-300 mb-6">{meta.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(meta.stats).map(([k, v]) => (
                <div key={k} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                  <div className="text-xs text-gray-400 uppercase">{k}</div>
                  <div className="font-bold text-white mt-1">{String(v)}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold mb-2">Funding Breakdown</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {Object.entries(meta.fundingBreakdown).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b border-gray-800 pb-1">
                      <span>{key}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Equipment Checklist</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  {meta.checklist.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-gray-900/50 rounded-2xl border border-gray-700 p-5 flex flex-col gap-3">
              <div className="text-sm text-gray-400">Key Token</div>
              <div className="text-lg font-bold">{meta.token}</div>
              <a
                href={meta.planUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary-500 underline"
              >
                View 5-year strategic plan
              </a>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AppDetail;
