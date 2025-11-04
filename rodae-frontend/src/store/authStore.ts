import { create } from 'zustand';

interface User {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  tipo: 'PASSAGEIRO' | 'MOTORISTA' | 'ADMIN';
  status: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Funções helper para localStorage
const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const data = JSON.parse(stored);
      return data.state || { token: null, user: null, isAuthenticated: false };
    }
  } catch (error) {
    console.error('Erro ao carregar autenticação:', error);
  }
  return { token: null, user: null, isAuthenticated: false };
};

const setStoredAuth = (state: Partial<AuthState>) => {
  try {
    localStorage.setItem('auth-storage', JSON.stringify({ state }));
  } catch (error) {
    console.error('Erro ao salvar autenticação:', error);
  }
};

const initialState = getStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  login: (token, user) => {
    const newState = { token, user, isAuthenticated: true };
    setStoredAuth(newState);
    set(newState);
  },
  logout: () => {
    const newState = { token: null, user: null, isAuthenticated: false };
    setStoredAuth(newState);
    set(newState);
  },
  updateUser: (user) => {
    set((state) => {
      const newState = { ...state, user };
      setStoredAuth(newState);
      return newState;
    });
  },
}));
