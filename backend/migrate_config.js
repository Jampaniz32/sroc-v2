
import db from './config/database.js';

async function runMigration() {
    try {
        console.log('🚀 Iniciando migração da base de dados...');

        // 1. Criar tabela system_config se não existir
        await db.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INT PRIMARY KEY AUTO_INCREMENT,
        report_logo LONGTEXT NULL,
        institution_name VARCHAR(255) DEFAULT 'SROC Operacional',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Tabela system_config verificada/criada.');

        // 2. Verificar se a coluna report_logo existe (caso a tabela já existisse)
        const [columns] = await db.query('SHOW COLUMNS FROM system_config LIKE "report_logo"');
        if (columns.length === 0) {
            await db.query('ALTER TABLE system_config ADD COLUMN report_logo LONGTEXT NULL');
            console.log('✅ Coluna report_logo adicionada.');
        } else {
            console.log('ℹ️ Coluna report_logo já existe.');
        }

        // 3. Garantir que exista pelo menos um registro (se vazio)
        const [rows] = await db.query('SELECT COUNT(*) as count FROM system_config');
        if (rows[0].count === 0) {
            await db.query('INSERT INTO system_config (institution_name) VALUES ("SROC Operacional")');
            console.log('✅ Registro inicial de configuração criado.');
        }

        console.log('🏁 Migração concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        process.exit(1);
    }
}

runMigration();
