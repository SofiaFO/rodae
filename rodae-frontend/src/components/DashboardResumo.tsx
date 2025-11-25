import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, DollarSign, RefreshCw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface DashboardData {
  usuarios: {
    total: number;
    ativos: number;
    inativos: number;
    pendentes: number;
  };
  corridas: {
    total: number;
    emAndamento: number;
    finalizadas: number;
    canceladas: number;
  };
  financeiro: {
    receitaTotal: number;
    reembolsos: {
      total: number;
      quantidade: number;
    };
    pagamentosPendentes: number;
  };
}

const DashboardResumo = () => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await api.getDashboardAdmin(token!);
      setDashboardData(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao carregar dashboard",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !dashboardData) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-5 w-5 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total de Usuários",
      value: dashboardData.usuarios.total,
      description: `${dashboardData.usuarios.ativos} ativos, ${dashboardData.usuarios.inativos} inativos, ${dashboardData.usuarios.pendentes} pendentes`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Corridas",
      value: dashboardData.corridas.total,
      description: `${dashboardData.corridas.emAndamento} em andamento, ${dashboardData.corridas.finalizadas} finalizadas`,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Receita Total",
      value: `R$ ${dashboardData.financeiro.receitaTotal.toFixed(2)}`,
      description: `${dashboardData.financeiro.pagamentosPendentes} pagamentos pendentes`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Reembolsos",
      value: `R$ ${dashboardData.financeiro.reembolsos.total.toFixed(2)}`,
      description: `${dashboardData.financeiro.reembolsos.quantidade} reembolsos realizados`,
      icon: RefreshCw,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Resumo</h2>
          <p className="text-muted-foreground">Visão geral do sistema em tempo real</p>
        </div>
        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards de Detalhamento */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Distribuição de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ativos</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(dashboardData.usuarios.ativos / dashboardData.usuarios.total) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold">{dashboardData.usuarios.ativos}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inativos</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-500"
                      style={{ width: `${(dashboardData.usuarios.inativos / dashboardData.usuarios.total) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold">{dashboardData.usuarios.inativos}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500"
                      style={{ width: `${(dashboardData.usuarios.pendentes / dashboardData.usuarios.total) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold">{dashboardData.usuarios.pendentes}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-green-600" />
              Status das Corridas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Em Andamento</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${(dashboardData.corridas.emAndamento / dashboardData.corridas.total) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold">{dashboardData.corridas.emAndamento}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Finalizadas</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(dashboardData.corridas.finalizadas / dashboardData.corridas.total) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold">{dashboardData.corridas.finalizadas}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Canceladas</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500"
                      style={{ width: `${(dashboardData.corridas.canceladas / dashboardData.corridas.total) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold">{dashboardData.corridas.canceladas}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardResumo;
