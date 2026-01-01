import React, { useState } from 'react';
import { Coins, Palette, Edit3, Wallet, ExternalLink } from 'lucide-react';
import { MerchantCoinConfig } from '../types';

interface MerchantCoinConfiguratorProps {
  config: MerchantCoinConfig | undefined;
  storeName: string;
  brandColor: string;
  onSave: (config: MerchantCoinConfig) => void;
}

const MerchantCoinConfigurator: React.FC<MerchantCoinConfiguratorProps> = ({
  config,
  storeName,
  brandColor,
  onSave
}) => {
  const [localConfig, setLocalConfig] = useState<MerchantCoinConfig>(
    config || {
      enabled: false,
      coinName: `${storeName} Coins`,
      coinSymbol: '🪙',
      brandColor: brandColor,
      earnRate: 1.0,
      redemptionRate: 10,
      redemptionRules: 'Earn 1 coin per $1 spent. Redeem 10 coins for $1 off.',
      minimumRedemption: 10,
      businessType: 'online_store',
      businessStatus: 'active'
    }
  );

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(localConfig);
    setIsEditing(false);
  };

  const handleImageEditorLink = () => {
    // Open image editor in new tab
    window.open('/image-editor', '_blank');
  };

  const handleWalletLink = () => {
    // Open wallet in new tab
    window.open('/wallet', '_blank');
  };

  const coinEmojis = ['🪙', '💰', '💎', '⭐', '🔷', '🟡', '🏅', '🎖️', '🌟', '✨'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Coins className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Merchant Coin System</h3>
            <p className="text-sm text-gray-500">Create your own branded loyalty coins</p>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm font-medium text-gray-700">
            {localConfig.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localConfig.enabled}
              onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
        </label>
      </div>

      {localConfig.enabled && (
        <div className="space-y-4 border-t pt-4">
          {/* Coin Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coin Name
            </label>
            <input
              type="text"
              value={localConfig.coinName}
              onChange={(e) => setLocalConfig({ ...localConfig, coinName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Shop Coins, Points, Rewards"
            />
          </div>

          {/* Coin Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coin Symbol
            </label>
            <div className="flex gap-2 flex-wrap">
              {coinEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setLocalConfig({ ...localConfig, coinSymbol: emoji })}
                  className={`w-12 h-12 flex items-center justify-center text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                    localConfig.coinSymbol === emoji
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Logo/Design */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-3">
              <Palette className="w-5 h-5 text-purple-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Create Custom Coin Design</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Design a unique brand logo or merchant coin graphic in our Image Editor
                </p>
                <button
                  onClick={handleImageEditorLink}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  Open Image Editor
                  <ExternalLink className="w-3 h-3" />
                </button>
                {localConfig.logoUrl && (
                  <div className="mt-3 flex items-center gap-2">
                    <img
                      src={localConfig.logoUrl}
                      alt="Coin logo"
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                    />
                    <span className="text-sm text-green-600 font-medium">✓ Logo set</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Brand Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Color
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={localConfig.brandColor}
                onChange={(e) => setLocalConfig({ ...localConfig, brandColor: e.target.value })}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={localConfig.brandColor}
                onChange={(e) => setLocalConfig({ ...localConfig, brandColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Earn Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Earn Rate (coins per $1 spent)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={localConfig.earnRate}
              onChange={(e) => setLocalConfig({ ...localConfig, earnRate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customer earns {localConfig.earnRate} coin(s) for every $1 they spend
            </p>
          </div>

          {/* Redemption Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redemption Rate (coins per $1 discount)
            </label>
            <input
              type="number"
              min="1"
              value={localConfig.redemptionRate}
              onChange={(e) => setLocalConfig({ ...localConfig, redemptionRate: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customer needs {localConfig.redemptionRate} coin(s) to get $1 off
            </p>
          </div>

          {/* Minimum Redemption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Coins to Redeem
            </label>
            <input
              type="number"
              min="1"
              value={localConfig.minimumRedemption}
              onChange={(e) => setLocalConfig({ ...localConfig, minimumRedemption: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Redemption Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redemption Rules
            </label>
            <textarea
              value={localConfig.redemptionRules}
              onChange={(e) => setLocalConfig({ ...localConfig, redemptionRules: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Maximum 50% of order total, Cannot be combined with other offers"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Preview</h4>
            <div className="bg-white rounded-lg p-4 shadow-sm" style={{ borderLeft: `4px solid ${localConfig.brandColor}` }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{localConfig.coinSymbol}</span>
                <div>
                  <h5 className="font-bold text-gray-900">{localConfig.coinName}</h5>
                  <p className="text-sm text-gray-500">{storeName}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Earn {localConfig.earnRate} coin per $1 spent</p>
                <p>• Redeem {localConfig.redemptionRate} coins for $1 off</p>
                <p>• {localConfig.redemptionRules}</p>
              </div>
            </div>
          </div>

          {/* View in Wallet */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">View in Quantum Wallet</h4>
                <p className="text-sm text-gray-600 mb-3">
                  See how your merchant coins appear in customers' wallets
                </p>
                <button
                  onClick={handleWalletLink}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Wallet className="w-4 h-4" />
                  Open Wallet
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Save Merchant Coin Configuration
            </button>
          </div>
        </div>
      )}

      {!localConfig.enabled && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">Enable merchant coins to start building customer loyalty</p>
          <p className="text-sm">Customers will earn coins with every purchase and can redeem them for discounts</p>
        </div>
      )}
    </div>
  );
};

export default MerchantCoinConfigurator;
