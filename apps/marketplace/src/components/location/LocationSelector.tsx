import { useState, useEffect } from 'react';
import { MapPin, CheckCircle, ArrowRight, Users, Calendar, Truck } from 'lucide-react';
import { LocationService } from '../../services/LocationService';
import { City } from '../../types/location';
// import { useAuth } from '../../contexts/AuthContext'; // unused for now

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (city: City) => void;
  currentCityId?: string;
}

export default function LocationSelector({ 
  isOpen, 
  onClose, 
  onLocationSelected, 
  currentCityId 
}: LocationSelectorProps) {
  // const { user } = useAuth(); // unused
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const locationService = LocationService.getInstance();

  useEffect(() => {
    if (isOpen) {
      loadCities();
    }
  }, [isOpen]);

  const loadCities = async () => {
    try {
      const citiesData = await locationService.getCities();
      setCities(citiesData);
      
      // Set current city as selected if provided
      if (currentCityId) {
        const currentCity = citiesData.find(city => city.id === currentCityId);
        if (currentCity) {
          setSelectedCity(currentCity);
        }
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
  };

  const handleConfirmSelection = () => {
    if (selectedCity) {
      onLocationSelected(selectedCity);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <MapPin size={24} className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Choose Your Local Market
            </h2>
          </div>
          <p className="text-gray-600">
            Select your city to see local auctions and connect with nearby buyers and sellers
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {cities.map((city) => (
                <div
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedCity?.id === city.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedCity?.id === city.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <MapPin size={20} />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {city.name}, {city.state}
                        </h3>
                        {city.population && (
                          <p className="text-sm text-gray-500">
                            Population: {city.population.toLocaleString()}
                          </p>
                        )}
                        {city.market_launch_date && (
                          <p className="text-sm text-gray-500">
                            Market launched: {new Date(city.market_launch_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedCity?.id === city.id && (
                      <CheckCircle size={24} className="text-blue-600" />
                    )}
                  </div>

                  {/* City features preview */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center space-y-1">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-600">Local Community</span>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-600">Weekend Markets</span>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <Truck size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-600">Local Delivery</span>
                    </div>
                  </div>
                </div>
              ))}

              {cities.length === 0 && (
                <div className="text-center py-8">
                  <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Markets Available Yet
                  </h3>
                  <p className="text-gray-500">
                    We're expanding to new cities soon. Check back later!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Benefits Section */}
        {selectedCity && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Local Market Benefits:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Meet buyers and sellers locally</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Safe exchange locations</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Weekend community markets</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span>Local delivery services</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Always visible */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedCity}
            className="px-8 py-2.5 bg-gradient-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 font-medium shadow-md"
          >
            <span>{selectedCity ? `Select ${selectedCity.name}` : 'Select City'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}