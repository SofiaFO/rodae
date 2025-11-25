import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Calendar, User, Pencil, Trash2, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Avaliacao {
  id: number;
  nota: number;
  comentario?: string;
  criadoEm: string;
  atualizadoEm?: string;
  usuarioDe: {
    id: number;
    nome: string;
    tipo: string;
  };
  usuarioPara: {
    id: number;
    nome: string;
    tipo: string;
  };
  corrida: {
    id: number;
    origem: string;
    destino: string;
    status: string;
  };
}

const MinhasAvaliacoes = () => {
  const { token, user } = useAuthStore();
  const { toast } = useToast();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [filteredAvaliacoes, setFilteredAvaliacoes] = useState<Avaliacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filtros
  const [notaMinima, setNotaMinima] = useState<string>('');
  const [notaMaxima, setNotaMaxima] = useState<string>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Edição
  const [avaliacaoEdit, setAvaliacaoEdit] = useState<Avaliacao | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editNota, setEditNota] = useState(0);
  const [editComentario, setEditComentario] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  // Exclusão (admin)
  const [avaliacaoDelete, setAvaliacaoDelete] = useState<Avaliacao | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [justificativa, setJustificativa] = useState('');

  const loadAvaliacoes = async () => {
    try {
      const filters: any = {};
      
      if (user?.tipo !== 'ADMIN') {
        filters.usuarioAvaliadoId = user?.id;
      }
      
      if (notaMinima) filters.notaMinima = parseInt(notaMinima);
      if (notaMaxima) filters.notaMaxima = parseInt(notaMaxima);
      if (dataInicio) filters.dataInicio = dataInicio;
      if (dataFim) filters.dataFim = dataFim;

      const response = await api.getAvaliacoes(token!, filters);
      const data = response.data || [];
      setAvaliacoes(data);
      setFilteredAvaliacoes(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao carregar avaliações",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadAvaliacoes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => {
    loadAvaliacoes();
  };

  const clearFilters = () => {
    setNotaMinima('');
    setNotaMaxima('');
    setDataInicio('');
    setDataFim('');
    loadAvaliacoes();
  };

  const handleEdit = (avaliacao: Avaliacao) => {
    // Verificar se pode editar (até 24h após criação)
    const criadoEm = new Date(avaliacao.criadoEm);
    const agora = new Date();
    const diferencaHoras = (agora.getTime() - criadoEm.getTime()) / (1000 * 60 * 60);

    if (diferencaHoras > 24) {
      toast({
        title: "Prazo expirado",
        description: "Você só pode editar avaliações até 24h após o registro.",
        variant: "destructive",
      });
      return;
    }

    setAvaliacaoEdit(avaliacao);
    setEditNota(avaliacao.nota);
    setEditComentario(avaliacao.comentario || '');
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!avaliacaoEdit) return;

    if (editNota === 0) {
      toast({
        title: "Nota obrigatória",
        description: "Por favor, selecione uma nota de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.updateAvaliacao(token!, avaliacaoEdit.id, {
        nota: editNota,
        comentario: editComentario.trim() || undefined,
      });

      toast({
        title: "Avaliação atualizada!",
        description: "Suas alterações foram salvas.",
      });

      setShowEditDialog(false);
      loadAvaliacoes();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao atualizar avaliação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (avaliacao: Avaliacao) => {
    setAvaliacaoDelete(avaliacao);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!avaliacaoDelete) return;

    if (user?.tipo === 'ADMIN' && !justificativa.trim()) {
      toast({
        title: "Justificativa obrigatória",
        description: "Por favor, informe o motivo da exclusão.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.deleteAvaliacao(token!, avaliacaoDelete.id, justificativa);

      toast({
        title: "Avaliação excluída!",
        description: user?.tipo === 'ADMIN' 
          ? "A avaliação foi removida e o usuário será notificado."
          : "Sua avaliação foi removida.",
      });

      setShowDeleteDialog(false);
      setJustificativa('');
      loadAvaliacoes();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao excluir avaliação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (nota: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= nota
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const mediaAvaliacoes = avaliacoes.length > 0
    ? (avaliacoes.reduce((sum, av) => sum + av.nota, 0) / avaliacoes.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avaliacoes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{mediaAvaliacoes}</div>
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avaliações 5★</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avaliacoes.filter(av => av.nota === 5).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nota-min">Nota Mínima</Label>
              <Select value={notaMinima || 'all'} onValueChange={(value) => setNotaMinima(value === 'all' ? '' : value)}>
                <SelectTrigger id="nota-min">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="1">1★</SelectItem>
                  <SelectItem value="2">2★</SelectItem>
                  <SelectItem value="3">3★</SelectItem>
                  <SelectItem value="4">4★</SelectItem>
                  <SelectItem value="5">5★</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nota-max">Nota Máxima</Label>
              <Select value={notaMaxima || 'all'} onValueChange={(value) => setNotaMaxima(value === 'all' ? '' : value)}>
                <SelectTrigger id="nota-max">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="1">1★</SelectItem>
                  <SelectItem value="2">2★</SelectItem>
                  <SelectItem value="3">3★</SelectItem>
                  <SelectItem value="4">4★</SelectItem>
                  <SelectItem value="5">5★</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} size="sm">
              <Search className="w-4 h-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recebidas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAvaliacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma avaliação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAvaliacoes.map((avaliacao) => (
                <Card key={avaliacao.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{avaliacao.usuarioDe.nome}</span>
                          <Badge variant="outline" className="text-xs">
                            {avaliacao.usuarioDe.tipo}
                          </Badge>
                        </div>
                        {renderStars(avaliacao.nota)}
                      </div>

                      <div className="flex gap-2">
                        {/* Só pode editar suas próprias avaliações e dentro de 24h */}
                        {user?.id === avaliacao.usuarioDe.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(avaliacao)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Admin pode excluir qualquer avaliação */}
                        {user?.tipo === 'ADMIN' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(avaliacao)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {avaliacao.comentario && (
                      <p className="text-sm text-muted-foreground mb-3">
                        "{avaliacao.comentario}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(avaliacao.criadoEm).toLocaleDateString('pt-BR')}
                      </div>
                      <span>Corrida #{avaliacao.corrida.id}</span>
                      {avaliacao.atualizadoEm && avaliacao.atualizadoEm !== avaliacao.criadoEm && (
                        <Badge variant="outline" className="text-xs">Editada</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Avaliação</DialogTitle>
            <DialogDescription>
              Você pode alterar sua nota e comentário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Estrelas */}
            <div className="space-y-2">
              <Label>Nota *</Label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditNota(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredStar || editNota)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comentário */}
            <div className="space-y-2">
              <Label htmlFor="edit-comentario">
                Comentário (opcional)
                <span className="text-xs text-muted-foreground ml-2">
                  {editComentario.length}/200
                </span>
              </Label>
              <Textarea
                id="edit-comentario"
                placeholder="Conte-nos mais sobre sua experiência..."
                value={editComentario}
                onChange={(e) => setEditComentario(e.target.value)}
                maxLength={200}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading || editNota === 0}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão (Admin) */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Avaliação</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A avaliação será marcada como excluída
              e não contará mais no cálculo da reputação.
            </DialogDescription>
          </DialogHeader>

          {user?.tipo === 'ADMIN' && (
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa *</Label>
              <Textarea
                id="justificativa"
                placeholder="Informe o motivo da exclusão desta avaliação..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isLoading}>
              {isLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinhasAvaliacoes;
