const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Conteúdo padrão para o arquivo .env.local
const defaultEnvContent = `MONGODB_URI=mongodb://localhost:27017/admin-panel
JWT_SECRET=admin-panel-jwt-secret-key-very-secure
NODE_ENV=development`;

console.log('===== Configuração do Painel Administrativo =====');
console.log('Este script criará os arquivos necessários para o sistema funcionar.');

const envPath = path.join(__dirname, '.env.local');

// Verifica se o arquivo .env.local já existe
if (fs.existsSync(envPath)) {
  console.log('\n.env.local já existe. Deseja sobrescrevê-lo? (s/n)');
  rl.question('> ', (answer) => {
    if (answer.toLowerCase() === 's') {
      createEnvFile();
    } else {
      console.log('\nMantendo arquivo .env.local existente.');
      checkDependencies();
    }
  });
} else {
  createEnvFile();
}

// Função para criar o arquivo .env.local
function createEnvFile() {
  console.log('\nCriando arquivo .env.local...');
  
  rl.question('URL do MongoDB (deixe em branco para usar o padrão: mongodb://localhost:27017/admin-panel):\n> ', (mongodbUri) => {
    rl.question('Chave secreta JWT (deixe em branco para gerar uma aleatória):\n> ', (jwtSecret) => {
      rl.question('Ambiente (development/production, deixe em branco para usar development):\n> ', (nodeEnv) => {
        // Usar valores padrão se não forem fornecidos
        const uri = mongodbUri || 'mongodb://localhost:27017/admin-panel';
        const secret = jwtSecret || `admin-panel-secret-${Math.random().toString(36).substring(2, 15)}`;
        const env = nodeEnv || 'development';
        
        // Criar conteúdo do arquivo
        const envContent = `MONGODB_URI=${uri}
JWT_SECRET=${secret}
NODE_ENV=${env}`;
        
        // Escrever arquivo
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ Arquivo .env.local criado com sucesso!');
        
        checkDependencies();
      });
    });
  });
}

// Verificar dependências necessárias
function checkDependencies() {
  console.log('\nVerificando dependências necessárias...');
  
  // Verificar package.json
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ Arquivo package.json não encontrado!');
    finishSetup();
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const dependencies = packageJson.dependencies || {};
    
    // Verificar dependências críticas
    const requiredDeps = ['jose', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'next'];
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      if (!dependencies[dep]) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      console.log(`❌ Dependências ausentes: ${missingDeps.join(', ')}`);
      console.log(`\nExecute o comando abaixo para instalar as dependências ausentes:`);
      console.log(`npm install ${missingDeps.join(' ')}`);
    } else {
      console.log('✅ Todas as dependências necessárias estão instaladas!');
    }
    
    finishSetup();
  } catch (error) {
    console.error('Erro ao verificar dependências:', error);
    finishSetup();
  }
}

// Finalizar configuração
function finishSetup() {
  console.log('\n===== Próximos passos =====');
  console.log('1. Instale o MongoDB, se ainda não estiver instalado.');
  console.log('2. Inicie o MongoDB.');
  console.log('3. Execute o servidor Next.js: npm run dev');
  console.log('4. Acesse a rota de inicialização: http://localhost:3000/api/init');
  console.log('5. Faça login com admin/admin123');
  
  rl.close();
}

// Evento de fechamento
rl.on('close', () => {
  console.log('\n===== Configuração concluída! =====');
  process.exit(0);
}); 