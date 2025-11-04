# Testes Automatizados com Selenium - Rodaê

## 📋 Pré-requisitos

- Node.js instalado
- Google Chrome instalado
- Backend rodando em `http://localhost:3000`
- Frontend rodando em `http://localhost:8080`

## 🚀 Instalação

```bash
cd tests-selenium
npm install
```

## ▶️ Executar Testes

### Todos os testes
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
tests-selenium/
├── package.json
├── helpers/
│   └── TestHelper.js          # Funções auxiliares
└── tests/
    ├── admin.test.js          # Testes do Admin
    ├── motorista.test.js      # Testes do Motorista
    └── passageiro.test.js     # Testes do Passageiro
```

## 🧪 Testes Implementados

### Admin
- ✅ Login como administrador
- ✅ Listar motoristas pendentes
- ✅ Filtrar motoristas por status
- ✅ Aprovar motorista
- ✅ Visualizar estatísticas

### Motorista
- ✅ Login como motorista
- ✅ Acessar perfil
- ✅ Atualizar informações do perfil
- ✅ Visualizar corridas disponíveis
- ✅ Aceitar corrida
- ✅ Logout

### Passageiro
- ✅ Cadastro de novo passageiro
- ✅ Login como passageiro
- ✅ Acessar perfil
- ✅ Atualizar informações do perfil
- ✅ Solicitar corrida
- ✅ Visualizar histórico de corridas
- ✅ Logout

## ⚙️ Configurações

### Alterar URL base
Edite a constante `BASE_URL` nos arquivos de teste:
```javascript
const BASE_URL = 'http://localhost:8080';
```

### Modo Headless
Para rodar sem abrir o navegador, descomente a linha no `TestHelper.js`:
```javascript
options.addArguments('--headless');
```

## 📝 Observações

- Os testes usam seletores CSS genéricos. Ajuste conforme a estrutura do seu frontend.
- Certifique-se de que o banco de dados está populado antes de rodar os testes.
- O timeout padrão é de 30 segundos por teste.
- Os testes podem falhar se os elementos HTML tiverem classes/ids diferentes.

## 🔧 Solução de Problemas

### ChromeDriver não encontrado
```bash
npm install chromedriver --save-dev
```

### Timeout nos testes
Aumente o timeout no package.json:
```json
"test": "mocha tests/**/*.test.js --timeout 60000"
```

### Elementos não encontrados
Verifique os seletores CSS nos testes e ajuste conforme a estrutura do seu frontend.
