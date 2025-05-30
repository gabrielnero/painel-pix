# 🔗 CONECTAR AO GITHUB

## Após criar o repositório no GitHub, execute estes comandos:

```powershell
# Adicionar o repositório remoto (substitua SEU-USUARIO e SEU-REPOSITORIO)
& "C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Renomear branch para main
& "C:\Program Files\Git\bin\git.exe" branch -M main

# Fazer push para o GitHub
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

## Exemplo:
Se seu usuário for "joao" e repositório "painel-pix":
```powershell
& "C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/joao/painel-pix.git
& "C:\Program Files\Git\bin\git.exe" branch -M main
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

## ⚠️ IMPORTANTE:
- Substitua SEU-USUARIO pelo seu nome de usuário do GitHub
- Substitua SEU-REPOSITORIO pelo nome que você deu ao repositório
- O GitHub pode pedir suas credenciais na primeira vez 