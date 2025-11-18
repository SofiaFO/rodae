import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileText, FileSpreadsheet, File, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface RelatorioMotoristasData {
  resumo: {
    totalMotoristas: number;
    totalCorridas: number;
    ganhoTotalGeral: string;
    mediaGeralAvaliacoes: string;
  };
  motoristas: Array<{
    id: number;
    nome: string;
    email: string;
    telefone: string;
    status: string;
    cnh: string;
    placaVeiculo: string;
    modeloCorVeiculo: string;
    metricas: {
      totalCorridas: number;
      corridasFinalizadas: number;
      ganhoTotal: string;
      mediaAvaliacao: string;
      totalAvaliacoes: number;
    };
  }>;
}

const RelatoriosMotoristas = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [relatorio, setRelatorio] = useState<RelatorioMotoristasData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    statusMotorista: '',
    cidade: '',
  });

  const handleVisualizar = async () => {
    setIsLoading(true);
    try {
      const response = await api.getRelatoriosMotoristas(token!, filtros);
      setRelatorio(response.data);
      toast({
        title: "Relatório gerado!",
        description: `${response.data.resumo.totalMotoristas} motoristas encontrados.`,
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
      const blob = await api.exportarRelatoriosMotoristas(token!, formato, filtros);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extensoes = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
      link.download = `relatorio-motoristas-${Date.now()}.${extensoes[formato]}`;
      
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
        <h2 className="text-2xl font-bold mb-2">Relatórios de Motoristas</h2>
        <p className="text-muted-foreground">
          Gere relatórios sobre desempenho, atividade e ganhos dos motoristas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label htmlFor="statusMotorista">Status do Motorista</Label>
              <Select value={filtros.statusMotorista} onValueChange={(value) => setFiltros({ ...filtros, statusMotorista: value })}>
                <SelectTrigger id="statusMotorista">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
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
              <CardTitle>Resumo Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total de Motoristas</p>
                  <p className="text-2xl font-bold">{relatorio.resumo.totalMotoristas}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total de Corridas</p>
                  <p className="text-2xl font-bold">{relatorio.resumo.totalCorridas}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Ganho Total</p>
                  <p className="text-2xl font-bold">R$ {relatorio.resumo.ganhoTotalGeral}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Média de Avaliações</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {relatorio.resumo.mediaGeralAvaliacoes}
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
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
              <CardTitle>Motoristas ({relatorio.motoristas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Corridas</TableHead>
                      <TableHead>Ganho Total</TableHead>
                      <TableHead>Avaliação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorio.motoristas.map((motorista) => (
                      <TableRow key={motorista.id}>
                        <TableCell className="font-medium">{motorista.nome}</TableCell>
                        <TableCell>{motorista.email}</TableCell>
                        <TableCell>{motorista.telefone}</TableCell>
                        <TableCell>{motorista.placaVeiculo}</TableCell>
                        <TableCell className="max-w-xs truncate">{motorista.modeloCorVeiculo}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            motorista.status === 'ATIVO' ? 'bg-green-100 text-green-700' :
                            motorista.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {motorista.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {motorista.metricas.corridasFinalizadas}/{motorista.metricas.totalCorridas}
                        </TableCell>
                        <TableCell>R$ {motorista.metricas.ganhoTotal}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {motorista.metricas.mediaAvaliacao}
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">
                              ({motorista.metricas.totalAvaliacoes})
                            </span>
                          </div>
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

export default RelatoriosMotoristas;
