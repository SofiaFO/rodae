import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Search, MapPin, Calendar, Clock, BarChart3, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { formatarEndereco } from "@/lib/utils";

const RelatoriosCorridasDetalhado = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dadosRelatorio, setDadosRelatorio] = useState<any>(null);

  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    statusCorrida: '',
  });

  useEffect(() => {
    handleBuscar();
  }, []);

  const handleBuscar = async () => {
    setIsLoading(true);
    try {
      const filtrosAtivos: any = {};
      if (filtros.dataInicio) filtrosAtivos.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) filtrosAtivos.dataFim = filtros.dataFim;
      if (filtros.statusCorrida) filtrosAtivos.statusCorrida = filtros.statusCorrida;

      const response = await api.getRelatoriosCorridas(token!, filtrosAtivos);
      setDadosRelatorio(response.data);
      
      toast({
        title: "Relatório gerado",
        description: "Dados carregados com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportar = async (formato: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const result = await api.exportarRelatorio(token!, 'corridas', formato, filtros);
      
      toast({
        title: `Exportando para ${formato.toUpperCase()}`,
        description: "O download começará em instantes...",
      });
      
      // Download do arquivo
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'FINALIZADA': 'bg-green-100 text-green-700',
      'EM_ANDAMENTO': 'bg-blue-100 text-blue-700',
      'CANCELADA': 'bg-red-100 text-red-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'FINALIZADA': 'Finalizada',
      'EM_ANDAMENTO': 'Em Andamento',
      'CANCELADA': 'Cancelada',
    };
    return labels[status] || status;
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'PADRAO': 'Padrão',
      'PREMIUM': 'Premium',
      'COMPARTILHADA': 'Compartilhada',
    };
    return labels[tipo] || tipo;
  };

  if (!dadosRelatorio) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  const { resumo, corridas } = dadosRelatorio;

  // Processar dados para gráficos
  const calcularEstatisticas = () => {
    if (!corridas || corridas.length === 0) return null;

    // Por Status
    const porStatus = corridas.reduce((acc: any, c: any) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    // Por Forma de Pagamento
    const porFormaPagamento = corridas.reduce((acc: any, c: any) => {
      acc[c.formaPagamento] = (acc[c.formaPagamento] || 0) + 1;
      return acc;
    }, {});

    // Por Tipo de Corrida
    const porTipo = corridas.reduce((acc: any, c: any) => {
      acc[c.opcaoCorrida] = (acc[c.opcaoCorrida] || 0) + 1;
      return acc;
    }, {});

    // Valor por Status
    const valorPorStatus = corridas.reduce((acc: any, c: any) => {
      const valor = c.valorFinal || c.valorEstimado || 0;
      acc[c.status] = (acc[c.status] || 0) + valor;
      return acc;
    }, {});

    return { porStatus, porFormaPagamento, porTipo, valorPorStatus };
  };

  const stats = calcularEstatisticas();

  const renderBarChart = (data: Record<string, number>, title: string, colors: Record<string, string>) => {
    const max = Math.max(...Object.values(data));
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">{title}</h4>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{getStatusLabel(key) || getTipoLabel(key) || key}</span>
              <span className="font-semibold">{value}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${colors[key] || 'bg-blue-500'}`}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPieChart = (data: Record<string, number>, title: string) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">{title}</h4>
        {Object.entries(data).map(([key, value]) => {
          const percentage = ((value / total) * 100).toFixed(1);
          return (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{key}</span>
              <span className="font-semibold">{value} ({percentage}%)</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              />
            </div>
            <div>
              <Label>Status da Corrida</Label>
              <Select value={filtros.statusCorrida || "ALL"} onValueChange={(value) => setFiltros({ ...filtros, statusCorrida: value === "ALL" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="FINALIZADA">Finalizadas</SelectItem>
                  <SelectItem value="CANCELADA">Canceladas</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleBuscar} disabled={isLoading} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => handleExportar('pdf')} disabled={isExporting} variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => handleExportar('excel')} disabled={isExporting} variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button onClick={() => handleExportar('csv')} disabled={isExporting} variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Corridas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo?.totalCorridas || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Taxa cancelamento: {resumo?.taxaCancelamento || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {typeof resumo?.valorTotalMovimentado === 'number' 
                ? resumo.valorTotalMovimentado.toFixed(2)
                : '0.00'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Plataforma (20%): R$ {typeof resumo?.valorTotalMovimentado === 'number'
                ? (resumo.valorTotalMovimentado * 0.2).toFixed(2)
                : '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {resumo?.ticketMedio || '0.00'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Por corrida
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumo?.tempoMedioDeslocamento || 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Duração das corridas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Tabela e Gráficos */}
      <Tabs defaultValue="tabela" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tabela">
            <Table className="w-4 h-4 mr-2" />
            Tabela de Dados
          </TabsTrigger>
          <TabsTrigger value="graficos">
            <BarChart3 className="w-4 h-4 mr-2" />
            Gráficos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tabela">
          {/* Tabela de Corridas */}
          <Card>
            <CardHeader>
              <CardTitle>Corridas Detalhadas ({corridas?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {corridas && corridas.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Passageiro</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Trajeto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {corridas.map((corrida: any) => (
                        <TableRow key={corrida.id}>
                          <TableCell className="font-medium">#{corrida.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar className="w-3 h-3" />
                              {new Date(corrida.criadoEm).toLocaleDateString('pt-BR')}
                              <Clock className="w-3 h-3 ml-1" />
                              {new Date(corrida.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell>{corrida.passageiro?.nome || 'N/A'}</TableCell>
                          <TableCell>{corrida.motorista?.nome || '-'}</TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1 max-w-xs">
                              <div className="flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1" title={corrida.origem}>
                                  {formatarEndereco(corrida.origem)}
                                </span>
                              </div>
                              <div className="flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1" title={corrida.destino}>
                                  {formatarEndereco(corrida.destino)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">{getTipoLabel(corrida.opcaoCorrida)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">{corrida.formaPagamento}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              R$ {(corrida.valorFinal || corrida.valorEstimado || 0).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(corrida.status)}`}>
                              {getStatusLabel(corrida.status)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma corrida encontrada com os filtros selecionados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graficos">
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Corridas por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderBarChart(stats.porStatus, "Quantidade por Status", {
                    'FINALIZADA': 'bg-green-500',
                    'EM_ANDAMENTO': 'bg-blue-500',
                    'CANCELADA': 'bg-red-500',
                  })}
                </CardContent>
              </Card>

              {/* Gráfico de Forma de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Formas de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderPieChart(stats.porFormaPagamento, "Distribuição por Pagamento")}
                </CardContent>
              </Card>

              {/* Gráfico de Tipo de Corrida */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Tipos de Corrida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderBarChart(stats.porTipo, "Quantidade por Tipo", {
                    'PADRAO': 'bg-blue-500',
                    'PREMIUM': 'bg-purple-500',
                    'COMPARTILHADA': 'bg-green-500',
                  })}
                </CardContent>
              </Card>

              {/* Gráfico de Receita por Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Receita por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Valor Total por Status</h4>
                    {Object.entries(stats.valorPorStatus).map(([key, value]: [string, any]) => {
                      const max = Math.max(...Object.values(stats.valorPorStatus) as number[]);
                      const colors: Record<string, string> = {
                        'FINALIZADA': 'bg-green-500',
                        'EM_ANDAMENTO': 'bg-blue-500',
                        'CANCELADA': 'bg-red-500',
                      };
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{getStatusLabel(key)}</span>
                            <span className="font-semibold">R$ {value.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${colors[key] || 'bg-blue-500'}`}
                              style={{ width: `${(value / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Nenhum dado disponível para gerar gráficos
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelatoriosCorridasDetalhado;

