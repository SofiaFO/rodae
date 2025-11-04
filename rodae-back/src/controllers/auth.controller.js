const authService = require('../services/auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      console.log('Login attempt:', { email });

      if (!email || !senha) {
        return res.status(400).json({
          error: 'Email e senha são obrigatórios'
        });
      }

      const result = await authService.login(email, senha);
      
      console.log('Login successful:', { userId: result.usuario.id });

      res.json({
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        error: 'Erro ao realizar login',
        message: error.message
      });
    }
  }

  async register(req, res) {
    try {
      console.log('Register attempt:', { tipo: req.body.tipo, email: req.body.email });
      
      const result = await authService.register(req.body);
      
      console.log('Register successful');

      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({
        error: 'Erro ao registrar usuário',
        message: error.message
      });
    }
  }

  async me(req, res) {
    try {
      const userId = req.userId; // Vem do middleware de autenticação
      const user = await authService.getUserById(userId);
      
      res.json({
        message: 'Dados do usuário',
        data: user
      });
    } catch (error) {
      res.status(404).json({
        error: 'Erro ao buscar usuário',
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
