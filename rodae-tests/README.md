# 🧪 Rodaê - Testes E2E com Selenium

# 🧪 Rodaê - Testes E2E Automatizados

Testes automatizados end-to-end usando Selenium WebDriver para o sistema Rodaê.

## 🪟 PARA USUÁRIOS WINDOWS

### ⚡ Forma MAIS RÁPIDA (Clique Duplo!)

1. **Execute tudo de uma vez:**
   - Clique duas vezes em: `INICIAR_TUDO.bat`
   - Isso vai abrir Backend + Frontend + Testes automaticamente!

2. **Ou execute apenas os testes:**
   - Clique duas vezes em: `executar-testes.bat`
   - Escolha qual teste quer executar no menu

### 📖 Guias Disponíveis

- **`CREDENCIAIS.md`** - ⭐ Credenciais de teste e explicação do fluxo
- **`GUIA_WINDOWS.md`** - Guia completo e simples para Windows
- **`COMO_EXECUTAR_TESTES.md`** - Instruções detalhadas
- **`CORRECOES_APLICADAS.md`** - Detalhes técnicos das correções

## 🚀 Instalação Rápida

```powershell
npm install
```

## ⚡ Execução Rápida

```powershell
npm test
```

## 📋 Pré-requisitos

- ✅ Node.js instalado
- ✅ Google Chrome instalado
- ✅ Backend rodando na porta 3000
- ✅ Frontend rodando na porta 8080

## 🔑 Credenciais de Teste

### Para Login nos Testes:

- **Admin:** `admin@rodae.com` / `admin123`
- **Passageiro:** `ana.silva@email.com` / `123456`
- **Motorista:** `joao@gmail.com` / `senha` ⚠️ (Pré-aprovado!)

> 💡 **Importante:** Motoristas recém-cadastrados não podem logar até serem aprovados pelo admin. Use o motorista pré-aprovado nos testes!

📖 Veja mais detalhes em: **`CREDENCIAIS.md`**

## 📋 Pré-requisitos

- **Node.js** instalado (v14 ou superior)
- **Google Chrome** instalado
- **Backend** rodando em `http://localhost:3000`
- **Frontend** rodando em `http://localhost:8080`

## 🚀 Instalação

```bash
cd rodae-tests
npm install
```

## ▶️ Executar Testes

### Todos os testes (sequencial com relatório)
```bash
npm run test:all
```

### Todos os testes (paralelo)
```bash
npm test
```

### Testes específicos
```bash
# Apenas testes de Admin
npm run test:admin

# Apenas testes de Motorista
npm run test:motorista

# Apenas testes de Passageiro
npm run test:passageiro
```

## 📁 Estrutura dos Testes

```
rodae-tests/
├── package.json
├── README.md
├── helpers/
│   └── TestHelper.js          # Funções auxiliares para os testes
└── tests/
    ├── run-all.js             # Orquestrador de testes
    ├── admin.test.js          # Testes do Admin
    ├── motorista.test.js      # Testes do Motorista
    └── passageiro.test.js     # Testes do Passageiro
```

## 🧪 Cenários de Teste

### 👤 Passageiro
- ✅ Cadastro de novo passageiro
- ✅ Login como passageiro
- ✅ Acesso ao dashboard
- ✅ Visualização de perfil
- ✅ Logout

### 🚗 Motorista
- ✅ Cadastro de novo motorista (com dados de veículo e CNH)
- ✅ Login como motorista
- ✅ Acesso ao dashboard
- ✅ Logout

### 👨‍💼 Admin
- ✅ Login como administrador
- ✅ Visualização do dashboard
- ✅ Listagem de motoristas
- ✅ Logout

## ⚙️ Configurações

### Alterar URL base
Edite a constante `BASE_URL` nos arquivos de teste:
```javascript
const BASE_URL = 'http://localhost:8080';
```

### Modo Headless
Para rodar sem abrir o navegador, edite o arquivo `helpers/TestHelper.js`:
```javascript
// Descomente esta linha:
options.addArguments('--headless');
```

## 🔧 Helpers Disponíveis

O arquivo `helpers/TestHelper.js` fornece:

- `createDriver()` - Cria e configura uma instância do WebDriver
- `sleep(ms)` - Aguarda um tempo específico
- `waitForElement(driver, locator, timeout)` - Aguarda elemento aparecer
- `safeClick(driver, locator)` - Clica com tratamento de erro
- `safeSendKeys(driver, locator, text)` - Preenche com tratamento de erro

## 📝 Observações

- Os testes usam seletores CSS genéricos que se adaptam à estrutura do frontend
- Certifique-se de que o banco de dados está populado com dados de teste
- O timeout padrão é de **30 segundos** por teste
- Os testes são executados em sequência para evitar conflitos

## 🐛 Solução de Problemas

### ChromeDriver não encontrado
```bash
npm install chromedriver --save-dev
```

### Timeout nos testes
Aumente o timeout no arquivo de teste:
```javascript
this.timeout(60000); // 60 segundos
```

### Elementos não encontrados
Verifique se:
1. O frontend está rodando corretamente
2. O backend está respondendo
3. Os seletores CSS correspondem aos elementos da página

## 📊 Relatórios

Ao executar `npm run test:all`, você verá um relatório colorido com:
- 🟢 Número de testes que passaram
- 🔴 Número de testes que falharam
- 📈 Total de testes executados

## 🎯 Próximos Passos

- [ ] Adicionar testes de solicitação de corrida
- [ ] Adicionar testes de aprovação de motoristas
- [ ] Adicionar testes de avaliações
- [ ] Implementar screenshots em caso de falha
- [ ] Adicionar relatórios HTML
- [ ] Integração com CI/CD

## 📄 Licença

Este projeto é parte do sistema Rodaê.
