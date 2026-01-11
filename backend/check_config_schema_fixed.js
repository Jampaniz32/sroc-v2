import db from './backend/config/database.js';

async function checkSchema() {
    try {
        const [cols] = await db.query('SHOW COLUMNS FROM system_config');
        console.log('--- SYSTEM_CONFIG COLUMNS ---');
        console.table(cols);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
