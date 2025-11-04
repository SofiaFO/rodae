import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CreditCard, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface SolicitarCorridaProps {
  onCorridaCriada?: () => void;
}

const SolicitarCorrida = ({ onCorridaCriada }: SolicitarCorridaProps) => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [opcaoCorrida, setOpcaoCorrida] = useState<'PADRAO' | 'PREMIUM' | 'COMPARTILHADA'>('PADRAO');
  const [formaPagamento, setFormaPagamento] = useState<'PIX' | 'CARTAO_CREDITO' | 'CARTEIRA_DIGITAL'>('PIX');

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

    setIsLoading(true);

    try {
      const response = await api.createCorrida(token!, {
        origem,
        destino,
        formaPagamento,
        opcaoCorrida,
      });

      toast({
        title: "Corrida solicitada!",
        description: `Valor estimado: R$ ${response.data.valorEstimado.toFixed(2)}. Aguarde um motorista aceitar.`,
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
            <Select value={formaPagamento} onValueChange={(value) => setFormaPagamento(value as 'PIX' | 'CARTAO_CREDITO' | 'CARTEIRA_DIGITAL')}>
              <SelectTrigger id="pagamento">
                <CreditCard className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                <SelectItem value="CARTEIRA_DIGITAL">Carteira Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Solicitando..." : "Solicitar Corrida"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SolicitarCorrida;
