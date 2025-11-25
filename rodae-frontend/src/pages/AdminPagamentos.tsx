import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Filter, 
  X, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Pagamento {
  id: number;
  transacaoId: string;
  valor: number;
  forma: 'CARTAO_CREDITO' | 'PIX' | 'CARTEIRA_DIGITAL';
  status: 'PENDENTE' | 'PAGO' | 'FALHOU' | 'ESTORNADO';
  dataHora: string;
  corridaId: number;
  valorRepasse?: number;
  statusRepasse?: string;
}

interface Repasse {
  id: number;
  pagamentoId: number;
  motoristaId: number;
  motoristaNome: string;
  valor: number;
  status: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'FALHOU' | 'CANCELADO';
  dataHora: string;
  tentativas?: number;
}

interface RepassesStats {
  total: number;
  pendentes: number;
  processando: number;
  concluidos: number;
  falhos: number;
  cancelados: number;
  valorTotalMotoristas: number;
  valorTotalPlataforma: number;
}

const AdminPagamentos = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [repasses, setRepasses] = useState<Repasse[]>([]);
  const [repassesStats, setRepassesStats] = useState<RepassesStats | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showReembolsoDialog, setShowReembolsoDialog] = useState(false);
  
  // Reembolso
  const [valorReembolso, setValorReembolso] = useState('');
  const [justificativaReembolso, setJustificativaReembolso] = useState('');
  const [isReembolsando, setIsReembolsando] = useState(false);

  // Filtros Transações
  const [filtrosTransacoes, setFiltrosTransacoes] = useState({
    status: '',
    dataInicio: '',
    dataFim: '',
  });

  // Filtros Repasses
  const [filtrosRepasses, setFiltrosRepasses] = useState({
    status: '',
    motoristaId: '',
    dataInicio: '',
    dataFim: '',
  });

  useEffect(() => {
    loadPagamentos();
    loadRepasses();
  }, []);

  const loadPagamentos = async () => {
    setIsLoading(true);
    try {
      const filtrosAtivos: any = {};
      if (filtrosTransacoes.status) filtrosAtivos.status = filtrosTransacoes.status;
      if (filtrosTransacoes.dataInicio) filtrosAtivos.dataInicio = filtrosTransacoes.dataInicio;
      if (filtrosTransacoes.dataFim) filtrosAtivos.dataFim = filtrosTransacoes.dataFim;

      const response = await api.consultarTransacoes(token!, filtrosAtivos);
      setPagamentos(response.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao carregar transações",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRepasses = async () => {
    try {
      const filtrosAtivos: any = {};
      if (filtrosRepasses.status) filtrosAtivos.status = filtrosRepasses.status;
      if (filtrosRepasses.motoristaId) filtrosAtivos.motoristaId = parseInt(filtrosRepasses.motoristaId);
      if (filtrosRepasses.dataInicio) filtrosAtivos.dataInicio = filtrosRepasses.dataInicio;
      if (filtrosRepasses.dataFim) filtrosAtivos.dataFim = filtrosRepasses.dataFim;

      const response = await api.consultarRepasses(token!, filtrosAtivos);
      setRepasses(response.data || []);
      setRepassesStats(response.stats || null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao carregar repasses",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (pagamento: Pagamento) => {
    try {
      const response = await api.buscarPagamento(token!, pagamento.id);
      setSelectedPagamento(response.data);
      setShowDetailsDialog(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao buscar detalhes",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleOpenReembolso = (pagamento: Pagamento) => {
    if (pagamento.status !== 'PAGO') {
      toast({
        title: "Reembolso não permitido",
        description: "Apenas pagamentos com status PAGO podem ser reembolsados.",
        variant: "destructive",
      });
      return;
    }
    setSelectedPagamento(pagamento);
    setValorReembolso(pagamento.valor.toFixed(2));
    setJustificativaReembolso('');
    setShowReembolsoDialog(true);
  };

  const handleReembolsar = async () => {
    if (!selectedPagamento) return;

    if (justificativaReembolso.trim().length < 10) {
      toast({
        title: "Justificativa obrigatória",
        description: "A justificativa deve ter pelo menos 10 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsReembolsando(true);
    try {
      const valorNumerico = parseFloat(valorReembolso);
      const dadosReembolso: any = {
        justificativa: justificativaReembolso,
      };

      if (valorNumerico < selectedPagamento.valor) {
        dadosReembolso.valorReembolso = valorNumerico;
      }

      await api.reembolsarPagamento(token!, selectedPagamento.id, dadosReembolso);
      
      toast({
        title: "Reembolso realizado!",
        description: `R$ ${valorNumerico.toFixed(2)} reembolsado com sucesso.`,
      });

      setShowReembolsoDialog(false);
      loadPagamentos();
      loadRepasses();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao reembolsar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsReembolsando(false);
    }
  };

  const handleReprocessarRepasse = async (repasse: Repasse) => {
    if (repasse.status !== 'FALHOU' && repasse.status !== 'PENDENTE') {
      toast({
        title: "Reprocessamento não permitido",
        description: "Apenas repasses com status FALHOU ou PENDENTE podem ser reprocessados.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.reprocessarRepasse(token!, repasse.id);
      toast({
        title: "Repasse reprocessado!",
        description: "O repasse foi enviado para processamento novamente.",
      });
      loadRepasses();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao reprocessar",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const limparFiltrosTransacoes = () => {
    setFiltrosTransacoes({
      status: '',
      dataInicio: '',
      dataFim: '',
    });
  };

  const limparFiltrosRepasses = () => {
    setFiltrosRepasses({
      status: '',
      motoristaId: '',
      dataInicio: '',
      dataFim: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      PENDENTE: { variant: "secondary", label: "Pendente" },
      PAGO: { variant: "default", label: "Pago" },
      FALHOU: { variant: "destructive", label: "Falhou" },
      ESTORNADO: { variant: "outline", label: "Estornado" },
      PROCESSANDO: { variant: "secondary", label: "Processando" },
      CONCLUIDO: { variant: "default", label: "Concluído" },
      CANCELADO: { variant: "outline", label: "Cancelado" },
    };
    const config = variants[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const labels: Record<string, string> = {
      CARTAO_CREDITO: 'Cartão de Crédito',
      PIX: 'PIX',
      CARTEIRA_DIGITAL: 'Carteira Digital',
    };
    return labels[forma] || forma;
  };

  const calcularEstatisticasTransacoes = () => {
    const total = pagamentos.length;
    const valorTotal = pagamentos
      .filter(p => p.status === 'PAGO')
      .reduce((acc, p) => acc + p.valor, 0);
    const pagos = pagamentos.filter(p => p.status === 'PAGO').length;
    const pendentes = pagamentos.filter(p => p.status === 'PENDENTE').length;
    const falhados = pagamentos.filter(p => p.status === 'FALHOU').length;
    const estornados = pagamentos.filter(p => p.status === 'ESTORNADO').length;

    return {
      total,
      valorTotal,
      pagos,
      pendentes,
      falhados,
      estornados,
    };
  };

  const statsTransacoes = calcularEstatisticasTransacoes();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="transacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="repasses">Repasses</TabsTrigger>
        </TabsList>

        {/* ABA TRANSAÇÕES */}
        <TabsContent value="transacoes" className="space-y-6">
          {/* Estatísticas Transações */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsTransacoes.total}</div>
                <p className="text-xs text-muted-foreground">
                  {statsTransacoes.pagos} pagas, {statsTransacoes.pendentes} pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total Processado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {statsTransacoes.valorTotal.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Transações pagas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Sucesso</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {statsTransacoes.total > 0 
                    ? ((statsTransacoes.pagos / statsTransacoes.total) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsTransacoes.pagos} de {statsTransacoes.total}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Problemas</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {statsTransacoes.falhados + statsTransacoes.estornados}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsTransacoes.falhados} falharam, {statsTransacoes.estornados} estornados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela Transações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Todas as Transações</CardTitle>
                  <CardDescription>
                    Gerenciamento completo de pagamentos e reembolsos
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                  <Button onClick={loadPagamentos} disabled={isLoading}>
                    Atualizar
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={filtrosTransacoes.status} onValueChange={(value) => setFiltrosTransacoes({ ...filtrosTransacoes, status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="PENDENTE">Pendente</SelectItem>
                          <SelectItem value="PAGO">Pago</SelectItem>
                          <SelectItem value="FALHOU">Falhou</SelectItem>
                          <SelectItem value="ESTORNADO">Estornado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataInicioTrans">Data Início</Label>
                      <Input
                        id="dataInicioTrans"
                        type="date"
                        value={filtrosTransacoes.dataInicio}
                        onChange={(e) => setFiltrosTransacoes({ ...filtrosTransacoes, dataInicio: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataFimTrans">Data Fim</Label>
                      <Input
                        id="dataFimTrans"
                        type="date"
                        value={filtrosTransacoes.dataFim}
                        onChange={(e) => setFiltrosTransacoes({ ...filtrosTransacoes, dataFim: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={loadPagamentos} size="sm">
                      Aplicar Filtros
                    </Button>
                    <Button onClick={limparFiltrosTransacoes} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando transações...</div>
              ) : pagamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Corrida</TableHead>
                        <TableHead>Forma</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagamentos.map((pagamento) => (
                        <TableRow key={pagamento.id}>
                          <TableCell className="font-mono text-xs">{pagamento.transacaoId}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(pagamento.dataHora).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono">#{pagamento.corridaId}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{getFormaPagamentoLabel(pagamento.forma)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">R$ {pagamento.valor.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(pagamento.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(pagamento)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {pagamento.status === 'PAGO' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenReembolso(pagamento)}
                                >
                                  <RefreshCw className="w-4 h-4 text-orange-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA REPASSES */}
        <TabsContent value="repasses" className="space-y-6">
          {/* Estatísticas Repasses */}
          {repassesStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Repasses</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{repassesStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {repassesStats.concluidos} concluídos, {repassesStats.pendentes} pendentes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Motoristas (80%)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {repassesStats.valorTotalMotoristas.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Repasses concluídos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Plataforma (20%)</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    R$ {repassesStats.valorTotalPlataforma.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taxa da plataforma
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Problemas</CardTitle>
                  <Activity className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {repassesStats.falhos}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {repassesStats.processando} processando, {repassesStats.cancelados} cancelados
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabela Repasses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Repasses</CardTitle>
                  <CardDescription>
                    Controle de transferências para motoristas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                  <Button onClick={loadRepasses}>
                    Atualizar
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={filtrosRepasses.status} onValueChange={(value) => setFiltrosRepasses({ ...filtrosRepasses, status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="PENDENTE">Pendente</SelectItem>
                          <SelectItem value="PROCESSANDO">Processando</SelectItem>
                          <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                          <SelectItem value="FALHOU">Falhou</SelectItem>
                          <SelectItem value="CANCELADO">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motoristaId">ID Motorista</Label>
                      <Input
                        id="motoristaId"
                        type="number"
                        placeholder="Opcional"
                        value={filtrosRepasses.motoristaId}
                        onChange={(e) => setFiltrosRepasses({ ...filtrosRepasses, motoristaId: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataInicioRep">Data Início</Label>
                      <Input
                        id="dataInicioRep"
                        type="date"
                        value={filtrosRepasses.dataInicio}
                        onChange={(e) => setFiltrosRepasses({ ...filtrosRepasses, dataInicio: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataFimRep">Data Fim</Label>
                      <Input
                        id="dataFimRep"
                        type="date"
                        value={filtrosRepasses.dataFim}
                        onChange={(e) => setFiltrosRepasses({ ...filtrosRepasses, dataFim: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={loadRepasses} size="sm">
                      Aplicar Filtros
                    </Button>
                    <Button onClick={limparFiltrosRepasses} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {repasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum repasse encontrado
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tentativas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repasses.map((repasse) => (
                        <TableRow key={repasse.id}>
                          <TableCell className="font-mono text-xs">#{repasse.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{repasse.motoristaNome}</p>
                              <p className="text-xs text-muted-foreground">ID: {repasse.motoristaId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {new Date(repasse.dataHora).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">R$ {repasse.valor.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(repasse.status)}</TableCell>
                          <TableCell>
                            <span className="text-sm">{repasse.tentativas || 1}x</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {(repasse.status === 'FALHOU' || repasse.status === 'PENDENTE') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReprocessarRepasse(repasse)}
                              >
                                <RefreshCw className="w-4 h-4 text-blue-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <DialogDescription>
              Informações completas sobre o pagamento
            </DialogDescription>
          </DialogHeader>

          {selectedPagamento && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">ID Transação</Label>
                  <p className="font-mono text-sm mt-1">{selectedPagamento.transacaoId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Corrida</Label>
                  <p className="font-mono text-sm mt-1">#{selectedPagamento.corridaId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data/Hora</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedPagamento.dataHora).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Forma de Pagamento</Label>
                  <p className="text-sm mt-1">{getFormaPagamentoLabel(selectedPagamento.forma)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="text-lg font-bold mt-1">R$ {selectedPagamento.valor.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPagamento.status)}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Reembolso */}
      <Dialog open={showReembolsoDialog} onOpenChange={setShowReembolsoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reembolsar Pagamento</DialogTitle>
            <DialogDescription>
              Realize o reembolso total ou parcial desta transação
            </DialogDescription>
          </DialogHeader>

          {selectedPagamento && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Transação</p>
                <p className="font-mono text-sm">{selectedPagamento.transacaoId}</p>
                <p className="text-lg font-bold mt-2">R$ {selectedPagamento.valor.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorReembolso">Valor do Reembolso</Label>
                <Input
                  id="valorReembolso"
                  type="number"
                  step="0.01"
                  value={valorReembolso}
                  onChange={(e) => setValorReembolso(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe igual ao valor total para reembolso completo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa (obrigatório, mín. 10 caracteres)</Label>
                <Textarea
                  id="justificativa"
                  value={justificativaReembolso}
                  onChange={(e) => setJustificativaReembolso(e.target.value)}
                  placeholder="Motivo do reembolso..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReembolsoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReembolsar} disabled={isReembolsando}>
              {isReembolsando ? "Processando..." : "Confirmar Reembolso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPagamentos;
