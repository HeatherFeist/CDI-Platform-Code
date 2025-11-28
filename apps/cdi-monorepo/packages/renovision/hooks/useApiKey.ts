/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'gemini-api-key';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
    }
    setIsLoaded(true);
  }, []);

  // Save API key to localStorage
  const saveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  };

  // Clear API key
  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  };

  // Check if API key is valid (basic format check)
  const isValidKey = (key: string): boolean => {
    return key.length > 20 && key.startsWith('AIza');
  };

  return {
    apiKey,
    isLoaded,
    hasValidKey: isValidKey(apiKey),
    saveApiKey,
    clearApiKey,
    isValidKey,
  };
};