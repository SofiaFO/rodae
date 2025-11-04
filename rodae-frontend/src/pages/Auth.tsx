import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, User, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'PASSAGEIRO' | 'MOTORISTA'>('PASSAGEIRO');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const senha = formData.get('senha') as string;

    try {
      const response = await api.login(email, senha);
      
      login(response.data.token, response.data.usuario);
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${response.data.usuario.nome}!`,
      });

      // Redirecionar baseado no tipo de usuário
      if (response.data.usuario.tipo === 'PASSAGEIRO') {
        navigate('/passageiro');
      } else if (response.data.usuario.tipo === 'MOTORISTA') {
        navigate('/motorista');
      } else if (response.data.usuario.tipo === 'ADMIN') {
        navigate('/admin');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const userData: any = {
      tipo: userType,
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      senha: formData.get('senha') as string,
    };

    // Se for motorista, adicionar campos específicos
    if (userType === 'MOTORISTA') {
      userData.cnh = formData.get('cnh') as string;
      userData.validadeCNH = formData.get('validadeCNH') as string;
      userData.docVeiculo = formData.get('docVeiculo') as string;
      userData.placaVeiculo = formData.get('placaVeiculo') as string;
      userData.modeloCorVeiculo = formData.get('modeloCorVeiculo') as string;
    }

    try {
      const response = await api.register(userData);
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: response.data.message || "Sua conta foi criada.",
      });

      // Se for passageiro, faz login automático
      if (userType === 'PASSAGEIRO' && response.data.token) {
        login(response.data.token, response.data.usuario);
        navigate('/passageiro');
      } else {
        // Se for motorista, mostra mensagem e vai para login
        toast({
          title: "Aguarde aprovação",
          description: "Sua conta de motorista está em análise.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 font-bold text-xl">
        <div className="bg-gradient-primary p-2 rounded-lg">
          <Car className="w-6 h-6 text-primary-foreground" />
        </div>
        <span>Rodaê</span>
      </Link>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Bem-vindo ao Rodaê
          </CardTitle>
          <CardDescription className="text-center">
            Entre ou cadastre-se para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input 
                    id="email-login"
                    name="email"
                    type="email" 
                    placeholder="seu@email.com" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Senha</Label>
                  <Input 
                    id="password-login"
                    name="senha"
                    type="password" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
                <Button type="button" variant="link" className="w-full">
                  Esqueceu a senha?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-type">Tipo de Conta</Label>
                  <select 
                    id="user-type"
                    name="tipo"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as 'PASSAGEIRO' | 'MOTORISTA')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="PASSAGEIRO">Passageiro</option>
                    <option value="MOTORISTA">Motorista</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name"
                    name="nome"
                    type="text" 
                    placeholder="João Silva" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-register">Email</Label>
                  <Input 
                    id="email-register"
                    name="email"
                    type="email" 
                    placeholder="seu@email.com" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone"
                    name="telefone"
                    type="tel" 
                    placeholder="(11) 99999-9999" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register">Senha</Label>
                  <Input 
                    id="password-register"
                    name="senha"
                    type="password" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>

                {/* Campos adicionais para motorista */}
                {userType === 'MOTORISTA' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cnh">CNH</Label>
                      <Input 
                        id="cnh"
                        name="cnh"
                        type="text" 
                        placeholder="12345678900" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validadeCNH">Validade da CNH</Label>
                      <Input 
                        id="validadeCNH"
                        name="validadeCNH"
                        type="date" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="docVeiculo">Documento do Veículo</Label>
                      <Input 
                        id="docVeiculo"
                        name="docVeiculo"
                        type="text" 
                        placeholder="CRLV123456" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placaVeiculo">Placa do Veículo</Label>
                      <Input 
                        id="placaVeiculo"
                        name="placaVeiculo"
                        type="text" 
                        placeholder="ABC1D23" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modeloCorVeiculo">Modelo e Cor do Veículo</Label>
                      <Input 
                        id="modeloCorVeiculo"
                        name="modeloCorVeiculo"
                        type="text" 
                        placeholder="Honda Civic Prata" 
                        required 
                      />
                    </div>
                  </>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Cadastrando..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <User className="w-5 h-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Para Passageiros</p>
                <p className="text-muted-foreground">Solicite corridas rápidas e seguras</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <UserCog className="w-5 h-5 text-secondary" />
              <div className="text-sm">
                <p className="font-medium">Para Motoristas</p>
                <p className="text-muted-foreground">Ganhe dinheiro dirigindo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
