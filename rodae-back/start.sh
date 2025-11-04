#!/bin/bash

echo "🔍 Verificando Backend Rodaê..."
echo ""

# Verificar se o Node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    exit 1
fi

echo "✅ Node.js instalado: $(node --version)"

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado!"
    exit 1
fi

echo "✅ npm instalado: $(npm --version)"

# Ir para o diretório do backend
cd "$(dirname "$0")"

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules não encontrado. Instalando dependências..."
    npm install
fi

# Verificar se Prisma está configurado
if [ ! -d "node_modules/.prisma" ]; then
    echo "⚠️  Prisma Client não gerado. Gerando..."
    npx prisma generate
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Crie um arquivo .env com as seguintes variáveis:"
    echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/rodae\""
    echo "JWT_SECRET=\"rodae-secret-key-2024-super-seguro\""
    echo "JWT_EXPIRES_IN=\"7d\""
    echo "PORT=3000"
    exit 1
fi

echo "✅ Arquivo .env encontrado"

# Verificar se a porta 3000 está disponível
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Porta 3000 já está em uso!"
    echo "Processo usando a porta:"
    lsof -i :3000
    echo ""
    echo "Para liberar a porta, execute: kill -9 \$(lsof -t -i:3000)"
else
    echo "✅ Porta 3000 disponível"
fi

echo ""
echo "🚀 Iniciando servidor..."
npm run dev
