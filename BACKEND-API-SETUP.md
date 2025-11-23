# Backend API Setup untuk Midtrans & Shipping

Frontend ini membutuhkan backend API untuk:
1. **Midtrans Payment Link** - Membuat payment link secara aman
2. **RajaOngkir Shipping** - Menghitung ongkir dari Semarang Kota

## 📋 Endpoint yang Diperlukan

### 1. Midtrans Payment Link Endpoint

**POST** `/api/midtrans/create-payment-link`

**Request Body:**
```json
{
  "transaction_details": {
    "order_id": "BOOK-1234567890-abc123",
    "gross_amount": 189000
  },
  "item_details": [
    {
      "id": "tips-trik-juara-1-lomba-mewarnai",
      "price": 110000,
      "quantity": 1,
      "name": "Tips & Trick Juara 1 Lomba Mewarnai"x
    },
    {
      "id": "shipping",
      "price": 79000,
      "quantity": 1,
      "name": "Ongkir"
    }
  ],
  "customer_details": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "billing_address": { ... },
    "shipping_address": { ... }
  }
}
```

**Response:**
```json
{
  "payment_url": "https://app.midtrans.com/snap/v2/vtweb/...",
  "order_id": "BOOK-1234567890-abc123",
  "token": "..." // optional
}
```

**Implementation Example (Node.js/Express):**
```javascript
const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: false, // Set to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

app.post('/api/midtrans/create-payment-link', async (req, res) => {
  try {
    const parameter = req.body;
    const transaction = await snap.createTransaction(parameter);
    
    res.json({
      payment_url: transaction.redirect_url,
      order_id: parameter.transaction_details.order_id,
      token: transaction.token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

### 2. RajaOngkir Shipping Endpoint

**POST** `/api/shipping/calculate`

**Request Body:**
```json
{
  "origin": "399", // Semarang Kota ID
  "destination": "151", // Destination city ID
  "weight": 500, // in grams
  "courier": "jne" // jne, tiki, or pos
}
```

**Response:**
```json
{
  "courier": "jne",
  "costs": [
    {
      "service": "REG",
      "description": "JNE Reguler",
      "cost": 15000,
      "etd": "2-3 hari"
    },
    {
      "service": "OKE",
      "description": "JNE OKE",
      "cost": 20000,
      "etd": "1-2 hari"
    }
  ]
}
```

**Implementation Example (Node.js/Express):**
```javascript
const axios = require('axios');

app.post('/api/shipping/calculate', async (req, res) => {
  try {
    const { origin, destination, weight, courier } = req.body;
    
    const response = await axios.post(
      'https://api.rajaongkir.com/starter/cost',
      {
        origin,
        destination,
        weight,
        courier,
      },
      {
        headers: {
          key: process.env.RAJAONGKIR_API_KEY,
        },
      }
    );
    
    const costs = response.data.rajaongkir.results[0].costs.map((cost) => ({
      service: cost.service,
      description: cost.description,
      cost: cost.cost[0].value,
      etd: cost.cost[0].etd,
    }));
    
    res.json({
      courier: response.data.rajaongkir.results[0].code,
      costs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

**GET** `/api/shipping/cities?search=jakarta`

**Response:**
```json
{
  "city_id": "151",
  "city_name": "Jakarta Barat"
}
```

## 🔑 Environment Variables untuk Backend

Buat file `.env` di backend dengan:

```env
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
RAJAONGKIR_API_KEY=your-rajaongkir-api-key
```

## 📝 Catatan Penting

1. **Security**: Jangan expose Server Key atau API Key di frontend
2. **CORS**: Pastikan backend mengizinkan CORS dari domain frontend
3. **Error Handling**: Handle error dengan baik dan return error message yang jelas
4. **Validation**: Validasi semua input di backend sebelum memproses

## 🚀 Quick Start dengan Express.js

```bash
# Install dependencies
npm install express cors dotenv midtrans-client axios

# Create server.js
# Copy implementation examples above

# Run server
node server.js
```

## 📚 Resources

- [Midtrans Documentation](https://docs.midtrans.com/)
- [RajaOngkir API Documentation](https://rajaongkir.com/dokumentasi)

