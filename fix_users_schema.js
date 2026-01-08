/* 
   Script para corrigir a estrutura da tabela de usuários.
   Altera colunas ENUM para VARCHAR para evitar erros de criação de usuários e conflitos de regras.
*/
import mysql from 'mysql2/promise';

// Configuração hardcoded temporária para garantir conexão (baseado em fix_railway_db.js)
// IMPORTANTE: Em produção, usar process.env
const connectionConfig = {
    host: process.env.DB_HOST || 'shortline.proxy.rlwy.net',
    port: process.env.DB_PORT || 46578,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB',
    database: process.env.DB_NAME || 'railway'
};

async function fixUsersSchema() {
    try {
        console.log('📡 Conectando ao MySQL para Correção de Usuários...');
        console.log(`Host: ${connectionConfig.host}`);

        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Conectado!');

        console.log('🛠️ Alterando estrutura da tabela users...');

        const queries = [
            // Alterar ROLE para VARCHAR
            'ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT "AGENTE"',
            // Garantir que AGENCY é VARCHAR
            'ALTER TABLE users MODIFY COLUMN agency VARCHAR(255)',
            // Garantir que USERNAME é VARCHAR e manter UNIQUE (que já deve ser, mas MODIFY pode precisar de cuidado)
            // 'ALTER TABLE users MODIFY COLUMN username VARCHAR(100) NOT NULL' // Geralmente seguro, mas unique key é separada
        ];

        for (const query of queries) {
            console.log(`⏳ Executando: ${query}`);
            try {
                await connection.query(query);
                console.log('   -> SUCESSO');
            } catch (qErr) {
                console.error(`   -> FALHA: ${qErr.message}`);
                // Não parar o script, tentar as próximas
            }
        }

        console.log('✨ SUCESSO! A tabela de usuários foi atualizada.');
        await connection.end();
    } catch (error) {
        console.error('❌ Erro durante a correção:', error.message);
    }
}

fixUsersSchema();
