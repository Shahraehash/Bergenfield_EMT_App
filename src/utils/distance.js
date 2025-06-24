// Distance calculation utilities using routing services for driving distances

/**
 * Calculate driving distance and time using OpenRouteService API (free tier)
 * @param {Object} userLocation - User's coordinates {latitude, longitude}
 * @param {Array} hospitalCoords - Hospital coordinates [lat, lon]
 * @returns {Promise<Object>} Distance and duration information
 */
export const calculateDrivingDistance = async (userLocation, hospitalCoords) => {
  try {
    // Using OpenRouteService free API (no key required for basic usage)
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${userLocation.longitude},${userLocation.latitude}&end=${hospitalCoords[1]},${hospitalCoords[0]}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      }
    });

    if (!response.ok) {
      throw new Error('Routing service unavailable');
    }

    const data = await response.json();
    const route = data.features[0];
    
    if (route && route.properties) {
      const distanceKm = route.properties.segments[0].distance / 1000;
      const distanceMiles = Math.round(distanceKm * 0.621371 * 10) / 10; // Convert to miles
      const durationMinutes = Math.round(route.properties.segments[0].duration / 60);
      
      return {
        distance: distanceMiles,
        duration: durationMinutes,
        distanceText: `${distanceMiles} miles`,
        durationText: formatDuration(durationMinutes)
      };
    }
  } catch (error) {
    console.warn('Driving distance calculation failed, falling back to straight-line distance:', error);
    // Fallback to straight-line distance calculation
    return calculateStraightLineDistance(userLocation, hospitalCoords);
  }
};

/**
 * Fallback: Calculate straight-line distance using Haversine formula
 * @param {Object} userLocation - User's coordinates {latitude, longitude}
 * @param {Array} hospitalCoords - Hospital coordinates [lat, lon]
 * @returns {Object} Distance information
 */
const calculateStraightLineDistance = (userLocation, hospitalCoords) => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(hospitalCoords[0] - userLocation.latitude);
  const dLon = toRadians(hospitalCoords[1] - userLocation.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLocation.latitude)) * Math.cos(toRadians(hospitalCoords[0])) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Math.round(R * c * 10) / 10;
  
  // Estimate driving time (assume 35 mph average for emergency vehicles)
  const estimatedMinutes = Math.round((distance / 35) * 60);
  
  return {
    distance: distance,
    duration: estimatedMinutes,
    distanceText: `~${distance} miles`,
    durationText: formatDuration(estimatedMinutes)
  };
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate driving distances for all hospitals
 * @param {Object} userLocation - User's coordinates {latitude, longitude}
 * @param {Array} hospitals - Array of hospital objects with coordinates
 * @returns {Promise<Array>} Hospitals with calculated driving distances
 */
export const calculateHospitalDistances = async (userLocation, hospitals) => {
  if (!userLocation || !hospitals) return hospitals;

  const hospitalsWithDistances = await Promise.all(
    hospitals.map(async (hospital) => {
      try {
        const distanceInfo = await calculateDrivingDistance(userLocation, hospital.coordinates);
        
        return {
          ...hospital,
          calculatedDistance: distanceInfo.distance,
          calculatedDuration: distanceInfo.duration,
          distance: distanceInfo.distanceText,
          travelTime: distanceInfo.durationText
        };
      } catch (error) {
        console.error(`Error calculating distance for ${hospital.name}:`, error);
        return {
          ...hospital,
          calculatedDistance: 999,
          calculatedDuration: 999,
          distance: 'Unknown',
          travelTime: 'Unknown'
        };
      }
    })
  );

  // Sort by distance (closest first)
  return hospitalsWithDistances.sort((a, b) => a.calculatedDistance - b.calculatedDistance);
};

/**
 * Format duration for display
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
const formatDuration = (minutes) => {
  if (minutes < 1) {
    return '< 1 min';
  } else if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
};

/**
 * Get directions URL for external navigation apps
 * @param {Object} userLocation - User's coordinates
 * @param {Array} hospitalCoords - Hospital coordinates [lat, lon]
 * @param {string} hospitalName - Hospital name
 * @returns {string} Google Maps directions URL
 */
export const getDirectionsUrl = (userLocation, hospitalCoords, hospitalName) => {
  const origin = `${userLocation.latitude},${userLocation.longitude}`;
  const destination = `${hospitalCoords[0]},${hospitalCoords[1]}`;
  return `https://www.google.com/maps/dir/${origin}/${destination}`;
};
