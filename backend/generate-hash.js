import bcrypt from 'bcryptjs';

const password = 'password123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nSQL para atualizar:');
console.log(`UPDATE users SET password = '${hash}' WHERE username IN ('admin', 'joao', 'maria');`);
