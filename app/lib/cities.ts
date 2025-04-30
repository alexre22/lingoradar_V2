import { Asset } from 'expo-asset';

export interface City {
  id: number;
  city: string;
  coordinates: [number, number];
  userCount: number;
}

export const cities: City[] = [
  { id: 1, city: 'New York', coordinates: [-74.006, 40.7128], userCount: 5 },
  { id: 2, city: 'London', coordinates: [-0.1276, 51.5074], userCount: 3 },
  { id: 3, city: 'Tokyo', coordinates: [139.6917, 35.6895], userCount: 4 },
  { id: 4, city: 'Paris', coordinates: [2.3522, 48.8566], userCount: 2 },
  { id: 5, city: 'Berlin', coordinates: [13.4050, 52.5200], userCount: 3 },
  { id: 6, city: 'Moscow', coordinates: [37.6173, 55.7558], userCount: 2 },
  { id: 7, city: 'Dubai', coordinates: [55.2708, 25.2048], userCount: 1 },
  { id: 8, city: 'Singapore', coordinates: [103.8198, 1.3521], userCount: 3 },
  { id: 9, city: 'Hong Kong', coordinates: [114.1655, 22.3193], userCount: 2 },
  { id: 10, city: 'Shanghai', coordinates: [121.4737, 31.2304], userCount: 4 },
  { id: 11, city: 'Mumbai', coordinates: [72.8777, 19.0760], userCount: 3 },
  { id: 12, city: 'Istanbul', coordinates: [28.9784, 41.0082], userCount: 2 },
  { id: 13, city: 'Rome', coordinates: [12.4964, 41.9028], userCount: 1 },
  { id: 14, city: 'Barcelona', coordinates: [2.1734, 41.3851], userCount: 2 },
  { id: 15, city: 'Amsterdam', coordinates: [4.8952, 52.3702], userCount: 3 },
  { id: 16, city: 'Vienna', coordinates: [16.3738, 48.2082], userCount: 2 },
  { id: 17, city: 'Prague', coordinates: [14.4378, 50.0755], userCount: 1 },
  { id: 18, city: 'Budapest', coordinates: [19.0402, 47.4979], userCount: 2 },
  { id: 19, city: 'Warsaw', coordinates: [21.0122, 52.2297], userCount: 1 },
  { id: 20, city: 'Stockholm', coordinates: [18.0686, 59.3293], userCount: 2 },
  { id: 21, city: 'Copenhagen', coordinates: [12.5683, 55.6761], userCount: 1 },
  { id: 22, city: 'Helsinki', coordinates: [24.9384, 60.1699], userCount: 1 },
  { id: 23, city: 'Oslo', coordinates: [10.7522, 59.9139], userCount: 1 },
  { id: 24, city: 'Dublin', coordinates: [-6.2603, 53.3498], userCount: 2 },
  { id: 25, city: 'Edinburgh', coordinates: [-3.1883, 55.9533], userCount: 1 },
  { id: 26, city: 'Madrid', coordinates: [-3.7038, 40.4168], userCount: 2 },
  { id: 27, city: 'Lisbon', coordinates: [-9.1393, 38.7223], userCount: 1 },
  { id: 28, city: 'Athens', coordinates: [23.7275, 37.9838], userCount: 1 },
  { id: 29, city: 'Zurich', coordinates: [8.5417, 47.3769], userCount: 2 },
  { id: 30, city: 'Geneva', coordinates: [6.1432, 46.2044], userCount: 1 },
  { id: 31, city: 'Brussels', coordinates: [4.3517, 50.8503], userCount: 2 },
  { id: 32, city: 'Luxembourg', coordinates: [6.1296, 49.8153], userCount: 1 },
  { id: 33, city: 'Monaco', coordinates: [7.4246, 43.7384], userCount: 1 },
  { id: 34, city: 'San Marino', coordinates: [12.4418, 43.9424], userCount: 1 },
  { id: 35, city: 'Vatican City', coordinates: [12.4534, 41.9029], userCount: 1 },
  { id: 36, city: 'Andorra la Vella', coordinates: [1.5218, 42.5063], userCount: 1 },
  { id: 37, city: 'Reykjavik', coordinates: [-21.9426, 64.1466], userCount: 1 },
  { id: 38, city: 'Tallinn', coordinates: [24.7536, 59.4370], userCount: 1 },
  { id: 39, city: 'Riga', coordinates: [24.1052, 56.9496], userCount: 1 },
  { id: 40, city: 'Vilnius', coordinates: [25.2797, 54.6872], userCount: 1 },
  { id: 41, city: 'Bratislava', coordinates: [17.1077, 48.1486], userCount: 1 },
  { id: 42, city: 'Ljubljana', coordinates: [14.5058, 46.0569], userCount: 1 },
  { id: 43, city: 'Zagreb', coordinates: [15.9819, 45.8150], userCount: 1 },
  { id: 44, city: 'Sarajevo', coordinates: [18.4131, 43.8563], userCount: 1 },
  { id: 45, city: 'Belgrade', coordinates: [20.4489, 44.7866], userCount: 1 },
  { id: 46, city: 'Bucharest', coordinates: [26.1025, 44.4268], userCount: 1 },
  { id: 47, city: 'Sofia', coordinates: [23.3219, 42.6977], userCount: 1 },
  { id: 48, city: 'Tirana', coordinates: [19.8187, 41.3275], userCount: 1 },
  { id: 49, city: 'Skopje', coordinates: [21.4314, 42.0038], userCount: 1 },
  { id: 50, city: 'Podgorica', coordinates: [19.2594, 42.4304], userCount: 1 }
];

export const loadCitiesFromCSV = async (): Promise<City[]> => {
  try {
    console.log('Starting to load cities...');
    const response = await fetch(require('../worldcities.csv'));
    console.log('CSV file loaded');
    
    const csvText = await response.text();
    console.log('CSV text loaded, length:', csvText.length);
    
    const lines = csvText.split('\n');
    console.log('Number of lines:', lines.length);
    
    const cities: City[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [city, lat, lng] = line.split(';');
      if (city && lat && lng) {
        // Replace comma with period for decimal parsing
        const latitude = parseFloat(lat.replace(',', '.'));
        const longitude = parseFloat(lng.replace(',', '.'));
        
        if (isNaN(latitude) || isNaN(longitude)) {
          console.warn(`Invalid coordinates for city ${city}: lat=${lat}, lng=${lng}`);
          continue;
        }
        
        cities.push({
          id: i,
          city: city.trim(),
          coordinates: [longitude, latitude],
          userCount: Math.floor(Math.random() * 5) + 1
        });
      }
    }
    
    console.log(`Successfully loaded ${cities.length} cities`);
    return cities;
  } catch (error) {
    console.error('Error loading cities:', error);
    return [];
  }
}; 