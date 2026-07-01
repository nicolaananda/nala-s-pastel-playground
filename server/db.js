import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
let useMemoryDb = process.env.DB_DISABLED === 'true';
let memoryContentId = 1;
let memoryAuditId = 1;
const memoryAccessCodes = [];
const memoryAuditLogs = [];

const defaultContentItems = [
  {
    type: 'book',
    slug: 'tips-trik-juara-1-lomba-mewarnai',
    title: 'Tips & Trick Juara 1 Lomba Mewarnai',
    description: `Sekarang ini kegiatan lomba mewarnai banyak diadakan di berbagai daerah. Tak hanya acara langsung, tetapi juga telah merambah melalui media social dan online. Ajang ini digunakan sebagai wadah mengasah kreativitas anak dalam tumbuh kembang anak. Untuk menjadi juara 1 lomba mewarnai tentunya dibutuhkan persiapan serta tips dan triknya. Buku ini bisa menjadi pedoman sebagai persiapan untuk mengikuti lomba mewarnai.

**Alat & Bahan**

Sebelum mengikuti lomba mewarnai, ada baiknya kita mengenal terlebih dahulu alat dan bahan dalam mewarnai sebagai persiapan untuk mengikuti lomba. Dilengkapi juga tips dan trik persiapan sebelum lomba dan saat lomba berlangsung.

**Teknik Mewarnai**

Untuk menjadi juara 1 lomba mewarnai tentunya dibutuhkan penggunaan teknik mewarnai yang benar dan kreatif. Dalam buku ini dijelaskan bagaimana teknik-teknik mewarnai dengan krayon, oil pastel, pensil warna, serta proses memahami roda & harmoni warna.

**Mewarnai Objek & Background**

Mewarnai objek dan background menjadi hal yang penting dalam lomba mewarnai. Dalam buku ini terdapat contoh objek-objek yang sering terdapat dalam lomba mewarnai dan latihannya yang disertai panduan warnanya.

**Tutorial Mewarnai & Melengkapi Gambar**

Sambil berlatih, anak bisa belajar melengkapi gambar untuk kategori TK dan SD serta tema-tema yang sering dilombakan sepanjang tahun dengan QR Code video tutorial.`,
    price: 110000,
    metadata: {
      gradient: 'gradient-pink',
      shortDescription: 'Buku pedoman lengkap untuk persiapan lomba mewarnai dengan tips, teknik, latihan, dan QR Code video tutorial.',
    },
    sortOrder: 1,
  },
  {
    type: 'book',
    slug: 'lets-coloring-your-anime',
    title: "LET'S COLORING YOUR ANIME!",
    description: `Temukan pengalaman mewarnai karakter anime yang seru dan edukatif! Buku ini berisi 30 gambar sketsa anime eksklusif yang siap kamu warnai, lengkap dengan tips dan trik profesional untuk menggambar dan mewarnai mata, rambut, serta wajah karakter anime.

**Keunggulan Buku**

1. Berisi 30 gambar sketsa anime.

2. Dilengkapi tips dan trik cara mewarnai mata, rambut, dan wajah karakter anime.

3. Semua gambar dilengkapi dengan video tutorial mewarnai.

4. Finishing jilid spiral agar mudah dilipat saat mewarnai.

5. Dilengkapi papan board di bagian belakang yang berfungsi sebagai alas dan menjaga kestabilan saat mewarnai.`,
    price: 85000,
    metadata: {
      gradient: 'gradient-pink-blue',
      shortDescription: '30 gambar sketsa anime eksklusif dengan tips profesional untuk mewarnai mata, rambut, dan wajah karakter anime.',
    },
    sortOrder: 2,
  },
  {
    type: 'book',
    slug: 'coloring-worksheet-juara-1-lomba-mewarnai',
    title: 'COLORING WORKSHEET JUARA 1 LOMBA MEWARNAI',
    description: `Buku worksheet mewarnai dengan 37 gambar sketsa tematik sepanjang tahun yang dirancang khusus untuk latihan dan persiapan lomba mewarnai.

**Keunggulan Buku**

1. Berisi 37 Gambar Sketsa Tematik sepanjang tahun.

2. Tema Gambar sangat bervariatif seperti hari-hari besar di Indonesia, Kebudayaan, dan Anak.

3. Tema-tema tersebut diambil dari tema yang sering dilombakan dan cocok untuk latihan lomba mewarnai.

4. Terdapat 6 video tutorial mewarnai yang menarik dan dapat discan melalui QR Code.`,
    price: 85000,
    metadata: {
      gradient: 'gradient-blue',
      shortDescription: '37 gambar sketsa tematik sepanjang tahun untuk latihan dan persiapan lomba mewarnai, dilengkapi video tutorial.',
    },
    sortOrder: 3,
  },
  {
    type: 'article',
    slug: 'festival-literasi-belandongan-2025',
    title: 'Festival Literasi Belandongan: Pengalaman Artstudio Nala Menjadi Juri Lomba Mewarnai',
    description: `Pada tanggal 18 November 2025, miss Nala mendapat kehormatan untuk menjadi juri tunggal dalam Lomba Mewarnai Anak Usia 4–6 Tahun di Festival Literasi Belandongan, sebuah acara literasi besar yang diselenggarakan oleh Dinas Perpustakaan Tangerang Selatan.

Sebagai juri tunggal, Artstudio Nala menilai karya anak-anak berdasarkan empat kriteria utama: harmoni warna, teknik penambahan gambar, kreativitas, serta kerapian dan kebersihan.

Dari seluruh karya yang masuk, terpilih tiga pemenang yang benar-benar memenuhi seluruh kriteria penilaian. Festival Literasi Belandongan pun menjadi pengalaman penuh warna bagi anak-anak dan Artstudio Nala.`,
    metadata: {
      displayDate: '18 November 2025',
      location: 'Tangerang Selatan',
      featured: true,
      winners: [
        { name: 'Ayi Ledendre (Aca)', position: 'Juara 1' },
        { name: 'Aulia', position: 'Juara 2' },
        { name: 'Abiyu', position: 'Juara 3' },
      ],
    },
    sortOrder: 1,
  },
  {
    type: 'grasp_asset',
    slug: 'grasp-60-cover',
    title: 'Cover Nama & Nomor Grasp Isi 60 Warna',
    fileUrl: 'https://r2.artstudionala.com/grasp/grispy.jpg',
    metadata: { accessGroup: 'grasp-60-color', assetType: 'image' },
    sortOrder: 1,
  },
  {
    type: 'grasp_asset',
    slug: 'grasp-60-swatch',
    title: 'Contoh Swatch Nama & Nomor Grasp 60 Warna',
    fileUrl: 'https://r2.artstudionala.com/grasp/grasp_silky_crayon-60warna.jpeg',
    metadata: { accessGroup: 'grasp-60-color', assetType: 'image' },
    sortOrder: 2,
  },
  {
    type: 'grasp_asset',
    slug: 'grasp-60-pdf',
    title: 'PDF Grasp Nama Nomor 60 Warna',
    fileUrl: 'https://r2.artstudionala.com/grasp/PDF%20GRASP%20NAMA%20NOMOR%2060%20WARNA.pdf',
    metadata: { accessGroup: 'grasp-60-color', assetType: 'pdf' },
    sortOrder: 3,
  },
  {
    type: 'merchandise',
    slug: 'baju-nala',
    title: 'Baju Artstudio Nala',
    description: 'Baju eksklusif Artstudio Nala untuk anak maupun dewasa.',
    price: 60000,
    metadata: { priceAnak: 60000, priceDewasa: 80000 },
    sortOrder: 1,
  },
];

const memoryContentItems = defaultContentItems.map((item) => ({
  id: memoryContentId++,
  type: item.type,
  slug: item.slug,
  title: item.title,
  description: item.description || '',
  price: item.price ?? null,
  image_url: item.imageUrl || null,
  file_url: item.fileUrl || null,
  metadata: item.metadata || {},
  status: 'published',
  sort_order: item.sortOrder || 0,
  created_at: new Date(),
  updated_at: new Date(),
}));

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || '119.28.114.89',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nala',
  user: process.env.DB_USER || 'bot_wa',
  password: process.env.DB_PASSWORD || 'bot_wa',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  if (!useMemoryDb) {
    useMemoryDb = true;
    console.warn('⚠️  Switching to in-memory database fallback');
  }
});

// Initialize database schema
export const initDatabase = async () => {
  if (useMemoryDb) {
    console.warn('⚠️  DB_DISABLED=true, using in-memory seeded data');
    return;
  }
  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grasp_guide_access (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        order_id VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        customer_first_name VARCHAR(255),
        customer_last_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(50) DEFAULT 'webhook',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_order_id ON grasp_guide_access(order_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_id ON grasp_guide_access(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_code ON grasp_guide_access(code);
    `);

    await pool.query(`
      ALTER TABLE grasp_guide_access
      ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS revoked_reason TEXT
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_items (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        price INTEGER,
        image_url TEXT,
        file_url TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(30) DEFAULT 'draft',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(type, slug)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_content_type_status ON content_items(type, status);
      CREATE INDEX IF NOT EXISTS idx_content_slug ON content_items(slug);
      CREATE INDEX IF NOT EXISTS idx_content_sort ON content_items(type, sort_order);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id SERIAL PRIMARY KEY,
        admin_email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255),
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const item of defaultContentItems) {
      await pool.query(
        `INSERT INTO content_items (type, slug, title, description, price, image_url, file_url, metadata, status, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published',$9)
         ON CONFLICT (type, slug) DO NOTHING`,
        [
          item.type,
          item.slug,
          item.title,
          item.description || '',
          item.price ?? null,
          item.imageUrl || null,
          item.fileUrl || null,
          JSON.stringify(item.metadata || {}),
          item.sortOrder || 0,
        ]
      );
    }

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    useMemoryDb = true;
    console.warn('⚠️  PostgreSQL unavailable, using in-memory seeded data for local dev');
  }
};

// Database operations
export const db = {
  // Save access code
  async saveAccessCode({ transactionId, orderId, code, customer, source = 'webhook' }) {
    if (useMemoryDb) {
      const existing = memoryAccessCodes.find((row) => row.transaction_id === transactionId);
      const row = {
        id: existing?.id || memoryAccessCodes.length + 1,
        transaction_id: transactionId,
        order_id: orderId,
        code,
        customer_first_name: customer?.firstName || null,
        customer_last_name: customer?.lastName || null,
        customer_email: customer?.email || null,
        customer_phone: customer?.phone || null,
        saved_at: new Date(),
        source,
        created_at: existing?.created_at || new Date(),
        updated_at: new Date(),
        revoked_at: existing?.revoked_at || null,
        revoked_reason: existing?.revoked_reason || null,
      };
      if (existing) Object.assign(existing, row);
      else memoryAccessCodes.push(row);
      return row;
    }
    const query = `
      INSERT INTO grasp_guide_access (
        transaction_id, order_id, code,
        customer_first_name, customer_last_name, customer_email, customer_phone,
        source, saved_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (transaction_id)
      DO UPDATE SET
        code = EXCLUDED.code,
        order_id = EXCLUDED.order_id,
        customer_first_name = EXCLUDED.customer_first_name,
        customer_last_name = EXCLUDED.customer_last_name,
        customer_email = EXCLUDED.customer_email,
        customer_phone = EXCLUDED.customer_phone,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      transactionId,
      orderId,
      code,
      customer?.firstName || null,
      customer?.lastName || null,
      customer?.email || null,
      customer?.phone || null,
      source,
      new Date().toISOString(),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Find code by code value
  async findCodeByCode(code) {
    if (useMemoryDb) {
      return memoryAccessCodes.find((row) => row.code.trim().toUpperCase() === code.trim().toUpperCase()) || null;
    }
    const query = `
      SELECT * FROM grasp_guide_access
      WHERE UPPER(TRIM(code)) = UPPER(TRIM($1))
      LIMIT 1
    `;
    const result = await pool.query(query, [code]);
    return result.rows[0] || null;
  },

  // Find code by order ID
  async findCodeByOrderId(orderId) {
    if (useMemoryDb) {
      return memoryAccessCodes.find((row) => row.order_id === orderId) || null;
    }
    const query = `
      SELECT * FROM grasp_guide_access
      WHERE order_id = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [orderId]);
    return result.rows[0] || null;
  },

  // Find code by transaction ID
  async findCodeByTransactionId(transactionId) {
    if (useMemoryDb) {
      return memoryAccessCodes.find((row) => row.transaction_id === transactionId) || null;
    }
    const query = `
      SELECT * FROM grasp_guide_access
      WHERE transaction_id = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [transactionId]);
    return result.rows[0] || null;
  },

  // Get all access codes (for admin/migration purposes)
  async getAllAccessCodes() {
    if (useMemoryDb) {
      return [...memoryAccessCodes].sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
    }
    const query = `
      SELECT * FROM grasp_guide_access
      ORDER BY saved_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getPublicContent(type) {
    if (useMemoryDb) {
      return memoryContentItems
        .filter((item) => item.type === type && item.status === 'published')
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((row) => this.contentRowToJson(row));
    }
    const result = await pool.query(
      `SELECT * FROM content_items WHERE type = $1 AND status = 'published' ORDER BY sort_order ASC, created_at DESC`,
      [type]
    );
    return result.rows.map((row) => this.contentRowToJson(row));
  },

  async getPublicContentBySlug(type, slug) {
    if (useMemoryDb) {
      const row = memoryContentItems.find((item) => item.type === type && item.slug === slug && item.status === 'published');
      return row ? this.contentRowToJson(row) : null;
    }
    const result = await pool.query(
      `SELECT * FROM content_items WHERE type = $1 AND slug = $2 AND status = 'published' LIMIT 1`,
      [type, slug]
    );
    return result.rows[0] ? this.contentRowToJson(result.rows[0]) : null;
  },

  async getAdminContent(type) {
    if (useMemoryDb) {
      return memoryContentItems
        .filter((item) => !type || item.type === type)
        .sort((a, b) => a.type.localeCompare(b.type) || a.sort_order - b.sort_order)
        .map((row) => this.contentRowToJson(row));
    }
    const values = [];
    const whereClause = type ? 'WHERE type = $1' : '';
    if (type) values.push(type);
    const result = await pool.query(
      `SELECT * FROM content_items ${whereClause} ORDER BY type ASC, sort_order ASC, created_at DESC`,
      values
    );
    return result.rows.map((row) => this.contentRowToJson(row));
  },

  async createContentItem(item) {
    if (useMemoryDb) {
      const row = {
        id: memoryContentId++,
        type: item.type,
        slug: item.slug,
        title: item.title,
        description: item.description || '',
        price: item.price ?? null,
        image_url: item.imageUrl || null,
        file_url: item.fileUrl || null,
        metadata: item.metadata || {},
        status: item.status || 'draft',
        sort_order: item.sortOrder || 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      memoryContentItems.push(row);
      return this.contentRowToJson(row);
    }
    const result = await pool.query(
      `INSERT INTO content_items (type, slug, title, description, price, image_url, file_url, metadata, status, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [item.type, item.slug, item.title, item.description || '', item.price ?? null, item.imageUrl || null, item.fileUrl || null, JSON.stringify(item.metadata || {}), item.status || 'draft', item.sortOrder || 0]
    );
    return this.contentRowToJson(result.rows[0]);
  },

  async updateContentItem(id, item) {
    if (useMemoryDb) {
      const row = memoryContentItems.find((contentItem) => String(contentItem.id) === String(id));
      if (!row) return null;
      Object.assign(row, {
        type: item.type,
        slug: item.slug,
        title: item.title,
        description: item.description || '',
        price: item.price ?? null,
        image_url: item.imageUrl || null,
        file_url: item.fileUrl || null,
        metadata: item.metadata || {},
        status: item.status || 'draft',
        sort_order: item.sortOrder || 0,
        updated_at: new Date(),
      });
      return this.contentRowToJson(row);
    }
    const result = await pool.query(
      `UPDATE content_items SET type = $1, slug = $2, title = $3, description = $4, price = $5, image_url = $6, file_url = $7, metadata = $8, status = $9, sort_order = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11 RETURNING *`,
      [item.type, item.slug, item.title, item.description || '', item.price ?? null, item.imageUrl || null, item.fileUrl || null, JSON.stringify(item.metadata || {}), item.status || 'draft', item.sortOrder || 0, id]
    );
    return result.rows[0] ? this.contentRowToJson(result.rows[0]) : null;
  },

  async archiveContentItem(id) {
    if (useMemoryDb) {
      const row = memoryContentItems.find((contentItem) => String(contentItem.id) === String(id));
      if (!row) return null;
      row.status = 'archived';
      row.updated_at = new Date();
      return this.contentRowToJson(row);
    }
    const result = await pool.query(
      `UPDATE content_items SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] ? this.contentRowToJson(result.rows[0]) : null;
  },

  async revokeAccessCode(code, reason) {
    if (useMemoryDb) {
      const row = memoryAccessCodes.find((accessCode) => accessCode.code.trim().toUpperCase() === code.trim().toUpperCase());
      if (!row) return null;
      row.revoked_at = new Date();
      row.revoked_reason = reason || 'Revoked from admin';
      row.updated_at = new Date();
      return row;
    }
    const result = await pool.query(
      `UPDATE grasp_guide_access SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE UPPER(TRIM(code)) = UPPER(TRIM($1)) RETURNING *`,
      [code, reason || 'Revoked from admin']
    );
    return result.rows[0] || null;
  },

  async restoreAccessCode(code) {
    if (useMemoryDb) {
      const row = memoryAccessCodes.find((accessCode) => accessCode.code.trim().toUpperCase() === code.trim().toUpperCase());
      if (!row) return null;
      row.revoked_at = null;
      row.revoked_reason = null;
      row.updated_at = new Date();
      return row;
    }
    const result = await pool.query(
      `UPDATE grasp_guide_access SET revoked_at = NULL, revoked_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE UPPER(TRIM(code)) = UPPER(TRIM($1)) RETURNING *`,
      [code]
    );
    return result.rows[0] || null;
  },

  async logAdminAction({ adminEmail, action, entityType, entityId, details }) {
    if (useMemoryDb) {
      memoryAuditLogs.unshift({
        id: memoryAuditId++,
        admin_email: adminEmail || null,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || {},
        created_at: new Date(),
      });
      return;
    }
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_email, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)`,
      [adminEmail || null, action, entityType, entityId || null, JSON.stringify(details || {})]
    );
  },

  async getAuditLogs() {
    if (useMemoryDb) {
      return memoryAuditLogs.map((row) => ({
        id: row.id,
        adminEmail: row.admin_email,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        details: row.details || {},
        createdAt: row.created_at?.toISOString?.() || row.created_at,
      }));
    }
    const result = await pool.query(`SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 200`);
    return result.rows.map((row) => ({
      id: row.id,
      adminEmail: row.admin_email,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details || {},
      createdAt: row.created_at?.toISOString?.() || row.created_at,
    }));
  },

  contentRowToJson(row) {
    return {
      id: row.id,
      type: row.type,
      slug: row.slug,
      title: row.title,
      description: row.description || '',
      price: row.price,
      imageUrl: row.image_url,
      fileUrl: row.file_url,
      metadata: row.metadata || {},
      status: row.status,
      sortOrder: row.sort_order || 0,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    };
  },

  // Convert database row to JSON format (for backward compatibility)
  rowToJson(row) {
    if (!row) return null;
    return {
      transactionId: row.transaction_id,
      orderId: row.order_id,
      code: row.code,
      customer: {
        firstName: row.customer_first_name,
        lastName: row.customer_last_name,
        email: row.customer_email,
        phone: row.customer_phone,
      },
      savedAt: row.saved_at?.toISOString() || row.saved_at,
      source: row.source,
      revokedAt: row.revoked_at?.toISOString?.() || row.revoked_at || null,
      revokedReason: row.revoked_reason || null,
    };
  },
};

export default pool;
