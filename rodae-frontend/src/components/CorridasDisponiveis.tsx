import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface CorridaDisponivel {
  id: number;
  origem: string;
  destino: string;
  valorEstimado: number;
  opcaoCorrida: string;
  formaPagamento: string;
  criadoEm: string;
  passageiro: {
    nome: string;
    telefone: string;
  };
}

const CorridasDisponiveis = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [corridas, setCorridas] = useState<CorridaDisponivel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCorridasDisponiveis = async () => {
    try {
      const response = await api.getCorridasDisponiveis(token!);
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
    loadCorridasDisponiveis();
    
    // Atualizar lista a cada 10 segundos
    const interval = setInterval(() => {
      loadCorridasDisponiveis();
    }, 10000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAceitar = async (corridaId: number) => {
    setIsLoading(true);
    try {
      await api.aceitarCorrida(token!, corridaId);
      
      toast({
        title: "Corrida aceita!",
        description: "Você aceitou a corrida. Dirija-se ao local de partida.",
      });

      loadCorridasDisponiveis();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao aceitar corrida",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTipoCorrida = (tipo: string) => {
    const tipos: Record<string, { label: string; color: string }> = {
      PADRAO: { label: "Padrão", color: "bg-blue-50 text-blue-700 border-blue-300" },
      PREMIUM: { label: "Premium", color: "bg-purple-50 text-purple-700 border-purple-300" },
      COMPARTILHADA: { label: "Econômico", color: "bg-green-50 text-green-700 border-green-300" },
    };
    return tipos[tipo] || tipos.PADRAO;
  };

  const getTempoDecorrido = (data: string) => {
    const agora = new Date().getTime();
    const criado = new Date(data).getTime();
    const diff = Math.floor((agora - criado) / 1000 / 60); // em minutos
    
    if (diff < 1) return "Agora mesmo";
    if (diff === 1) return "1 minuto atrás";
    if (diff < 60) return `${diff} minutos atrás`;
    
    const horas = Math.floor(diff / 60);
    if (horas === 1) return "1 hora atrás";
    return `${horas} horas atrás`;
  };

  if (corridas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Corridas Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Nenhuma corrida disponível no momento</p>
            <p className="text-sm">Fique online e aguarde novas solicitações</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Corridas Disponíveis</span>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {corridas.length} {corridas.length === 1 ? 'corrida' : 'corridas'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {corridas.map((corrida) => {
            const tipoCorrida = getTipoCorrida(corrida.opcaoCorrida);
            
            return (
              <div
                key={corrida.id}
                className="relative p-4 rounded-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={tipoCorrida.color}>
                        {tipoCorrida.label}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {getTempoDecorrido(corrida.criadoEm)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Origem</p>
                          <p className="font-semibold">{corrida.origem}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Destino</p>
                          <p className="font-semibold">{corrida.destino}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Passageiro: {corrida.passageiro.nome}</span>
                      <span>Tel: {corrida.passageiro.telefone}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Ganho estimado</p>
                      <p className="text-3xl font-bold text-primary">
                        R$ {corrida.valorEstimado.toFixed(2)}
                      </p>
                    </div>

                    <Button
                      size="lg"
                      onClick={() => handleAceitar(corrida.id)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {isLoading ? 'Aceitando...' : 'Aceitar Corrida'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CorridasDisponiveis;
