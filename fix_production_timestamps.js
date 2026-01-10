import mysql from 'mysql2/promise';

async function fixTimestamps() {
    try {
        const url = 'mysql://root:tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB@shortline.proxy.rlwy.net:46578/railway';
        const connection = await mysql.createConnection(url);

        console.log('🚀 Ajustando timestamps para UTC (Maputo -2h)...');

        // Ajustar as chamadas de hoje que foram inseridas com horário local em vez de UTC
        await connection.query(`
            UPDATE calls 
            SET data = DATE_SUB(data, INTERVAL 2 HOUR)
            WHERE DATE(data) = '2026-01-08' AND HOUR(data) >= 8
        `);

        // Sincronizar data com created_at onde for null ou inconsistente
        await connection.query(`
            UPDATE calls 
            SET data = created_at 
            WHERE data IS NULL OR data = '0000-00-00 00:00:00'
        `);

        console.log('✅ Timestamps ajustados!');
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixTimestamps();
