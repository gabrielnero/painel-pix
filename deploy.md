# 🚀 GUIA DE DEPLOY SEGURO

## 📋 PRÉ-REQUISITOS

1. **Conta no GitHub** - Para versionamento do código
2. **Conta no Vercel** - Para hospedagem (recomendado)
3. **MongoDB Atlas** - Para banco de dados em produção
4. **Credenciais PrimePag** - Para processamento de pagamentos

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### 1. Preparar o Repositório

```bash
# Inicializar Git (se ainda não foi feito)
git init

# Adicionar arquivos
git add .

# Commit inicial
git commit -m "Initial commit - Secure payment panel"

# Conectar ao GitHub
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

### 2. Configurar MongoDB Atlas

1. Acesse [MongoDB Atlas](https://cloud.mongodb.com/)
2. Crie uma conta gratuita
3. Crie um novo cluster
4. Configure acesso de rede (0.0.0.0/0 para Vercel)
5. Crie um usuário de banco de dados
6. Copie a string de conexão

### 3. Deploy no Vercel

1. Acesse [Vercel](https://vercel.com/)
2. Conecte sua conta GitHub
3. Importe o repositório
4. Configure as variáveis de ambiente:

```
MONGODB_URI=sua-string-conexao-mongodb-atlas
JWT_SECRET=sua-chave-jwt-super-segura-32-caracteres-minimo
PRIMEPAG_CLIENT_ID=sua-client-id-primepag
PRIMEPAG_CLIENT_SECRET=sua-client-secret-primepag
PRIMEPAG_SECRET_KEY=sua-webhook-secret-primepag
ADMIN_DEFAULT_PASSWORD=sua-senha-admin-super-segura
NODE_ENV=production
```

5. Clique em "Deploy"

### 4. Configuração Pós-Deploy

1. **Alterar senha admin:**
   - Acesse seu site
   - Faça login com admin/sua-senha-configurada
   - Vá em Perfil → Alterar Senha
   - Defina uma senha ainda mais forte

2. **Configurar webhook PrimePag:**
   - URL: `https://seu-dominio.vercel.app/api/webhook/primepag`
   - Método: POST
   - Configure a secret key

3. **Testar funcionalidades:**
   - Login/logout
   - Geração de PIX
   - Recebimento de pagamentos
   - Painel administrativo

## 🔒 VERIFICAÇÕES DE SEGURANÇA

### Checklist Obrigatório:

- [ ] NODE_ENV=production configurado
- [ ] JWT_SECRET único e seguro (32+ caracteres)
- [ ] Credenciais PrimePag corretas
- [ ] MongoDB Atlas com autenticação
- [ ] HTTPS ativo (automático no Vercel)
- [ ] Senha admin alterada
- [ ] Rotas de debug inacessíveis
- [ ] Logs sem informações sensíveis

### Teste de Segurança:

```bash
# Verificar se rotas perigosas estão bloqueadas
curl https://seu-dominio.vercel.app/api/debug
# Deve retornar 404

curl https://seu-dominio.vercel.app/api/init
# Deve retornar 404

curl https://seu-dominio.vercel.app/api/test/webhook
# Deve retornar 404
```

## 🌐 CONFIGURAÇÃO DE DOMÍNIO PERSONALIZADO

### No Vercel:

1. Vá em Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções
4. Aguarde propagação (até 48h)

### Configurações DNS:

```
Tipo: CNAME
Nome: @
Valor: cname.vercel-dns.com

Tipo: CNAME  
Nome: www
Valor: cname.vercel-dns.com
```

## 📊 MONITORAMENTO

### Logs do Vercel:
- Acesse Functions → View Function Logs
- Monitore erros e performance
- Configure alertas se necessário

### Métricas Importantes:
- Tempo de resposta das APIs
- Taxa de erro
- Uso de recursos
- Transações de pagamento

## 🆘 TROUBLESHOOTING

### Problemas Comuns:

1. **Erro de conexão MongoDB:**
   - Verifique string de conexão
   - Confirme IP whitelist (0.0.0.0/0)
   - Teste credenciais

2. **JWT inválido:**
   - Verifique JWT_SECRET
   - Limpe cookies do navegador
   - Refaça login

3. **Webhook não funciona:**
   - Verifique URL no PrimePag
   - Confirme secret key
   - Teste com ferramenta como Postman

4. **Deploy falha:**
   - Verifique logs do Vercel
   - Confirme todas variáveis de ambiente
   - Teste build local: `npm run build`

## 📞 SUPORTE

### Em caso de problemas:

1. Verifique logs do Vercel
2. Teste em ambiente local
3. Confirme todas as configurações
4. Revise o arquivo SECURITY.md

### Recursos Úteis:

- [Documentação Vercel](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [PrimePag API](https://docs.primepag.com.br/)

---

**⚠️ IMPORTANTE:** Nunca compartilhe suas credenciais ou chaves secretas. Mantenha sempre backups das configurações importantes. 