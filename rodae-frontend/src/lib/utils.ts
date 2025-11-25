import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um endereço longo retornado pela API de geocoding,
 * mantendo apenas as partes mais relevantes (cidade e estado).
 * 
 * Exemplo:
 * "Campinas, Região Imediata de Campinas, São Paulo, Brasil"
 * → "Campinas, São Paulo"
 */
export function formatarEndereco(endereco: string): string {
  if (!endereco) return '';
  
  // Split por vírgula e remove espaços em branco
  const partes = endereco.split(',').map(p => p.trim());
  
  // Se o endereço tem menos de 3 partes, retorna como está
  if (partes.length <= 2) return endereco;
  
  // Palavras-chave para filtrar partes desnecessárias
  const palavrasRemover = [
    'região', 'metropolitana', 'imediata', 'intermediária',
    'geográfica', 'sudeste', 'sul', 'norte', 'nordeste', 'centro-oeste',
    'brasil', 'brazil'
  ];
  
  // Filtra partes relevantes (remove as que contêm palavras-chave)
  const partesRelevantes = partes.filter(parte => {
    const parteLower = parte.toLowerCase();
    return !palavrasRemover.some(palavra => parteLower.includes(palavra));
  });
  
  // Pega no máximo as 3 primeiras partes relevantes
  const resultado = partesRelevantes.slice(0, 3).join(', ');
  
  // Se ficou muito longo ainda, pega apenas as 2 primeiras
  if (resultado.length > 60) {
    return partesRelevantes.slice(0, 2).join(', ');
  }
  
  return resultado || endereco; // Fallback para o endereço original
}
