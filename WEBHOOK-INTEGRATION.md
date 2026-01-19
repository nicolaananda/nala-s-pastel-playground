# Integrasi Webhook dengan Bot-WA

## Situasi Saat Ini

- Webhook Midtrans sudah dikonfigurasi ke: `https://logs.nicola.id/webhook/midtrans`
- Webhook diterima dengan sukses (200 OK)
- Tapi kode tidak ter-generate karena handler bot-wa tidak memproses untuk nala

## Solusi: Forward Webhook dari Bot-WA ke Server Nala

### Opsi 1: Forward dari Bot-WA (Recommended)

Update webhook handler bot-wa untuk forward webhook ke server nala jika order_id untuk nala:

```javascript
// Di bot-wa webhook handler
import axios from 'axios';

app.post('/webhook/midtrans', async (req, res) => {
  const notification = req.body;
  const orderId = notification.order_id || '';

  // Process untuk bot-wa
  await processBotWaNotification(notification);

  // Forward ke nala jika order_id untuk nala
  const isNalaTransaction = orderId.includes('CLASS-') || 
                           orderId.includes('GG-') || 
                           orderId.includes('GRASP-');

  if (isNalaTransaction) {
    try {
      await axios.post('https://api.artstudionala.com/api/midtrans/notification', notification, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      console.log(`[Webhook] Forwarded to nala: ${orderId}`);
    } catch (error) {
      console.error(`[Webhook] Failed to forward to nala: ${error.message}`);
    }
  }

  res.status(200).json({ status: 'OK' });
});
```

### Opsi 2: Update Handler Bot-WA untuk Juga Generate Kode

Jika bot-wa punya akses ke database nala, bisa langsung generate kode di handler bot-wa:

```javascript
// Di bot-wa webhook handler
import { db, initDatabase } from './nala-db.js'; // Import dari server nala

app.post('/webhook/midtrans', async (req, res) => {
  const notification = req.body;
  const orderId = notification.order_id || '';

  // Process untuk bot-wa
  await processBotWaNotification(notification);

  // Generate kode untuk nala jika order_id untuk nala
  const isNalaTransaction = orderId.includes('CLASS-') || 
                           orderId.includes('GG-') || 
                           orderId.includes('GRASP-');

  if (isNalaTransaction && notification.transaction_status === 'settlement') {
    try {
      await initDatabase();
      
      // Check if code already exists
      const existing = await db.findCodeByOrderId(orderId);
      if (!existing) {
        // Generate code
        const randomPart = Math.random().toString(36).slice(-6).toUpperCase();
        const code = `GG-${randomPart}`;

        await db.saveAccessCode({
          transactionId: notification.transaction_id,
          orderId: orderId,
          code: code,
          customer: {
            email: notification.customer_details?.email || '',
            firstName: notification.customer_details?.first_name || '',
            lastName: notification.customer_details?.last_name || '',
            phone: notification.customer_details?.phone || '',
          },
          source: 'webhook-botwa',
        });

        console.log(`[Webhook] Generated code for nala: ${code} (${orderId})`);
      }
    } catch (error) {
      console.error(`[Webhook] Failed to generate code for nala: ${error.message}`);
    }
  }

  res.status(200).json({ status: 'OK' });
});
```

### Opsi 3: Multiple Webhook URLs (Tidak Recommended)

Midtrans **tidak support multiple webhook URLs** di satu account. Jadi tidak bisa set 2 URL berbeda.

## Rekomendasi: Opsi 1 (Forward)

**Keuntungan:**
- ✅ Tidak perlu akses database nala di bot-wa
- ✅ Separation of concerns (bot-wa handle bot-wa, nala handle nala)
- ✅ Mudah di-maintain
- ✅ Server nala bisa di-deploy terpisah

**Cara Implementasi:**

1. **Update webhook handler bot-wa** untuk forward ke server nala
2. **Pastikan server nala running** dan bisa diakses dari bot-wa server
3. **Test dengan webhook simulation**

## Testing

### Test Forward dari Bot-WA

```bash
# Simulate webhook ke bot-wa
curl -X POST https://logs.nicola.id/webhook/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "CLASS-TEST-123",
    "transaction_id": "TRANS-TEST-123",
    "customer_details": {
      "email": "test@example.com"
    }
  }'
```

### Cek Apakah Kode Ter-generate

```bash
# Cek di database nala
curl https://api.artstudionala.com/api/transaction/CLASS-TEST-123/code
```

## Checklist

- [ ] Update webhook handler bot-wa untuk forward ke nala
- [ ] Pastikan server nala bisa diakses dari bot-wa server
- [ ] Test dengan webhook simulation
- [ ] Monitor logs untuk memastikan forward berhasil
- [ ] Test dengan transaksi real

## Catatan Penting

1. **Order ID Pattern**: Pastikan order_id untuk nala menggunakan prefix yang jelas:
   - `CLASS-` untuk class registration
   - `GG-` untuk Grasp Guide
   - `GRASP-` untuk Grasp Guide (alternatif)

2. **Error Handling**: Pastikan forward error tidak mengganggu bot-wa processing

3. **Timeout**: Set timeout yang reasonable (10 detik) untuk forward request

4. **Logging**: Log semua forward attempt untuk debugging

