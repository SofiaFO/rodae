import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Car, CheckCircle, XCircle, Eye, Trash2, Clock, Search, X, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import ListaCorridas from "@/components/ListaCorridas";

interface Motorista {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  tipo: string;
  status: string;
  motorista: {
    id: number;
    cnh: string;
    validadeCNH: string;
    docVeiculo: string;
    placaVeiculo: string;
    modeloCorVeiculo: string;
  };
}

interface Passageiro {
  id: number;
  usuario: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
    tipo: string;
    status: string;
    criadoEm: string;
  };
}

const AdminDashboard = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [passageiros, setPassageiros] = useState<Passageiro[]>([]);
  const [filteredPassageiros, setFilteredPassageiros] = useState<Passageiro[]>([]);
  const [filteredMotoristas, setFilteredMotoristas] = useState<Motorista[]>([]);
  const [selectedMotorista, setSelectedMotorista] = useState<Motorista | null>(null);
  const [selectedPassageiro, setSelectedPassageiro] = useState<Passageiro | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPassageiroDialog, setShowPassageiroDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeletePassageiroDialog, setShowDeletePassageiroDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros para Passageiros
  const [passageiroFilters, setPassageiroFilters] = useState({
    nome: '',
  });

  // Filtros para Motoristas
  const [motoristaFilters, setMotoristaFilters] = useState({
    nome: '',
    status: 'TODOS' as 'TODOS' | 'PENDENTE' | 'ATIVO' | 'INATIVO',
  });
  const [refreshCorridas, setRefreshCorridas] = useState(0);

  const loadMotoristas = async () => {
    try {
      console.log('Carregando motoristas...');
      const response = await api.getAllMotoristas(token!);
      console.log('Resposta da API:', response);
      
      const allMotoristas = response.data || [];
      console.log('Motoristas recebidos:', allMotoristas);
      
      setMotoristas(allMotoristas);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao carregar motoristas:', error);
      toast({
        title: "Erro ao carregar motoristas",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const loadPassageiros = async () => {
    try {
      console.log('Carregando passageiros...');
      const response = await api.getAllPassageiros(token!);
      console.log('Passageiros recebidos:', response);
      
      setPassageiros(response.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao carregar passageiros:', error);
      toast({
        title: "Erro ao carregar passageiros",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadMotoristas();
    loadPassageiros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrar passageiros quando os filtros mudarem
  useEffect(() => {
    let filtered = [...passageiros];

    if (passageiroFilters.nome) {
      filtered = filtered.filter(p =>
        p.usuario.nome.toLowerCase().includes(passageiroFilters.nome.toLowerCase())
      );
    }

    setFilteredPassageiros(filtered);
  }, [passageiros, passageiroFilters]);

  // Filtrar motoristas quando os filtros mudarem
  useEffect(() => {
    let filtered = [...motoristas];

    if (motoristaFilters.nome) {
      filtered = filtered.filter(m =>
        m.nome.toLowerCase().includes(motoristaFilters.nome.toLowerCase())
      );
    }

    if (motoristaFilters.status !== 'TODOS') {
      filtered = filtered.filter(m =>
        m.status === motoristaFilters.status
      );
    }

    setFilteredMotoristas(filtered);
  }, [motoristas, motoristaFilters]);

  const clearPassageiroFilters = () => {
    setPassageiroFilters({ nome: '' });
  };

  const clearMotoristaFilters = () => {
    setMotoristaFilters({ nome: '', status: 'TODOS' });
  };

  const handleViewDetails = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setShowDetailsDialog(true);
  };

  const handleAprovar = async (motorista: Motorista) => {
    setIsLoading(true);
    try {
      await api.aprovarMotorista(token!, motorista.motorista.id);
      toast({
        title: "Motorista aprovado",
        description: `${motorista.nome} foi aprovado com sucesso!`,
      });
      await loadMotoristas();
      setShowDetailsDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao aprovar motorista",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMotorista) return;
    
    setIsLoading(true);
    try {
      // Usa a rota de rejeitar para desativar o motorista
      await api.rejeitarMotorista(token!, selectedMotorista.motorista.id);
      toast({
        title: "Motorista desativado",
        description: `${selectedMotorista.nome} foi desativado da plataforma.`,
      });
      await loadMotoristas();
      setShowDeleteDialog(false);
      setShowDetailsDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao desativar motorista",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePassageiroConfirm = async () => {
    if (!selectedPassageiro) return;
    
    setIsLoading(true);
    try {
      await api.deletePassageiro(token!, selectedPassageiro.id);
      toast({
        title: "Passageiro desativado",
        description: `${selectedPassageiro.usuario.nome} foi removido da plataforma.`,
      });
      await loadPassageiros();
      setShowDeletePassageiroDialog(false);
      setShowPassageiroDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao desativar passageiro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDeletePassageiroDialog = (passageiro: Passageiro) => {
    setSelectedPassageiro(passageiro);
    setShowDeletePassageiroDialog(true);
  };

  const openDeleteDialog = (motorista: Motorista) => {
    setSelectedMotorista(motorista);
    setShowDeleteDialog(true);
  };

  const stats = [
    { 
      title: "Total de Motoristas", 
      value: filteredMotoristas.length.toString(), 
      icon: Car, 
      color: "text-blue-600" 
    },
    { 
      title: "Motoristas Pendentes", 
      value: filteredMotoristas.filter(m => m.status === 'PENDENTE').length.toString(), 
      icon: Clock, 
      color: "text-yellow-600" 
    },
    { 
      title: "Motoristas Ativos", 
      value: filteredMotoristas.filter(m => m.status === 'ATIVO').length.toString(), 
      icon: CheckCircle, 
      color: "text-green-600" 
    },
    { 
      title: "Total de Passageiros", 
      value: filteredPassageiros.length.toString(), 
      icon: Users, 
      color: "text-purple-600" 
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerenciamento de motoristas da plataforma Rodaê</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs para Motoristas, Passageiros e Corridas */}
        <Tabs defaultValue="motoristas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="motoristas" className="gap-2">
              <Car className="w-4 h-4" />
              Motoristas ({filteredMotoristas.length})
            </TabsTrigger>
            <TabsTrigger value="passageiros" className="gap-2">
              <Users className="w-4 h-4" />
              Passageiros ({filteredPassageiros.length})
            </TabsTrigger>
            <TabsTrigger value="corridas" className="gap-2">
              <MapPin className="w-4 h-4" />
              Corridas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="motoristas">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Motoristas</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4" />
                    <h3 className="font-semibold">Filtros de Busca</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="motorista-nome">Nome</Label>
                      <Input
                        id="motorista-nome"
                        placeholder="Buscar por nome..."
                        value={motoristaFilters.nome}
                        onChange={(e) => setMotoristaFilters({ ...motoristaFilters, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motorista-status">Status</Label>
                      <Select
                        value={motoristaFilters.status}
                        onValueChange={(value) => setMotoristaFilters({ ...motoristaFilters, status: value as any })}
                      >
                        <SelectTrigger id="motorista-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODOS">Todos</SelectItem>
                          <SelectItem value="PENDENTE">Pendente</SelectItem>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearMotoristaFilters}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>CNH</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMotoristas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum motorista encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMotoristas.map((motorista) => (
                        <TableRow key={motorista.id}>
                          <TableCell className="font-medium">{motorista.nome}</TableCell>
                          <TableCell>{motorista.email}</TableCell>
                          <TableCell>{motorista.telefone}</TableCell>
                          <TableCell>{motorista.motorista?.cnh || 'N/A'}</TableCell>
                          <TableCell>
                            {motorista.status === 'PENDENTE' && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                Pendente
                              </Badge>
                            )}
                            {motorista.status === 'ATIVO' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                Ativo
                              </Badge>
                            )}
                            {motorista.status === 'INATIVO' && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(motorista)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(motorista)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passageiros">
            <Card>
              <CardHeader>
                <CardTitle>Passageiros Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4" />
                    <h3 className="font-semibold">Filtros de Busca</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="passageiro-nome">Nome</Label>
                      <Input
                        id="passageiro-nome"
                        placeholder="Buscar por nome..."
                        value={passageiroFilters.nome}
                        onChange={(e) => setPassageiroFilters({ ...passageiroFilters, nome: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearPassageiroFilters}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPassageiros.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum passageiro cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPassageiros.map((passageiro) => (
                        <TableRow key={passageiro.id}>
                          <TableCell className="font-medium">{passageiro.usuario.nome}</TableCell>
                          <TableCell>{passageiro.usuario.email}</TableCell>
                          <TableCell>{passageiro.usuario.telefone}</TableCell>
                          <TableCell>{new Date(passageiro.usuario.criadoEm).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPassageiro(passageiro);
                                setShowPassageiroDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeletePassageiroDialog(passageiro)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="corridas">
            <Tabs defaultValue="em_andamento" className="space-y-4">
              <TabsList>
                <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
                <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
                <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
              </TabsList>

              <TabsContent value="em_andamento">
                <ListaCorridas 
                  filtroStatus="EM_ANDAMENTO" 
                  titulo="Corridas em Andamento" 
                />
              </TabsContent>

              <TabsContent value="finalizadas">
                <ListaCorridas 
                  filtroStatus="FINALIZADA" 
                  titulo="Corridas Finalizadas" 
                />
              </TabsContent>

              <TabsContent value="canceladas">
                <ListaCorridas 
                  filtroStatus="CANCELADA" 
                  titulo="Corridas Canceladas" 
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalhes do Motorista */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Motorista</DialogTitle>
              <DialogDescription>
                Informações completas do motorista
              </DialogDescription>
            </DialogHeader>
            {selectedMotorista && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Nome</h4>
                    <p className="text-base">{selectedMotorista.nome}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Email</h4>
                    <p className="text-base">{selectedMotorista.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Telefone</h4>
                    <p className="text-base">{selectedMotorista.telefone}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Status</h4>
                    <Badge 
                      variant="outline" 
                      className={selectedMotorista.status === 'ATIVO' 
                        ? "bg-green-50 text-green-700 border-green-300" 
                        : "bg-yellow-50 text-yellow-700 border-yellow-300"}
                    >
                      {selectedMotorista.status}
                    </Badge>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">Informações do Veículo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">CNH</h4>
                      <p className="text-base">{selectedMotorista.motorista.cnh}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Validade CNH</h4>
                      <p className="text-base">{new Date(selectedMotorista.motorista.validadeCNH).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Documento do Veículo</h4>
                      <p className="text-base">{selectedMotorista.motorista.docVeiculo}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Placa</h4>
                      <p className="text-base">{selectedMotorista.motorista.placaVeiculo}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Modelo e Cor</h4>
                    <p className="text-base">{selectedMotorista.motorista.modeloCorVeiculo}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDetailsDialog(false);
                  if (selectedMotorista) openDeleteDialog(selectedMotorista);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Desativar da Plataforma
              </Button>
              {selectedMotorista?.status === 'PENDENTE' && (
                <Button
                  onClick={() => handleAprovar(selectedMotorista)}
                  disabled={isLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isLoading ? 'Aprovando...' : 'Aprovar Motorista'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Desativação</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja desativar {selectedMotorista?.nome} da plataforma? O motorista será marcado como inativo.
              </DialogDescription>
            </DialogHeader>
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
                onClick={handleDeleteConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Desativando...' : 'Confirmar Desativação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes do Passageiro */}
        <Dialog open={showPassageiroDialog} onOpenChange={setShowPassageiroDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Passageiro</DialogTitle>
              <DialogDescription>
                Informações do passageiro cadastrado
              </DialogDescription>
            </DialogHeader>
            {selectedPassageiro && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Nome</h4>
                    <p className="text-base">{selectedPassageiro.usuario.nome}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Email</h4>
                    <p className="text-base">{selectedPassageiro.usuario.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Telefone</h4>
                    <p className="text-base">{selectedPassageiro.usuario.telefone}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Data de Cadastro</h4>
                    <p className="text-base">{new Date(selectedPassageiro.usuario.criadoEm).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Status</h4>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      {selectedPassageiro.usuario.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowPassageiroDialog(false);
                  if (selectedPassageiro) openDeletePassageiroDialog(selectedPassageiro);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Desativar da Plataforma
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPassageiroDialog(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão do Passageiro */}
        <Dialog open={showDeletePassageiroDialog} onOpenChange={setShowDeletePassageiroDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Desativação</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja desativar {selectedPassageiro?.usuario.nome} da plataforma? Esta ação removerá o passageiro do sistema.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeletePassageiroDialog(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePassageiroConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Desativando...' : 'Confirmar Desativação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
