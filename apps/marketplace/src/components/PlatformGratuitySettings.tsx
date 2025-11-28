import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PlatformGratuitySettingsProps {
  userId: string;
}

export const PlatformGratuitySettings: React.FC<PlatformGratuitySettingsProps> = ({ userId }) => {
  const [gratuityPercentage, setGratuityPercentage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadGratuitySettings();
  }, [userId]);

  const loadGratuitySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('platform_gratuity_percentage')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setGratuityPercentage(data?.platform_gratuity_percentage || 10);
    } catch (error) {
      console.error('Error loading gratuity settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveGratuitySettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ platform_gratuity_percentage: gratuityPercentage })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: `Platform gratuity updated to ${gratuityPercentage}%` 
      });
    } catch (error) {
      console.error('Error saving gratuity settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateExample = (itemPrice: number) => {
    const gratuity = (itemPrice * gratuityPercentage) / 100;
    const total = itemPrice + gratuity;
    return { gratuity: gratuity.toFixed(2), total: total.toFixed(2) };
  };

  const example = calculateExample(100);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Platform Gratuity Settings
        </h3>
        <p className="text-sm text-gray-600">
          Similar to DoorDash driver tips, this gratuity helps support the platform. 
          It's added automatically to each sale and is fully customizable.
        </p>
      </div>

      {/* Current Setting */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-blue-800">Current Platform Gratuity:</span>
          <span className="text-2xl font-bold text-blue-900">{gratuityPercentage}%</span>
        </div>
        <p className="text-xs text-blue-700">
          This optional donation supports platform operations and development. Buyers can customize or remove it during checkout.
        </p>
      </div>

      {/* Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adjust Platform Gratuity (0% - 30%)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={gratuityPercentage}
            onChange={(e) => setGratuityPercentage(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <input
            type="number"
            min="0"
            max="30"
            step="0.5"
            value={gratuityPercentage}
            onChange={(e) => setGratuityPercentage(Math.min(30, Math.max(0, parseFloat(e.target.value) || 0)))}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
          />
          <span className="text-gray-700 font-medium">%</span>
        </div>
        
        {/* Quick Presets */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setGratuityPercentage(0)}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition"
          >
            0% (None)
          </button>
          <button
            onClick={() => setGratuityPercentage(10)}
            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition"
          >
            10% (Suggested)
          </button>
          <button
            onClick={() => setGratuityPercentage(15)}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition"
          >
            15%
          </button>
          <button
            onClick={() => setGratuityPercentage(20)}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition"
          >
            20%
          </button>
        </div>
      </div>

      {/* Example Calculation */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Example: $100 Sale</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Item Price:</span>
            <span className="font-medium text-gray-900">$100.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform Gratuity ({gratuityPercentage}%):</span>
            <span className="font-medium text-blue-600">+${example.gratuity}</span>
          </div>
          <div className="border-t border-gray-300 pt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Buyer Pays:</span>
            <span className="font-bold text-gray-900">${example.total}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">You Receive:</span>
            <span className="text-green-600 font-medium">$100.00</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-6">
        <p className="text-xs font-semibold text-amber-800 mb-1">💡 How It Works</p>
        <ul className="text-xs text-amber-700 space-y-1 ml-4 list-disc">
          <li>Optional donation is suggested at checkout (buyers can customize or remove)</li>
          <li>Buyers see the breakdown and can adjust before purchasing</li>
          <li>You receive 100% of your item price</li>
          <li>Donations support platform infrastructure, hosting, and new features</li>
          <li>You can adjust your suggested percentage anytime</li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={saveGratuitySettings}
          disabled={isSaving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Transparency Note */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          We believe in transparency. This optional donation is clearly shown to buyers and can be adjusted during checkout.
          Thank you for supporting our mission to connect trades and homeowners! 🏗️
        </p>
      </div>
    </div>
  );
};
