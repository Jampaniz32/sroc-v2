import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function updateConfigTable() {
    console.log('🚀 Updating system_config table...');

    const config = {
        host: process.env.MYSQLHOST || 'shortline.proxy.rlwy.net',
        port: process.env.MYSQLPORT || 46578,
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || 'tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB',
        database: process.env.MYSQLDATABASE || 'railway',
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected to database');

        // Adicionar campos se não existirem
        const [columns] = await connection.query('SHOW COLUMNS FROM system_config');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('full_config')) {
            console.log('📝 Adicionando coluna full_config...');
            await connection.query('ALTER TABLE system_config ADD COLUMN full_config LONGTEXT');
        }

        if (!columnNames.includes('institution_name')) {
            console.log('📝 Adicionando coluna institution_name...');
            await connection.query('ALTER TABLE system_config ADD COLUMN institution_name VARCHAR(255)');
        }

        if (!columnNames.includes('system_logo')) {
            console.log('📝 Adicionando coluna system_logo...');
            await connection.query('ALTER TABLE system_config ADD COLUMN system_logo LONGTEXT');
        }

        await connection.end();
        console.log('🏁 Tabela system_config atualizada com sucesso');
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

updateConfigTable();
