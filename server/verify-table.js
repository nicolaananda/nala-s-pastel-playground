import pool from './db.js';

const verifyTable = async () => {
  try {
    console.log('🔄 Verifying table exists...\n');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'grasp_guide_access'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Table "grasp_guide_access" exists\n');

      // Get table structure
      const structure = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'grasp_guide_access'
        ORDER BY ordinal_position;
      `);

      console.log('📋 Table Structure:');
      console.log('─'.repeat(80));
      structure.rows.forEach(col => {
        const maxLength = col.character_maximum_length 
          ? `(${col.character_maximum_length})` 
          : '';
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name.padEnd(25)} ${(col.data_type + maxLength).padEnd(20)} ${nullable}${defaultValue}`);
      });
      console.log('─'.repeat(80));

      // Count records
      const count = await pool.query('SELECT COUNT(*) FROM grasp_guide_access');
      console.log(`\n📊 Total records: ${count.rows[0].count}`);

      // Show sample data
      if (parseInt(count.rows[0].count) > 0) {
        const sample = await pool.query('SELECT * FROM grasp_guide_access ORDER BY created_at DESC LIMIT 5');
        console.log('\n📝 Sample records (latest 5):');
        console.log('─'.repeat(80));
        sample.rows.forEach((row, idx) => {
          console.log(`\n${idx + 1}. Code: ${row.code}`);
          console.log(`   Order ID: ${row.order_id}`);
          console.log(`   Transaction ID: ${row.transaction_id}`);
          console.log(`   Customer: ${row.customer_first_name || ''} ${row.customer_last_name || ''}`.trim() || 'N/A');
          console.log(`   Email: ${row.customer_email || 'N/A'}`);
          console.log(`   Created: ${row.created_at}`);
        });
        console.log('─'.repeat(80));
      }

    } else {
      console.log('❌ Table "grasp_guide_access" does NOT exist');
      console.log('   Run: npm run init:schema');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

verifyTable();

