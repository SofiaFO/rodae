import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Star, Clock, TrendingUp, MapPin, Navigation2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import ListaCorridas from "@/components/ListaCorridas";
import CorridasDisponiveis from "@/components/CorridasDisponiveis";
import { useToast } from "@/hooks/use-toast";

const DriverDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    toast({
      title: isOnline ? "Você está offline" : "Você está online",
      description: isOnline 
        ? "Você não receberá mais solicitações de corrida." 
        : "Agora você pode receber solicitações de corrida.",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel do Motorista</h1>
          <p className="text-muted-foreground">Gerencie suas corridas e ganhos</p>
        </div>

        {/* Online Status Toggle */}
        <Card className="mb-6 border-2" style={{ borderColor: isOnline ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                <div>
                  <p className="font-semibold text-lg">
                    {isOnline ? "Você está online" : "Você está offline"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isOnline ? "Pronto para receber corridas" : "Ative para receber corridas"}
                  </p>
                </div>
              </div>
              <Button 
                size="lg"
                onClick={handleToggleOnline}
                variant={isOnline ? "destructive" : "default"}
              >
                {isOnline ? "Ficar Offline" : "Ficar Online"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          {/* Earnings Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">R$ 108,00</div>
              <p className="text-xs text-muted-foreground">3 corridas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">R$ 845,00</div>
              <p className="text-xs text-muted-foreground">+12% vs semana anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
              <Star className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">4.9</div>
              <p className="text-xs text-muted-foreground">156 avaliações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Horas Online</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6.5h</div>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Corridas Disponíveis ou Minhas Corridas */}
          <div className="lg:col-span-2">
            {isOnline ? (
              <CorridasDisponiveis />
            ) : (
              <Tabs defaultValue="em_andamento" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
                  <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
                  <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
                </TabsList>
                <TabsContent value="em_andamento" className="mt-6">
                  <ListaCorridas 
                    filtroStatus="EM_ANDAMENTO" 
                    titulo="Minhas Corridas em Andamento"
                    refresh={refreshKey}
                  />
                </TabsContent>
                <TabsContent value="finalizadas" className="mt-6">
                  <ListaCorridas 
                    filtroStatus="FINALIZADA" 
                    titulo="Corridas Finalizadas"
                    refresh={refreshKey}
                  />
                </TabsContent>
                <TabsContent value="canceladas" className="mt-6">
                  <ListaCorridas 
                    filtroStatus="CANCELADA" 
                    titulo="Corridas Canceladas"
                    refresh={refreshKey}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Ver Mapa de Demanda
                </Button>
                <Button className="w-full" variant="outline">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Histórico de Ganhos
                </Button>
                <Button className="w-full" variant="outline">
                  <Star className="w-4 h-4 mr-2" />
                  Minhas Avaliações
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metas do Mês</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Corridas</span>
                    <span className="text-sm font-semibold">68/100</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary rounded-full h-2" style={{ width: '68%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Faturamento</span>
                    <span className="text-sm font-semibold">R$ 3.2k/5k</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-secondary rounded-full h-2" style={{ width: '64%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
