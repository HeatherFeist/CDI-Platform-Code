import { useState, useEffect } from 'react';
import { CreditCard, Trash2, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/stripe';

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface CardManagerProps {
  onSelectCard: (paymentMethodId: string) => void;
  selectedCardId: string;
  onSelectedCardChange: (cardId: string) => void;
  showPayButton?: boolean;
  paymentAmount?: number;
}

export default function CardManager({ 
  onSelectCard, 
  selectedCardId, 
  onSelectedCardChange,
  showPayButton = false,
  paymentAmount = 0
}: CardManagerProps) {
  const { user } = useAuth();
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedCards();
    }
  }, [user]);

  // This would typically fetch saved cards from your backend
  const fetchSavedCards = async () => {
    // For demo purposes, we'll show some mock cards
    // In production, this would call your Supabase edge function
    setSavedCards([
      {
        id: 'pm_1234567890',
        last4: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2028,
        is_default: true
      },
      {
        id: 'pm_0987654321',
        last4: '5555',
        brand: 'mastercard',
        exp_month: 6,
        exp_year: 2027,
        is_default: false
      }
    ]);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      setLoading(true);
      try {
        // Call your backend to delete the payment method from Stripe
        setSavedCards(cards => cards.filter(card => card.id !== cardId));
        if (selectedCardId === cardId) {
          onSelectedCardChange('');
        }
      } catch (error) {
        console.error('Error deleting card:', error);
        alert('Failed to delete payment method');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePayWithSelectedCard = () => {
    if (selectedCardId) {
      onSelectCard(selectedCardId);
    }
  };

  if (savedCards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No saved payment methods</p>
        <p className="text-sm">Add a new card to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Payment Methods</h3>
      
      {savedCards.map((card) => (
        <div
          key={card.id}
          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
            selectedCardId === card.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelectedCardChange(card.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <CreditCard size={20} className="text-gray-400" />
                {selectedCardId === card.id && (
                  <Check size={12} className="absolute -top-1 -right-1 text-blue-600 bg-white rounded-full" />
                )}
              </div>
              <div>
                <div className="font-medium flex items-center space-x-2">
                  <span>{card.brand.toUpperCase()} •••• {card.last4}</span>
                  {card.is_default && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Expires {card.exp_month.toString().padStart(2, '0')}/{card.exp_year}
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCard(card.id);
              }}
              className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={loading}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      
      {showPayButton && selectedCardId && paymentAmount > 0 && (
        <button
          onClick={handlePayWithSelectedCard}
          disabled={loading}
          className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing...' : `Pay ${formatCurrency(paymentAmount)}`}
        </button>
      )}
    </div>
  );
}