import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Home, Briefcase, ShoppingCart, Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";

interface EnderecoFavorito {
  id: number;
  usuarioId: number;
  nomeLocal: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  criadoEm: string;
  atualizadoEm: string;
}

const EnderecosFavoritos = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [enderecos, setEnderecos] = useState<EnderecoFavorito[]>([]);
  const [estatisticas, setEstatisticas] = useState({ totalEnderecos: 0, limiteMaximo: 10, enderecosDisponiveis: 10 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEndereco, setSelectedEndereco] = useState<EnderecoFavorito | null>(null);

  // Form
  const [nomeLocal, setNomeLocal] = useState("");
  const [endereco, setEndereco] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const loadEnderecos = async (busca?: string) => {
    try {
      const response = await api.getEnderecosFavoritos(token!, busca);
      setEnderecos(response.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao carregar endereços",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const loadEstatisticas = async () => {
    try {
      const response = await api.getEstatisticasEnderecosFavoritos(token!);
      setEstatisticas(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  useEffect(() => {
    loadEnderecos();
    loadEstatisticas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    loadEnderecos(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    loadEnderecos();
  };

  const openCreateDialog = () => {
    setNomeLocal("");
    setEndereco("");
    setLatitude("");
    setLongitude("");
    setShowCreateDialog(true);
  };

  const openEditDialog = (end: EnderecoFavorito) => {
    setSelectedEndereco(end);
    setNomeLocal(end.nomeLocal);
    setEndereco(end.endereco);
    setLatitude(end.latitude?.toString() || "");
    setLongitude(end.longitude?.toString() || "");
    setShowEditDialog(true);
  };

  const openDeleteDialog = (end: EnderecoFavorito) => {
    setSelectedEndereco(end);
    setShowDeleteDialog(true);
  };

  const handleCreate = async () => {
    if (!nomeLocal.trim() || !endereco.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do local e endereço são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (nomeLocal.length > 50) {
      toast({
        title: "Nome muito longo",
        description: "O nome do local deve ter no máximo 50 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data: any = {
        nomeLocal: nomeLocal.trim(),
        endereco: endereco.trim(),
      };

      if (latitude && longitude) {
        data.latitude = parseFloat(latitude);
        data.longitude = parseFloat(longitude);
      }

      await api.createEnderecoFavorito(token!, data);

      toast({
        title: "Endereço salvo!",
        description: "Seu endereço favorito foi cadastrado com sucesso.",
      });

      setShowCreateDialog(false);
      loadEnderecos();
      loadEstatisticas();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao salvar endereço",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedEndereco) return;

    if (!nomeLocal.trim() || !endereco.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do local e endereço são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data: any = {
        nomeLocal: nomeLocal.trim(),
        endereco: endereco.trim(),
      };

      if (latitude && longitude) {
        data.latitude = parseFloat(latitude);
        data.longitude = parseFloat(longitude);
      }

      await api.updateEnderecoFavorito(token!, selectedEndereco.id, data);

      toast({
        title: "Endereço atualizado!",
        description: "Suas alterações foram salvas.",
      });

      setShowEditDialog(false);
      loadEnderecos();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao atualizar endereço",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEndereco) return;

    setIsLoading(true);
    try {
      await api.deleteEnderecoFavorito(token!, selectedEndereco.id);

      toast({
        title: "Endereço excluído!",
        description: "O endereço foi removido dos seus favoritos.",
      });

      setShowDeleteDialog(false);
      loadEnderecos();
      loadEstatisticas();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao excluir endereço",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (nome: string) => {
    const nomeLower = nome.toLowerCase();
    if (nomeLower.includes('casa') || nomeLower.includes('residência')) return Home;
    if (nomeLower.includes('trabalho') || nomeLower.includes('emprego') || nomeLower.includes('escritório')) return Briefcase;
    if (nomeLower.includes('mercado') || nomeLower.includes('shopping')) return ShoppingCart;
    return MapPin;
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Meus Endereços Favoritos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {estatisticas.totalEnderecos} de {estatisticas.limiteMaximo} endereços salvos
            </div>
            <Badge variant={estatisticas.enderecosDisponiveis > 0 ? "default" : "destructive"}>
              {estatisticas.enderecosDisponiveis} disponíveis
            </Badge>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all" 
              style={{ width: `${(estatisticas.totalEnderecos / estatisticas.limiteMaximo) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Busca e Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="w-4 h-4" />
              </Button>
              {searchQuery && (
                <Button onClick={clearSearch} variant="outline">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button 
              onClick={openCreateDialog}
              disabled={estatisticas.enderecosDisponiveis === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Endereço
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Endereços */}
      <div className="grid md:grid-cols-2 gap-4">
        {enderecos.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum endereço favorito cadastrado</p>
              <p className="text-sm mt-2">Adicione seus endereços mais utilizados para facilitar suas solicitações</p>
            </CardContent>
          </Card>
        ) : (
          enderecos.map((end) => {
            const Icon = getIcon(end.nomeLocal);
            return (
              <Card key={end.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{end.nomeLocal}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{end.endereco}</p>
                      </div>
                    </div>
                  </div>

                  {(end.latitude && end.longitude) && (
                    <div className="text-xs text-muted-foreground mb-3">
                      📍 {end.latitude.toFixed(4)}, {end.longitude.toFixed(4)}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(end)} className="flex-1">
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openDeleteDialog(end)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog Criar */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Endereço Favorito</DialogTitle>
            <DialogDescription>
              Salve um endereço que você usa com frequência
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Local *</Label>
              <Input
                id="nome"
                placeholder="Ex: Casa, Trabalho, Academia..."
                value={nomeLocal}
                onChange={(e) => setNomeLocal(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">{nomeLocal.length}/50 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço Completo *</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro, cidade..."
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (opcional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-23.5505"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (opcional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="-46.6333"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Endereço'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Endereço</DialogTitle>
            <DialogDescription>
              Atualize as informações do endereço
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Local *</Label>
              <Input
                id="edit-nome"
                placeholder="Ex: Casa, Trabalho, Academia..."
                value={nomeLocal}
                onChange={(e) => setNomeLocal(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endereco">Endereço Completo *</Label>
              <Input
                id="edit-endereco"
                placeholder="Rua, número, bairro, cidade..."
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Endereço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{selectedEndereco?.nomeLocal}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnderecosFavoritos;
