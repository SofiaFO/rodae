import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface AvaliacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  corridaId: number;
  usuarioParaId: number;
  avaliadoNome: string;
  onSuccess?: () => void;
}

const AvaliacaoDialog = ({ open, onOpenChange, corridaId, usuarioParaId, avaliadoNome, onSuccess }: AvaliacaoDialogProps) => {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [nota, setNota] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comentario, setComentario] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (nota === 0) {
      toast({
        title: "Nota obrigatória",
        description: "Por favor, selecione uma nota de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    if (comentario.length > 200) {
      toast({
        title: "Comentário muito longo",
        description: "O comentário deve ter no máximo 200 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.createAvaliacao(token!, {
        corridaId,
        nota,
        comentario: comentario.trim() || undefined,
        usuarioParaId,
      });

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado pelo seu feedback.",
      });

      setNota(0);
      setComentario("");
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao enviar avaliação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNota(0);
    setComentario("");
    setHoveredStar(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar {avaliadoNome}</DialogTitle>
          <DialogDescription>
            Como foi sua experiência? Sua avaliação ajuda a melhorar nossa plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Estrelas */}
          <div className="space-y-2">
            <Label>Nota *</Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNota(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredStar || nota)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {nota > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {nota === 1 && "Péssimo"}
                {nota === 2 && "Ruim"}
                {nota === 3 && "Regular"}
                {nota === 4 && "Bom"}
                {nota === 5 && "Excelente"}
              </p>
            )}
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comentario">
              Comentário (opcional)
              <span className="text-xs text-muted-foreground ml-2">
                {comentario.length}/200
              </span>
            </Label>
            <Textarea
              id="comentario"
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={200}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || nota === 0}>
            {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvaliacaoDialog;
