import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, CreditCard, Star, Navigation } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const PassengerDashboard = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const { toast } = useToast();

  const handleRequestRide = () => {
    if (!origin || !destination) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha origem e destino.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Procurando motorista...",
      description: "Aguarde enquanto encontramos um motorista próximo.",
    });
  };

  const recentRides = [
    { id: 1, driver: "Carlos Silva", rating: 4.8, date: "Hoje, 14:30", destination: "Shopping Center", price: "R$ 25,00" },
    { id: 2, driver: "Ana Santos", rating: 5.0, date: "Ontem, 18:45", destination: "Aeroporto", price: "R$ 65,00" },
    { id: 3, driver: "Pedro Costa", rating: 4.5, date: "21 Nov, 09:15", destination: "Centro", price: "R$ 18,00" },
  ];

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
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Solicitar Corrida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Origem</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-primary" />
                  <Input
                    placeholder="Digite o endereço de partida"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Destino</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-destructive" />
                  <Input
                    placeholder="Digite o endereço de destino"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <Card className="border-2 hover:border-primary cursor-pointer transition-colors">
                  <CardContent className="pt-6 text-center">
                    <p className="font-semibold mb-1">Econômico</p>
                    <p className="text-2xl font-bold text-primary">R$ 18</p>
                    <p className="text-xs text-muted-foreground">5 min</p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-secondary cursor-pointer transition-colors">
                  <CardContent className="pt-6 text-center">
                    <p className="font-semibold mb-1">Conforto</p>
                    <p className="text-2xl font-bold text-secondary">R$ 25</p>
                    <p className="text-xs text-muted-foreground">3 min</p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-accent cursor-pointer transition-colors">
                  <CardContent className="pt-6 text-center">
                    <p className="font-semibold mb-1">Premium</p>
                    <p className="text-2xl font-bold text-accent">R$ 40</p>
                    <p className="text-xs text-muted-foreground">8 min</p>
                  </CardContent>
                </Card>
              </div>

              <Button className="w-full" size="lg" onClick={handleRequestRide}>
                Solicitar Corrida
              </Button>
            </CardContent>
          </Card>

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
                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gerenciar Pagamentos
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Rides */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Corridas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{ride.destination}</p>
                        <p className="text-sm text-muted-foreground">{ride.driver}</p>
                        <p className="text-xs text-muted-foreground">{ride.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{ride.price}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span>{ride.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PassengerDashboard;
