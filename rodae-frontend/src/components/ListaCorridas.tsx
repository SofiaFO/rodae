import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, DollarSign, User, Car, XCircle, Eye, CheckCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatarEndereco } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import AvaliacaoDialog from "./AvaliacaoDialog";

interface Corrida {
  id: number;
  origem: string;
  destino: string;
  valorEstimado: number;
  status: 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
  formaPagamento: string;
  opcaoCorrida: string;
  criadoEm: string;
  passageiro: {
    id: number;
    nome: string;
    telefone: string;
  };
  motorista?: {
    id: number;
    nome: string;
    telefone: string;
    motorista?: {
      placaVeiculo: string;
      modeloCorVeiculo: string;
    };
  };
  avaliacoes?: Array<{
    id: number;
    nota: number;
    comentario?: string;
    usuarioDeId: number;
    usuarioParaId: number;
    usuarioPara?: {
      id: number;
      nome: string;
    };
  }>;
  usuarioAtualJaAvaliou?: boolean;
  podeAvaliar?: boolean;
}

interface ListaCorridasProps {
  filtroStatus?: 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
  titulo?: string;
  refresh?: number;
  onCorridaFinalizada?: () => void;
}

const ListaCorridas = ({ filtroStatus, titulo = "Minhas Corridas", refresh, onCorridaFinalizada }: ListaCorridasProps) => {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [corridaSelecionada, setCorridaSelecionada] = useState<Corrida | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Avaliação
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  const [corridaAvaliar, setCorridaAvaliar] = useState<Corrida | null>(null);

  const loadCorridas = async () => {
    try {
      const response = await api.getCorridas(token!, filtroStatus ? { status: filtroStatus } : undefined);
      setCorridas(response.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao carregar corridas",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadCorridas();
  }, [filtroStatus, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelar = async () => {
    if (!corridaSelecionada) return;

    setIsLoading(true);
    try {
      await api.cancelarCorrida(token!, corridaSelecionada.id, motivoCancelamento);
      
      toast({
        title: "Corrida cancelada",
        description: "A corrida foi cancelada com sucesso.",
      });

      setShowCancelar(false);
      setShowDetalhes(false);
      setMotivoCancelamento("");
      loadCorridas();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao cancelar corrida",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizar = async (corrida: Corrida) => {
    setIsLoading(true);
    try {
      // Usa o endpoint correto que cria pagamento e repasse automaticamente
      const response = await api.finalizarCorrida(token!, corrida.id, corrida.valorEstimado);
      
      toast({
        title: "Corrida finalizada",
        description: response.pagamento 
          ? `Pagamento registrado: R$ ${response.pagamento.valorTotal.toFixed(2)} (Motorista recebe R$ ${response.pagamento.valorMotorista.toFixed(2)})`
          : "A corrida foi finalizada com sucesso.",
      });

      loadCorridas();
      
      // Atualizar estatísticas do motorista
      if (onCorridaFinalizada) {
        onCorridaFinalizada();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao finalizar corrida",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      EM_ANDAMENTO: { color: "bg-blue-50 text-blue-700 border-blue-300", label: "Em Andamento" },
      FINALIZADA: { color: "bg-green-50 text-green-700 border-green-300", label: "Finalizada" },
      CANCELADA: { color: "bg-red-50 text-red-700 border-red-300", label: "Cancelada" },
    };

    const variant = variants[status] || variants.EM_ANDAMENTO;

    return (
      <Badge variant="outline" className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  const getTipoCorrida = (tipo: string) => {
    const tipos: Record<string, string> = {
      PADRAO: "Padrão",
      PREMIUM: "Premium",
      COMPARTILHADA: "Econômico",
    };
    return tipos[tipo] || tipo;
  };

  const getFormaPagamento = (forma: string) => {
    const formas: Record<string, string> = {
      PIX: "PIX",
      CARTAO_CREDITO: "Cartão de Crédito",
      CARTEIRA_DIGITAL: "Carteira Digital",
    };
    return formas[forma] || forma;
  };

  if (corridas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma corrida encontrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{titulo}</span>
            <Badge variant="secondary">{corridas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {corridas.map((corrida) => (
              <div
                key={corrida.id}
                className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold line-clamp-1 flex-1" title={`${corrida.origem} → ${corrida.destino}`}>
                        {formatarEndereco(corrida.origem)} → {formatarEndereco(corrida.destino)}
                      </p>
                      {getStatusBadge(corrida.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(corrida.criadoEm).toLocaleString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        R$ {corrida.valorEstimado.toFixed(2)}
                      </span>
                      <span>{getTipoCorrida(corrida.opcaoCorrida)}</span>
                    </div>
                    {corrida.motorista && (
                      <div className="mt-2 flex items-center gap-1 text-sm">
                        <Car className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{corrida.motorista.nome}</span>
                        {corrida.motorista.motorista && (
                          <span className="text-muted-foreground">
                            - {corrida.motorista.motorista.modeloCorVeiculo} ({corrida.motorista.motorista.placaVeiculo})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCorridaSelecionada(corrida);
                      setShowDetalhes(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {corrida.status === 'EM_ANDAMENTO' && (
                    <>
                      {user?.tipo === 'MOTORISTA' && corrida.motorista?.id === user.id && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleFinalizar(corrida)}
                          disabled={isLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Finalizar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setCorridaSelecionada(corrida);
                          setShowCancelar(true);
                        }}
                        disabled={isLoading}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {corrida.podeAvaliar && user?.tipo !== 'ADMIN' ? (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setCorridaAvaliar(corrida);
                        setShowAvaliacao(true);
                      }}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Avaliar
                    </Button>
                  ) : corrida.usuarioAtualJaAvaliou && corrida.status === 'FINALIZADA' && user?.tipo !== 'ADMIN' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                    >
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                      Avaliado
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Corrida #{corridaSelecionada?.id}</DialogTitle>
            <DialogDescription>
              Informações completas da corrida
            </DialogDescription>
          </DialogHeader>
          {corridaSelecionada && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Status</h4>
                  {getStatusBadge(corridaSelecionada.status)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Valor</h4>
                  <p className="text-lg font-bold text-primary">R$ {corridaSelecionada.valorEstimado.toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Trajeto</h3>
                <div className="space-y-2">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Origem</h4>
                    <p className="text-base">{formatarEndereco(corridaSelecionada.origem)}</p>
                    <p className="text-xs text-muted-foreground mt-1" title={corridaSelecionada.origem}>
                      {corridaSelecionada.origem}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Destino</h4>
                    <p className="text-base">{formatarEndereco(corridaSelecionada.destino)}</p>
                    <p className="text-xs text-muted-foreground mt-1" title={corridaSelecionada.destino}>
                      {corridaSelecionada.destino}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Tipo de Corrida</h4>
                  <p className="text-base">{getTipoCorrida(corridaSelecionada.opcaoCorrida)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Forma de Pagamento</h4>
                  <p className="text-base">{getFormaPagamento(corridaSelecionada.formaPagamento)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Informações do Passageiro</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Nome</h4>
                    <p className="text-base">{corridaSelecionada.passageiro.nome}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Telefone</h4>
                    <p className="text-base">{corridaSelecionada.passageiro.telefone}</p>
                  </div>
                </div>
              </div>

              {corridaSelecionada.motorista && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">Informações do Motorista</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Nome</h4>
                      <p className="text-base">{corridaSelecionada.motorista.nome}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Telefone</h4>
                      <p className="text-base">{corridaSelecionada.motorista.telefone}</p>
                    </div>
                  </div>
                  {corridaSelecionada.motorista.motorista && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Veículo</h4>
                        <p className="text-base">{corridaSelecionada.motorista.motorista.modeloCorVeiculo}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Placa</h4>
                        <p className="text-base">{corridaSelecionada.motorista.motorista.placaVeiculo}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Data/Hora da Solicitação</h4>
                <p className="text-base">{new Date(corridaSelecionada.criadoEm).toLocaleString('pt-BR')}</p>
              </div>

              {/* Seção de Avaliações */}
              {corridaSelecionada.avaliacoes && corridaSelecionada.avaliacoes.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">Avaliações</h3>
                  <div className="space-y-3">
                    {corridaSelecionada.avaliacoes.map((avaliacao) => (
                      <div key={avaliacao.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {avaliacao.usuarioPara?.nome || 'Usuário'}
                            </span>
                            {avaliacao.usuarioDeId === user?.id && (
                              <Badge variant="secondary" className="text-xs">Sua avaliação</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < avaliacao.nota
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {avaliacao.comentario && (
                          <p className="text-sm text-muted-foreground">{avaliacao.comentario}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {corridaSelecionada?.status === 'EM_ANDAMENTO' && (
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDetalhes(false);
                  setShowCancelar(true);
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar Corrida
              </Button>
            )}
            {corridaSelecionada?.podeAvaliar && user?.tipo !== 'ADMIN' && (
              <Button
                variant="default"
                onClick={() => {
                  setShowDetalhes(false);
                  setCorridaAvaliar(corridaSelecionada);
                  setShowAvaliacao(true);
                }}
              >
                <Star className="w-4 h-4 mr-2" />
                Avaliar
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetalhes(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelamento */}
      <Dialog open={showCancelar} onOpenChange={setShowCancelar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Corrida</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta corrida? 
              {corridaSelecionada?.motorista && user?.tipo === 'PASSAGEIRO' && (
                <span className="block mt-2 text-yellow-600 font-medium">
                  Atenção: Pode ser cobrada uma taxa de cancelamento de 20% do valor.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="motivo">Motivo do cancelamento (opcional)</Label>
              <Textarea
                id="motivo"
                placeholder="Descreva o motivo do cancelamento..."
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelar(false);
                setMotivoCancelamento("");
              }}
              disabled={isLoading}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={isLoading}
            >
              {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Avaliação */}
      {corridaAvaliar && (
        <AvaliacaoDialog
          open={showAvaliacao}
          onOpenChange={setShowAvaliacao}
          corridaId={corridaAvaliar.id}
          usuarioParaId={
            user?.tipo === 'PASSAGEIRO'
              ? corridaAvaliar.motorista?.id || 0
              : corridaAvaliar.passageiro.id
          }
          avaliadoNome={
            user?.tipo === 'PASSAGEIRO'
              ? corridaAvaliar.motorista?.nome || 'Motorista'
              : corridaAvaliar.passageiro.nome
          }
          onSuccess={() => {
            loadCorridas();
          }}
        />
      )}
    </>
  );
};

export default ListaCorridas;
