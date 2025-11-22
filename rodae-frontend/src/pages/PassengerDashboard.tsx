import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CreditCard, Star, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import SolicitarCorrida from "@/components/SolicitarCorrida";
import ListaCorridas from "@/components/ListaCorridas";
import MinhasAvaliacoes from "@/components/MinhasAvaliacoes";
import EnderecosFavoritos from "@/components/EnderecosFavoritos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PassengerDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleCorridaCriada = () => {
    // Força atualização da lista de corridas
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Olá, Passageiro!</h1>
          <p className="text-muted-foreground">Para onde você quer ir hoje?</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Request Ride Card */}
          <div className="lg:col-span-2">
            <SolicitarCorrida onCorridaCriada={handleCorridaCriada} />
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm">Corridas totais</span>
                  </div>
                  <span className="font-bold">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-accent" />
                    <span className="text-sm">Avaliação média</span>
                  </div>
                  <span className="font-bold">4.9</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-secondary" />
                    <span className="text-sm">Gastos totais</span>
                  </div>
                  <span className="font-bold">R$ 2.450</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formas de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/formas-pagamento')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gerenciar Pagamentos
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Minhas Corridas */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="em_andamento" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
                <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
                <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
                <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
                <TabsTrigger value="enderecos">Endereços</TabsTrigger>
              </TabsList>
              <TabsContent value="em_andamento" className="mt-6">
                <ListaCorridas 
                  filtroStatus="EM_ANDAMENTO" 
                  titulo="Corridas em Andamento"
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
              <TabsContent value="avaliacoes" className="mt-6">
                <MinhasAvaliacoes />
              </TabsContent>
              <TabsContent value="enderecos" className="mt-6">
                <EnderecosFavoritos />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PassengerDashboard;
