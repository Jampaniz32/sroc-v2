@echo off
echo Parando todos os processos Node...
taskkill /F /IM node.exe
timeout /t 2
echo Iniciando Backend...
cd backend
start cmd /k "npm run dev"
timeout /t 3
cd..
echo Iniciando Frontend...
start cmd /k "npm run dev"
echo.
echo PRONTO! Aguarde 5 segundos e abra http://localhost:3000
pause
