import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, List } from "lucide-react";
import CadastrarFormaPagamento from "@/components/CadastrarFormaPagamento";
import ListaFormasPagamento from "@/components/ListaFormasPagamento";

const FormasPagamento = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormaCadastrada = () => {
    // Força atualização da lista de formas de pagamento
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Formas de Pagamento</h1>
          <p className="text-muted-foreground">Gerencie suas formas de pagamento para usar nas corridas</p>
        </div>

        <Tabs defaultValue="minhas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="minhas" className="gap-2">
              <List className="w-4 h-4" />
              Minhas Formas
            </TabsTrigger>
            <TabsTrigger value="nova" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Nova Forma
            </TabsTrigger>
          </TabsList>

          <TabsContent value="minhas">
            <ListaFormasPagamento refresh={refreshKey} />
          </TabsContent>

          <TabsContent value="nova">
            <CadastrarFormaPagamento onFormaCadastrada={handleFormaCadastrada} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FormasPagamento;
