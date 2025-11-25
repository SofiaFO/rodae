const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class ExportService {
  // Função para formatar endereços longos
  formatarEndereco(endereco) {
    if (!endereco) return '';
    
    // Split por vírgula e remove espaços
    const partes = endereco.split(',').map(p => p.trim());
    
    // Se tem menos de 3 partes, retorna como está
    if (partes.length <= 2) return endereco;
    
    // Palavras-chave para filtrar
    const palavrasRemover = [
      'região', 'metropolitana', 'imediata', 'intermediária',
      'geográfica', 'sudeste', 'sul', 'norte', 'nordeste', 'centro-oeste',
      'brasil', 'brazil'
    ];
    
    // Filtra partes relevantes
    const partesRelevantes = partes.filter(parte => {
      const parteLower = parte.toLowerCase();
      return !palavrasRemover.some(palavra => parteLower.includes(palavra));
    });
    
    // Pega no máximo as 3 primeiras partes relevantes
    const resultado = partesRelevantes.slice(0, 3).join(', ');
    
    // Se ficou muito longo ainda, pega apenas as 2 primeiras
    if (resultado.length > 60) {
      return partesRelevantes.slice(0, 2).join(', ');
    }
    
    return resultado || endereco;
  }

  // Exportar para CSV
  exportarCSV(dados, campos) {
    try {
      const parser = new Parser({ fields: campos });
      const csv = parser.parse(dados);
      return csv;
    } catch (error) {
      throw new Error(`Erro ao gerar CSV: ${error.message}`);
    }
  }

  // Exportar Relatório de Corridas para CSV
  exportarRelatorioCorridasCSV(relatorio) {
    // Formatar os dados antes de exportar
    const corridasFormatadas = relatorio.corridas.map(corrida => ({
      ...corrida,
      origem: this.formatarEndereco(corrida.origem),
      destino: this.formatarEndereco(corrida.destino)
    }));

    const campos = [
      { label: 'ID', value: 'id' },
      { label: 'Passageiro', value: 'passageiro.nome' },
      { label: 'Motorista', value: 'motorista.nome' },
      { label: 'Origem', value: 'origem' },
      { label: 'Destino', value: 'destino' },
      { label: 'Status', value: 'status' },
      { label: 'Forma Pagamento', value: 'formaPagamento' },
      { label: 'Valor Estimado', value: 'valorEstimado' },
      { label: 'Valor Pago', value: 'pagamento.valor' },
      { label: 'Status Pagamento', value: 'pagamento.status' },
      { label: 'Data', value: 'criadoEm' }
    ];

    return this.exportarCSV(corridasFormatadas, campos);
  }

  // Exportar Relatório de Motoristas para CSV
  exportarRelatorioMotoristasCSV(relatorio) {
    const campos = [
      { label: 'ID', value: 'id' },
      { label: 'Nome', value: 'nome' },
      { label: 'Email', value: 'email' },
      { label: 'Telefone', value: 'telefone' },
      { label: 'Status', value: 'status' },
      { label: 'CNH', value: 'cnh' },
      { label: 'Placa Veículo', value: 'placaVeiculo' },
      { label: 'Modelo/Cor Veículo', value: 'modeloCorVeiculo' },
      { label: 'Total Corridas', value: 'metricas.totalCorridas' },
      { label: 'Corridas Finalizadas', value: 'metricas.corridasFinalizadas' },
      { label: 'Ganho Total', value: 'metricas.ganhoTotal' },
      { label: 'Média Avaliação', value: 'metricas.mediaAvaliacao' },
      { label: 'Total Avaliações', value: 'metricas.totalAvaliacoes' }
    ];

    return this.exportarCSV(relatorio.motoristas, campos);
  }

  // Gerar HTML simples para Excel (formato compatível)
  exportarExcel(dados, titulo, colunas) {
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${titulo}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <h2>${titulo}</h2>
        <table border="1">
          <thead>
            <tr>
    `;

    // Cabeçalhos
    colunas.forEach(col => {
      html += `<th>${col.label}</th>`;
    });

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    // Dados
    dados.forEach(item => {
      html += '<tr>';
      colunas.forEach(col => {
        const valor = this.getNestedValue(item, col.value);
        html += `<td>${valor || ''}</td>`;
      });
      html += '</tr>';
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    return html;
  }

  // Exportar Relatório de Corridas para Excel
  exportarRelatorioCorridasExcel(relatorio) {
    // Formatar os dados antes de exportar
    const corridasFormatadas = relatorio.corridas.map(corrida => ({
      ...corrida,
      origem: this.formatarEndereco(corrida.origem),
      destino: this.formatarEndereco(corrida.destino)
    }));

    const colunas = [
      { label: 'ID', value: 'id' },
      { label: 'Passageiro', value: 'passageiro.nome' },
      { label: 'Motorista', value: 'motorista.nome' },
      { label: 'Origem', value: 'origem' },
      { label: 'Destino', value: 'destino' },
      { label: 'Status', value: 'status' },
      { label: 'Forma Pagamento', value: 'formaPagamento' },
      { label: 'Valor Estimado', value: 'valorEstimado' },
      { label: 'Valor Pago', value: 'pagamento.valor' },
      { label: 'Status Pagamento', value: 'pagamento.status' },
      { label: 'Data', value: 'criadoEm' }
    ];

    return this.exportarExcel(corridasFormatadas, 'Relatório de Corridas', colunas);
  }

  // Exportar Relatório de Motoristas para Excel
  exportarRelatorioMotoristasExcel(relatorio) {
    const colunas = [
      { label: 'ID', value: 'id' },
      { label: 'Nome', value: 'nome' },
      { label: 'Email', value: 'email' },
      { label: 'Telefone', value: 'telefone' },
      { label: 'Status', value: 'status' },
      { label: 'CNH', value: 'cnh' },
      { label: 'Placa Veículo', value: 'placaVeiculo' },
      { label: 'Modelo/Cor Veículo', value: 'modeloCorVeiculo' },
      { label: 'Total Corridas', value: 'metricas.totalCorridas' },
      { label: 'Corridas Finalizadas', value: 'metricas.corridasFinalizadas' },
      { label: 'Ganho Total', value: 'metricas.ganhoTotal' },
      { label: 'Média Avaliação', value: 'metricas.mediaAvaliacao' },
      { label: 'Total Avaliações', value: 'metricas.totalAvaliacoes' }
    ];

    return this.exportarExcel(relatorio.motoristas, 'Relatório de Motoristas', colunas);
  }

  // Gerar PDF simples (HTML que pode ser convertido)
  gerarHTMLParaPDF(titulo, conteudo) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .resumo { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .resumo h3 { margin-top: 0; }
        </style>
      </head>
      <body>
        <h1>${titulo}</h1>
        ${conteudo}
      </body>
      </html>
    `;
  }

  // Função auxiliar para acessar valores aninhados
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // ==================== EXPORTAÇÃO PDF COM PDFKIT ====================
  
  async gerarPDFCorridas(relatorio) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Título
        doc.fontSize(20).font('Helvetica-Bold').text('Relatório de Corridas', { align: 'center' });
        doc.moveDown();

        // Data de geração
        doc.fontSize(10).font('Helvetica').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
        doc.moveDown();

        // Resumo
        doc.fontSize(14).font('Helvetica-Bold').text('Resumo', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total de Corridas: ${relatorio.resumo.totalCorridas}`);
        doc.text(`Valor Total Movimentado: R$ ${relatorio.resumo.valorTotalMovimentado.toFixed(2)}`);
        doc.text(`Taxa de Cancelamento: ${relatorio.resumo.taxaCancelamento}%`);
        doc.text(`Ticket Médio: R$ ${relatorio.resumo.ticketMedio}`);
        doc.moveDown();

        // Filtros aplicados
        if (relatorio.filtrosAplicados && Object.keys(relatorio.filtrosAplicados).length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Filtros Aplicados:', { underline: true });
          doc.moveDown(0.3);
          doc.fontSize(10).font('Helvetica');
          Object.entries(relatorio.filtrosAplicados).forEach(([key, value]) => {
            if (value) doc.text(`${key}: ${value}`);
          });
          doc.moveDown();
        }

        // Tabela de corridas
        doc.fontSize(14).font('Helvetica-Bold').text('Detalhamento das Corridas', { underline: true });
        doc.moveDown(0.5);

        let y = doc.y;
        const pageHeight = doc.page.height - doc.page.margins.bottom;

        relatorio.corridas.slice(0, 50).forEach((corrida, index) => {
          // Verificar se precisa de nova página
          if (y > pageHeight - 100) {
            doc.addPage();
            y = doc.page.margins.top;
          }

          doc.fontSize(10).font('Helvetica-Bold');
          doc.text(`Corrida #${corrida.id}`, 50, y);
          
          doc.fontSize(9).font('Helvetica');
          y += 15;
          doc.text(`Passageiro: ${corrida.passageiro?.nome || 'N/A'}`, 50, y);
          doc.text(`Status: ${corrida.status}`, 350, y);
          
          y += 12;
          doc.text(`Motorista: ${corrida.motorista?.nome || 'Aguardando'}`, 50, y);
          doc.text(`Valor: R$ ${(corrida.pagamento?.valor || corrida.valorEstimado).toFixed(2)}`, 350, y);
          
          y += 12;
          doc.text(`Origem: ${this.formatarEndereco(corrida.origem)}`, 50, y);
          y += 12;
          doc.text(`Destino: ${this.formatarEndereco(corrida.destino)}`, 50, y);
          
          y += 12;
          doc.fontSize(8).fillColor('#999');
          doc.text(`Data: ${new Date(corrida.criadoEm).toLocaleString('pt-BR')}`, 50, y);
          
          doc.strokeColor('#ddd').moveTo(50, y + 10).lineTo(550, y + 10).stroke();
          doc.fillColor('#000');
          y += 20;
        });

        if (relatorio.corridas.length > 50) {
          doc.moveDown();
          doc.fontSize(9).fillColor('#666').text(`... e mais ${relatorio.corridas.length - 50} corridas. Exporte em CSV para ver todos os dados.`);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async gerarPDFMotoristas(relatorio) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Título
        doc.fontSize(20).font('Helvetica-Bold').text('Relatório de Motoristas', { align: 'center' });
        doc.moveDown();

        // Data de geração
        doc.fontSize(10).font('Helvetica').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
        doc.moveDown();

        // Resumo
        doc.fontSize(14).font('Helvetica-Bold').text('Resumo Geral', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total de Motoristas: ${relatorio.resumo.totalMotoristas}`);
        doc.text(`Total de Corridas: ${relatorio.resumo.totalCorridas}`);
        doc.text(`Ganho Total Geral: R$ ${relatorio.resumo.ganhoTotalGeral}`);
        doc.text(`Média Geral de Avaliações: ${relatorio.resumo.mediaGeralAvaliacoes} ⭐`);
        doc.moveDown();

        // Filtros aplicados
        if (relatorio.filtrosAplicados && Object.keys(relatorio.filtrosAplicados).length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Filtros Aplicados:', { underline: true });
          doc.moveDown(0.3);
          doc.fontSize(10).font('Helvetica');
          Object.entries(relatorio.filtrosAplicados).forEach(([key, value]) => {
            if (value) doc.text(`${key}: ${value}`);
          });
          doc.moveDown();
        }

        // Detalhes dos motoristas
        doc.fontSize(14).font('Helvetica-Bold').text('Detalhamento por Motorista', { underline: true });
        doc.moveDown(0.5);

        let y = doc.y;
        const pageHeight = doc.page.height - doc.page.margins.bottom;

        relatorio.motoristas.slice(0, 30).forEach((motorista, index) => {
          if (y > pageHeight - 120) {
            doc.addPage();
            y = doc.page.margins.top;
          }

          doc.fontSize(11).font('Helvetica-Bold');
          doc.text(`${motorista.nome}`, 50, y);
          doc.fontSize(9).font('Helvetica').fillColor('#666');
          doc.text(`Status: ${motorista.status}`, 350, y);
          doc.fillColor('#000');

          y += 15;
          doc.fontSize(9);
          doc.text(`CNH: ${motorista.cnh || 'N/A'}`, 50, y);
          doc.text(`Placa: ${motorista.placaVeiculo || 'N/A'}`, 200, y);
          doc.text(`Tel: ${motorista.telefone}`, 350, y);

          y += 12;
          doc.text(`Veículo: ${motorista.modeloCorVeiculo || 'N/A'}`, 50, y);

          y += 15;
          doc.fontSize(10).font('Helvetica-Bold').text('Métricas:', 50, y);
          y += 12;
          doc.fontSize(9).font('Helvetica');
          doc.text(`• Corridas: ${motorista.metricas.totalCorridas} (${motorista.metricas.corridasFinalizadas} finalizadas)`, 50, y);
          y += 12;
          doc.text(`• Ganho Total: R$ ${motorista.metricas.ganhoTotal}`, 50, y);
          y += 12;
          doc.text(`• Avaliação Média: ${motorista.metricas.mediaAvaliacao} ⭐ (${motorista.metricas.totalAvaliacoes} avaliações)`, 50, y);

          doc.strokeColor('#ddd').moveTo(50, y + 10).lineTo(550, y + 10).stroke();
          y += 20;
        });

        if (relatorio.motoristas.length > 30) {
          doc.moveDown();
          doc.fontSize(9).fillColor('#666').text(`... e mais ${relatorio.motoristas.length - 30} motoristas. Exporte em CSV para ver todos os dados.`);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==================== EXPORTAÇÃO EXCEL COM EXCELJS ====================

  async gerarExcelCorridas(relatorio) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Corridas');

    // Configurar colunas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Passageiro', key: 'passageiro', width: 25 },
      { header: 'Motorista', key: 'motorista', width: 25 },
      { header: 'Origem', key: 'origem', width: 30 },
      { header: 'Destino', key: 'destino', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Forma Pagamento', key: 'formaPagamento', width: 18 },
      { header: 'Valor Estimado', key: 'valorEstimado', width: 15 },
      { header: 'Valor Pago', key: 'valorPago', width: 15 },
      { header: 'Status Pagamento', key: 'statusPagamento', width: 18 },
      { header: 'Data/Hora', key: 'dataHora', width: 20 }
    ];

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Adicionar dados
    relatorio.corridas.forEach(corrida => {
      worksheet.addRow({
        id: corrida.id,
        passageiro: corrida.passageiro?.nome || 'N/A',
        motorista: corrida.motorista?.nome || 'Aguardando',
        origem: this.formatarEndereco(corrida.origem),
        destino: this.formatarEndereco(corrida.destino),
        status: corrida.status,
        formaPagamento: corrida.formaPagamento,
        valorEstimado: corrida.valorEstimado,
        valorPago: corrida.pagamento?.valor || 0,
        statusPagamento: corrida.pagamento?.status || 'PENDENTE',
        dataHora: new Date(corrida.criadoEm).toLocaleString('pt-BR')
      });
    });

    // Adicionar resumo em uma nova aba
    const resumoSheet = workbook.addWorksheet('Resumo');
    resumoSheet.columns = [
      { header: 'Indicador', key: 'indicador', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 }
    ];

    resumoSheet.getRow(1).font = { bold: true };
    resumoSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2196F3' }
    };
    resumoSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    resumoSheet.addRow({ indicador: 'Total de Corridas', valor: relatorio.resumo.totalCorridas });
    resumoSheet.addRow({ indicador: 'Valor Total Movimentado', valor: `R$ ${relatorio.resumo.valorTotalMovimentado.toFixed(2)}` });
    resumoSheet.addRow({ indicador: 'Taxa de Cancelamento', valor: `${relatorio.resumo.taxaCancelamento}%` });
    resumoSheet.addRow({ indicador: 'Ticket Médio', valor: `R$ ${relatorio.resumo.ticketMedio}` });

    return await workbook.xlsx.writeBuffer();
  }

  async gerarExcelMotoristas(relatorio) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Motoristas');

    // Configurar colunas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nome', key: 'nome', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefone', key: 'telefone', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'CNH', key: 'cnh', width: 15 },
      { header: 'Placa', key: 'placa', width: 12 },
      { header: 'Veículo', key: 'veiculo', width: 25 },
      { header: 'Total Corridas', key: 'totalCorridas', width: 15 },
      { header: 'Corridas Finalizadas', key: 'corridasFinalizadas', width: 20 },
      { header: 'Ganho Total (R$)', key: 'ganhoTotal', width: 18 },
      { header: 'Média Avaliação', key: 'mediaAvaliacao', width: 18 },
      { header: 'Total Avaliações', key: 'totalAvaliacoes', width: 18 }
    ];

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Adicionar dados
    relatorio.motoristas.forEach(motorista => {
      worksheet.addRow({
        id: motorista.id,
        nome: motorista.nome,
        email: motorista.email,
        telefone: motorista.telefone,
        status: motorista.status,
        cnh: motorista.cnh || 'N/A',
        placa: motorista.placaVeiculo || 'N/A',
        veiculo: motorista.modeloCorVeiculo || 'N/A',
        totalCorridas: motorista.metricas.totalCorridas,
        corridasFinalizadas: motorista.metricas.corridasFinalizadas,
        ganhoTotal: parseFloat(motorista.metricas.ganhoTotal),
        mediaAvaliacao: parseFloat(motorista.metricas.mediaAvaliacao),
        totalAvaliacoes: motorista.metricas.totalAvaliacoes
      });
    });

    // Adicionar resumo em uma nova aba
    const resumoSheet = workbook.addWorksheet('Resumo');
    resumoSheet.columns = [
      { header: 'Indicador', key: 'indicador', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 }
    ];

    resumoSheet.getRow(1).font = { bold: true };
    resumoSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2196F3' }
    };
    resumoSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    resumoSheet.addRow({ indicador: 'Total de Motoristas', valor: relatorio.resumo.totalMotoristas });
    resumoSheet.addRow({ indicador: 'Total de Corridas', valor: relatorio.resumo.totalCorridas });
    resumoSheet.addRow({ indicador: 'Ganho Total Geral', valor: `R$ ${relatorio.resumo.ganhoTotalGeral}` });
    resumoSheet.addRow({ indicador: 'Média Geral de Avaliações', valor: `${relatorio.resumo.mediaGeralAvaliacoes} ⭐` });

    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = new ExportService();
