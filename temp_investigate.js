import db from './backend/config/database.js';

async function setup() {
    try {
        console.log('--- USERS ---');
        const [users] = await db.query('SELECT id, name FROM users');
        console.log(JSON.stringify(users, null, 2));

        console.log('\n--- CALLS SCHEMA ---');
        const [columns] = await db.query('DESCRIBE calls');
        console.log(JSON.stringify(columns, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

setup();
