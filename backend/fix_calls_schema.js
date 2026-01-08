
import db from './config/database.js';

async function fixSchema() {
    try {
        console.log('🚀 Ajustando esquema da tabela calls...');

        // 1. Mudar tipo_pedido e entidade para VARCHAR se forem ENUM para evitar erros com novos dados
        await db.query(`ALTER TABLE calls MODIFY COLUMN tipo_pedido VARCHAR(255) NULL`);
        await db.query(`ALTER TABLE calls MODIFY COLUMN entidade VARCHAR(255) NULL`);
        await db.query(`ALTER TABLE calls MODIFY COLUMN estagio VARCHAR(255) NULL`);
        await db.query(`ALTER TABLE calls MODIFY COLUMN turno VARCHAR(255) NULL`);

        console.log('✅ Colunas ENUM convertidas para VARCHAR.');

        // 2. Adicionar coluna outro_tipo_pedido se não existir
        const [colsOutro] = await db.query('SHOW COLUMNS FROM calls LIKE "outro_tipo_pedido"');
        if (colsOutro.length === 0) {
            await db.query('ALTER TABLE calls ADD COLUMN outro_tipo_pedido VARCHAR(255) NULL AFTER tipo_pedido');
            console.log('✅ Coluna outro_tipo_pedido adicionada.');
        }

        // 3. Adicionar coluna whatsapp como BOOLEAN (ou TINYINT(1))
        // No schema original era VARCHAR(50). Vamos converter para TINYINT se necessário.
        await db.query('ALTER TABLE calls MODIFY COLUMN whatsapp TINYINT(1) DEFAULT 0');
        console.log('✅ Coluna whatsapp convertida para BOOLEAN/TINYINT.');

        // 4. Adicionar coluna agencia se não existir
        const [colsAgencia] = await db.query('SHOW COLUMNS FROM calls LIKE "agencia"');
        if (colsAgencia.length === 0) {
            await db.query('ALTER TABLE calls ADD COLUMN agencia VARCHAR(255) NULL AFTER entidade');
            console.log('✅ Coluna agencia adicionada.');
        }

        console.log('🏁 Esquema ajustado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao ajustar esquema:', error);
        process.exit(1);
    }
}

fixSchema();
