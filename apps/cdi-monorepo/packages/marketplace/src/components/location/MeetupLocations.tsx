import { useState, useEffect } from 'react';
import { MapPin, Shield, Clock, Phone, Star, Navigation, ExternalLink } from 'lucide-react';
import { LocationService } from '../../services/LocationService';
import { MeetupLocation, LocationHelpers } from '../../types/location';

interface MeetupLocationsProps {
  cityId: string;
  userLatitude?: number;
  userLongitude?: number;
  onLocationSelect?: (location: MeetupLocation) => void;
  selectedLocationId?: string;
}

export default function MeetupLocations({ 
  cityId, 
  userLatitude, 
  userLongitude, 
  onLocationSelect,
  selectedLocationId 
}: MeetupLocationsProps) {
  const [locations, setLocations] = useState<MeetupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'police'>('all');
  const locationService = LocationService.getInstance();

  useEffect(() => {
    loadMeetupLocations();
  }, [cityId, userLatitude, userLongitude]);

  const loadMeetupLocations = async () => {
    try {
      let locationsData: MeetupLocation[];
      
      if (userLatitude && userLongitude) {
        locationsData = await locationService.getNearbyMeetupLocations(
          userLatitude, 
          userLongitude, 
          25
        );
      } else {
        locationsData = await locationService.getMeetupLocationsByCity(cityId);
      }
      
      // Calculate distances if user location is provided
      if (userLatitude && userLongitude) {
        locationsData = locationsData.map(location => ({
          ...location,
          distance_miles: LocationHelpers.calculateDistance(
            userLatitude,
            userLongitude,
            location.latitude,
            location.longitude
          )
        }));
        
        // Sort by distance
        locationsData.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
      }
      
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load meetup locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(location => {
    if (filter === 'verified') return location.is_verified;
    if (filter === 'police') return location.location_type === 'police_station';
    return true;
  });

  const getSafetyBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  const formatOperatingHours = (hours?: { [day: string]: string }) => {
    if (!hours) return 'Hours not specified';
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    return hours[today] || 'Closed today';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Safe Meetup Locations</h3>
          <p className="text-sm text-gray-600">
            Verified locations for secure item exchanges
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'verified'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setFilter('police')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'police'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Police Stations
          </button>
        </div>
      </div>

      {/* Locations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLocations.map((location) => {
          const safetyScore = LocationHelpers.getSafetyScore(location);
          const isSelected = selectedLocationId === location.id;
          
          return (
            <div
              key={location.id}
              onClick={() => onLocationSelect?.(location)}
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${onLocationSelect ? 'cursor-pointer' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">
                        {LocationHelpers.getLocationTypeIcon(location.location_type)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                      <span>{location.name}</span>
                      {location.is_verified && (
                        <Shield size={16} className="text-green-500" />
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {LocationHelpers.getLocationTypeLabel(location.location_type)}
                    </p>
                  </div>
                </div>
                
                {location.distance_miles && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {LocationHelpers.formatDistance(location.distance_miles)}
                    </p>
                    <p className="text-xs text-gray-500">away</p>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="flex items-start space-x-2 mb-3">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{location.address}</p>
              </div>

              {/* Safety Score */}
              <div className="flex items-center space-x-2 mb-3">
                <Star size={14} className="text-yellow-400" />
                <span className="text-sm text-gray-600">Safety Score:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSafetyBadgeColor(safetyScore)}`}>
                  {safetyScore}/100
                </span>
              </div>

              {/* Operating Hours */}
              <div className="flex items-center space-x-2 mb-3">
                <Clock size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formatOperatingHours(location.operating_hours)}
                </span>
              </div>

              {/* Safety Features */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Safety Features:</p>
                <div className="flex flex-wrap gap-1">
                  {location.safety_features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                    >
                      {feature.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {location.safety_features.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                      +{location.safety_features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {location.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {location.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://maps.google.com/?q=${location.latitude},${location.longitude}`,
                      '_blank'
                    );
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1 text-sm"
                >
                  <Navigation size={14} />
                  <span>Directions</span>
                </button>
                
                {location.contact_info?.phone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${location.contact_info?.phone}`, '_self');
                    }}
                    className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <Phone size={14} />
                  </button>
                )}
                
                {location.contact_info?.website && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(location.contact_info?.website, '_blank');
                    }}
                    className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-8">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Meetup Locations Found
          </h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No safe meetup locations available in this area yet.'
              : `No ${filter === 'verified' ? 'verified' : 'police station'} locations found.`
            }
          </p>
        </div>
      )}

      {/* Safety Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
          <Shield size={16} />
          <span>Safe Exchange Tips</span>
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {locationService.getSafeExchangeTips().slice(0, 4).map((tip, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}