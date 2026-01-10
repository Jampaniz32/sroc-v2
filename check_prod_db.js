import mysql from 'mysql2/promise';

async function checkDatabase() {
    try {
        const url = 'mysql://root:tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB@shortline.proxy.rlwy.net:46578/railway';
        const connection = await mysql.createConnection(url);

        console.log('--- TABLES ---');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(tables);

        console.log('\n--- CALLS STRUCTURE ---');
        const [cols] = await connection.query('DESCRIBE calls');
        console.log(JSON.stringify(cols, null, 2));

        console.log('\n--- TEST CALLS RAW ---');
        const [rows] = await connection.query('SELECT * FROM calls ORDER BY created_at DESC LIMIT 3');
        console.log(JSON.stringify(rows, null, 2));

        await connection.end();
    } catch (error) {
        console.error('❌ Database Check Error:', error);
    }
}

checkDatabase();
