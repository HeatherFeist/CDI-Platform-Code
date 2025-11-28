import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/layout/Layout';
import HomePage from './components/home/HomePage';
import CreateListing from './components/listings/CreateListing';
import EditListing from './components/listings/EditListing';
import ListingDetail from './components/listings/ListingDetail';
import Dashboard from './components/dashboard/Dashboard';
import ProfilePage from './components/profile/ProfilePage';
import AdminPanel from './components/admin/AdminPanel';
import TradingDashboard from './components/trading/TradingDashboard';
import SocialSettings from './components/social/SocialSettings';
import { AISettings } from './components/settings/AISettings';
import { PricingPage } from './components/info/PricingPage';
import { CheckoutSuccess } from './components/checkout/CheckoutSuccess';
import { CheckoutCancel } from './components/checkout/CheckoutCancel';
import StorefrontPage from './components/store/StorefrontPage';
import BrowseStore from './components/store/BrowseStore';
import BrowseTrade from './components/trade/BrowseTrade';
import StoreDirectory from './components/directory/StoreDirectory';
import MemberRegistration from './components/membership/MemberRegistration';
import ErrorBoundary from './components/common/ErrorBoundary';
import BidBotChat from './components/agent/BidBotChat';
import { AIChatLauncher } from './components/ai/AIChatAssistant';
import AboutPage from './components/nonprofit/AboutPage';
import DonatePage from './components/nonprofit/DonatePage';
import ImpactPage from './components/nonprofit/ImpactPage';
import ProgramsPage from './components/nonprofit/ProgramsPage';
import ContactPage from './components/nonprofit/ContactPage';
import PrivacyPolicyPage from './components/nonprofit/PrivacyPolicyPage';
import NonprofitStatusPage from './components/nonprofit/NonprofitStatusPage';
import ProductPage from './app/products/[id]/page';
import EmbeddedProductPage from './app/products/embed/[id]/page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary><div>Something went wrong</div></ErrorBoundary>,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'listings/create',
        element: <CreateListing />
      },
      {
        path: 'listings/:id/edit',
        element: <EditListing />
      },
      {
        path: 'listings/:id',
        element: <ListingDetail />
      },
      {
        path: 'products/:id',
        element: <ProductPage />
      },
      {
        path: 'products/embed/:id',
        element: <EmbeddedProductPage />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'trading',
        element: <TradingDashboard />
      },
      {
        path: 'profile',
        element: <ProfilePage />
      },
      {
        path: 'settings/social',
        element: <SocialSettings />
      },
      {
        path: 'settings/ai',
        element: <AISettings />
      },
      {
        path: 'pricing',
        element: <PricingPage />
      },
      {
        path: 'success',
        element: <CheckoutSuccess />
      },
      {
        path: 'cancel',
        element: <CheckoutCancel />
      },
      {
        path: 'store/browse',
        element: <BrowseStore />
      },
      {
        path: 'trade',
        element: <BrowseTrade />
      },
      {
        path: 'store/directory',
        element: <StoreDirectory />
      },
      {
        path: 'store/:username',
        element: <StorefrontPage />
      },
      {
        path: 'members/register',
        element: <MemberRegistration />
      },
      {
        path: 'admin',
        element: <AdminPanel />
      },
      {
        path: 'about',
        element: <AboutPage />
      },
      {
        path: 'donate',
        element: <DonatePage />
      },
      {
        path: 'impact',
        element: <ImpactPage />
      },
      {
        path: 'programs',
        element: <ProgramsPage />
      },
      {
        path: 'contact',
        element: <ContactPage />
      },
      {
        path: 'privacy',
        element: <PrivacyPolicyPage />
      },
      {
        path: 'nonprofit-status',
        element: <NonprofitStatusPage />
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
        {/* <BidBotChat /> - Disabled: Using Gemini AI Chat instead */}
        <AIChatLauncher 
          userType="seller" 
          currentPage="marketplace"
        />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
