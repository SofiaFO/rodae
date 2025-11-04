import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTypes?: ('PASSAGEIRO' | 'MOTORISTA' | 'ADMIN')[];
}

export const ProtectedRoute = ({ children, allowedTypes }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (allowedTypes && user && !allowedTypes.includes(user.tipo)) {
      navigate('/');
    }
  }, [isAuthenticated, user, allowedTypes, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (allowedTypes && user && !allowedTypes.includes(user.tipo)) {
    return null;
  }

  return <>{children}</>;
};
