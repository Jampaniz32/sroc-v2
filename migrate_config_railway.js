import mysql from 'mysql2/promise';

const connectionConfig = {
    host: 'shortline.proxy.rlwy.net',
    port: 46578,
    user: 'root',
    password: 'tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB',
    database: 'railway'
};

async function migrateConfigTable() {
    try {
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Conectado!');

        console.log('🧹 Eliminando tabela system_config antiga...');
        await connection.query('DROP TABLE IF EXISTS system_config');

        console.log('🏗️ Criando nova tabela system_config...');
        await connection.query(`
            CREATE TABLE system_config (
                id INT PRIMARY KEY AUTO_INCREMENT,
                institution_name VARCHAR(255) DEFAULT 'SROC Operacional',
                report_logo LONGTEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('📝 Inserindo configuração inicial...');
        await connection.query('INSERT INTO system_config (id, institution_name) VALUES (1, "SROC Operacional")');

        console.log('✨ SUCESSO! Estrutura de configuração migrada com sucesso.');
        await connection.end();
    } catch (error) {
        console.error('❌ Erro na migração:', error.message);
    }
}

migrateConfigTable();
