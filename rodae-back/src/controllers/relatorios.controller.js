const relatoriosService = require('../services/relatorios.service');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * Controller para relatórios administrativos
 */
class RelatoriosController {
  /**
   * GET /api/admin/relatorios/corridas
   * Retorna relatório de corridas em JSON
   */
  async getRelatoriosCorridas(req, res) {
    try {
      const filtros = {
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        statusCorrida: req.query.statusCorrida,
        formaPagamento: req.query.formaPagamento,
        tipoCorrida: req.query.tipoCorrida
      };

      const relatorio = await relatoriosService.gerarRelatorioCorridas(filtros);

      res.json({
        message: 'Relatório gerado com sucesso',
        data: relatorio
      });
    } catch (error) {
      console.error('[RELATORIOS CONTROLLER] Erro ao gerar relatório de corridas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro ao gerar relatório. Tente novamente mais tarde.'
      });
    }
  }

  /**
   * GET /api/admin/relatorios/motoristas
   * Retorna relatório de motoristas em JSON
   */
  async getRelatoriosMotoristas(req, res) {
    try {
      const filtros = {
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        statusMotorista: req.query.statusMotorista,
        avaliacaoMinima: req.query.avaliacaoMinima ? parseFloat(req.query.avaliacaoMinima) : undefined
      };

      const relatorio = await relatoriosService.gerarRelatorioMotoristas(filtros);

      res.json({
        message: 'Relatório gerado com sucesso',
        data: relatorio
      });
    } catch (error) {
      console.error('[RELATORIOS CONTROLLER] Erro ao gerar relatório de motoristas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro ao gerar relatório. Tente novamente mais tarde.'
      });
    }
  }

  /**
   * GET /api/admin/relatorios/corridas/export/:formato
   * Exporta relatório de corridas em PDF, Excel ou CSV
   */
  async exportRelatoriosCorridas(req, res) {
    try {
      const { formato } = req.params;
      const filtros = {
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        statusCorrida: req.query.statusCorrida,
        formaPagamento: req.query.formaPagamento,
        tipoCorrida: req.query.tipoCorrida
      };

      const relatorio = await relatoriosService.gerarRelatorioCorridas(filtros);
      const dataAtual = new Date().toISOString().split('T')[0];

      if (formato === 'pdf') {
        await this._exportarCorridasPDF(res, relatorio, dataAtual);
      } else if (formato === 'excel') {
        await this._exportarCorridasExcel(res, relatorio, dataAtual);
      } else if (formato === 'csv') {
        await this._exportarCorridasCSV(res, relatorio, dataAtual);
      } else {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Formato inválido. Use: pdf, excel ou csv'
        });
      }
    } catch (error) {
      console.error('[RELATORIOS CONTROLLER] Erro ao exportar relatório de corridas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro ao exportar relatório. Tente novamente mais tarde.'
      });
    }
  }

  /**
   * GET /api/admin/relatorios/motoristas/export/:formato
   * Exporta relatório de motoristas em PDF, Excel ou CSV
   */
  async exportRelatoriosMotoristas(req, res) {
    try {
      const { formato } = req.params;
      const filtros = {
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        statusMotorista: req.query.statusMotorista,
        avaliacaoMinima: req.query.avaliacaoMinima ? parseFloat(req.query.avaliacaoMinima) : undefined
      };

      const relatorio = await relatoriosService.gerarRelatorioMotoristas(filtros);
      const dataAtual = new Date().toISOString().split('T')[0];

      if (formato === 'pdf') {
        await this._exportarMotoristasPDF(res, relatorio, dataAtual);
      } else if (formato === 'excel') {
        await this._exportarMotoristasExcel(res, relatorio, dataAtual);
      } else if (formato === 'csv') {
        await this._exportarMotoristasCSV(res, relatorio, dataAtual);
      } else {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Formato inválido. Use: pdf, excel ou csv'
        });
      }
    } catch (error) {
      console.error('[RELATORIOS CONTROLLER] Erro ao exportar relatório de motoristas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro ao exportar relatório. Tente novamente mais tarde.'
      });
    }
  }

  // ========== MÉTODOS AUXILIARES DE EXPORTAÇÃO ==========

  async _exportarCorridasPDF(res, relatorio, dataAtual) {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `relatorio-corridas-${dataAtual}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Título
    doc.fontSize(20).text('Relatório de Corridas - Rodaê', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    // Resumo
    doc.fontSize(14).text('Resumo Geral', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total de Corridas: ${relatorio.resumo.totalCorridas}`);
    doc.text(`Corridas Finalizadas: ${relatorio.resumo.totalFinalizadas}`);
    doc.text(`Corridas Canceladas: ${relatorio.resumo.totalCanceladas}`);
    doc.text(`Valor Total Movimentado: R$ ${relatorio.resumo.valorTotalMovimentado.toFixed(2)}`);
    doc.text(`Receita Plataforma (20%): R$ ${relatorio.resumo.valorReceitaPlataforma.toFixed(2)}`);
    doc.text(`Pago aos Motoristas (80%): R$ ${relatorio.resumo.valorPagoMotoristas.toFixed(2)}`);
    doc.text(`Ticket Médio: R$ ${relatorio.resumo.ticketMedio.toFixed(2)}`);
    doc.text(`Taxa de Cancelamento: ${relatorio.resumo.taxaCancelamento.toFixed(2)}%`);
    doc.moveDown(2);

    // Top Rotas
    doc.fontSize(14).text('Top 5 Rotas Mais Populares', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    relatorio.topRotas.forEach((rota, index) => {
      doc.text(`${index + 1}. ${rota.origem} → ${rota.destino}: ${rota.corridas} corridas (R$ ${rota.valor.toFixed(2)})`);
    });

    doc.end();
  }

  async _exportarCorridasExcel(res, relatorio, dataAtual) {
    const workbook = new ExcelJS.Workbook();
    const filename = `relatorio-corridas-${dataAtual}.xlsx`;

    // Aba 1: Resumo
    const sheetResumo = workbook.addWorksheet('Resumo');
    sheetResumo.columns = [
      { header: 'Métrica', key: 'metrica', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 }
    ];
    sheetResumo.addRows([
      { metrica: 'Total de Corridas', valor: relatorio.resumo.totalCorridas },
      { metrica: 'Corridas Finalizadas', valor: relatorio.resumo.totalFinalizadas },
      { metrica: 'Corridas Canceladas', valor: relatorio.resumo.totalCanceladas },
      { metrica: 'Valor Total Movimentado', valor: `R$ ${relatorio.resumo.valorTotalMovimentado.toFixed(2)}` },
      { metrica: 'Receita Plataforma (20%)', valor: `R$ ${relatorio.resumo.valorReceitaPlataforma.toFixed(2)}` },
      { metrica: 'Pago aos Motoristas (80%)', valor: `R$ ${relatorio.resumo.valorPagoMotoristas.toFixed(2)}` },
      { metrica: 'Ticket Médio', valor: `R$ ${relatorio.resumo.ticketMedio.toFixed(2)}` },
      { metrica: 'Distância Média', valor: `${relatorio.resumo.distanciaMedia.toFixed(1)} km` },
      { metrica: 'Duração Média', valor: `${relatorio.resumo.duracaoMedia} min` },
      { metrica: 'Taxa de Cancelamento', valor: `${relatorio.resumo.taxaCancelamento.toFixed(2)}%` },
      { metrica: 'Crescimento Mensal', valor: `${relatorio.resumo.crescimentoMensal.toFixed(1)}%` }
    ]);

    // Aba 2: Corridas Recentes
    const sheetCorridas = workbook.addWorksheet('Corridas Recentes');
    sheetCorridas.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Data', key: 'data', width: 20 },
      { header: 'Passageiro', key: 'passageiro', width: 20 },
      { header: 'Motorista', key: 'motorista', width: 20 },
      { header: 'Origem', key: 'origem', width: 30 },
      { header: 'Destino', key: 'destino', width: 30 },
      { header: 'Distância (km)', key: 'distancia', width: 15 },
      { header: 'Valor', key: 'valor', width: 12 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    sheetCorridas.addRows(relatorio.corridasRecentes);

    // Aba 3: Top Rotas
    const sheetRotas = workbook.addWorksheet('Top Rotas');
    sheetRotas.columns = [
      { header: 'Origem', key: 'origem', width: 30 },
      { header: 'Destino', key: 'destino', width: 30 },
      { header: 'Corridas', key: 'corridas', width: 15 },
      { header: 'Valor Total', key: 'valor', width: 15 }
    ];
    sheetRotas.addRows(relatorio.topRotas);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  async _exportarCorridasCSV(res, relatorio, dataAtual) {
    const filename = `relatorio-corridas-${dataAtual}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // BOM para UTF-8
    res.write('\uFEFF');

    // Cabeçalho
    res.write('ID,Data,Passageiro,Motorista,Origem,Destino,Distância,Valor,Status\n');

    // Dados
    relatorio.corridasRecentes.forEach(c => {
      const linha = [
        c.id,
        c.data,
        c.passageiro,
        c.motorista || 'N/A',
        `"${c.origem}"`,
        `"${c.destino}"`,
        c.distancia,
        c.valor,
        c.status
      ].join(',');
      res.write(linha + '\n');
    });

    res.end();
  }

  async _exportarMotoristasPDF(res, relatorio, dataAtual) {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `relatorio-motoristas-${dataAtual}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Título
    doc.fontSize(20).text('Relatório de Motoristas - Rodaê', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    // Resumo
    doc.fontSize(14).text('Resumo Geral', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total de Motoristas: ${relatorio.resumo.totalMotoristas}`);
    doc.text(`Motoristas Ativos: ${relatorio.resumo.motoristasAtivos}`);
    doc.text(`Motoristas Pendentes: ${relatorio.resumo.motoristasPendentes}`);
    doc.text(`Motoristas Inativos: ${relatorio.resumo.motoristasInativos}`);
    doc.text(`Total de Corridas Realizadas: ${relatorio.resumo.totalCorridasRealizadas}`);
    doc.text(`Ganho Total dos Motoristas: R$ ${relatorio.resumo.ganhoTotalMotoristas.toFixed(2)}`);
    doc.text(`Média de Avaliação Geral: ${relatorio.resumo.mediaAvaliacaoGeral.toFixed(1)} ⭐`);
    doc.moveDown(2);

    // Top Motoristas
    doc.fontSize(14).text('Top 10 Motoristas', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);
    relatorio.topMotoristas.slice(0, 10).forEach((m, index) => {
      doc.text(`${index + 1}. ${m.nome} - ${m.metricas.totalCorridas} corridas - R$ ${m.metricas.ganhoTotal.toFixed(2)} - Nota: ${m.metricas.mediaAvaliacao}`);
    });

    doc.end();
  }

  async _exportarMotoristasExcel(res, relatorio, dataAtual) {
    const workbook = new ExcelJS.Workbook();
    const filename = `relatorio-motoristas-${dataAtual}.xlsx`;

    // Aba 1: Resumo
    const sheetResumo = workbook.addWorksheet('Resumo');
    sheetResumo.columns = [
      { header: 'Métrica', key: 'metrica', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 }
    ];
    sheetResumo.addRows([
      { metrica: 'Total de Motoristas', valor: relatorio.resumo.totalMotoristas },
      { metrica: 'Motoristas Ativos', valor: relatorio.resumo.motoristasAtivos },
      { metrica: 'Motoristas Pendentes', valor: relatorio.resumo.motoristasPendentes },
      { metrica: 'Motoristas Inativos', valor: relatorio.resumo.motoristasInativos },
      { metrica: 'Total de Corridas', valor: relatorio.resumo.totalCorridasRealizadas },
      { metrica: 'Ganho Total', valor: `R$ ${relatorio.resumo.ganhoTotalMotoristas.toFixed(2)}` },
      { metrica: 'Média de Avaliação', valor: relatorio.resumo.mediaAvaliacaoGeral.toFixed(1) }
    ]);

    // Aba 2: Top Motoristas
    const sheetMotoristas = workbook.addWorksheet('Top Motoristas');
    sheetMotoristas.columns = [
      { header: 'Nome', key: 'nome', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefone', key: 'telefone', width: 18 },
      { header: 'CNH', key: 'cnh', width: 15 },
      { header: 'Placa', key: 'placa', width: 12 },
      { header: 'Corridas', key: 'corridas', width: 12 },
      { header: 'Ganho Total', key: 'ganho', width: 15 },
      { header: 'Avaliação', key: 'avaliacao', width: 12 },
      { header: 'Status', key: 'status', width: 12 }
    ];
    sheetMotoristas.addRows(relatorio.topMotoristas.map(m => ({
      nome: m.nome,
      email: m.email,
      telefone: m.telefone,
      cnh: m.cnh,
      placa: m.placa,
      corridas: m.metricas.totalCorridas,
      ganho: `R$ ${m.metricas.ganhoTotal.toFixed(2)}`,
      avaliacao: m.metricas.mediaAvaliacao,
      status: m.status
    })));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  async _exportarMotoristasCSV(res, relatorio, dataAtual) {
    const filename = `relatorio-motoristas-${dataAtual}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.write('\uFEFF');

    // Cabeçalho
    res.write('Nome,Email,Telefone,CNH,Placa,Corridas,Ganho Total,Avaliação,Status\n');

    // Dados
    relatorio.topMotoristas.forEach(m => {
      const linha = [
        `"${m.nome}"`,
        m.email,
        m.telefone,
        m.cnh,
        m.placa,
        m.metricas.totalCorridas,
        m.metricas.ganhoTotal.toFixed(2),
        m.metricas.mediaAvaliacao,
        m.status
      ].join(',');
      res.write(linha + '\n');
    });

    res.end();
  }
}

module.exports = new RelatoriosController();
