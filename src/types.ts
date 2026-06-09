export interface Product {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  buyingPrice: number;
  sellingPrice: number;
  discountOffer: number; // percentage offer (e.g., 10 for 10%)
  imageUrl: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export type OrderStatus = 'Order Confirmed' | 'Packing Done' | 'Hand over to courier agent' | 'Delivery Done';

export interface Order {
  id: string; // Unique printable order number, e.g. HB-10001
  date: string; // Current date string, e.g. 2026-06-08
  customerName: string;
  address: string;
  mobileNumber: string;
  paymentMethod: 'Cash on Delivery' | 'Bkash' | 'Nagad';
  deliveryRegion: 'Inside Dhaka' | 'Outside Dhaka';
  deliveryCharge: number; // 80 or 120
  subtotal: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  createdAt: string;
}

export interface ChatMessage {
  sender: 'customer' | 'admin';
  text: string;
  timestamp: string; // ISO String
}

export interface ChatSession {
  id: string; // Customer session ID
  messages: ChatMessage[];
  lastMessageAt: string;
}

export interface AdvertisementBanner {
  id: string;
  title: string;
  discountText: string;
  imageUrl: string;
  isActive: boolean;
}
