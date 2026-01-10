import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function fixMessagesTable() {
    console.log('🚀 Checking/Fixing messages table...');

    const config = {
        host: 'shortline.proxy.rlwy.net',
        port: 46578,
        user: 'root',
        password: 'tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB',
        database: 'railway',
    };

    console.log(`📡 Connecting to: ${config.host}:${config.port} (${config.database})`);

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected to database');

        // Create messages table if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(36) PRIMARY KEY,
                sender_id VARCHAR(36) NOT NULL,
                sender_name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                room_id VARCHAR(100) NOT NULL DEFAULT 'global',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE,
                INDEX idx_room (room_id),
                INDEX idx_sender (sender_id),
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Table "messages" is ready');

        // Check if is_read column exists (in case table was created with old schema)
        const [columns] = await connection.query('SHOW COLUMNS FROM messages LIKE "is_read"');
        if (columns.length === 0) {
            console.log('📝 Adding is_read column...');
            await connection.query('ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE');
            console.log('✅ Column "is_read" added');
        }

        await connection.end();
        console.log('🏁 Finished successfully');
    } catch (error) {
        console.error('❌ Error fixing table:', error.message);
        process.exit(1);
    }
}

fixMessagesTable();
