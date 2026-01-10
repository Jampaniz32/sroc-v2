import mysql from 'mysql2/promise';

const templatesSQL = `
CREATE TABLE IF NOT EXISTS \`observation_templates\` (
  \`id\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`tipo_solicitacao\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`estado_pedido\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`titulo\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`observacao\` text COLLATE utf8mb4_unicode_ci NOT NULL,
  \`prioridade\` int NOT NULL DEFAULT '1',
  \`ativo\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_tipo_estado\` (\`tipo_solicitacao\`, \`estado_pedido\`),
  KEY \`idx_ativo\` (\`ativo\`),
  KEY \`idx_prioridade\` (\`prioridade\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO \`observation_templates\` (\`id\`, \`tipo_solicitacao\`, \`estado_pedido\`, \`titulo\`, \`observacao\`, \`prioridade\`, \`ativo\`) VALUES
('TMP-001', 'Outro', 'Aberto', 'Emissão de Carta de Quitação', 'O cliente entrou em contacto solicitando a emissão da carta de quitação. Foi devidamente orientado a submeter a documentação necessária para dar seguimento ao processo.', 1, 1),
('TMP-002', 'Pedidos de Cotação', 'Aberto', 'Pedido de Cotação', 'O cliente entrou em contacto solicitando a emissão de uma cotação. Foi orientado a dirigir-se a uma agência ou a submeter a documentação necessária para o devido seguimento do processo.', 1, 1),
('TMP-003', 'Descontos Apos Liquidacao do Credito', 'Pendente', 'Descontos Após a Liquidação', 'O cliente entrou em contacto solicitando reembolso após a liquidação. Foi orientado a preencher o formulário para a regularização da situação. Processo pendente, aguardando o formulário devidamente preenchido e submetido pelo cliente.', 1, 1),
('TMP-004', 'Descontos Apos Maturidade do Credito', 'Pendente', 'Descontos Após a Maturidade', 'O cliente entrou em contacto solicitando reembolso após a maturidade do crédito. Foi orientado a preencher o formulário para a regularização da situação. Processo pendente, aguardando o formulário devidamente preenchido e submetido pelo cliente.', 1, 1),
('TMP-005', 'Descontos incorrectos', 'Em Tratamento', 'Descontos Incorretos', 'O cliente solicitou reembolso referente ao mês de dezembro, devido à aplicação de descontos incorretos. O caso encontra-se em análise para a devida regularização.', 1, 1),
('TMP-006', 'Restruturação de Crédito', 'Pendente', 'Reestruturação de Crédito', 'O cliente solicitou a reestruturação do seu crédito. Foi orientado a submeter a respetiva carta de pedido para análise. Processo pendente, aguardando o envio da proposta devidamente preenchida e assinada pelo cliente.', 1, 1);
`;

async function deployTemplates() {
    try {
        console.log('🚀 Restaurando Observation Templates no Railway...');
        const connection = await mysql.createConnection('mysql://root:tprfAEpuoyUpcGCtcnwlxCVQMoATOVMB@shortline.proxy.rlwy.net:46578/railway');

        const commands = templatesSQL.split(';').filter(cmd => cmd.trim());
        for (let cmd of commands) {
            await connection.query(cmd);
        }

        console.log('✅ Templates restaurados com sucesso!');
        await connection.end();
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

deployTemplates();
