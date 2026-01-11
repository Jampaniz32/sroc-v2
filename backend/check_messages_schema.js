import db from './config/database.js';

async function checkSchema() {
    try {
        const [cols] = await db.query('SHOW COLUMNS FROM messages');
        console.log('--- MESSAGES COLUMNS ---');
        console.table(cols);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
