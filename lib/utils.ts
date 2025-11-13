import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

/**
 * Verifica se uma URL de imagem é válida e existe
 * @param imageUrl - URL da imagem para verificar
 * @returns true se a imagem existe e é válida
 */
export function hasValidImage(imageUrl?: string | null): boolean {
  return !!(imageUrl && imageUrl.trim().length > 0)
}
