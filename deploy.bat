@echo off
echo Iniciando deploy para Vercel...
echo.
echo N | vercel --prod --name painel-pix-master --confirm
if %errorlevel% neq 0 (
    echo Erro durante o deploy. Tentando novamente...
    vercel --prod --confirm
)
echo.
echo Deploy concluído!
pause 