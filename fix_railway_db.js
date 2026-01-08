/* 
   Script para corrigir a estrutura da base de dados no Railway.
   Altera colunas ENUM para VARCHAR para evitar erros de gravação.
*/
import mysql from 'mysql2/promise';

const connectionConfig = {
    host: 'shortline.proxy.rlwy.net',
    port: 46578,
    user: 'root',
    password: 'tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB',
    database: 'railway'
};

async function fixDatabase() {
    try {
        console.log('📡 Conectando ao MySQL do Railway para Correção...');
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Conectado!');

        console.log('🛠️ Alterando estrutura das colunas...');

        const queries = [
            'ALTER TABLE calls MODIFY COLUMN entidade VARCHAR(255) NOT NULL',
            'ALTER TABLE calls MODIFY COLUMN tipo_pedido VARCHAR(255) NOT NULL',
            'ALTER TABLE calls MODIFY COLUMN estagio VARCHAR(255) NOT NULL DEFAULT "Aberto"',
            'ALTER TABLE calls MODIFY COLUMN turno VARCHAR(255) NOT NULL'
        ];

        for (const query of queries) {
            console.log(`⏳ Executando: ${query}`);
            await connection.query(query);
        }

        console.log('✨ SUCESSO! A base de dados foi corrigida e agora aceita todos os valores do sistema.');
        await connection.end();
    } catch (error) {
        console.error('❌ Erro durante a correção:', error.message);
    }
}

fixDatabase();
