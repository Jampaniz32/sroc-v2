import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function testJoaoFlow() {
    console.log('--- TESTE DIAGNOSTICO: Fluxo do Joao ---');

    try {
        // 1. Login
        console.log('1. Tentando login com joao/password123...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'joao',
            password: 'password123'
        });

        const token = loginRes.data.token;
        const user = loginRes.data.user;
        console.log(`✅ Login SUCESSO! ID: ${user.id}, Nome: ${user.name}`);

        // 2. Criar Chamada
        console.log('\n2. Criando chamada de teste...');
        const newCallData = {
            cliente: "CLIENTE TESTE SCRIPT " + Date.now(),
            nuit: "123456789",
            entidade: "Singular",
            agencia: "Maputo",
            tipoPedido: "Reclamação",
            estagio: "Pendente",
            contacto: "841234567",
            whatsapp: false,
            observacoes: "Teste automtico script",
            turno: "Manhã"
        };

        const createRes = await axios.post(`${API_URL}/calls`, newCallData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Chamada CRIADA! ID da chamada: ${createRes.data.id}`);

        // 3. Buscar Chamadas
        console.log('\n3. Buscando todas as chamadas como Joao...');
        const listRes = await axios.get(`${API_URL}/calls`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const allCalls = listRes.data;
        console.log(`📊 Total chamadas retornadas pelo backend: ${allCalls.length}`);

        // 4. Verificar se a nossa aparece
        const myCall = allCalls.find(c => c.cliente === newCallData.cliente);

        if (myCall) {
            console.log(`\n✅ SUCESSO TOTAL! A chamada foi encontrada na lista.`);
            console.log(`   Detalhes salvos:`);
            console.log(`   - AgenteID na chamada: ${myCall.agenteId} (Tipo: ${typeof myCall.agenteId})`);
            console.log(`   - AgenteNome na chamada: ${myCall.agenteNome}`);
            console.log(`   - Seu User ID: ${user.id} (Tipo: ${typeof user.id})`);

            if (String(myCall.agenteId) === String(user.id)) {
                console.log('   ✅ MATCH DE ID CONFIRMADO!');
            } else {
                console.log('   ❌ ERRO DE ID: Os IDs nao batem!');
            }
        } else {
            console.log(`\n❌ FALHA CRÍTICA: A chamada criada NÃO apareceu na lista!`);
            console.log('Isso significa que o banco de dados salvou, mas a API de listagem nao retornou.');
        }

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.response ? error.response.data : error.message);
    }
}

testJoaoFlow();
