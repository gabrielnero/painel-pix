# 🔒 GUIA DE SEGURANÇA PARA PRODUÇÃO

## ⚠️ AÇÕES OBRIGATÓRIAS ANTES DO DEPLOY

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `env.example` para `.env.local` e configure:

```bash
# OBRIGATÓRIO - Gere uma chave JWT segura
JWT_SECRET=sua-chave-jwt-super-segura-aqui

# OBRIGATÓRIO - Suas credenciais PrimePag
PRIMEPAG_CLIENT_ID=sua-client-id-primepag
PRIMEPAG_CLIENT_SECRET=sua-client-secret-primepag
PRIMEPAG_SECRET_KEY=sua-webhook-secret-primepag

# OBRIGATÓRIO - Senha admin segura
ADMIN_DEFAULT_PASSWORD=sua-senha-admin-segura

# OBRIGATÓRIO - Configurar para produção
NODE_ENV=production
```

### 2. Alterar Senha do Admin

1. Faça login com as credenciais padrão
2. Vá para Perfil → Alterar Senha
3. Defina uma senha forte (mín. 12 caracteres)

### 3. Configurar HTTPS

- Use sempre HTTPS em produção
- Configure certificado SSL válido
- Redirecione HTTP para HTTPS

### 4. Configurar Banco de Dados

- Use MongoDB Atlas ou instância dedicada
- Configure autenticação no MongoDB
- Use conexão criptografada (SSL/TLS)

## 🛡️ RECURSOS DE SEGURANÇA IMPLEMENTADOS

### Autenticação e Autorização
- ✅ JWT com expiração de 1 hora
- ✅ Senhas hasheadas com bcrypt (12 rounds)
- ✅ Middleware de autenticação em todas as rotas
- ✅ Verificação de roles (admin/user)

### Proteção de Rotas
- ✅ Rotas de debug bloqueadas em produção
- ✅ Rotas de teste bloqueadas em produção
- ✅ Rota de inicialização bloqueada em produção

### Proteção contra Ataques
- ✅ Validação de entrada em todas as APIs
- ✅ Sanitização de dados
- ✅ Verificação de assinatura em webhooks
- ✅ Rate limiting implícito via JWT

### Segurança de Dados
- ✅ Credenciais em variáveis de ambiente
- ✅ Logs sem informações sensíveis
- ✅ Respostas de erro sanitizadas

## 🚨 VULNERABILIDADES CORRIGIDAS

1. **Credenciais Hardcoded** → Movidas para variáveis de ambiente
2. **Rotas de Debug Expostas** → Bloqueadas em produção
3. **Bypass de Autenticação** → Removido modo desenvolvimento
4. **Exposição de Informações** → Logs e respostas sanitizadas
5. **JWT Inseguro** → Chave obrigatória em produção

## 📋 CHECKLIST PRÉ-DEPLOY

- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET definido (mín. 32 caracteres)
- [ ] Credenciais PrimePag configuradas
- [ ] NODE_ENV=production
- [ ] HTTPS configurado
- [ ] MongoDB seguro configurado
- [ ] Senha admin alterada
- [ ] Testes de segurança realizados

## 🌐 ONDE HOSPEDAR

### Recomendações de Hospedagem:

1. **Vercel** (Recomendado)
   - Deploy automático via Git
   - HTTPS automático
   - Variáveis de ambiente seguras
   - CDN global

2. **Railway**
   - Deploy simples
   - Banco de dados integrado
   - Variáveis de ambiente

3. **DigitalOcean App Platform**
   - Controle total
   - Banco de dados gerenciado
   - Certificados SSL automáticos

4. **AWS/Azure/GCP**
   - Máximo controle
   - Requer mais configuração
   - Ideal para grandes volumes

### Configuração no Vercel:

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente no dashboard
3. Deploy automático

## 🔍 MONITORAMENTO

### Logs Importantes:
- Tentativas de login falhadas
- Acessos a rotas administrativas
- Erros de webhook
- Transações financeiras

### Alertas Recomendados:
- Múltiplas tentativas de login falhadas
- Acessos não autorizados
- Erros de pagamento
- Indisponibilidade do sistema

## 📞 SUPORTE

Em caso de problemas de segurança:
1. Revise este guia
2. Verifique os logs do sistema
3. Teste em ambiente de desenvolvimento primeiro 