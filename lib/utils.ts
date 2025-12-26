import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_validation: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    publishing: 'bg-purple-100 text-purple-800',
    published: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    rejected: 'bg-orange-100 text-orange-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending_validation: 'En attente',
    scheduled: 'Programmé',
    publishing: 'Publication...',
    published: 'Publié',
    failed: 'Échoué',
    rejected: 'Rejeté',
  }
  return labels[status] || status
}

export function getPlatformIcon(platform: string) {
  const icons: Record<string, string> = {
    facebook: '📘',
    instagram: '📸',
    gmb: '📍',
  }
  return icons[platform] || '📱'
}
