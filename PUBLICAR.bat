@echo off
chcp 65001 >nul
cd /d "C:\Users\vv\Desktop\Monalisa-Flores-Site"
echo ============================================
echo   PUBLICANDO O SITE NO GITHUB (iza-flores)
echo ============================================
echo.
echo [1/3] Adicionando arquivos...
git add -A
echo.
echo [2/3] Criando commit...
git commit -m "Site novo: imagens proprias, rodape novo, dados reais, dominio floricultura-ana-amores"
echo.
echo [3/3] Enviando para o GitHub (push)...
git push
echo.
echo ============================================
echo   Se NAO apareceu erro vermelho acima,
echo   deu certo! O Vercel vai atualizar o site
echo   em ~30 segundos. Recarregue o site depois.
echo ============================================
echo.
pause
