import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import slugifyLib from 'slugify';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function calculateDiscount(mrp: number, sellingPrice: number): number {
  if (mrp <= 0) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

export function generateSlug(text: string): string {
  return slugifyLib(text, { lower: true, strict: true });
}

export function generateOrderId(prefix: string = 'RJE'): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

export function getEstimatedDelivery(days: number = 5): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Order Placed', icon: '✅', color: '#2874F0' },
  { value: 'confirmed', label: 'Order Confirmed', icon: '📦', color: '#FF9800' },
  { value: 'shipped', label: 'Shipped', icon: '🚚', color: '#9C27B0' },
  { value: 'out-for-delivery', label: 'Out for Delivery', icon: '🏠', color: '#4CAF50' },
  { value: 'delivered', label: 'Delivered', icon: '✅', color: '#388E3C' },
  { value: 'cancelled', label: 'Cancelled', icon: '❌', color: '#F44336' },
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number]['value'];
