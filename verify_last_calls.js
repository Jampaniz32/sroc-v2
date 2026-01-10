import mysql from 'mysql2/promise';

async function verifyCalls() {
    try {
        const url = 'mysql://root:tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB@shortline.proxy.rlwy.net:46578/railway';
        const connection = await mysql.createConnection(url);

        console.log('--- LAST 10 CALLS ---');
        const [rows] = await connection.query('SELECT id, cliente, data, agente_nome, created_at FROM calls ORDER BY created_at DESC LIMIT 10');
        console.log(JSON.stringify(rows, null, 2));

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

verifyCalls();
