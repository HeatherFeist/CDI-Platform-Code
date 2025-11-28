/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { BusinessProvider } from './contexts/BusinessContext';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BusinessProvider>
        <RouterProvider router={router} />
      </BusinessProvider>
    </AuthProvider>
  );
};

export default App;