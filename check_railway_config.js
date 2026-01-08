import mysql from 'mysql2/promise';

const connectionConfig = {
    host: 'shortline.proxy.rlwy.net',
    port: 46578,
    user: 'root',
    password: 'tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB',
    database: 'railway'
};

async function checkSchema() {
    try {
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Conectado!');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables:', tables);

        const [columns] = await connection.query('SHOW COLUMNS FROM system_config');
        console.log('Columns in system_config:', columns);

        const [rows] = await connection.query('SELECT * FROM system_config');
        console.log('Rows in system_config:', rows);

        await connection.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkSchema();
