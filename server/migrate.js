import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_PATH = path.join(__dirname, 'database.json');

// Migrate data from JSON to PostgreSQL
const migrateFromJson = async () => {
  try {
    console.log('🔄 Starting migration from JSON to PostgreSQL...');

    // Initialize database schema
    await initDatabase();

    // Read JSON file
    if (!fs.existsSync(DATABASE_PATH)) {
      console.log('⚠️  No JSON database file found. Skipping migration.');
      return;
    }

    const jsonData = JSON.parse(fs.readFileSync(DATABASE_PATH, 'utf-8'));
    const accessCodes = jsonData.graspGuideAccess || [];

    if (accessCodes.length === 0) {
      console.log('ℹ️  No data to migrate.');
      return;
    }

    console.log(`📦 Found ${accessCodes.length} records to migrate...`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of accessCodes) {
      try {
        // Check if record already exists
        const existing = await db.findCodeByTransactionId(record.transactionId);
        
        if (existing) {
          console.log(`⏭️  Skipping ${record.transactionId} (already exists)`);
          skipped++;
          continue;
        }

        // Migrate record
        await db.saveAccessCode({
          transactionId: record.transactionId,
          orderId: record.orderId,
          code: record.code,
          customer: record.customer,
          source: record.source || 'migration',
        });

        migrated++;
        console.log(`✅ Migrated: ${record.code} (${record.transactionId})`);
      } catch (error) {
        console.error(`❌ Error migrating ${record.transactionId}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n✨ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateFromJson()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

