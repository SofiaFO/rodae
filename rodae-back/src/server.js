require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const passageiroRoutes = require('./routes/passageiro.routes');
const motoristaRoutes = require('./routes/motorista.routes');
const corridaRoutes = require('./routes/corrida.routes');
const adminRoutes = require('./routes/admin.routes');
const metodoPagamentoRoutes = require('./routes/metodoPagamento.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:8080'],
  credentials: true
}));
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/passageiros', passageiroRoutes);
app.use('/api/motoristas', motoristaRoutes);
app.use('/api/corridas', corridaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/metodos-pagamento', metodoPagamentoRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Rodaê API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!', 
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

module.exports = app;
