# 🗄️ CONFIGURAR MONGODB ATLAS

## 1. Criar Conta:
- Acesse: [cloud.mongodb.com](https://cloud.mongodb.com)
- Clique em "Try Free"
- Crie sua conta gratuita

## 2. Criar Cluster:
- Clique em "Build a Database"
- Escolha "M0 Sandbox" (gratuito)
- Escolha região mais próxima (ex: São Paulo)
- Clique em "Create"

## 3. Configurar Acesso:
### Usuário do Banco:
- Vá em "Database Access"
- Clique "Add New Database User"
- Username: `admin`
- Password: `suaSenhaSegura123` (anote essa senha!)
- Database User Privileges: "Read and write to any database"
- Clique "Add User"

### Acesso de Rede:
- Vá em "Network Access"
- Clique "Add IP Address"
- Clique "Allow Access from Anywhere" (0.0.0.0/0)
- Clique "Confirm"

## 4. Obter String de Conexão:
- Vá em "Database" → "Connect"
- Escolha "Connect your application"
- Driver: Node.js
- Version: 5.5 or later
- Copie a string de conexão

### Exemplo da string:
```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### ⚠️ IMPORTANTE:
- Substitua `<password>` pela senha que você criou
- Anote essa string, você vai precisar no Vercel! 