# Script PowerShell para configuração do Painel Administrativo no Windows
Write-Host "===== Configuração do Painel Administrativo =====" -ForegroundColor Cyan

# Definir variáveis de ambiente
$envFile = ".env.local"
$envPath = Join-Path -Path $PSScriptRoot -ChildPath $envFile

# Verificar se o arquivo .env.local já existe
if (Test-Path $envPath) {
    Write-Host "`n.env.local já existe. Deseja sobrescrevê-lo? (s/n)" -ForegroundColor Yellow
    $answer = Read-Host -Prompt ">"
    
    if ($answer.ToLower() -ne "s") {
        Write-Host "`nMantendo arquivo .env.local existente." -ForegroundColor Green
        $createEnv = $false
    } else {
        $createEnv = $true
    }
} else {
    $createEnv = $true
}

# Criar arquivo .env.local se necessário
if ($createEnv) {
    Write-Host "`nCriando arquivo .env.local..." -ForegroundColor Cyan
    
    $defaultMongoUri = "mongodb://localhost:27017/admin-panel"
    $inputMongoUri = Read-Host -Prompt "URL do MongoDB (deixe em branco para usar o padrão: $defaultMongoUri)"
    
    $mongoUri = if ($inputMongoUri) { $inputMongoUri } else { $defaultMongoUri }
    
    # Gerar chave JWT aleatória ou usar input
    $inputJwtSecret = Read-Host -Prompt "Chave secreta JWT (deixe em branco para gerar uma aleatória)"
    $jwtSecret = if ($inputJwtSecret) { 
        $inputJwtSecret 
    } else { 
        "admin-panel-secret-" + (-join ((65..90) + (97..122) | Get-Random -Count 12 | % {[char]$_}))
    }
    
    # Ambiente
    $inputNodeEnv = Read-Host -Prompt "Ambiente (development/production, deixe em branco para usar development)"
    $nodeEnv = if ($inputNodeEnv) { $inputNodeEnv } else { "development" }
    
    # Criar conteúdo do arquivo
    $envContent = @"
MONGODB_URI=$mongoUri
JWT_SECRET=$jwtSecret
NODE_ENV=$nodeEnv
"@
    
    # Escrever arquivo
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "`n✅ Arquivo .env.local criado com sucesso!" -ForegroundColor Green
}

# Verificar dependências necessárias
Write-Host "`nVerificando dependências necessárias..." -ForegroundColor Cyan

# Verificar package.json
$packagePath = Join-Path -Path $PSScriptRoot -ChildPath "package.json"
if (-not (Test-Path $packagePath)) {
    Write-Host "❌ Arquivo package.json não encontrado!" -ForegroundColor Red
} else {
    try {
        $packageJson = Get-Content -Path $packagePath -Raw | ConvertFrom-Json
        $dependencies = $packageJson.dependencies
        
        # Verificar dependências críticas
        $requiredDeps = @("jose", "mongoose", "bcryptjs", "jsonwebtoken", "next")
        $missingDeps = @()
        
        foreach ($dep in $requiredDeps) {
            if (-not $dependencies.$dep) {
                $missingDeps += $dep
            }
        }
        
        if ($missingDeps.Count -gt 0) {
            Write-Host "❌ Dependências ausentes: $($missingDeps -join ', ')" -ForegroundColor Red
            Write-Host "`nExecute o comando abaixo para instalar as dependências ausentes:" -ForegroundColor Yellow
            Write-Host "npm install $($missingDeps -join ' ')" -ForegroundColor Cyan
        } else {
            Write-Host "✅ Todas as dependências necessárias estão instaladas!" -ForegroundColor Green
        }
    } catch {
        Write-Host "Erro ao verificar dependências: $_" -ForegroundColor Red
    }
}

# Configurações do PowerShell para execução de scripts
Write-Host "`nVerificando configurações do PowerShell..." -ForegroundColor Cyan
$executionPolicy = Get-ExecutionPolicy
Write-Host "Política de execução atual: $executionPolicy" -ForegroundColor Cyan

if ($executionPolicy -eq "Restricted") {
    Write-Host @"
    
⚠️ Sua política de execução está definida como Restricted, o que pode impedir a execução de scripts.
Para permitir a execução de scripts apenas para a sessão atual, execute:

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

Ou para configurar permanentemente (requer privilégios de administrador):

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

"@ -ForegroundColor Yellow
}

# Finalizar configuração com próximos passos
Write-Host "`n===== Próximos passos =====" -ForegroundColor Cyan
Write-Host "1. Instale o MongoDB, se ainda não estiver instalado." -ForegroundColor White
Write-Host "2. Inicie o MongoDB." -ForegroundColor White
Write-Host "3. Execute o servidor Next.js: npm run dev" -ForegroundColor White
Write-Host "4. Acesse a rota de inicialização: http://localhost:3000/api/init" -ForegroundColor White
Write-Host "5. Faça login com admin/admin123" -ForegroundColor White

Write-Host "`n===== Configuração concluída! =====" -ForegroundColor Green 