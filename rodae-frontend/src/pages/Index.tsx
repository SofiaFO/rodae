import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, MapPin, CreditCard, Star, Shield, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroImage from "@/assets/hero-ride.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Mobilidade Urbana <br />
              <span className="text-accent">Inteligente e Segura</span>
            </h1>
            <p className="text-xl mb-8 text-white/90 animate-fade-in">
              Conecte-se com motoristas confiáveis em segundos. Corridas rápidas, 
              pagamentos seguros e avaliações transparentes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8">
                  Solicitar Corrida
                </Button>
              </Link>
              <Link to="/motorista">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-lg px-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  Seja um Motorista
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4">
            Por que escolher o Rodaê?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Uma plataforma completa pensada para oferecer a melhor experiência 
            tanto para passageiros quanto para motoristas.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow animate-fade-in">
              <CardContent className="pt-8">
                <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Rastreamento em Tempo Real</h3>
                <p className="text-muted-foreground">
                  Acompanhe sua corrida em tempo real com precisão de GPS. 
                  Saiba exatamente onde está seu motorista.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow animate-fade-in">
              <CardContent className="pt-8">
                <div className="bg-secondary/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Pagamentos Seguros</h3>
                <p className="text-muted-foreground">
                  Múltiplas opções de pagamento integradas com total segurança. 
                  Cartão, PIX ou dinheiro.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow animate-fade-in">
              <CardContent className="pt-8">
                <div className="bg-accent/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Sistema de Avaliação</h3>
                <p className="text-muted-foreground">
                  Avalie e seja avaliado. Construa sua reputação e escolha 
                  motoristas com as melhores notas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow animate-fade-in">
              <CardContent className="pt-8">
                <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Segurança Garantida</h3>
                <p className="text-muted-foreground">
                  Todos os motoristas são verificados. Compartilhe sua corrida 
                  com amigos e familiares.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow animate-fade-in">
              <CardContent className="pt-8">
                <div className="bg-secondary/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Disponível 24/7</h3>
                <p className="text-muted-foreground">
                  Motoristas disponíveis a qualquer hora do dia ou da noite. 
                  Onde você precisar, quando precisar.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow animate-fade-in">
              <CardContent className="pt-8">
                <div className="bg-accent/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  <Car className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Frota Variada</h3>
                <p className="text-muted-foreground">
                  Escolha entre diferentes categorias de veículos de acordo 
                  com sua necessidade e orçamento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Cadastre-se agora e experimente a nova forma de se locomover pela cidade. 
            É rápido, fácil e seguro.
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
            >
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="bg-gradient-primary p-2 rounded-lg">
                  <Car className="w-6 h-6 text-primary-foreground" />
                </div>
                <span>Rodaê</span>
              </div>
              <p className="text-muted-foreground">
                Mobilidade urbana inteligente e segura para todos.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Passageiros</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/auth" className="hover:text-primary">Solicitar Corrida</Link></li>
                <li><Link to="/passageiro" className="hover:text-primary">Como Funciona</Link></li>
                <li><Link to="#" className="hover:text-primary">Preços</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Motoristas</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/motorista" className="hover:text-primary">Seja um Motorista</Link></li>
                <li><Link to="#" className="hover:text-primary">Requisitos</Link></li>
                <li><Link to="#" className="hover:text-primary">Ganhos</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/sobre" className="hover:text-primary">Sobre Nós</Link></li>
                <li><Link to="#" className="hover:text-primary">Contato</Link></li>
                <li><Link to="#" className="hover:text-primary">Suporte</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; 2024 Rodaê. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
