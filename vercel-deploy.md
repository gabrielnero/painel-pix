# 🚀 DEPLOY NO VERCEL

## 1. Importar Projeto:
- Acesse: [vercel.com](https://vercel.com)
- Clique "Continue with GitHub"
- Autorize o Vercel a acessar seus repositórios
- Clique "Import" no seu repositório do painel

## 2. Configurar Projeto:
- Project Name: `painel-pix` (ou outro nome)
- Framework Preset: Next.js (deve detectar automaticamente)
- Root Directory: `./` (deixe como está)
- Clique "Deploy" (vai falhar, mas é normal)

## 3. Configurar Variáveis de Ambiente:
Após o primeiro deploy (que vai falhar), vá em:
- Settings → Environment Variables
- Adicione TODAS essas variáveis:

### ⚠️ COPIE EXATAMENTE:

```
MONGODB_URI
sua-string-do-mongodb-atlas-aqui

JWT_SECRET
629ee24db4214d63abbd4f1494d588dc75cc9a372563f41415e81ff7e69997976d254dd756112c52442b16c71674145a6887450c91ab98f8240bea7192dbbe86f09cd0f5ee4c38c0e49ce2caf1810234773640bede62f3e3f64f5158a7a72a6afe5f10972cf95e7c3ed1d8eb4c1828ea443d7128ac4cde93a8b0b0f68bf9efc26a087a86f43202a4ba27b8d48ab7628819d07f00d565dd8894b4b77f6cf55e41cee732759b2921b593d96b974a435b812e94065bc340f354a980e9a738f942192961463ab685f69b80e1a368238ce83a220210ef4fbb6958ede37b6bb43cccf6fa2aa1eec485e7b84770251d5d14cd9588f34d8bde69bd374fce89334e9445f08c2e9617c8f8c99fae812dcc6fa978c9b7406b122b3680efaca92b14fd81ce9f72e8ea9da1ef0b18b6dba2dd6815752f960f0d000d7e7757849ca978d8c577a3a94207600f6e84f3e40ece7e11c53d06e553e50a50cef365c4b853d73076bb2dad3b19b23b9e865134ca44918b92f02b64b81afa535159f6cf24ac8aa55f69acd8fa2204b807bd5c72839673ad4582f1fa97558559e161029ef092f504c648b2f5f4002e75cfcf518a2a5a384bfbf1aa16a47a29203f76bd399a15742874fe226c74896f6bdf95f920c208c32307115d9e2d7370ecf391089537176e28c6f3b08b1ff34cbc60dd545762e475e1447c2ebfde36b5a6ecf66a246cb886b70ef164

PRIMEPAG_CLIENT_ID
9a692e2a-205e-4880-b49b-aa862096bbeb

PRIMEPAG_CLIENT_SECRET
b2c2a2b5-96ac-4c14-83fb-f3474501a84f

PRIMEPAG_SECRET_KEY
b2c2a2b5-96ac-4c14-83fb-f3474501a84f

ADMIN_DEFAULT_PASSWORD
695948741gs

NODE_ENV
production
```

## 4. Redeploy:
- Vá em "Deployments"
- Clique nos 3 pontinhos do último deploy
- Clique "Redeploy"
- Aguarde o build completar

## 5. Testar:
- Acesse a URL do seu projeto (ex: painel-pix.vercel.app)
- Login: `admin` / `695948741gs`
- Teste gerar um PIX

## ⚠️ IMPORTANTE:
- Altere a senha admin após primeiro login!
- Configure o webhook no PrimePag com sua URL
- Teste todas as funcionalidades 