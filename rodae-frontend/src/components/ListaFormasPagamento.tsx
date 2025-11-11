import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, QrCode, Edit, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface FormaPagamento {
  id: number;
  tipoPagamento: 'CARTAO_CREDITO' | 'PIX' | 'CARTEIRA_APP';
  nomeCartao?: string;
  ultimos4Digitos?: string;
  validadeCartao?: string;
  status: 'ATIVO' | 'EXPIRADO';
  criadoEm: string;
}

interface ListaFormasPagamentoProps {
  refresh?: number;
}

const ListaFormasPagamento = ({ refresh }: ListaFormasPagamentoProps) => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [formasSelecionada, setFormaSelecionada] = useState<FormaPagamento | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Campos de edição
  const [nomeNoCartaoEdit, setNomeNoCartaoEdit] = useState("");
  const [validadeCartaoEdit, setValidadeCartaoEdit] = useState("");

  const loadFormasPagamento = async () => {
    try {
      const response = await api.getFormasPagamento(token!);
      setFormasPagamento(response.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao carregar formas de pagamento",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadFormasPagamento();
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = (forma: FormaPagamento) => {
    setFormaSelecionada(forma);
    setNomeNoCartaoEdit(forma.nomeCartao || "");
    setValidadeCartaoEdit(forma.validadeCartao || "");
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!formasSelecionada) return;

    // Validações
    if (formasSelecionada.tipoPagamento === 'CARTAO_CREDITO') {
      if (nomeNoCartaoEdit.length > 60) {
        toast({
          title: "Nome inválido",
          description: "O nome no cartão deve ter no máximo 60 caracteres.",
          variant: "destructive",
        });
        return;
      }

      // Validar validade (MM/AA)
      if (!/^\d{2}\/\d{2}$/.test(validadeCartaoEdit)) {
        toast({
          title: "Validade inválida",
          description: "A validade deve estar no formato MM/AA.",
          variant: "destructive",
        });
        return;
      }

      // Validar se a validade está no futuro
      const [mes, ano] = validadeCartaoEdit.split('/').map(Number);
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
    }

    setIsLoading(true);
    try {
      await api.updateFormaPagamento(token!, formasSelecionada.id, {
        nomeNoCartao: nomeNoCartaoEdit,
        validadeCartao: validadeCartaoEdit,
      });

      toast({
        title: "Forma de pagamento atualizada!",
        description: "As informações foram atualizadas com sucesso.",
      });

      setShowEditDialog(false);
      loadFormasPagamento();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao atualizar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formasSelecionada) return;

    setIsLoading(true);
    try {
      await api.deleteFormaPagamento(token!, formasSelecionada.id);

      toast({
        title: "Forma de pagamento excluída!",
        description: "A forma de pagamento foi removida com sucesso.",
      });

      setShowDeleteDialog(false);
      loadFormasPagamento();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao excluir",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'CARTAO_CREDITO':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'PIX':
        return <QrCode className="w-5 h-5 text-green-600" />;
      case 'CARTEIRA_APP':
      case 'CARTEIRA_DIGITAL':
        return <Wallet className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'CARTAO_CREDITO':
        return 'Cartão de Crédito';
      case 'PIX':
        return 'PIX';
      case 'CARTEIRA_APP':
      case 'CARTEIRA_DIGITAL':
        return 'Carteira Digital';
      default:
        return tipo;
    }
  };

  const formatarValidade = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length >= 2) {
      return numeros.slice(0, 2) + '/' + numeros.slice(2, 4);
    }
    return numeros;
  };

  if (formasPagamento.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Nenhuma forma de pagamento cadastrada</p>
            <p className="text-sm">Cadastre uma forma de pagamento para usar em suas corridas</p>
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
            <span>Minhas Formas de Pagamento</span>
            <Badge variant="secondary">{formasPagamento.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formasPagamento.map((forma) => (
              <div
                key={forma.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    {getTipoIcon(forma.tipoPagamento)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{getTipoLabel(forma.tipoPagamento)}</p>
                      <Badge 
                        variant="outline" 
                        className={forma.status === 'ATIVO' 
                          ? "bg-green-50 text-green-700 border-green-300" 
                          : "bg-red-50 text-red-700 border-red-300"}
                      >
                        {forma.status === 'ATIVO' ? 'Ativo' : 'Expirado'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {forma.tipoPagamento === 'CARTAO_CREDITO' && (
                        <>
                          <span>•••• •••• •••• {forma.ultimos4Digitos}</span>
                          {forma.nomeCartao && <span>{forma.nomeCartao}</span>}
                          {forma.validadeCartao && <span>Val: {forma.validadeCartao}</span>}
                        </>
                      )}
                      <span>Cadastrado em {new Date(forma.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {forma.tipoPagamento === 'CARTAO_CREDITO' && forma.status === 'ATIVO' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(forma)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setFormaSelecionada(forma);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Forma de Pagamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do seu cartão
            </DialogDescription>
          </DialogHeader>
          {formasSelecionada && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome no Cartão</Label>
                <Input
                  id="edit-nome"
                  value={nomeNoCartaoEdit}
                  onChange={(e) => setNomeNoCartaoEdit(e.target.value.toUpperCase())}
                  maxLength={60}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-validade">Validade (MM/AA)</Label>
                <Input
                  id="edit-validade"
                  placeholder="MM/AA"
                  value={validadeCartaoEdit}
                  onChange={(e) => setValidadeCartaoEdit(formatarValidade(e.target.value))}
                  maxLength={5}
                  disabled={isLoading}
                />
              </div>

              <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">⚠️ Atenção</p>
                  <p>Não é possível alterar o número do cartão. Para trocar o cartão, exclua esta forma de pagamento e cadastre uma nova.</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta forma de pagamento?
            </DialogDescription>
          </DialogHeader>
          {formasSelecionada && (
            <div className="space-y-2">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {getTipoIcon(formasSelecionada.tipoPagamento)}
                  <div>
                    <p className="font-semibold">{getTipoLabel(formasSelecionada.tipoPagamento)}</p>
                    {formasSelecionada.ultimos4Digitos && (
                      <p className="text-sm text-muted-foreground">
                        •••• •••• •••• {formasSelecionada.ultimos4Digitos}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-red-50 dark:bg-red-950 p-3 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">⚠️ Aviso Importante</p>
                  <p>• Esta ação não pode ser desfeita</p>
                  <p>• Os dados serão removidos conforme a LGPD</p>
                  <p>• Não é possível excluir formas de pagamento usadas em corridas em andamento</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ListaFormasPagamento;
