import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, Search, FileText, FileSpreadsheet, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatarEndereco } from "@/lib/utils";

interface RelatorioData {
  resumo: {
    totalCorridas: number;
    valorTotalMovimentado: number;
    tempoMedioDeslocamento: number | null;
    taxaCancelamento: string;
    ticketMedio: string;
  };
  corridas: Array<{
    id: number;
    passageiro: { nome: string };
    motorista: { nome: string } | null;
    origem: string;
    destino: string;
    status: string;
    formaPagamento: string;
    valorEstimado: number;
    pagamento: {
      valor: number;
      status: string;
    } | null;
    criadoEm: string;
  }>;
}

const RelatoriosCorridas = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    statusCorrida: '',
    statusPagamento: '',
    cidade: '',
  });

  const handleVisualizar = async () => {
    setIsLoading(true);
    try {
      const response = await api.getRelatoriosCorridas(token!, filtros);
      setRelatorio(response.data);
      toast({
        title: "Relatório gerado!",
        description: `${response.data.resumo.totalCorridas} corridas encontradas.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao gerar relatório",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportar = async (formato: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const blob = await api.exportarRelatoriosCorridas(token!, formato, filtros);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extensoes = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
      link.download = `relatorio-corridas-${Date.now()}.${extensoes[formato]}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Relatório exportado!",
        description: `Arquivo ${formato.toUpperCase()} baixado com sucesso.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao exportar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Relatórios de Corridas</h2>
        <p className="text-muted-foreground">
          Gere relatórios detalhados sobre as corridas realizadas na plataforma
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusCorrida">Status da Corrida</Label>
              <Select value={filtros.statusCorrida} onValueChange={(value) => setFiltros({ ...filtros, statusCorrida: value })}>
                <SelectTrigger id="statusCorrida">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusPagamento">Status Pagamento</Label>
              <Select value={filtros.statusPagamento} onValueChange={(value) => setFiltros({ ...filtros, statusPagamento: value })}>
                <SelectTrigger id="statusPagamento">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="FALHOU">Falhou</SelectItem>
                  <SelectItem value="ESTORNADO">Estornado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade/Região</Label>
              <Input
                id="cidade"
                placeholder="Ex: São Paulo"
                value={filtros.cidade}
                onChange={(e) => setFiltros({ ...filtros, cidade: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleVisualizar} disabled={isLoading} className="flex-1">
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? 'Gerando...' : 'Visualizar Relatório'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {relatorio && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total de Corridas</p>
                  <p className="text-2xl font-bold">{relatorio.resumo.totalCorridas}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Valor Movimentado</p>
                  <p className="text-2xl font-bold">R$ {relatorio.resumo.valorTotalMovimentado.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
                  <p className="text-2xl font-bold">R$ {relatorio.resumo.ticketMedio}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Taxa Cancelamento</p>
                  <p className="text-2xl font-bold">{relatorio.resumo.taxaCancelamento}%</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Tempo Médio</p>
                  <p className="text-2xl font-bold">
                    {relatorio.resumo.tempoMedioDeslocamento 
                      ? `${relatorio.resumo.tempoMedioDeslocamento}min` 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Exportação */}
          <Card>
            <CardHeader>
              <CardTitle>Exportar Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleExportar('csv')}
                  disabled={isExporting}
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button
                  onClick={() => handleExportar('excel')}
                  disabled={isExporting}
                  variant="outline"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button
                  onClick={() => handleExportar('pdf')}
                  disabled={isExporting}
                  variant="outline"
                >
                  <File className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Dados */}
          <Card>
            <CardHeader>
              <CardTitle>Corridas ({relatorio.corridas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Passageiro</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Trajeto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Forma Pagamento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorio.corridas.map((corrida) => (
                      <TableRow key={corrida.id}>
                        <TableCell>#{corrida.id}</TableCell>
                        <TableCell>{corrida.passageiro?.nome || 'N/A'}</TableCell>
                        <TableCell>{corrida.motorista?.nome || 'Aguardando'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          <span title={`${corrida.origem} → ${corrida.destino}`}>
                            {formatarEndereco(corrida.origem)} → {formatarEndereco(corrida.destino)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            corrida.status === 'FINALIZADA' ? 'bg-green-100 text-green-700' :
                            corrida.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {corrida.status}
                          </span>
                        </TableCell>
                        <TableCell>{corrida.formaPagamento}</TableCell>
                        <TableCell>
                          R$ {(corrida.pagamento?.valor || corrida.valorEstimado).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {new Date(corrida.criadoEm).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default RelatoriosCorridas;
