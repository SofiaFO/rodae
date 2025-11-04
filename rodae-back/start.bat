@echo off
echo Verificando Backend Rodae...
echo.

REM Verificar se o Node está instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js nao encontrado!
    echo Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js instalado
node --version

REM Ir para o diretório do backend
cd /d %~dp0

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

REM Verificar se Prisma está configurado
if not exist "node_modules\.prisma" (
    echo Gerando Prisma Client...
    call npx prisma generate
)

REM Verificar se o arquivo .env existe
if not exist ".env" (
    echo Arquivo .env nao encontrado!
    echo Crie um arquivo .env com as seguintes variaveis:
    echo DATABASE_URL="postgresql://user:password@localhost:5432/rodae"
    echo JWT_SECRET="rodae-secret-key-2024-super-seguro"
    echo JWT_EXPIRES_IN="7d"
    echo PORT=3000
    pause
    exit /b 1
)

echo Arquivo .env encontrado
echo.
echo Iniciando servidor...
call npm run dev
