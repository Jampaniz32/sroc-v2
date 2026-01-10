import mysql from 'mysql2/promise';

async function checkUsers() {
    try {
        const url = 'mysql://root:tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB@shortline.proxy.rlwy.net:46578/railway';
        const connection = await mysql.createConnection(url);
        const [users] = await connection.query('SELECT id, name FROM users');
        console.log('--- USERS ---');
        console.log(users);
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkUsers();
