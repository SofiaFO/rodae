import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CreditCard, Navigation, Wallet, QrCode, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

interface SolicitarCorridaProps {
  onCorridaCriada?: () => void;
}

interface FormaPagamento {
  id: number;
  tipoPagamento: 'CARTAO_CREDITO' | 'PIX' | 'CARTEIRA_DIGITAL';
  nomeNoCartao?: string;
  ultimosDigitos?: string;
  status: 'ATIVO' | 'EXPIRADO';
}

const SolicitarCorrida = ({ onCorridaCriada }: SolicitarCorridaProps) => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);

  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [opcaoCorrida, setOpcaoCorrida] = useState<'PADRAO' | 'PREMIUM' | 'COMPARTILHADA'>('PADRAO');
  const [formaPagamentoId, setFormaPagamentoId] = useState<string>("");

  useEffect(() => {
    loadFormasPagamento();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFormasPagamento = async () => {
    try {
      const response = await api.getFormasPagamento(token!);
      const formasAtivas = (response.data || []).filter((f: FormaPagamento) => f.status === 'ATIVO');
      setFormasPagamento(formasAtivas);
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!origem || !destino) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha origem e destino.",
        variant: "destructive",
      });
      return;
    }

    if (!formaPagamentoId) {
      toast({
        title: "Forma de pagamento necessária",
        description: "Selecione uma forma de pagamento ou cadastre uma nova.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formaSelecionada = formasPagamento.find(f => f.id.toString() === formaPagamentoId);
      
      const response = await api.createCorridaComRota(token!, {
        origem,
        destino,
        formaPagamento: formaSelecionada?.tipoPagamento || 'PIX',
        opcaoCorrida,
      });

      console.log('Response da API:', response);

      // Verifica se a resposta tem os dados esperados
      if (!response || !response.corrida) {
        throw new Error('Resposta inválida da API');
      }

      const { corrida, detalhesRota, detalhesValor } = response;

      toast({
        title: "Corrida solicitada!",
        description: `Distância: ${detalhesRota?.distancia || '0'} km | Duração: ${detalhesRota?.duracao || '0 min'} | Valor: R$ ${corrida.valorEstimado.toFixed(2)}. Aguarde um motorista aceitar.`,
      });

      // Limpar formulário
      setOrigem("");
      setDestino("");
      
      // Callback para atualizar lista de corridas
      if (onCorridaCriada) {
        onCorridaCriada();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao solicitar corrida",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const valorEstimado = {
    PADRAO: 18,
    PREMIUM: 25,
    COMPARTILHADA: 15,
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'CARTAO_CREDITO':
        return <CreditCard className="w-4 h-4" />;
      case 'PIX':
        return <QrCode className="w-4 h-4" />;
      case 'CARTEIRA_DIGITAL':
        return <Wallet className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'CARTAO_CREDITO':
        return 'Cartão';
      case 'PIX':
        return 'PIX';
      case 'CARTEIRA_DIGITAL':
        return 'Carteira';
      default:
        return tipo;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          Solicitar Nova Corrida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origem */}
          <div className="space-y-2">
            <Label htmlFor="origem">Origem</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-primary" />
              <Input
                id="origem"
                placeholder="Digite o endereço de partida"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Destino */}
          <div className="space-y-2">
            <Label htmlFor="destino">Destino</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-destructive" />
              <Input
                id="destino"
                placeholder="Digite o endereço de destino"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Opção de Corrida */}
          <div className="space-y-2">
            <Label>Tipo de Corrida</Label>
            <div className="grid grid-cols-3 gap-4">
              <div
                className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  opcaoCorrida === 'COMPARTILHADA' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/40'
                }`}
                onClick={() => setOpcaoCorrida('COMPARTILHADA')}
              >
                <p className="font-semibold">Econômico</p>
                <p className="text-2xl font-bold text-primary my-1">R$ {valorEstimado.COMPARTILHADA}</p>
                <p className="text-xs text-muted-foreground">Compartilhada</p>
              </div>

              <div
                className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  opcaoCorrida === 'PADRAO' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/40'
                }`}
                onClick={() => setOpcaoCorrida('PADRAO')}
              >
                <p className="font-semibold">Padrão</p>
                <p className="text-2xl font-bold text-secondary my-1">R$ {valorEstimado.PADRAO}</p>
                <p className="text-xs text-muted-foreground">Conforto</p>
              </div>

              <div
                className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  opcaoCorrida === 'PREMIUM' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/40'
                }`}
                onClick={() => setOpcaoCorrida('PREMIUM')}
              >
                <p className="font-semibold">Premium</p>
                <p className="text-2xl font-bold text-accent my-1">R$ {valorEstimado.PREMIUM}</p>
                <p className="text-xs text-muted-foreground">Luxo</p>
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="pagamento">Forma de Pagamento</Label>
            {formasPagamento.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">⚠️ Nenhuma forma de pagamento cadastrada</p>
                    <p className="mb-2">Você precisa cadastrar uma forma de pagamento antes de solicitar uma corrida.</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate('/formas-pagamento')}
                    >
                      Cadastrar Forma de Pagamento
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Select value={formaPagamentoId} onValueChange={setFormaPagamentoId}>
                <SelectTrigger id="pagamento">
                  <SelectValue placeholder="Selecione uma forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((forma) => (
                    <SelectItem key={forma.id} value={forma.id.toString()}>
                      <div className="flex items-center gap-2">
                        {getTipoIcon(forma.tipoPagamento)}
                        <span>{getTipoLabel(forma.tipoPagamento)}</span>
                        {forma.ultimosDigitos && (
                          <span className="text-muted-foreground">•••• {forma.ultimosDigitos}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg" 
            disabled={isLoading || formasPagamento.length === 0}
          >
            {isLoading ? "Solicitando..." : "Solicitar Corrida"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SolicitarCorrida;
