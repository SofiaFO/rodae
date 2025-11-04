const express = require('express');
const router = express.Router();
const passageiroController = require('../controllers/passageiro.controller');

// Criar passageiro
router.post('/', passageiroController.create);

// Listar todos os passageiros
router.get('/', passageiroController.getAll);

// Buscar passageiro por ID
router.get('/:id', passageiroController.getById);

// Atualizar passageiro
router.put('/:id', passageiroController.update);

// Deletar passageiro
router.delete('/:id', passageiroController.delete);

module.exports = router;
