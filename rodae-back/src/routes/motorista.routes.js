const express = require('express');
const router = express.Router();
const motoristaController = require('../controllers/motorista.controller');

// Criar motorista
router.post('/', motoristaController.create);

// Listar todos os motoristas
router.get('/', motoristaController.getAll);

// Buscar motorista por ID
router.get('/:id', motoristaController.getById);

// Atualizar motorista
router.put('/:id', motoristaController.update);

// Deletar motorista
router.delete('/:id', motoristaController.delete);

module.exports = router;
