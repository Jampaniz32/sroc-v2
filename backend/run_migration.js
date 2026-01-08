import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function runMigration() {
    console.log('🚀 Starting migration: create_observation_templates');

    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sroc_db',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        multipleStatements: true,
        charset: 'UTF8MB4_UNICODE_CI'
    });

    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');

        // Check if table already exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'observation_templates'"
        );

        if (tables.length > 0) {
            console.log('ℹ️  Table observation_templates already exists. Skipping creation.');
            console.log('   Checking for seed data...');

            const [existingData] = await connection.query(
                "SELECT COUNT(*) as count FROM observation_templates"
            );

            if (existingData[0].count === 0) {
                console.log('   No data found. Inserting seed templates...');
                await insertSeedData(connection);
            } else {
                console.log(`   Found ${existingData[0].count} existing templates. Skipping seed.`);
            }
        } else {
            console.log('📝 Creating table observation_templates...');

            // Create table
            await connection.query(`
                CREATE TABLE observation_templates (
                    id varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
                    tipo_solicitacao varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                    estado_pedido varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                    titulo varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                    observacao text COLLATE utf8mb4_unicode_ci NOT NULL,
                    prioridade int NOT NULL DEFAULT '1',
                    ativo tinyint(1) DEFAULT '1',
                    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    KEY idx_tipo_estado (tipo_solicitacao, estado_pedido),
                    KEY idx_ativo (ativo),
                    KEY idx_prioridade (prioridade)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            console.log('✅ Table created successfully');

            // Insert seed data
            console.log('🌱 Inserting seed templates...');
            await insertSeedData(connection);
        }

        connection.release();
        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

async function insertSeedData(connection) {
    const seedTemplates = [
        {
            id: 'TMP-001',
            tipo_solicitacao: 'Outro',
            estado_pedido: 'Aberto',
            titulo: 'Emissão de Carta de Quitação',
            observacao: 'O cliente entrou em contacto solicitando a emissão da carta de quitação. Foi devidamente orientado a submeter a documentação necessária para dar seguimento ao processo.',
            prioridade: 1,
            ativo: 1
        },
        {
            id: 'TMP-002',
            tipo_solicitacao: 'Pedidos de Cotação',
            estado_pedido: 'Aberto',
            titulo: 'Pedido de Cotação',
            observacao: 'O cliente entrou em contacto solicitando a emissão de uma cotação. Foi orientado a dirigir-se a uma agência ou a submeter a documentação necessária para o devido seguimento do processo.',
            prioridade: 1,
            ativo: 1
        },
        {
            id: 'TMP-003',
            tipo_solicitacao: 'Descontos Apos Liquidacao do Credito',
            estado_pedido: 'Pendente',
            titulo: 'Descontos Após a Liquidação',
            observacao: 'O cliente entrou em contacto solicitando reembolso após a liquidação. Foi orientado a preencher o formulário para a regularização da situação. Processo pendente, aguardando o formulário devidamente preenchido e submetido pelo cliente.',
            prioridade: 1,
            ativo: 1
        },
        {
            id: 'TMP-004',
            tipo_solicitacao: 'Descontos Apos Maturidade do Credito',
            estado_pedido: 'Pendente',
            titulo: 'Descontos Após a Maturidade',
            observacao: 'O cliente entrou em contacto solicitando reembolso após a maturidade do crédito. Foi orientado a preencher o formulário para a regularização da situação. Processo pendente, aguardando o formulário devidamente preenchido e submetido pelo cliente.',
            prioridade: 1,
            ativo: 1
        },
        {
            id: 'TMP-005',
            tipo_solicitacao: 'Descontos incorrectos',
            estado_pedido: 'Em Tratamento',
            titulo: 'Descontos Incorretos',
            observacao: 'O cliente solicitou reembolso referente ao mês de dezembro, devido à aplicação de descontos incorretos. O caso encontra-se em análise para a devida regularização.',
            prioridade: 1,
            ativo: 1
        },
        {
            id: 'TMP-006',
            tipo_solicitacao: 'Restruturação de Crédito',
            estado_pedido: 'Pendente',
            titulo: 'Reestruturação de Crédito',
            observacao: 'O cliente solicitou a reestruturação do seu crédito. Foi orientado a submeter a respetiva carta de pedido para análise. Processo pendente, aguardando o envio da proposta devidamente preenchida e assinada pelo cliente.',
            prioridade: 1,
            ativo: 1
        }
    ];

    for (const template of seedTemplates) {
        await connection.query(
            `INSERT INTO observation_templates 
            (id, tipo_solicitacao, estado_pedido, titulo, observacao, prioridade, ativo) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [template.id, template.tipo_solicitacao, template.estado_pedido, template.titulo, template.observacao, template.prioridade, template.ativo]
        );
    }

    console.log(`   ✅ Inserted ${seedTemplates.length} seed templates`);
}

runMigration();
