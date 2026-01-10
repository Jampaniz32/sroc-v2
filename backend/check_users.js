import db from './config/database.js';

async function checkUsers() {
    try {
        const [users] = await db.query('SELECT id, username FROM users');
        console.log('--- USER IDS ---');
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
