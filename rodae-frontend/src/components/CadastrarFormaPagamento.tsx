import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Wallet, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface CadastrarFormaPagamentoProps {
  onFormaCadastrada?: () => void;
}

const CadastrarFormaPagamento = ({ onFormaCadastrada }: CadastrarFormaPagamentoProps) => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [tipoPagamento, setTipoPagamento] = useState<'CARTAO_CREDITO' | 'PIX' | 'CARTEIRA_DIGITAL'>('CARTAO_CREDITO');
  const [nomeNoCartao, setNomeNoCartao] = useState("");
  const [numeroCartao, setNumeroCartao] = useState("");
  const [validadeCartao, setValidadeCartao] = useState("");
  const [cvv, setCvv] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (tipoPagamento === 'CARTAO_CREDITO') {
      if (!nomeNoCartao || !numeroCartao || !validadeCartao || !cvv) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos do cartão.",
          variant: "destructive",
        });
        return;
      }

      // Validar nome no cartão
      if (nomeNoCartao.length > 60) {
        toast({
          title: "Nome inválido",
          description: "O nome no cartão deve ter no máximo 60 caracteres.",
          variant: "destructive",
        });
        return;
      }

      // Validar número do cartão (deve ter 16 dígitos)
      const numeroLimpo = numeroCartao.replace(/\s/g, '');
      if (numeroLimpo.length !== 16 || !/^\d+$/.test(numeroLimpo)) {
        toast({
          title: "Número do cartão inválido",
          description: "O número do cartão deve conter 16 dígitos.",
          variant: "destructive",
        });
        return;
      }

      // Validar validade (MM/AA)
      if (!/^\d{2}\/\d{2}$/.test(validadeCartao)) {
        toast({
          title: "Validade inválida",
          description: "A validade deve estar no formato MM/AA.",
          variant: "destructive",
        });
        return;
      }

      // Validar se a validade está no futuro
      const [mes, ano] = validadeCartao.split('/').map(Number);
      const dataValidade = new Date(2000 + ano, mes - 1);
      const hoje = new Date();
      if (dataValidade <= hoje) {
        toast({
          title: "Validade expirada",
          description: "A validade do cartão deve ser futura.",
          variant: "destructive",
        });
        return;
      }

      // Validar CVV (3 ou 4 dígitos)
      if (!/^\d{3,4}$/.test(cvv)) {
        toast({
          title: "CVV inválido",
          description: "O CVV deve conter 3 ou 4 dígitos.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const formaPagamentoData: {
        tipoPagamento: 'CARTAO_CREDITO' | 'PIX' | 'CARTEIRA_DIGITAL';
        nomeNoCartao?: string;
        numeroCartao?: string;
        validadeCartao?: string;
        cvv?: string;
      } = {
        tipoPagamento,
      };

      if (tipoPagamento === 'CARTAO_CREDITO') {
        formaPagamentoData.nomeNoCartao = nomeNoCartao;
        formaPagamentoData.numeroCartao = numeroCartao.replace(/\s/g, '');
        formaPagamentoData.validadeCartao = validadeCartao;
        formaPagamentoData.cvv = cvv;
      }

      await api.createFormaPagamento(token!, formaPagamentoData);

      toast({
        title: "Forma de pagamento cadastrada!",
        description: "Sua forma de pagamento foi cadastrada com sucesso.",
      });

      // Limpar formulário
      setNomeNoCartao("");
      setNumeroCartao("");
      setValidadeCartao("");
      setCvv("");
      
      // Callback para atualizar lista
      if (onFormaCadastrada) {
        onFormaCadastrada();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao cadastrar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatarNumeroCartao = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    const grupos = numeros.match(/.{1,4}/g);
    return grupos ? grupos.join(' ') : numeros;
  };

  const formatarValidade = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length >= 2) {
      return numeros.slice(0, 2) + '/' + numeros.slice(2, 4);
    }
    return numeros;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Nova Forma de Pagamento
        </CardTitle>
        <CardDescription>
          Cadastre uma forma de pagamento para usar em suas corridas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="tipoPagamento">Tipo de Pagamento</Label>
            <Select value={tipoPagamento} onValueChange={(value) => setTipoPagamento(value as 'CARTAO_CREDITO' | 'PIX' | 'CARTEIRA_DIGITAL')}>
              <SelectTrigger id="tipoPagamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CARTAO_CREDITO">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Cartão de Crédito
                  </div>
                </SelectItem>
                <SelectItem value="PIX">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    PIX
                  </div>
                </SelectItem>
                <SelectItem value="CARTEIRA_DIGITAL">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Carteira Digital
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos específicos para Cartão de Crédito */}
          {tipoPagamento === 'CARTAO_CREDITO' && (
            <>
              {/* Nome no Cartão */}
              <div className="space-y-2">
                <Label htmlFor="nomeNoCartao">Nome no Cartão</Label>
                <Input
                  id="nomeNoCartao"
                  placeholder="Como está no cartão"
                  value={nomeNoCartao}
                  onChange={(e) => setNomeNoCartao(e.target.value.toUpperCase())}
                  maxLength={60}
                  disabled={isLoading}
                />
              </div>

              {/* Número do Cartão */}
              <div className="space-y-2">
                <Label htmlFor="numeroCartao">Número do Cartão</Label>
                <Input
                  id="numeroCartao"
                  placeholder="0000 0000 0000 0000"
                  value={numeroCartao}
                  onChange={(e) => setNumeroCartao(formatarNumeroCartao(e.target.value))}
                  maxLength={19}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Validade */}
                <div className="space-y-2">
                  <Label htmlFor="validadeCartao">Validade</Label>
                  <Input
                    id="validadeCartao"
                    placeholder="MM/AA"
                    value={validadeCartao}
                    onChange={(e) => setValidadeCartao(formatarValidade(e.target.value))}
                    maxLength={5}
                    disabled={isLoading}
                  />
                </div>

                {/* CVV */}
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="000"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                <p className="font-semibold mb-1">🔒 Segurança</p>
                <p>• O CVV não é armazenado após validação</p>
                <p>• Informações do cartão são criptografadas</p>
                <p>• Seus dados estão protegidos conforme a LGPD</p>
              </div>
            </>
          )}

          {/* Mensagem para PIX */}
          {tipoPagamento === 'PIX' && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="font-semibold mb-2">📱 Pagamento via PIX</p>
              <p>Você poderá pagar suas corridas usando PIX. O QR Code será gerado no momento do pagamento.</p>
            </div>
          )}

          {/* Mensagem para Carteira Digital */}
          {tipoPagamento === 'CARTEIRA_DIGITAL' && (
            <div className="text-sm text-muted-foreground bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
              <p className="font-semibold mb-2">💳 Carteira Digital</p>
              <p>Use o saldo da sua carteira digital do aplicativo para pagar as corridas.</p>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Cadastrando..." : "Cadastrar Forma de Pagamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CadastrarFormaPagamento;
