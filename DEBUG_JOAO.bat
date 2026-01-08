@echo off
echo Parando processos node...
taskkill /F /IM node.exe
timeout /t 2 >nul
echo.
echo Iniciando Backend com LOGS DE DEBUG...
start "BACKEND - DEBUG ATIVO" cmd /k "cd backend && npm run dev"
timeout /t 5 >nul
echo.
echo Iniciando Frontend...
start "FRONTEND" cmd /k "npm run dev"
echo.
echo SISTEMA REINICIADO!
echo.
echo 1. Faca login como Joao
echo 2. Crie uma chamada
echo 3. VOLTE NA JANELA PRETA DO BACKEND e veja o ID que aparece!
pause
