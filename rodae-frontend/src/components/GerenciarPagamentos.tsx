import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreditCard, Calendar, DollarSign, Filter, X, Eye, TrendingUp, TrendingDown } from "lucide-react";
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
  statusRepasse?: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'FALHOU' | 'CANCELADO';
}

const GerenciarPagamentos = () => {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    status: '',
    dataInicio: '',
    dataFim: '',
  });

  useEffect(() => {
    loadPagamentos();
  }, []);

  const loadPagamentos = async () => {
    setIsLoading(true);
    try {
      const filtrosAtivos: any = {};
      if (filtros.status) filtrosAtivos.status = filtros.status;
      if (filtros.dataInicio) filtrosAtivos.dataInicio = filtros.dataInicio;
      if (filtros.dataFim) filtrosAtivos.dataFim = filtros.dataFim;

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

  const limparFiltros = () => {
    setFiltros({
      status: '',
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
    };
    const config = variants[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusRepasseBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      PENDENTE: { variant: "secondary", label: "Pendente" },
      PROCESSANDO: { variant: "secondary", label: "Processando" },
      CONCLUIDO: { variant: "default", label: "Concluído" },
      FALHOU: { variant: "destructive", label: "Falhou" },
      CANCELADO: { variant: "outline", label: "Cancelado" },
    };
    const config = variants[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant} className="ml-2">{config.label}</Badge>;
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const labels: Record<string, string> = {
      CARTAO_CREDITO: 'Cartão de Crédito',
      PIX: 'PIX',
      CARTEIRA_DIGITAL: 'Carteira Digital',
    };
    return labels[forma] || forma;
  };

  const calcularEstatisticas = () => {
    const total = pagamentos.length;
    const valorTotal = pagamentos
      .filter(p => p.status === 'PAGO')
      .reduce((acc, p) => acc + p.valor, 0);
    const pagos = pagamentos.filter(p => p.status === 'PAGO').length;
    const pendentes = pagamentos.filter(p => p.status === 'PENDENTE').length;
    const falhados = pagamentos.filter(p => p.status === 'FALHOU').length;
    const estornados = pagamentos.filter(p => p.status === 'ESTORNADO').length;

    // Para motoristas
    const valorRepasse = user?.tipo === 'MOTORISTA'
      ? pagamentos
          .filter(p => p.status === 'PAGO' && p.valorRepasse)
          .reduce((acc, p) => acc + (p.valorRepasse || 0), 0)
      : 0;

    return {
      total,
      valorTotal,
      pagos,
      pendentes,
      falhados,
      estornados,
      valorRepasse,
    };
  };

  const stats = calcularEstatisticas();

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pagos} pagas, {stats.pendentes} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.valorTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Transações pagas
            </p>
          </CardContent>
        </Card>

        {user?.tipo === 'MOTORISTA' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repasses Recebidos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {stats.valorRepasse.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                80% do valor das corridas
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.falhados + stats.estornados}</div>
            <p className="text-xs text-muted-foreground">
              {stats.falhados} falharam, {stats.estornados} estornados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                {user?.tipo === 'MOTORISTA' 
                  ? 'Seus repasses e pagamentos recebidos' 
                  : 'Suas transações e pagamentos realizados'}
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

          {/* Filtros */}
          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filtros.status} onValueChange={(value) => setFiltros({ ...filtros, status: value })}>
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
              </div>

              <div className="flex gap-2">
                <Button onClick={loadPagamentos} size="sm">
                  Aplicar Filtros
                </Button>
                <Button onClick={limparFiltros} variant="outline" size="sm">
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
                    <TableHead>ID Transação</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Corrida</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Valor</TableHead>
                    {user?.tipo === 'MOTORISTA' && <TableHead>Repasse</TableHead>}
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
                      {user?.tipo === 'MOTORISTA' && (
                        <TableCell>
                          {pagamento.valorRepasse ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-green-600">
                                R$ {pagamento.valorRepasse.toFixed(2)}
                              </span>
                              {getStatusRepasseBadge(pagamento.statusRepasse)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>{getStatusBadge(pagamento.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(pagamento)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
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

                {user?.tipo === 'MOTORISTA' && selectedPagamento.valorRepasse && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Valor Repasse (80%)</Label>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        R$ {selectedPagamento.valorRepasse.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status Repasse</Label>
                      <div className="mt-1">{getStatusRepasseBadge(selectedPagamento.statusRepasse)}</div>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Taxa Plataforma (20%)</Label>
                      <p className="text-sm mt-1">
                        R$ {(selectedPagamento.valor - selectedPagamento.valorRepasse).toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarPagamentos;
