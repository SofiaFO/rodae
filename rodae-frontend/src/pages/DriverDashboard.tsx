import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Star, Clock, TrendingUp, MapPin, Navigation2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const DriverDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
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

  const todayEarnings = [
    { time: "14:30", origin: "Centro", destination: "Shopping", value: "R$ 25,00", rating: 5 },
    { time: "16:15", origin: "Aeroporto", destination: "Jardins", value: "R$ 65,00", rating: 5 },
    { time: "18:45", origin: "Vila Nova", destination: "Centro", value: "R$ 18,00", rating: 4 },
  ];

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
          {/* Today's Rides */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Corridas de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayEarnings.map((ride, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Navigation2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{ride.origin} → {ride.destination}</p>
                        <p className="text-sm text-muted-foreground">{ride.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">{ride.value}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span>{ride.rating}.0</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
