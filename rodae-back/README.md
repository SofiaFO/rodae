# Rodaê Backend - API Documentation

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure o arquivo `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/rodae"
JWT_SECRET="rodae-secret-key-2024-super-seguro"
JWT_EXPIRES_IN="7d"
PORT=3000
```

3. Execute as migrações do Prisma:
```bash
npx prisma migrate dev
```

4. Inicie o servidor:
```bash
npm run dev
```

## Endpoints

### Autenticação

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "senha": "senha123"
}

Resposta:
{
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 98765-4321",
      "tipo": "PASSAGEIRO",
      "status": "ATIVO",
      "criadoEm": "2024-11-03T...",
      "passageiro": { "id": 1 }
    }
  }
}
```

#### Registro (Passageiro)
```http
POST /api/auth/register
Content-Type: application/json

{
  "tipo": "PASSAGEIRO",
  "nome": "Maria Santos",
  "email": "maria@email.com",
  "telefone": "(11) 99999-9999",
  "senha": "senha123"
}
```

#### Registro (Motorista)
```http
POST /api/auth/register
Content-Type: application/json

{
  "tipo": "MOTORISTA",
  "nome": "Carlos Souza",
  "email": "carlos@email.com",
  "telefone": "(11) 97777-7777",
  "senha": "senha123",
  "cnh": "12345678900",
  "validadeCNH": "2026-12-31",
  "docVeiculo": "CRLV123456",
  "placaVeiculo": "ABC1D23",
  "modeloCorVeiculo": "Honda Civic Prata"
}

Resposta:
{
  "message": "Usuário registrado com sucesso",
  "data": {
    "message": "Motorista cadastrado com sucesso. Sua conta está em análise.",
    "usuario": {
      "id": 2,
      "nome": "Carlos Souza",
      "email": "carlos@email.com",
      "tipo": "MOTORISTA",
      "status": "PENDENTE"
    }
  }
}
```

#### Obter Dados do Usuário Logado
```http
GET /api/auth/me
Authorization: Bearer {token}

Resposta:
{
  "message": "Dados do usuário",
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 98765-4321",
    "tipo": "PASSAGEIRO",
    "status": "ATIVO",
    "criadoEm": "2024-11-03T...",
    "passageiro": { "id": 1 }
  }
}
```

---

### Passageiros

#### Criar Passageiro
```http
POST /api/passageiros
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "(11) 98765-4321",
  "senha": "senha123"
}
```

#### Listar Todos os Passageiros
```http
GET /api/passageiros
```

#### Buscar Passageiro por ID
```http
GET /api/passageiros/:id
```

#### Atualizar Passageiro
```http
PUT /api/passageiros/:id
Content-Type: application/json

{
  "nome": "João Silva Santos",
  "telefone": "(11) 98888-8888"
}
```

#### Deletar Passageiro
```http
DELETE /api/passageiros/:id
```

---

### Motoristas

#### Criar Motorista
```http
POST /api/motoristas
Content-Type: application/json

{
  "nome": "Carlos Souza",
  "email": "carlos@email.com",
  "telefone": "(11) 97777-7777",
  "senha": "senha123",
  "cnh": "12345678900",
  "validadeCNH": "2026-12-31",
  "docVeiculo": "CRLV123456",
  "placaVeiculo": "ABC1D23",
  "modeloCorVeiculo": "Honda Civic Prata"
}
```

#### Listar Todos os Motoristas
```http
GET /api/motoristas
```

#### Buscar Motorista por ID
```http
GET /api/motoristas/:id
```

#### Atualizar Motorista
```http
PUT /api/motoristas/:id
Content-Type: application/json

{
  "nome": "Carlos Souza Lima",
  "telefone": "(11) 96666-6666",
  "placaVeiculo": "XYZ9Z99"
}
```

#### Deletar Motorista
```http
DELETE /api/motoristas/:id
```

---

## Estrutura do Projeto

```
rodae-back/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── passageiro.controller.js
│   │   └── motorista.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── passageiro.service.js
│   │   └── motorista.service.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── passageiro.routes.js
│   │   ├── motorista.routes.js
│   │   └── corrida.routes.js
│   └── server.js
├── .env
└── package.json
```

## Recursos Implementados

✅ **Autenticação completa**
  - Login com JWT
  - Registro de passageiros e motoristas
  - Middleware de autenticação
  - Middleware de autorização por tipo de usuário
  - Token com expiração configurável
  
✅ **CRUD completo de Passageiros**
✅ **CRUD completo de Motoristas**
✅ **Hash de senhas com bcrypt**
✅ **Validação de dados únicos (email, CNH, placa)**
✅ **Transações no banco de dados**
✅ **Tratamento de erros**
✅ **Cors habilitado**
✅ **Status do motorista (PENDENTE por padrão)**
✅ **Validação de status de usuário no login**

## Próximos Passos

- [x] Implementar autenticação JWT
- [ ] CRUD de corridas
- [ ] Sistema de avaliações
- [ ] Sistema de pagamentos
- [ ] Notificações
- [ ] WebSocket para rastreamento em tempo real

## Como Testar

### 1. Registrar um Passageiro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PASSAGEIRO",
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 98765-4321",
    "senha": "senha123"
  }'
```

### 2. Fazer Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "senha": "senha123"
  }'
```

### 3. Acessar Rota Protegida
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```
