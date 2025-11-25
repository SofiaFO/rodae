import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, User, Star, DollarSign, BarChart3, PieChart, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

const RelatoriosMotoristasDetalhado = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dadosRelatorio, setDadosRelatorio] = useState<any>(null);

  useEffect(() => {
    handleBuscar();
  }, []);

  const handleBuscar = async () => {
    setIsLoading(true);
    try {
      const response = await api.getRelatoriosMotoristas(token!, {});
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
      const result = await api.exportarRelatorio(token!, 'motoristas', formato, {});
      
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
      'ATIVO': 'bg-green-100 text-green-700',
      'PENDENTE': 'bg-yellow-100 text-yellow-700',
      'INATIVO': 'bg-gray-100 text-gray-700',
      'BLOQUEADO': 'bg-red-100 text-red-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ATIVO': 'Ativo',
      'PENDENTE': 'Pendente',
      'INATIVO': 'Inativo',
      'BLOQUEADO': 'Bloqueado',
    };
    return labels[status] || status;
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

  const { resumo, motoristas } = dadosRelatorio;

  // Processar dados para gráficos
  const calcularEstatisticas = () => {
    if (!motoristas || motoristas.length === 0) return null;

    // Por Status
    const porStatus = motoristas.reduce((acc: any, m: any) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});

    // Distribuição de Corridas
    const distribuicaoCorridas: Record<string, number> = {
      'Sem Corridas': 0,
      '1-10 Corridas': 0,
      '11-50 Corridas': 0,
      '51+ Corridas': 0,
    };

    motoristas.forEach((m: any) => {
      const total = m.metricas?.totalCorridas || 0;
      if (total === 0) distribuicaoCorridas['Sem Corridas']++;
      else if (total <= 10) distribuicaoCorridas['1-10 Corridas']++;
      else if (total <= 50) distribuicaoCorridas['11-50 Corridas']++;
      else distribuicaoCorridas['51+ Corridas']++;
    });

    // Distribuição de Ganhos
    const distribuicaoGanhos: Record<string, number> = {
      'R$ 0': 0,
      'R$ 1-100': 0,
      'R$ 101-500': 0,
      'R$ 501+': 0,
    };

    motoristas.forEach((m: any) => {
      const ganho = parseFloat(m.metricas?.ganhoTotal || '0');
      if (ganho === 0) distribuicaoGanhos['R$ 0']++;
      else if (ganho <= 100) distribuicaoGanhos['R$ 1-100']++;
      else if (ganho <= 500) distribuicaoGanhos['R$ 101-500']++;
      else distribuicaoGanhos['R$ 501+']++;
    });

    // Top Motoristas por Ganho
    const topPorGanho = [...motoristas]
      .sort((a: any, b: any) => {
        const ganhoA = parseFloat(a.metricas?.ganhoTotal || '0');
        const ganhoB = parseFloat(b.metricas?.ganhoTotal || '0');
        return ganhoB - ganhoA;
      })
      .slice(0, 5);

    return { porStatus, distribuicaoCorridas, distribuicaoGanhos, topPorGanho };
  };

  const stats = calcularEstatisticas();

  const renderBarChart = (data: Record<string, number>, title: string, colors: Record<string, string>) => {
    const max = Math.max(...Object.values(data));
    if (max === 0) {
      return (
        <div className="text-center text-sm text-muted-foreground py-4">
          Sem dados disponíveis
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">{title}</h4>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{key}</span>
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
    if (total === 0) {
      return (
        <div className="text-center text-sm text-muted-foreground py-4">
          Sem dados disponíveis
        </div>
      );
    }

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
      {/* Export Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Motoristas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo?.totalMotoristas || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Cadastrados no sistema
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Corridas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo?.totalCorridas || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Realizadas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ganho Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {typeof resumo?.ganhoTotalGeral === 'string'
                ? parseFloat(resumo.ganhoTotalGeral).toFixed(2)
                : (resumo?.ganhoTotalGeral || 0).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Todos os motoristas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              {typeof resumo?.mediaGeralAvaliacoes === 'string'
                ? parseFloat(resumo.mediaGeralAvaliacoes).toFixed(1)
                : (resumo?.mediaGeralAvaliacoes || 0).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avaliação geral
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
          {/* Tabela de Motoristas */}
          <Card>
            <CardHeader>
              <CardTitle>Motoristas Detalhados ({motoristas?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {motoristas && motoristas.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>CNH</TableHead>
                        <TableHead>Corridas</TableHead>
                        <TableHead>Ganho Total</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {motoristas.map((motorista: any) => (
                        <TableRow key={motorista.id}>
                          <TableCell className="font-medium">#{motorista.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{motorista.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div>{motorista.email}</div>
                              <div className="text-muted-foreground">{motorista.telefone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                {motorista.modeloCorVeiculo}
                              </div>
                              <div className="text-muted-foreground font-mono">{motorista.placaVeiculo}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono">{motorista.cnh}</span>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div className="font-semibold">{motorista.metricas?.totalCorridas || 0}</div>
                              <div className="text-muted-foreground">
                                Finalizadas: {motorista.metricas?.corridasFinalizadas || 0}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              R$ {typeof motorista.metricas?.ganhoTotal === 'string'
                                ? parseFloat(motorista.metricas.ganhoTotal).toFixed(2)
                                : (motorista.metricas?.ganhoTotal || 0).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">
                                {typeof motorista.metricas?.mediaAvaliacao === 'string'
                                  ? parseFloat(motorista.metricas.mediaAvaliacao).toFixed(1)
                                  : (motorista.metricas?.mediaAvaliacao || 0).toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({motorista.metricas?.totalAvaliacoes || 0})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(motorista.status)}`}>
                              {getStatusLabel(motorista.status)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum motorista encontrado com os filtros selecionados</p>
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
                    <PieChart className="w-5 h-5" />
                    Motoristas por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderPieChart(stats.porStatus, "Distribuição por Status")}
                </CardContent>
              </Card>

              {/* Gráfico de Distribuição de Corridas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Distribuição de Corridas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderBarChart(stats.distribuicaoCorridas, "Motoristas por Faixa", {
                    'Sem Corridas': 'bg-gray-400',
                    '1-10 Corridas': 'bg-blue-400',
                    '11-50 Corridas': 'bg-green-500',
                    '51+ Corridas': 'bg-purple-500',
                  })}
                </CardContent>
              </Card>

              {/* Gráfico de Distribuição de Ganhos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Distribuição de Ganhos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderBarChart(stats.distribuicaoGanhos, "Motoristas por Faixa de Ganho", {
                    'R$ 0': 'bg-gray-400',
                    'R$ 1-100': 'bg-yellow-400',
                    'R$ 101-500': 'bg-orange-500',
                    'R$ 501+': 'bg-green-500',
                  })}
                </CardContent>
              </Card>

              {/* Top 5 Motoristas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Top 5 Motoristas (Ganho)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Maiores Ganhos</h4>
                    {stats.topPorGanho.length > 0 ? (
                      stats.topPorGanho.map((motorista: any, index: number) => {
                        const ganho = parseFloat(motorista.metricas?.ganhoTotal || '0');
                        const maxGanho = parseFloat(stats.topPorGanho[0].metricas?.ganhoTotal || '1');
                        return (
                          <div key={motorista.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {index + 1}º {motorista.nome}
                              </span>
                              <span className="font-semibold">R$ {ganho.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${(ganho / maxGanho) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Sem dados disponíveis
                      </div>
                    )}
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

export default RelatoriosMotoristasDetalhado;
