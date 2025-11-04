import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car, Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <span>Rodaê</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link to="/passageiro" className="hover:text-primary transition-colors">
                  Para Passageiros
                </Link>
                <Link to="/motorista" className="hover:text-primary transition-colors">
                  Para Motoristas
                </Link>
                <Link to="/sobre" className="hover:text-primary transition-colors">
                  Sobre
                </Link>
                <Link to="/auth">
                  <Button variant="outline">Entrar</Button>
                </Link>
                <Link to="/auth">
                  <Button>Cadastrar</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/perfil" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                  <User className="w-4 h-4" />
                  <span>{user?.nome}</span>
                </Link>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              {!isAuthenticated ? (
                <>
                  <Link 
                    to="/passageiro" 
                    className="hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Para Passageiros
                  </Link>
                  <Link 
                    to="/motorista" 
                    className="hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Para Motoristas
                  </Link>
                  <Link 
                    to="/sobre" 
                    className="hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Sobre
                  </Link>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">Entrar</Button>
                  </Link>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Cadastrar</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/perfil" 
                    className="flex items-center gap-2 py-2 hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>{user?.nome}</span>
                  </Link>
                  <Button variant="outline" onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
