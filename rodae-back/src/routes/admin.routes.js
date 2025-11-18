const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// Todas as rotas exigem autenticação e permissão de admin
router.use(authMiddleware);
router.use(isAdmin);

// GET /api/admin/motoristas - Listar todos os motoristas (com filtro opcional)
// Query params: ?status=PENDENTE ou ?status=ATIVO ou ?status=INATIVO
router.get('/motoristas', adminController.getMotoristas);

// PUT /api/admin/motoristas/:id/aprovar - Aprovar motorista
router.put('/motoristas/:id/aprovar', adminController.aprovarMotorista);

// PUT /api/admin/motoristas/:id/rejeitar - Rejeitar/Desativar motorista
router.put('/motoristas/:id/rejeitar', adminController.rejeitarMotorista);

// GET /api/admin/estatisticas - Obter estatísticas gerais
router.get('/estatisticas', adminController.getEstatisticas);

// [RFS21] GET /api/admin/dashboard - Dashboard com resumo em tempo real
router.get('/dashboard', adminController.getDashboard);

// [RFS22] PUT /api/admin/usuarios/:id/status - Ativar/Inativar usuário
// Body: { status: 'ATIVO' | 'INATIVO' | 'PENDENTE', justificativa: string }
router.put('/usuarios/:id/status', adminController.toggleUsuarioStatus);

// [RFS22] PUT /api/admin/corridas/:id/cancelar - Cancelar corrida fraudulenta
// Body: { justificativa: string }
router.put('/corridas/:id/cancelar', adminController.cancelarCorrida);

// [RFS22] GET /api/admin/usuarios/:id/historico - Histórico detalhado do usuário
router.get('/usuarios/:id/historico', adminController.getHistoricoUsuario);

// [RFS23] GET /api/admin/relatorios/corridas - Relatório sobre corridas
// Query params: ?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD&statusCorrida=FINALIZADA&statusPagamento=PAGO&cidade=São Paulo
router.get('/relatorios/corridas', adminController.getRelatorioCorridas);

// [RFS24] GET /api/admin/relatorios/motoristas - Relatório sobre motoristas
// Query params: ?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD&statusMotorista=ATIVO&cidade=São Paulo
router.get('/relatorios/motoristas', adminController.getRelatorioMotoristas);

// ========== EXPORTAÇÃO DE RELATÓRIOS DE CORRIDAS ==========

// [RFS23] Exportar Relatório de Corridas em CSV
router.get('/relatorios/corridas/export/csv', adminController.exportarRelatorioCorridasCSV);

// [RFS23] Exportar Relatório de Corridas em Excel
router.get('/relatorios/corridas/export/excel', adminController.exportarRelatorioCorridasExcel);

// [RFS23] Exportar Relatório de Corridas em PDF
router.get('/relatorios/corridas/export/pdf', adminController.exportarRelatorioCorridasPDF);

// ========== EXPORTAÇÃO DE RELATÓRIOS DE MOTORISTAS ==========

// [RFS24] Exportar Relatório de Motoristas em CSV
router.get('/relatorios/motoristas/export/csv', adminController.exportarRelatorioMotoristasCSV);

// [RFS24] Exportar Relatório de Motoristas em Excel
router.get('/relatorios/motoristas/export/excel', adminController.exportarRelatorioMotoristasExcel);

// [RFS24] Exportar Relatório de Motoristas em PDF
router.get('/relatorios/motoristas/export/pdf', adminController.exportarRelatorioMotoristasPDF);

module.exports = router;
