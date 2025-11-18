const { Parser } = require('json2csv');

class ExportService {
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

    return this.exportarCSV(relatorio.corridas, campos);
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

    return this.exportarExcel(relatorio.corridas, 'Relatório de Corridas', colunas);
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
}

module.exports = new ExportService();
