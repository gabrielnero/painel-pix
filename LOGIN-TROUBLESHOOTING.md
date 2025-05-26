# Solução de Problemas de Conexão e Login

## Erro do Middleware: "Cannot read properties of undefined (reading 'User')"

Este erro acontece no middleware (Edge Runtime) quando o sistema tenta usar modelos do Mongoose que não são compatíveis com o ambiente Edge do Next.js. Para solucionar:

1. O código foi atualizado para usar a biblioteca `jose` para verificação de tokens JWT no middleware.
2. Certifique-se de que o pacote `jose` esteja instalado, execute:
   ```
   npm install jose
   ```
3. Verifique se o arquivo `.env` ou `.env.local` existe na raiz do projeto com:
   ```
   MONGODB_URI=mongodb://localhost:27017/admin-panel
   JWT_SECRET=admin-panel-jwt-secret-key-very-secure
   NODE_ENV=development
   ```
4. Reinicie o servidor Next.js.

## Erro "Cannot read properties of undefined (reading 'User')"

Este erro acontece quando o sistema tenta acessar o modelo `User` do MongoDB, mas a conexão com o banco de dados não foi estabelecida corretamente.

## Etapas para solucionar:

### 1. Verifique a instalação do MongoDB

- **Windows:** Garanta que o MongoDB está instalado e em execução como um serviço
- **macOS:** Execute `brew services start mongodb-community`
- **Linux:** Execute `sudo systemctl start mongod`

Ou baixe e instale o MongoDB a partir do site oficial: https://www.mongodb.com/try/download/community

### 2. Configure o arquivo .env

Crie um arquivo `.env` ou `.env.local` na raiz do projeto com o seguinte conteúdo:

```
MONGODB_URI=mongodb://localhost:27017/admin-panel
JWT_SECRET=admin-panel-jwt-secret-key-very-secure
NODE_ENV=development
```

### 3. Reinicie o servidor Next.js

Pare o servidor e inicie-o novamente:

```
npm run dev
```

### 4. Execute o diagnóstico do sistema

Acesse a rota de diagnóstico para verificar a conexão com o MongoDB:

```
http://localhost:3000/api/debug
```

Esta página mostrará o status da conexão com o banco de dados e outras informações úteis.

### 5. Inicialize o usuário administrador

Acesse a rota de inicialização para criar o usuário administrador:

```
http://localhost:3000/api/init
```

### 6. Tentando fazer login

Agora tente fazer login com as credenciais:
- **Usuário:** admin
- **Senha:** admin123

### 7. Depuração avançada

Se ainda estiver tendo problemas:

1. Verifique os logs no console do servidor
2. Verifique os logs no console do navegador (F12)
3. Verifique se o MongoDB está acessível:
   ```
   mongosh
   ```
4. Limpe os cookies do navegador e tente novamente

### 8. Instalação local do MongoDB

Se você não tem o MongoDB instalado, você pode:

1. Usar o MongoDB Atlas (serviço na nuvem): https://www.mongodb.com/cloud/atlas
2. Usar o Docker para executar o MongoDB localmente:
   ```
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

### 9. Se nada mais funcionar

Você pode modificar o sistema para usar um banco de dados simulado para desenvolvimento:

1. Crie um arquivo `src/lib/mockDb.ts` para simular o banco de dados
2. Configure o sistema para usar o banco de dados simulado em desenvolvimento

---

## Outros problemas comuns:

### Erro ECONNREFUSED ao conectar ao MongoDB

Isto indica que o MongoDB não está em execução na porta 27017.

### Erro "JWT malformed"

Isto pode indicar um problema com o cookie de autenticação. Tente limpar os cookies do navegador.

### Erro "Token inválido"

Isto pode indicar que o JWT_SECRET foi alterado após a emissão de um token. Certifique-se de manter o JWT_SECRET consistente. 