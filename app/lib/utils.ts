import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Map user role to Vietnamese name
 */
export function getRoleName(role: string): string {
  switch (role) {
    case 'admin':
      return 'Quản trị viên'
    case 'employer':
      return 'Nhà tuyển dụng'
    case 'candidate':
      return 'Ứng viên'
    default:
      return 'Khách'
  }
}
