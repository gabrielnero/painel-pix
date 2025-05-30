# Painel Administrativo

Sistema de painel administrativo com autenticação, gerenciamento de usuários e pagamentos.

## Instalação Rápida

### No Windows (PowerShell)

Execute o script de configuração PowerShell diretamente:

```powershell
# Se a política de execução estiver restrita, execute primeiro:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Execute o script de configuração
.\setup.ps1
```

### Para qualquer sistema (Node.js)

Execute o script de configuração Node.js:

```
npm run setup
```

Estes scripts irão:
1. Criar um arquivo `.env.local` com as configurações necessárias
2. Verificar as dependências instaladas
3. Fornecer instruções para os próximos passos

## Correção do Erro do Middleware

Se você estiver enfrentando o erro:

```
Error [TypeError]: Cannot read properties of undefined (reading 'User')
```

Este erro ocorre porque o middleware tenta usar modelos do Mongoose que não são compatíveis com o Edge Runtime do Next.js.

### Solução Implementada:

1. **Atualização do middleware**: O código foi modificado para usar a biblioteca `jose` para verificação de tokens JWT no middleware, sem depender dos modelos Mongoose.

2. **Instalação da biblioteca jose**:
   ```
   npm install jose
   ```

3. **Configuração do Ambiente**: Use um dos scripts de configuração ou crie manualmente um arquivo `.env.local` na raiz do projeto com:
   ```
   MONGODB_URI=mongodb://localhost:27017/admin-panel
   JWT_SECRET=admin-panel-jwt-secret-key-very-secure
   NODE_ENV=development
   ```

4. **Reinicie o servidor**:
   ```
   npm run dev
   ```

## Características

- Design responsivo com tema dark
- Sistema de autenticação completo com JWT
- Registro com código de convite obrigatório
- Painel administrativo
- Painel de usuário
- Geração de códigos PIX para pagamentos

## Inicialização

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure a conexão com o MongoDB (MONGODB_URI no .env)
4. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

## Credenciais de Teste

- **Admin**: 
  - Usuário: admin
  - Senha: admin123

## Funcionalidades do Administrador

- Gerenciar usuários
- Criar códigos de convite
- Conceder permissões de moderador
- Banir usuários
- Visualizar histórico de pagamentos

## Funcionalidades do Usuário

- Gerar códigos PIX
  - Para pessoa física ou jurídica
  - Com ou sem valor predefinido
- Escolher tipo de assinatura
- Visualizar histórico de pagamentos

## Segurança

Recomendamos alterar a senha do administrador logo após o primeiro acesso.

## Tecnologias

- Next.js
- React
- TypeScript
- MongoDB
- Tailwind CSS
- JWT para autenticação 

## Recursos Disponíveis

- **Sistema de Autenticação**: Login e registro com níveis de permissão
- **Gerenciamento de Usuários**: Administradores podem gerenciar usuários e moderadores
- **Convites**: Sistema de códigos de convite para registro
- **Pagamentos**: Geração de códigos PIX para pagamentos

## Rotas Importantes

- **/login**: Página de login
- **/register**: Página de registro (requer código de convite)
- **/admin**: Painel administrativo
- **/dashboard**: Painel do usuário
- **/api/init**: Inicializa o usuário admin
- **/api/debug**: Diagnóstico do sistema

## Depuração e Solução de Problemas

Para mais informações sobre solução de problemas, consulte:
- [LOGIN-TROUBLESHOOTING.md](./LOGIN-TROUBLESHOOTING.md) 