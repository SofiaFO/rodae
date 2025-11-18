const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const exportService = require('../services/export.service');
const adminService = require('../services/admin.service');
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

// Exportação de Relatórios - Corridas
router.get('/relatorios/corridas/export/csv', async (req, res) => {
  try {
    const relatorio = await adminService.gerarRelatorioCorridas(req.query);
    const csv = exportService.exportarRelatorioCorridasCSV(relatorio);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio-corridas.csv');
    res.send('\uFEFF' + csv); // BOM para UTF-8
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar CSV', message: error.message });
  }
});

router.get('/relatorios/corridas/export/excel', async (req, res) => {
  try {
    const relatorio = await adminService.gerarRelatorioCorridas(req.query);
    const excel = exportService.exportarRelatorioCorridasExcel(relatorio);
    
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio-corridas.xls');
    res.send(excel);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar Excel', message: error.message });
  }
});

router.get('/relatorios/corridas/export/pdf', async (req, res) => {
  try {
    const relatorio = await adminService.gerarRelatorioCorridas(req.query);
    
    const resumoHTML = `
      <div class="resumo">
        <h3>Resumo do Relatório</h3>
        <p><strong>Total de Corridas:</strong> ${relatorio.resumo.totalCorridas}</p>
        <p><strong>Valor Total Movimentado:</strong> R$ ${relatorio.resumo.valorTotalMovimentado.toFixed(2)}</p>
        <p><strong>Taxa de Cancelamento:</strong> ${relatorio.resumo.taxaCancelamento}%</p>
        <p><strong>Ticket Médio:</strong> R$ ${relatorio.resumo.ticketMedio}</p>
      </div>
    `;

    const tabelaHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Passageiro</th>
            <th>Motorista</th>
            <th>Origem</th>
            <th>Destino</th>
            <th>Status</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${relatorio.corridas.map(c => `
            <tr>
              <td>${c.id}</td>
              <td>${c.passageiro?.nome || 'N/A'}</td>
              <td>${c.motorista?.nome || 'N/A'}</td>
              <td>${c.origem}</td>
              <td>${c.destino}</td>
              <td>${c.status}</td>
              <td>R$ ${(c.pagamento?.valor || c.valorEstimado).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const html = exportService.gerarHTMLParaPDF('Relatório de Corridas', resumoHTML + tabelaHTML);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    // Nota: O frontend pode usar window.print() ou uma biblioteca como html2pdf para converter
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar PDF', message: error.message });
  }
});

// Exportação de Relatórios - Motoristas
router.get('/relatorios/motoristas/export/csv', async (req, res) => {
  try {
    const relatorio = await adminService.gerarRelatorioMotoristas(req.query);
    const csv = exportService.exportarRelatorioMotoristasCSV(relatorio);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio-motoristas.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar CSV', message: error.message });
  }
});

router.get('/relatorios/motoristas/export/excel', async (req, res) => {
  try {
    const relatorio = await adminService.gerarRelatorioMotoristas(req.query);
    const excel = exportService.exportarRelatorioMotoristasExcel(relatorio);
    
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio-motoristas.xls');
    res.send(excel);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar Excel', message: error.message });
  }
});

router.get('/relatorios/motoristas/export/pdf', async (req, res) => {
  try {
    const relatorio = await adminService.gerarRelatorioMotoristas(req.query);
    
    const resumoHTML = `
      <div class="resumo">
        <h3>Resumo do Relatório</h3>
        <p><strong>Total de Motoristas:</strong> ${relatorio.resumo.totalMotoristas}</p>
        <p><strong>Total de Corridas:</strong> ${relatorio.resumo.totalCorridas}</p>
        <p><strong>Ganho Total Geral:</strong> R$ ${relatorio.resumo.ganhoTotalGeral}</p>
        <p><strong>Média Geral de Avaliações:</strong> ${relatorio.resumo.mediaGeralAvaliacoes}</p>
      </div>
    `;

    const tabelaHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Status</th>
            <th>Placa</th>
            <th>Total Corridas</th>
            <th>Ganho Total</th>
            <th>Média Avaliação</th>
          </tr>
        </thead>
        <tbody>
          ${relatorio.motoristas.map(m => `
            <tr>
              <td>${m.id}</td>
              <td>${m.nome}</td>
              <td>${m.status}</td>
              <td>${m.placaVeiculo || 'N/A'}</td>
              <td>${m.metricas.totalCorridas}</td>
              <td>R$ ${m.metricas.ganhoTotal}</td>
              <td>${m.metricas.mediaAvaliacao}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const html = exportService.gerarHTMLParaPDF('Relatório de Motoristas', resumoHTML + tabelaHTML);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar PDF', message: error.message });
  }
});

module.exports = router;
