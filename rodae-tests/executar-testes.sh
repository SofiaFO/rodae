#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo -e "${GREEN}"
echo "========================================"
echo "   🧪 TESTES SELENIUM - RODAE"
echo "========================================"
echo -e "${NC}"

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependências não encontradas!${NC}"
    echo -e "${BLUE}📥 Instalando dependências...${NC}"
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}❌ Erro ao instalar dependências!${NC}"
        read -p "Pressione Enter para continuar..."
        exit 1
    fi
    echo ""
    echo -e "${GREEN}✅ Dependências instaladas!${NC}"
    echo ""
fi

# Menu de opções
echo "Escolha qual teste executar:"
echo ""
echo "1 - Executar TODOS os testes"
echo "2 - Teste de Admin"
echo "3 - Teste de Passageiro"
echo "4 - Teste de Motorista"
echo "5 - Teste de Avaliações"
echo "6 - Teste de Endereços Favoritos"
echo "7 - Teste de Pagamento Corrida"
echo "8 - Configurar ambiente"
echo "0 - Sair"
echo ""

read -p "Digite o número da opção: " opcao

case $opcao in
    1)
        echo ""
        echo -e "${BLUE}🚀 Executando todos os testes...${NC}"
        echo ""
        node run-all-tests.js
        ;;
    2)
        echo ""
        echo -e "${BLUE}👨‍💼 Executando teste de Admin...${NC}"
        echo ""
        node tests/admin-standalone.test.js
        ;;
    3)
        echo ""
        echo -e "${BLUE}🚶 Executando teste de Passageiro...${NC}"
        echo ""
        node tests/passageiro-standalone.test.js
        ;;
    4)
        echo ""
        echo -e "${BLUE}🚗 Executando teste de Motorista...${NC}"
        echo ""
        node tests/motorista-standalone.test.js
        ;;
    5)
        echo ""
        echo -e "${BLUE}⭐ Executando teste de Avaliações...${NC}"
        echo ""
        node tests/avaliacao.test.js
        ;;
    6)
        echo ""
        echo -e "${BLUE}📍 Executando teste de Endereços Favoritos...${NC}"
        echo ""
        node tests/enderecos.test.js
        ;;
    7)
        echo ""
        echo -e "${BLUE}💳 Executando teste de Pagamento Corrida...${NC}"
        echo ""
        node tests/pagamento-corrida.test.js
        ;;
    8)
        echo ""
        echo -e "${BLUE}⚙️  Configurando ambiente...${NC}"
        echo ""
        node setup-windows.js
        ;;
    0)
        echo ""
        echo -e "${GREEN}👋 Até logo!${NC}"
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}❌ Opção inválida!${NC}"
        ;;
esac

echo ""
echo "========================================"
read -p "Pressione Enter para continuar..."
