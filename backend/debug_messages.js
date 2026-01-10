import db from './config/database.js';

async function testMessages() {
    try {
        const [rows] = await db.query('SELECT COUNT(*) as count FROM messages');
        console.log('Total messages in DB:', rows[0].count);

        const [last] = await db.query('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 5');
        console.log('Last 5 messages:');
        console.log(JSON.stringify(last, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

testMessages();
