
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Disappear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in">
      <p>{message}</p>
    </div>
  );
};

export default Toast;
