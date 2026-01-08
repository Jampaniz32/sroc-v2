import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Configuração de conexão (mesma do script de fix anterior)
const connectionConfig = {
    host: process.env.DB_HOST || 'shortline.proxy.rlwy.net',
    port: process.env.DB_PORT || 46578,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB',
    database: process.env.DB_NAME || 'railway'
};

async function resetPassword() {
    try {
        console.log('📡 Conectando ao MySQL...');
        const connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Conectado!');

        const username = 'admin';
        const newPassword = 'password123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log(`🔐 Redefinindo senha para o usuário: ${username}`);
        console.log(`🔑 Nova senha: ${newPassword}`);

        // Verificar se usuário existe
        const [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            console.log('⚠️ Usuário admin não encontrado! Criando um novo...');
            const id = '1-' + Date.now(); // ID temporário simples
            await connection.query(
                'INSERT INTO users (id, name, username, password, role, agency) VALUES (?, ?, ?, ?, ?, ?)',
                [id, 'Administrador Principal', username, hashedPassword, 'ADMIN', 'Sede']
            );
            console.log('✅ Usuário admin criado com sucesso.');
        } else {
            await connection.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);
            console.log('✅ Senha atualizada com sucesso.');
        }

        // Listar todos os usuários para confirmação
        console.log('\n📋 Usuários disponíveis na base de dados:');
        const [allUsers] = await connection.query('SELECT username, role, created_at FROM users');
        console.table(allUsers);

        await connection.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

resetPassword();
