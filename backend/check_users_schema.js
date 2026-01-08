
import db from './config/database.js';

async function checkUsersTable() {
    try {
        const [rows] = await db.query('DESCRIBE users');
        console.log('--- USERS TABLE SCHEMA ---');
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsersTable();
