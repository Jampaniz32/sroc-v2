import mysql from 'mysql2/promise';

async function fixTimestamps() {
    try {
        const url = 'mysql://root:tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB@shortline.proxy.rlwy.net:46578/railway';
        const connection = await mysql.createConnection(url);

        console.log('🚀 Ajustando timestamps para UTC (Maputo -2h)...');

        // Ajustar as chamadas de hoje que foram inseridas com horário local em vez de UTC
        // Pegamos especificamente as chamadas que inserimos manualmente
        const [result] = await connection.query(`
            UPDATE calls 
            SET data = DATE_SUB(data, INTERVAL 2 HOUR)
            WHERE id IN (
                '9d3d1965-ec6a-11f0-bc1b-a2aab92155dc',
                '9d3d2084-ec6a-11f0-bc1b-a2aab92155dc',
                '9d3d2202-ec6a-11f0-bc1b-a2aab92155dc',
                '9d3d2378-ec6a-11f0-bc1b-a2aab92155dc',
                '9d3d24bb-ec6a-11f0-bc1b-a2aab92155dc'
            )
        `);

        console.log(`✅ ${result.affectedRows} registos ajustados!`);
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixTimestamps();
