import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  getDocFromServer,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { Product, Category, Order, ChatSession, ChatMessage } from './types';

// 1. Safe Initialization of Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
// Support multi-database if configured, otherwise standard
export const db = getFirestore(app);

// Connectivity check as requested in Firebase Skill Guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is offline. Local fallback will be used.");
    }
  }
}
testConnection();

// 2. Structured Firestore Error Handler as mandated by Skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Resilient High-Trust Store Fallback for Placeholders
// This ensures the application is completely functional for users out-of-the-box
// while seamlessly writing to Firestore if real keys are supplied.
const isDummyKey = firebaseConfig.apiKey.includes('Dummy') || firebaseConfig.projectId.includes('hello-beautiful-ecom');

// Initial Mock Seed Data
const initialMockCategories: Category[] = [
  { id: 'cat-1', name: 'Face Care' },
  { id: 'cat-2', name: 'Body Care' },
  { id: 'cat-3', name: 'Mac Lip Care' },
  { id: 'cat-4', name: 'Hair Wellness' }
];

const initialMockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Glow Boosting Vitamin C Serum',
    category: 'Face Care',
    stockQuantity: 15,
    buyingPrice: 450,
    sellingPrice: 950,
    discountOffer: 15, // 15% discount
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Hydrating Shea Butter Cream',
    category: 'Body Care',
    stockQuantity: 8, // stock alert trigger (<10)
    buyingPrice: 300,
    sellingPrice: 650,
    discountOffer: 10, // 10% discount
    imageUrl: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=400',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Moisture Lock Velvet Lip Balm',
    category: 'Mac Lip Care',
    stockQuantity: 24,
    buyingPrice: 150,
    sellingPrice: 350,
    discountOffer: 0,
    imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=400',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    name: 'Argan Hair Nourishing Oil',
    category: 'Hair Wellness',
    stockQuantity: 5, // stock alert trigger
    buyingPrice: 500,
    sellingPrice: 1200,
    discountOffer: 20, // 20% discount
    imageUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=400',
    createdAt: new Date().toISOString()
  }
];

// Helper to initialize local storage
function initLocalStorage() {
  if (!localStorage.getItem('hb_categories')) {
    localStorage.setItem('hb_categories', JSON.stringify(initialMockCategories));
  }
  if (!localStorage.getItem('hb_products')) {
    localStorage.setItem('hb_products', JSON.stringify(initialMockProducts));
  }
  if (!localStorage.getItem('hb_orders')) {
    localStorage.setItem('hb_orders', JSON.stringify([]));
  }
  if (!localStorage.getItem('hb_chats')) {
    localStorage.setItem('hb_chats', JSON.stringify([]));
  }
  if (!localStorage.getItem('hb_banners')) {
    localStorage.setItem('hb_banners', JSON.stringify([
      {
        id: 'banner-1',
        title: 'Ramadan Radiance Glow Offer',
        discountText: 'Get 15% discount on all Face Care essentials. Brighten your beauty!',
        imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=1200',
        isActive: true
      },
      {
        id: 'banner-2',
        title: 'Summer Moisturization Treat',
        discountText: 'Smooth body, soft skin. Shop Argan oils and Organic Creams today!',
        imageUrl: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1200',
        isActive: true
      }
    ]));
  }
}

if (typeof window !== 'undefined') {
  initLocalStorage();
}

// Data operation wrappers with dual fallback mode
export const dbService = {
  // Categories CRUD
  async getCategories(): Promise<Category[]> {
    if (isDummyKey) {
      return JSON.parse(localStorage.getItem('hb_categories') || '[]');
    }
    const path = 'categories';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      return [];
    }
  },

  async addCategory(name: string): Promise<Category> {
    const id = 'cat-' + Date.now();
    const newCat = { id, name };
    if (isDummyKey) {
      const list = await this.getCategories();
      list.push(newCat);
      localStorage.setItem('hb_categories', JSON.stringify(list));
      return newCat;
    }
    const path = `categories/${id}`;
    try {
      await setDoc(doc(db, 'categories', id), { name });
      return newCat;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return newCat;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (isDummyKey) {
      const list = await this.getCategories();
      const updated = list.filter(item => item.id !== id);
      localStorage.setItem('hb_categories', JSON.stringify(updated));
      return;
    }
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // Products CRUD
  async getProducts(): Promise<Product[]> {
    if (isDummyKey) {
      return JSON.parse(localStorage.getItem('hb_products') || '[]');
    }
    const path = 'products';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (e) {
      // Fallback on permission/network error to local, so sandbox always runs
      console.warn("Firestore fetch failing, displaying local product cache.");
      return JSON.parse(localStorage.getItem('hb_products') || '[]');
    }
  },

  async addProduct(prod: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const id = 'prod-' + Date.now();
    const newProd: Product = {
      ...prod,
      id,
      createdAt: new Date().toISOString()
    };
    if (isDummyKey) {
      const list = await this.getProducts();
      list.push(newProd);
      localStorage.setItem('hb_products', JSON.stringify(list));
      return newProd;
    }
    const path = `products/${id}`;
    try {
      await setDoc(doc(db, 'products', id), {
        name: prod.name,
        category: prod.category,
        stockQuantity: prod.stockQuantity,
        buyingPrice: prod.buyingPrice,
        sellingPrice: prod.sellingPrice,
        discountOffer: prod.discountOffer,
        imageUrl: prod.imageUrl,
        createdAt: new Date().toISOString()
      });
      return newProd;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
      return newProd;
    }
  },

  async updateProduct(id: string, prodUpdates: Partial<Product>): Promise<void> {
    if (isDummyKey) {
      const list = await this.getProducts();
      const idx = list.findIndex(p => p.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...prodUpdates };
        localStorage.setItem('hb_products', JSON.stringify(list));
      }
      return;
    }
    const path = `products/${id}`;
    try {
      await updateDoc(doc(db, 'products', id), prodUpdates as any);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (isDummyKey) {
      const list = await this.getProducts();
      const updated = list.filter(p => p.id !== id);
      localStorage.setItem('hb_products', JSON.stringify(updated));
      return;
    }
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // Orders CRUD & Logic
  async getOrders(): Promise<Order[]> {
    if (isDummyKey) {
      return JSON.parse(localStorage.getItem('hb_orders') || '[]');
    }
    const path = 'orders';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (e) {
      console.warn("Firestore fetch failing, displaying local order cache.");
      return JSON.parse(localStorage.getItem('hb_orders') || '[]');
    }
  },

  async saveOrder(orderInput: Omit<Order, 'id' | 'date' | 'createdAt'>, cartItems: { product: Product, qty: number }[]): Promise<Order> {
    // Generate Order ID, e.g., HB-10254
    const ordersCount = (await this.getOrders()).length;
    const orderNum = `HB-${10000 + ordersCount + 1}`;
    
    const newOrder: Order = {
      ...orderInput,
      id: orderNum,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    // First decrement stocks
    const products = await this.getProducts();
    for (const item of cartItems) {
      const targetProd = products.find(p => p.id === item.product.id);
      if (targetProd) {
        const remainingStock = Math.max(0, targetProd.stockQuantity - item.qty);
        await this.updateProduct(item.product.id, { stockQuantity: remainingStock });
      }
    }

    if (isDummyKey) {
      const list = await this.getOrders();
      list.push(newOrder);
      localStorage.setItem('hb_orders', JSON.stringify(list));
      return newOrder;
    }

    const path = `orders/${orderNum}`;
    try {
      await setDoc(doc(db, 'orders', orderNum), {
        customerName: newOrder.customerName,
        address: newOrder.address,
        mobileNumber: newOrder.mobileNumber,
        paymentMethod: newOrder.paymentMethod,
        deliveryRegion: newOrder.deliveryRegion,
        deliveryCharge: newOrder.deliveryCharge,
        subtotal: newOrder.subtotal,
        totalAmount: newOrder.totalAmount,
        orderStatus: newOrder.orderStatus,
        date: newOrder.date,
        createdAt: newOrder.createdAt
      });
      return newOrder;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return newOrder;
    }
  },

  async updateOrderStatus(id: string, status: Order['orderStatus']): Promise<void> {
    if (isDummyKey) {
      const list = await this.getOrders();
      const idx = list.findIndex(o => o.id === id);
      if (idx !== -1) {
        list[idx].orderStatus = status;
        localStorage.setItem('hb_orders', JSON.stringify(list));
      }
      return;
    }
    const path = `orders/${id}`;
    try {
      await updateDoc(doc(db, 'orders', id), { orderStatus: status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  // Chats Operations
  async getChats(): Promise<ChatSession[]> {
    if (isDummyKey) {
      return JSON.parse(localStorage.getItem('hb_chats') || '[]');
    }
    const path = 'chats';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
    } catch (e) {
      return JSON.parse(localStorage.getItem('hb_chats') || '[]');
    }
  },

  async sendMessage(sessionId: string, sender: 'customer' | 'admin', text: string): Promise<void> {
    const message: ChatMessage = {
      sender,
      text,
      timestamp: new Date().toISOString()
    };

    if (isDummyKey) {
      const chats = await this.getChats();
      const idx = chats.findIndex(c => c.id === sessionId);
      if (idx !== -1) {
        chats[idx].messages.push(message);
        chats[idx].lastMessageAt = message.timestamp;
      } else {
        chats.push({
          id: sessionId,
          messages: [message],
          lastMessageAt: message.timestamp
        });
      }
      localStorage.setItem('hb_chats', JSON.stringify(chats));
      // Dispatch a storage event so components can detect local chats change immediately
      window.dispatchEvent(new Event('storage'));
      return;
    }

    const path = `chats/${sessionId}`;
    try {
      const ref = doc(db, 'chats', sessionId);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        const data = docSnap.data() as ChatSession;
        const updatedMsgs = [...(data.messages || []), message];
        await setDoc(ref, {
          messages: updatedMsgs,
          lastMessageAt: message.timestamp
        }, { merge: true });
      } else {
        await setDoc(ref, {
          messages: [message],
          lastMessageAt: message.timestamp
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // Real-time Chat subscription
  subscribeToChat(sessionId: string, callback: (session: ChatSession | null) => void) {
    if (isDummyKey) {
      const pollAndTrigger = () => {
        const chats = JSON.parse(localStorage.getItem('hb_chats') || '[]') as ChatSession[];
        const session = chats.find(c => c.id === sessionId) || null;
        callback(session);
      };
      
      pollAndTrigger();
      window.addEventListener('storage', pollAndTrigger);
      // Custom internal interval polling to simulate socket live update in dummy mode
      const interval = setInterval(pollAndTrigger, 1000);
      return () => {
        window.removeEventListener('storage', pollAndTrigger);
        clearInterval(interval);
      };
    }

    const ref = doc(db, 'chats', sessionId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as ChatSession);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${sessionId}`);
    });
  },

  subscribeToAllChats(callback: (sessions: ChatSession[]) => void) {
    if (isDummyKey) {
      const poll = () => {
        const chats = JSON.parse(localStorage.getItem('hb_chats') || '[]') as ChatSession[];
        callback(chats);
      };
      poll();
      window.addEventListener('storage', poll);
      const interval = setInterval(poll, 1500);
      return () => {
        window.removeEventListener('storage', poll);
        clearInterval(interval);
      };
    }

    const q = query(collection(db, 'chats'), orderBy('lastMessageAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession)));
    }, (error) => {
      // Graceful fail fallback to local polling
      console.warn("Chats real-time listener error, starting system local poll: ", error);
      const poll = () => {
        callback(JSON.parse(localStorage.getItem('hb_chats') || '[]'));
      };
      poll();
      const interval = setInterval(poll, 2000);
      return () => clearInterval(interval);
    });
  },

  // Advertising / Banner Control
  async getBanners(): Promise<any[]> {
    if (isDummyKey) {
      return JSON.parse(localStorage.getItem('hb_banners') || '[]');
    }
    const path = 'banners';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return JSON.parse(localStorage.getItem('hb_banners') || '[]');
    }
  },

  async updateBanners(banners: any[]): Promise<void> {
    if (isDummyKey) {
      localStorage.setItem('hb_banners', JSON.stringify(banners));
      return;
    }
    for (const b of banners) {
      const path = `banners/${b.id}`;
      try {
        await setDoc(doc(db, 'banners', b.id), b);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    }
  }
};
