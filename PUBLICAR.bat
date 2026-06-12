@echo off
chcp 65001 >nul
cd /d "C:\Users\vv\Desktop\Monalisa-Flores-Site"
echo Publicando... aguarde.
(
echo ===== BRANCH =====
git branch --show-current
echo ===== REMOTE =====
git remote -v
echo ===== STATUS =====
git status
echo ===== ADD =====
git add -A
echo ===== COMMIT =====
git commit -m "Site novo: carrinho verde, imagens proprias, rodape novo, dominio floricultura-ana-amores"
echo ===== PUSH =====
git push
echo ===== ULTIMO COMMIT =====
git log -1 --oneline
echo ===== FIM =====
) > publicar-log.txt 2>&1
echo.
echo ============================================
echo   PRONTO. Gerei o arquivo publicar-log.txt
echo   Pode fechar esta janela e me avisar.
echo ============================================
echo.
pause
