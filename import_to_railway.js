/* 
   Salve este arquivo como 'import_to_railway.js' na raiz do seu projeto 
   Execute no terminal: node import_to_railway.js
*/
import mysql from 'mysql2/promise';
import fs from 'fs';

const connectionConfig = {
    host: 'shortline.proxy.rlwy.net',
    port: 46578,
    user: 'root',
    password: 'tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB',
    database: 'railway',
    multipleStatements: true // Importante para rodar o arquivo SQL todo
};

async function importSchema() {
    try {
        console.log('📡 Conectando ao MySQL do Railway...');
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Conectado com sucesso!');

        console.log('📖 Lendo o arquivo schema.sql...');
        const sql = fs.readFileSync('./backend/database/schema.sql', 'utf8');

        console.log('🚀 Executando comandos SQL no Railway...');
        await connection.query(sql);

        console.log('✨ TUDO PRONTO! As tabelas foram criadas com sucesso no Railway.');
        await connection.end();
    } catch (error) {
        console.error('❌ Erro durante a importação:', error.message);
    }
}

importSchema();