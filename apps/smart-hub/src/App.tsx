import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Wallet } from './components/Wallet';
import AppDetail from './components/AppDetail';
import { BusinessDirectory } from './components/BusinessDirectory';
import ShopreneurLiveCheckout from './components/ShopreneurLiveCheckout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/business-directory" element={<BusinessDirectory />} />
        <Route path="/apps/:slug" element={<AppDetail />} />
        <Route path="/apps/wallet" element={<Wallet />} />
        <Route path="/shopreneur-checkout" element={<ShopreneurLiveCheckout />} />
      </Routes>
    </Router>
  );
}

export default App;
