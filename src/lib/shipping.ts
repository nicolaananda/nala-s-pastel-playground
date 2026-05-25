// Shipping Cost Calculation Service
// Backend: api.co.id (Indonesia Expedition Cost API)
// Origin (Tembalang, Semarang): hardcoded di backend, frontend hanya kirim destination

export interface ShippingCost {
  courierCode: string;   // e.g. "JNE", "SiCepat"
  courierName: string;   // e.g. "JNE Express"
  service: string;       // alias of courierCode (untuk kompatibilitas form)
  description: string;   // alias of courierName
  cost: number;          // dalam rupiah
  etd: string;           // estimasi waktu pengiriman
}

export interface ShippingResponse {
  costs: ShippingCost[];
}

export interface VillageOption {
  code: string;          // 10-digit village code
  name: string;
  district: string;
  regency: string;
  province: string;
  label: string;         // formatted untuk tampilan: "Tembalang, KOTA SEMARANG, JAWA TENGAH"
}

// Default berat per kategori (dalam gram)
export const DEFAULT_BOOK_WEIGHT = 500;
export const DEFAULT_SHIRT_WEIGHT = 250;

const apiBase = () => import.meta.env.VITE_API_URL || '';

export const searchVillages = async (query: string): Promise<VillageOption[]> => {
  if (!query || query.trim().length < 2) return [];
  const url = `${apiBase()}/api/shipping/villages?search=${encodeURIComponent(query.trim())}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data.villages || [];
};

export const calculateShippingCost = async (
  destinationVillageCode: string,
  weight: number = DEFAULT_BOOK_WEIGHT,
): Promise<ShippingResponse> => {
  try {
    const url = `${apiBase()}/api/shipping/calculate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationVillageCode, weight }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to calculate shipping cost' }));
      throw new Error(error.message || 'Failed to calculate shipping cost');
    }

    const data = await response.json();
    return { costs: data.costs || [] };
  } catch (error) {
    console.error('Shipping cost calculation error:', error);
    return getFallbackShippingCost();
  }
};

// Fallback kalau API down
const getFallbackShippingCost = (): ShippingResponse => ({
  costs: [
    { courierCode: 'JNE', courierName: 'JNE Reguler', service: 'JNE', description: 'JNE Reguler', cost: 20000, etd: '2-3 hari' },
    { courierCode: 'SiCepat', courierName: 'SiCepat Reguler', service: 'SiCepat', description: 'SiCepat Reguler', cost: 18000, etd: '2-3 hari' },
  ],
});
