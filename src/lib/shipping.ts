// Shipping Cost Calculation Service
// Using RajaOngkir API for shipping cost calculation
// Origin: Semarang Kota (ID: 399)

export interface ShippingRequest {
  destinationCityId: string;
  destinationCityName: string;
  courier: 'jne' | 'tiki' | 'pos';
  weight: number; // in grams (default: 500g for book)
}

export interface ShippingCost {
  service: string;
  description: string;
  cost: number;
  etd: string; // estimated time of delivery
}

export interface ShippingResponse {
  courier: string;
  costs: ShippingCost[];
}

// Semarang Kota City ID
const SEMARANG_KOTA_ID = '399';

// Default book weight in grams
const DEFAULT_BOOK_WEIGHT = 500;

export const calculateShippingCost = async (
  destinationCityId: string,
  destinationCityName: string,
  courier: 'jne' | 'tiki' | 'pos' = 'jne',
  weight: number = DEFAULT_BOOK_WEIGHT
): Promise<ShippingResponse> => {
  try {
    // Call backend API endpoint for RajaOngkir
    // In development, Vite proxy will forward /api/* to backend
    // In production, use VITE_API_URL environment variable
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const apiUrl = `${baseUrl}/api/shipping/calculate`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: SEMARANG_KOTA_ID,
        destination: destinationCityId,
        weight,
        courier,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to calculate shipping cost' }));
      throw new Error(error.message || 'Failed to calculate shipping cost');
    }

    const data = await response.json();
    
    return {
      courier: data.courier || courier,
      costs: data.costs || [],
    };
  } catch (error) {
    console.error('Shipping cost calculation error:', error);
    // Fallback: return estimated cost based on distance
    return getEstimatedShippingCost(destinationCityName, courier);
  }
};

// Fallback function for estimated shipping cost
const getEstimatedShippingCost = (
  destinationCity: string,
  courier: 'jne' | 'tiki' | 'pos'
): ShippingResponse => {
  // Simple estimation based on courier
  const baseCosts: Record<string, ShippingCost[]> = {
    jne: [
      { service: 'REG', description: 'JNE Reguler', cost: 15000, etd: '2-3 hari' },
      { service: 'OKE', description: 'JNE OKE', cost: 20000, etd: '1-2 hari' },
      { service: 'YES', description: 'JNE YES', cost: 30000, etd: '1 hari' },
    ],
    tiki: [
      { service: 'REG', description: 'TIKI Reguler', cost: 18000, etd: '2-3 hari' },
      { service: 'ECO', description: 'TIKI ECO', cost: 25000, etd: '1-2 hari' },
    ],
    pos: [
      { service: 'Paket Kilat Khusus', description: 'POS Kilat Khusus', cost: 20000, etd: '1-2 hari' },
      { service: 'Paketpos', description: 'POS Reguler', cost: 12000, etd: '3-5 hari' },
    ],
  };

  return {
    courier,
    costs: baseCosts[courier] || baseCosts.jne,
  };
};

// Get city ID from city name (simplified - in production, use proper city list)
export const getCityId = async (cityName: string): Promise<string | null> => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const apiUrl = `${baseUrl}/api/shipping/cities`;
    const response = await fetch(`${apiUrl}?search=${encodeURIComponent(cityName)}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.city_id || null;
  } catch (error) {
    console.error('City ID lookup error:', error);
    return null;
  }
};

