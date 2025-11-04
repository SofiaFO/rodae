const authService = require('../services/auth.service');

const authMiddleware = (req, res, next) => {
  try {
    // Pegar token do header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token não fornecido'
      });
    }

    // Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({
        error: 'Token mal formatado'
      });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({
        error: 'Token mal formatado'
      });
    }

    // Verificar token
    const decoded = authService.verifyToken(token);
    
    // Adicionar informações do usuário na requisição
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userTipo = decoded.tipo;

    return next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido',
      message: error.message
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.userTipo !== 'ADMIN') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores.'
    });
  }
  return next();
};

const isMotorista = (req, res, next) => {
  if (req.userTipo !== 'MOTORISTA') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas motoristas.'
    });
  }
  return next();
};

const isPassageiro = (req, res, next) => {
  if (req.userTipo !== 'PASSAGEIRO') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas passageiros.'
    });
  }
  return next();
};

module.exports = {
  authMiddleware,
  isAdmin,
  isMotorista,
  isPassageiro
};
