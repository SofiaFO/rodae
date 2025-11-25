@echo off
chcp 65001 >nul
color 0A
echo.
echo ========================================
echo   🧪 TESTES SELENIUM - RODAE
echo ========================================
echo.

:: Verificar se node_modules existe
if not exist "node_modules\" (
    echo ⚠️  Dependências não encontradas!
    echo 📥 Instalando dependências...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
    echo.
    echo ✅ Dependências instaladas!
    echo.
)

:: Menu de opções
echo Escolha qual teste executar:
echo.
echo 1 - Executar TODOS os testes
echo 2 - Teste de Admin
echo 3 - Teste de Passageiro  
echo 4 - Teste de Motorista
echo 5 - Teste de Avaliacoes
echo 6 - Teste de Enderecos Favoritos
echo 7 - Configurar ambiente
echo 0 - Sair
echo.

set /p opcao="Digite o numero da opcao: "

if "%opcao%"=="1" (
    echo.
    echo 🚀 Executando todos os testes...
    echo.
    node run-all-tests.js
) else if "%opcao%"=="2" (
    echo.
    echo 👨‍💼 Executando teste de Admin...
    echo.
    node tests/admin-standalone.test.js
) else if "%opcao%"=="3" (
    echo.
    echo 🚶 Executando teste de Passageiro...
    echo.
    node tests/passageiro-standalone.test.js
) else if "%opcao%"=="4" (
    echo.
    echo 🚗 Executando teste de Motorista...
    echo.
    node tests/motorista-standalone.test.js
) else if "%opcao%"=="5" (
    echo.
    echo ⭐ Executando teste de Avaliações...
    echo.
    node tests/avaliacao.test.js
) else if "%opcao%"=="6" (
    echo.
    echo 📍 Executando teste de Endereços Favoritos...
    echo.
    node tests/enderecos.test.js
) else if "%opcao%"=="7" (
    echo.
    echo ⚙️  Configurando ambiente...
    echo.
    node setup-windows.js
) else if "%opcao%"=="0" (
    echo.
    echo 👋 Até logo!
    exit /b 0
) else (
    echo.
    echo ❌ Opção inválida!
)

echo.
echo ========================================
pause
