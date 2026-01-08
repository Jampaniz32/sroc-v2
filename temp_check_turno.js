import db from './backend/config/database.js';

async function setup() {
    try {
        const [calls] = await db.query('SELECT turno FROM calls LIMIT 1');
        console.log(JSON.stringify(calls, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

setup();
