
import db from './config/database.js';

async function checkConfig() {
    try {
        const [rows] = await db.query('SELECT * FROM system_config');
        console.log('--- SYSTEM CONFIG TABLE ---');
        console.table(rows.map(r => ({
            id: r.id,
            key: r.config_key || 'N/A',
            value: (r.config_value || '').substring(0, 20) + '...',
            logo: (r.report_logo || '').substring(0, 20) + '...'
        })));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkConfig();
