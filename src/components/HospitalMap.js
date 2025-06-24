import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different marker types using simpler approach
const createDivIcon = (color, size, content) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${size * 0.4}px;
    ">${content}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
};

const userIcon = createDivIcon('#2563eb', 20, '👤');
const hospitalIcon = createDivIcon('#dc2626', 24, '🏥');
const traumaHospitalIcon = createDivIcon('#dc2626', 28, '🚑');

// Component to handle map centering
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
};

const HospitalMap = ({ 
  hospitals, 
  userLocation, 
  onHospitalClick,
  className = "h-96 w-full rounded-lg"
}) => {
  const mapRef = useRef();

  // Default center (Bergenfield, NJ area)
  const defaultCenter = [40.9276, -73.9976];
  const mapCenter = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : defaultCenter;

  const mapZoom = userLocation ? 12 : 10;

  const handleHospitalMarkerClick = (hospital) => {
    if (onHospitalClick) {
      onHospitalClick(hospital);
    }
  };

  const getDirectionsUrl = (hospital) => {
    if (!userLocation) return '#';
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${hospital.coordinates[0]},${hospital.coordinates[1]}`;
    return `https://www.google.com/maps/dir/${origin}/${destination}`;
  };

  return (
    <div className={className}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
                <br />
                <span className="text-sm text-gray-600">
                  Lat: {userLocation.latitude.toFixed(4)}<br />
                  Lng: {userLocation.longitude.toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hospital markers */}
        {hospitals.map((hospital, index) => (
          <Marker
            key={index}
            position={hospital.coordinates}
            icon={hospital.trauma ? traumaHospitalIcon : hospitalIcon}
            eventHandlers={{
              click: () => handleHospitalMarkerClick(hospital)
            }}
          >
            <Popup>
              <div className="min-w-64">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {hospital.name}
                  </h3>
                  {hospital.trauma && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded ml-2">
                      Trauma
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <p>{hospital.address}</p>
                  <p>
                    <a 
                      href={`tel:${hospital.phone}`} 
                      className="text-red-600 hover:text-red-700"
                    >
                      {hospital.phone}
                    </a>
                  </p>
                  {hospital.distance && (
                    <p className="font-medium">Distance: {hospital.distance}</p>
                  )}
                  {hospital.travelTime && (
                    <p className="font-medium">Travel Time: {hospital.travelTime}</p>
                  )}
                </div>

                {userLocation && (
                  <div className="flex space-x-2">
                    <a
                      href={getDirectionsUrl(hospital)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Directions
                    </a>
                    <a
                      href={`tel:${hospital.phone}`}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                    >
                      Call
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default HospitalMap;
