import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../firebase';
import { Product, Category, Order, ChatSession, AdvertisementBanner } from '../types';
import {
  Sparkles, ShieldAlert, TrendingUp, Grid, Users, ListFilter,
  Volume2, MessageSquare, Archive, Plus, Trash2, Edit, Save, 
  DollarSign, FileText, Calendar, Search, Check, AlertTriangle, 
  Printer, X, ArrowUpRight, Upload, Image as ImageIcon
} from 'lucide-react';
import DeliverySlip from './DeliverySlip';

export default function AdminPanel() {
  // Navigation
  const [activeTab, setActiveTab] = useState('Overview');

  // Database lists
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [banners, setBanners] = useState<AdvertisementBanner[]>([]);

  // Sub-Page 01 Constants (modal overview)
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  // Sub-Page 03 Product states
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdStock, setNewProdStock] = useState(0);
  const [newProdBuyingPrice, setNewProdBuyingPrice] = useState(0);
  const [newProdSellingPrice, setNewProdSellingPrice] = useState(0);
  const [newProdDiscount, setNewProdDiscount] = useState(0);
  const [newProdImage, setNewProdImage] = useState('');
  // Image Upload States
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploadMethod, setImageUploadMethod] = useState<'upload' | 'url'>('upload');

  const [editDragActive, setEditDragActive] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editImageUploadMethod, setEditImageUploadMethod] = useState<'upload' | 'url'>('upload');
  // Category control
  const [newCatName, setNewCatName] = useState('');
  // Product Edit
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('');
  const [editProdStock, setEditProdStock] = useState(0);
  const [editProdBuyingPrice, setEditProdBuyingPrice] = useState(0);
  const [editProdSellingPrice, setEditProdSellingPrice] = useState(0);
  const [editProdDiscount, setEditProdDiscount] = useState(0);
  const [editProdImage, setEditProdImage] = useState('');
  const [editAddQty, setEditAddQty] = useState(0); // increments stock

  // Sub-Page 06 Advertisement state
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerDiscount, setNewBannerDiscount] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  // Advertisement Banner Image Upload states
  const [bannerDragActive, setBannerDragActive] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [bannerImageUploadMethod, setBannerImageUploadMethod] = useState<'upload' | 'url'>('upload');

  // Sub-Page 07 Chat panel support states
  const [selectedChatSessionId, setSelectedChatSessionId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const chatsEndRef = useRef<HTMLDivElement>(null);

  // Sub-Page 08 Delivery Slips Archive states
  const [filterSlipOrderNum, setFilterSlipOrderNum] = useState('');
  const [filterSlipDate, setFilterSlipDate] = useState('');
  const [selectedArchiveOrder, setSelectedArchiveOrder] = useState<Order | null>(null);

  // Reload data
  const loadAdminControlData = async () => {
    const pr = await dbService.getProducts();
    const ct = await dbService.getCategories();
    const od = await dbService.getOrders();
    const bn = await dbService.getBanners();
    setProducts(pr);
    setCategories(ct);
    setOrders(od);
    setBanners(bn);

    if (newProdCategory === '' && ct.length > 0) {
      setNewProdCategory(ct[0].name);
    }
  };

  useEffect(() => {
    loadAdminControlData();

    // Subscribe to multi-tenant customer messaging threads
    const unsubscribeChats = dbService.subscribeToAllChats((sessions: ChatSession[]) => {
      setChats(sessions);
    });

    return () => {
      unsubscribeChats();
    };
  }, []);

  // Scroll active chat thread to bottom
  useEffect(() => {
    chatsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatSessionId, chats]);

  // Calculations for alerts & margins
  const lowStockProducts = products.filter(p => p.stockQuantity < 10);

  // Stock Valuation
  const totalStockCount = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalStockBuyingValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.buyingPrice), 0);
  const totalStockSellingValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.sellingPrice), 0);

  // Daily Ledger metrics (Group by date)
  const orderDates: string[] = Array.from(new Set(orders.map(o => o.date)));
  
  // Simulated margins / ledger metrics
  const getDailySalesMetricsForDate = (date: string) => {
    const dailyOrders = orders.filter(o => o.date === date);
    const subtotalRev = dailyOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const shippingRev = dailyOrders.reduce((sum, o) => sum + o.deliveryCharge, 0);
    const count = dailyOrders.length;

    // Financial profit estimates assuming standard product purchase prices of 45% of wholesale
    // Since we also have buying price, we can calculate margins (buyingPrice vs sellingPrice with discount)
    const totalRev = subtotalRev + shippingRev;
    const estProfit = subtotalRev * 0.40; // 40% margin of wholesale

    return { subtotalRev, shippingRev, totalRev, estProfit, count };
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdCategory || !newProdImage) {
      alert('Key fields are missing.');
      return;
    }

    try {
      await dbService.addProduct({
        name: newProdName,
        category: newProdCategory,
        stockQuantity: Number(newProdStock),
        buyingPrice: Number(newProdBuyingPrice),
        sellingPrice: Number(newProdSellingPrice),
        discountOffer: Number(newProdDiscount),
        imageUrl: newProdImage
      });

      // Clear Product inputs
      setNewProdName('');
      setNewProdStock(0);
      setNewProdBuyingPrice(0);
      setNewProdSellingPrice(0);
      setNewProdDiscount(0);
      setNewProdImage('');

      await loadAdminControlData();
      alert('Product created success!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImageFile = (file: File, isEdit: boolean = false) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file to attach.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        if (isEdit) {
          setEditProdImage(event.target.result);
        } else {
          setNewProdImage(event.target.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0], false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0], false);
    }
  };

  const handleEditDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setEditDragActive(true);
    } else if (e.type === "dragleave") {
      setEditDragActive(false);
    }
  };

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0], true);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0], true);
    }
  };

  const handleBannerDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setBannerDragActive(true);
    } else if (e.type === "dragleave") {
      setBannerDragActive(false);
    }
  };

  const processBannerImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file to attach.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setNewBannerImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processBannerImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processBannerImageFile(e.target.files[0]);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await dbService.deleteProduct(id);
      await loadAdminControlData();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditProduct = (p: Product) => {
    setEditingProdId(p.id);
    setEditProdName(p.name);
    setEditProdCategory(p.category);
    setEditProdStock(p.stockQuantity);
    setEditProdBuyingPrice(p.buyingPrice);
    setEditProdSellingPrice(p.sellingPrice);
    setEditProdDiscount(p.discountOffer);
    setEditProdImage(p.imageUrl);
    setEditAddQty(0);
  };

  const saveEditProduct = async () => {
    if (!editingProdId) return;

    try {
      const finalStock = Number(editProdStock) + Number(editAddQty);
      await dbService.updateProduct(editingProdId, {
        name: editProdName,
        category: editProdCategory,
        stockQuantity: finalStock,
        buyingPrice: Number(editProdBuyingPrice),
        sellingPrice: Number(editProdSellingPrice),
        discountOffer: Number(editProdDiscount),
        imageUrl: editProdImage
      });

      setEditingProdId(null);
      await loadAdminControlData();
      alert('Inventory product updated.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await dbService.addCategory(newCatName.trim());
      setNewCatName('');
      await loadAdminControlData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product category? Products assigned to this category will not be deleted, but they should be re-assigned to an active category.')) return;
    try {
      await dbService.deleteCategory(id);
      await loadAdminControlData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBannerAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImage) return;

    const newAd: AdvertisementBanner = {
      id: 'banner-' + Date.now(),
      title: newBannerTitle,
      discountText: newBannerDiscount,
      imageUrl: newBannerImage,
      isActive: true
    };

    try {
      const currentBanners = [...banners, newAd];
      await dbService.updateBanners(currentBanners);
      setNewBannerTitle('');
      setNewBannerDiscount('');
      setNewBannerImage('');
      await loadAdminControlData();
      alert('Promotional banner advertisement created');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBannerAd = async (id: string) => {
    const updated = banners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b);
    try {
      await dbService.updateBanners(updated);
      await loadAdminControlData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBannerAd = async (id: string) => {
    const updated = banners.filter(b => b.id !== id);
    try {
      await dbService.updateBanners(updated);
      await loadAdminControlData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAdminChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedChatSessionId) return;

    try {
      await dbService.sendMessage(selectedChatSessionId, 'admin', adminReplyText.trim());
      setAdminReplyText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, value: Order['orderStatus']) => {
    try {
      await dbService.updateOrderStatus(orderId, value);
      await loadAdminControlData();
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger print windows
  const triggerDailyAccountsPrint = (date: string) => {
    const metrics = getDailySalesMetricsForDate(date);
    const dailyOrdersForPrint = orders.filter(o => o.date === date);

    const printWin = window.open('', '', 'width=800,height=600');
    if (!printWin) return;

    printWin.document.write(`
      <html>
        <head>
          <title>Daily Sales Summary: ${date}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: black; }
            h1 { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; text-transform: uppercase; }
            .metrics-grid { display: flex; justify-content: space-between; margin: 20px 0; border: 1px dashed black; padding: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Hello Beautiful - Daily Ledger</h1>
          <p><strong>Accounting Date:</strong> ${date}</p>
          
          <div class="metrics-grid">
            <div><strong>Orders Recv:</strong> ${metrics.count}</div>
            <div><strong>Subtotal Rev:</strong> ${metrics.subtotalRev} TK</div>
            <div><strong>Shipping Rev:</strong> ${metrics.shippingRev} TK</div>
            <div><strong>Est profit margin:</strong> ${metrics.estProfit.toFixed(0)} TK</div>
          </div>

          <h2>Completed Orders Ledger Log</h2>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Client</th>
                <th>Region</th>
                <th>Total Bill</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${dailyOrdersForPrint.map(o => `
                <tr>
                  <td>${o.id}</td>
                  <td>${o.customerName}</td>
                  <td>${o.deliveryRegion}</td>
                  <td>${o.totalAmount} TK</td>
                  <td>${o.orderStatus}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.print();
  };

  // Navigations sidebar tabs list
  const navTabs = [
    { name: 'Overview', icon: ShieldAlert },
    { name: 'Accounts', icon: TrendingUp },
    { name: 'Product Control', icon: Grid },
    { name: 'Membership', icon: Users },
    { name: 'Order Status', icon: ListFilter },
    { name: 'Home Advertisements', icon: Volume2 },
    { name: 'Live Chat', icon: MessageSquare },
    { name: 'Delivery Slips', icon: Archive }
  ];

  const activeChat = chats.find(c => c.id === selectedChatSessionId);

  // Filters for Slip Archive (Sub-Page 08)
  const filteredArchiveRequests = orders.filter(o => {
    const isOrderMatch = !filterSlipOrderNum.trim() || o.id.toLowerCase().includes(filterSlipOrderNum.trim().toLowerCase());
    const isDateMatch = !filterSlipDate || o.date === new Date(filterSlipDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    return isOrderMatch && isDateMatch;
  });

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16 font-sans text-left items-start">
      
      {/* Sidebar navigation tabs panels */}
      <div className="w-full md:w-64 bg-white rounded-3xl border border-brand-sand p-4 space-y-1 shadow-sm shrink-0">
        <div className="px-3 py-2 border-b border-brand-sand/65 mb-2">
          <span className="text-[10px] text-brand-sage font-extrabold uppercase tracking-wide">Secure Admin Workspace</span>
          <h2 className="font-bold font-serif text-brand-charcoal text-sm">tanvir.khc@gmail.com</h2>
        </div>
        {navTabs.map((t) => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.name}
              onClick={() => setActiveTab(t.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold select-none transition cursor-pointer ${
                activeTab === t.name
                  ? 'bg-brand-warm text-brand-sage font-bold border-l-4 border-brand-sage'
                  : 'text-brand-charcoal/70 hover:bg-brand-warm/50 hover:text-brand-charcoal'
              }`}
            >
              <TabIcon className="w-4.5 h-4.5" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main dashboard tab context viewer */}
      <div className="flex-1 bg-white rounded-3xl border border-brand-sand p-6 sm:p-8 shadow-sm space-y-6 w-full min-h-[540px]">
        
        {/* SUB-PAGE 01: OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-brand-charcoal tracking-tight">Stock Analysis Overview</h2>
              <p className="text-xs text-brand-charcoal/60">Live indicators of your cosmetics stock count and business volume</p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Card 1: Alert Indicator */}
              <div 
                onClick={() => { if (lowStockProducts.length > 0) setShowLowStockModal(true); }}
                className={`p-5 rounded-2xl border transition-all ${
                  lowStockProducts.length > 0
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900 hover:shadow-md cursor-pointer'
                    : 'bg-white border-brand-sand/60 text-brand-charcoal/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-brand-charcoal/40'}`} />
                  <span className="text-xs uppercase font-bold tracking-wider">Stock warnings</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-black text-brand-charcoal">{lowStockProducts.length}</span>
                  <span className="text-xs text-brand-charcoal/60">items low in stock</span>
                </div>
                {lowStockProducts.length > 0 && (
                  <p className="text-[10px] text-amber-700 font-semibold mt-2 underline flex items-center gap-1">
                    Click to view analytics <ArrowUpRight className="w-3 h-3" />
                  </p>
                )}
              </div>

              {/* Card 2: Cumulative orders */}
              <div className="p-5 bg-white border border-brand-sand/60 rounded-2xl text-brand-charcoal">
                <div className="flex items-center gap-2 mb-2 text-brand-charcoal/60">
                  <TrendingUp className="w-5 h-5 text-brand-sage" />
                  <span className="text-xs uppercase font-bold tracking-wider">Completed Orders</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-bold text-brand-charcoal">{orders.length}</span>
                  <span className="text-xs text-brand-charcoal/60">Total Checkouts</span>
                </div>
              </div>

              {/* Card 3: Total products count */}
              <div className="p-5 bg-white border border-brand-sand/60 rounded-2xl text-brand-charcoal">
                <div className="flex items-center gap-2 mb-2 text-brand-charcoal/60">
                  <Grid className="w-5 h-5 text-brand-sage" />
                  <span className="text-xs uppercase font-bold tracking-wider">Catalog size</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-bold text-brand-charcoal">{products.length}</span>
                  <span className="text-xs text-brand-charcoal/60">Products active</span>
                </div>
              </div>
            </div>

            {/* Low stock alerts panel (inline if not open in modal) */}
            <div className="p-5 border border-dashed border-brand-sand rounded-2xl space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-sage block">Critical Inventory Highlight</span>
              {lowStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-brand-warm/35 p-2.5 rounded-lg border border-brand-sand/55 text-xs text-brand-charcoal">
                      <div className="text-left">
                        <p className="font-bold text-brand-charcoal">{p.name}</p>
                        <p className="text-[10px] text-brand-charcoal/50 font-medium">Category: {p.category}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded font-mono border border-amber-200">
                        {p.stockQuantity} Pcs left
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-brand-warm/40 border border-brand-sand rounded-xl text-center space-y-1">
                  <div className="text-2xl">🌱</div>
                  <p className="text-xs font-bold text-brand-sage">Excellent! All cosmetics products are well stocked above 10 pieces.</p>
                </div>
              )}
            </div>

            {/* Low Stock Analytical Modal */}
            {showLowStockModal && (
              <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 text-left space-y-4 animate-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-extrabold text-gray-900 text-base">Low Stock Analytics</h3>
                    </div>
                    <button onClick={() => setShowLowStockModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {lowStockProducts.map((p) => (
                      <div key={p.id} className="flex gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-xs items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={p.imageUrl} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="font-bold text-gray-800">{p.name}</p>
                            <p className="text-[10px] text-gray-400">Buying Price: {p.buyingPrice} TK</p>
                          </div>
                        </div>
                        <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1 text-xs rounded-full font-mono">
                          {p.stockQuantity} pcs
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={() => { setShowLowStockModal(false); setActiveTab('Product Control'); }}
                      className="w-full py-2.5 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-neutral-800 cursor-pointer"
                    >
                      Refill stock in Product Control
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-PAGE 02: ACCOUNTS */}
        {activeTab === 'Accounts' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Daily Sales Ledger</h2>
              <p className="text-xs text-gray-500">Stock accounting margins, current valuation assessments, and summary tools</p>
            </div>

            {/* Live Stock Valuation Ledger */}
            <div className="p-5 bg-gray-50/70 rounded-2xl border border-gray-150 space-y-3">
              <span className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                Current Stock Valuations
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-1">
                  <p className="text-gray-400">Cumulative pieces in stock</p>
                  <p className="font-black text-lg text-gray-800 font-mono">{totalStockCount} units</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-1">
                  <p className="text-gray-400">Buying inventory asset cost</p>
                  <p className="font-black text-lg text-rose-600 font-mono">{totalStockBuyingValue.toLocaleString()} TK</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-1">
                  <p className="text-gray-400">Target retail sale value</p>
                  <p className="font-black text-lg text-emerald-600 font-mono">{totalStockSellingValue.toLocaleString()} TK</p>
                </div>
              </div>
            </div>

            {/* Daily compile tool lists */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase text-gray-800 tracking-wider block">Daily sales compile ledger</span>
              {orderDates.length > 0 ? (
                <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-xs">
                  <table className="w-full text-xs text-neutral-800">
                    <thead className="bg-gray-50/70 border-b border-gray-100">
                      <tr>
                        <th className="p-3 text-left">Accounting Date</th>
                        <th className="p-3 text-left">Orders Count</th>
                        <th className="p-3 text-right">Daily Rev (Total)</th>
                        <th className="p-3 text-right">Est Margin / Profit</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orderDates.map((date) => {
                        const m = getDailySalesMetricsForDate(date);
                        return (
                          <tr key={date} className="hover:bg-rose-50/10">
                            <td className="p-3 font-semibold font-mono">{date}</td>
                            <td className="p-3 font-bold text-rose-500">{m.count}</td>
                            <td className="p-3 text-right font-bold text-gray-900">{m.totalRev.toFixed(0)} TK</td>
                            <td className="p-3 text-right font-bold text-emerald-600">+{m.estProfit.toFixed(0)} TK</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => triggerDailyAccountsPrint(date)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 text-white rounded hover:bg-neutral-850 cursor-pointer transition text-[10px] font-bold"
                              >
                                <Printer className="w-3" />
                                Invoice Print
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-xs italic">No orders received to assemble financial accounting ledger reports yet.</p>
              )}
            </div>
          </div>
        )}

        {/* SUB-PAGE 03: PRODUCT CONTROL */}
        {activeTab === 'Product Control' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Inventory Management CRUD</h2>
              <p className="text-xs text-gray-500">Edit, modify pricing, append stock increments, and manage system categories</p>
            </div>

            {/* List and CRUD Add Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Form to create cosmetic product */}
              <div className="lg:col-span-1 p-5 bg-gray-50/50 border border-gray-150 rounded-2xl space-y-4">
                <span className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider block">Add New Product</span>
                
                <form onSubmit={handleCreateProduct} className="space-y-3 font-medium text-left">
                  <div className="space-y-0.5 text-xs">
                    <label className="text-gray-550 font-bold block">Product Name</label>
                    <input
                      type="text"
                      required
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="e.g. Cleansing Serum Base"
                      className="w-full text-xs bg-white border border-gray-250 py-2 px-3 rounded-lg focus:ring-1 focus:ring-rose-400 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-0.5">
                      <label className="text-gray-550 font-bold block">Category</label>
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        className="w-full text-xs bg-white border border-gray-250 py-2 px-3 rounded-lg outline-none"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-gray-550 font-bold block">Stock Base Qty</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-gray-250 py-2 px-3 rounded-lg outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <label className="text-gray-550 font-bold block">Buying (TK)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={newProdBuyingPrice}
                        onChange={(e) => setNewProdBuyingPrice(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-gray-250 py-2 px-3 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-gray-550 font-bold block">Selling (TK)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={newProdSellingPrice}
                        onChange={(e) => setNewProdSellingPrice(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-gray-250 py-2 px-3 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-gray-550 font-bold block">Discount %</label>
                      <input
                        type="number"
                        required
                        min={0}
                        max={90}
                        value={newProdDiscount}
                        onChange={(e) => setNewProdDiscount(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-gray-250 py-2 px-3 rounded-lg outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <label className="text-gray-510 font-bold block">Product Image</label>
                      <div className="flex bg-gray-200/50 p-0.5 rounded-lg border border-gray-200 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setImageUploadMethod('upload')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer select-none ${imageUploadMethod === 'upload' ? 'bg-white shadow-xs text-brand-charcoal text-bold' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                          Attach File
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUploadMethod('url')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer select-none ${imageUploadMethod === 'url' ? 'bg-white shadow-xs text-brand-charcoal text-bold' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                          Paste URL
                        </button>
                      </div>
                    </div>

                    {imageUploadMethod === 'upload' ? (
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[110px] space-y-1.5 ${
                          dragActive 
                            ? 'border-brand-sage bg-brand-warm/35' 
                            : newProdImage 
                            ? 'border-brand-sand bg-white hover:bg-brand-warm/10' 
                            : 'border-gray-250 bg-white hover:bg-gray-50/50'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {newProdImage ? (
                          <div className="relative w-full flex items-center justify-between gap-3 p-1">
                            <img 
                              src={newProdImage} 
                              alt="New product preview" 
                              className="w-12 h-12 rounded-lg object-cover border border-brand-sand" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-bold text-[10px] text-brand-charcoal truncate">Attached Image</p>
                              <p className="text-[9px] text-brand-charcoal/50 font-mono">Ready to upload</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewProdImage('');
                              }}
                              className="p-1 text-gray-400 hover:text-rose-500 hover:bg-gray-100 rounded-full cursor-pointer transition"
                              title="Clear image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="p-2 bg-brand-warm/30 rounded-full border border-brand-sand">
                              <Upload className="w-4 h-4 text-brand-sage animate-pulse" />
                            </div>
                            <p className="font-semibold text-[11px] text-brand-charcoal leading-none">Click to browse file</p>
                            <p className="text-[9px] text-brand-charcoal/50">or drag & drop your image here</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <input
                          type="url"
                          value={newProdImage}
                          onChange={(e) => setNewProdImage(e.target.value)}
                          placeholder="Paste Unsplash landscape URL..."
                          className="w-full text-xs bg-white border border-gray-250 py-2 px-3 rounded-lg focus:ring-1 focus:ring-rose-400 outline-none"
                        />
                        {newProdImage && (
                          <div className="flex items-center gap-3 p-1.5 border border-brand-sand/55 rounded-xl bg-brand-warm/20">
                            <img 
                              src={newProdImage} 
                              alt="URL preview" 
                              className="w-12 h-12 rounded-lg object-cover border border-brand-sand" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-bold text-[10px] text-brand-charcoal truncate">URL Preview</p>
                              <p className="text-[9px] text-brand-charcoal/50 font-mono truncate">{newProdImage}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition uppercase"
                  >
                    Add Product Catalog
                  </button>
                </form>

                {/* Sub-Panel: Add/Delete Categories inline */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider block">Product Categories</span>
                    <span className="text-[10px] text-gray-500 font-mono">({categories.length} active)</span>
                  </div>
                  
                  <form onSubmit={handleCreateCategory} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Hair Care"
                      className="flex-1 text-xs bg-white border border-gray-250 py-1.5 px-3 rounded-lg focus:ring-1 focus:ring-rose-400 outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-gray-900 hover:bg-neutral-850 rounded-lg text-white font-bold text-xs cursor-pointer select-none"
                    >
                      Add
                    </button>
                  </form>

                  {/* Active Nodes list */}
                  <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5">
                    {categories.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic py-2 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">No categories found. Create one above.</p>
                    ) : (
                      categories.map((c) => (
                        <div key={c.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-150 text-[11px] group hover:border-gray-300 transition-colors">
                          <span className="font-semibold text-gray-750">{c.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id)}
                            className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md p-1 transition cursor-pointer"
                            title={`Delete category "${c.name}"`}
                            aria-label={`Delete category "${c.name}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Inventory database directory with inline interactive edit state */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl border border-gray-150">
                  <span className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider block">Current Catalog Inventory Directory</span>
                  <span className="text-[10px] bg-brand-charcoal text-brand-warm font-mono font-bold px-2 py-0.5 rounded-full">{products.length} Items</span>
                </div>
                
                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                  {products.map((p) => {
                    const isEditing = editingProdId === p.id;
                    const isLow = p.stockQuantity < 10;

                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border transition duration-150 ${
                          isEditing
                            ? 'bg-rose-50/20 border-rose-300 ring-2 ring-rose-200'
                            : isLow
                            ? 'bg-amber-50/30 border-amber-200'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {isEditing ? (
                          /* Interactive editing view template */
                          <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-rose-100">
                              <span className="font-bold text-rose-600">Editing: {p.name}</span>
                              <div className="flex gap-2 items-center">
                                <button
                                  onClick={saveEditProduct}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer transition select-none"
                                >
                                  Save Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded border border-red-200 transition cursor-pointer flex items-center gap-1 select-none"
                                  title="Delete this product catalog item completely"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                                <button
                                  onClick={() => setEditingProdId(null)}
                                  className="px-2.5 py-1 bg-gray-200 hover:bg-gray-350 text-gray-800 font-semibold rounded cursor-pointer transition select-none"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                              <div className="space-y-0.5">
                                <label className="text-gray-500 font-medium">Product Name</label>
                                <input
                                  type="text"
                                  value={editProdName}
                                  onChange={(e) => setEditProdName(e.target.value)}
                                  className="w-full bg-white border border-gray-200 px-2 py-1.5 rounded"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-gray-500 font-medium">Category</label>
                                <select
                                  value={editProdCategory}
                                  onChange={(e) => setEditProdCategory(e.target.value)}
                                  className="w-full bg-white border border-gray-200 px-2 py-1.5 rounded"
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
                              <div className="space-y-0.5">
                                <label className="text-gray-500 font-medium">Buying Cost (TK)</label>
                                <input
                                  type="number"
                                  value={editProdBuyingPrice}
                                  onChange={(e) => setEditProdBuyingPrice(Number(e.target.value))}
                                  className="w-full bg-white border border-gray-200 px-2 py-1.5 rounded"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-gray-550 font-medium">Selling Retail (TK)</label>
                                <input
                                  type="number"
                                  value={editProdSellingPrice}
                                  onChange={(e) => setEditProdSellingPrice(Number(e.target.value))}
                                  className="w-full bg-white border border-gray-200 px-2 py-1.5 rounded"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-gray-500 font-medium">Discount Offer %</label>
                                <input
                                  type="number"
                                  value={editProdDiscount}
                                  onChange={(e) => setEditProdDiscount(Number(e.target.value))}
                                  className="w-full bg-white border border-gray-200 px-2 py-1.5 rounded"
                                />
                              </div>
                              <div className="space-y-0.5 bg-rose-50/40 p-2.5 border border-rose-100 rounded">
                                <label className="text-rose-700 font-bold block">Refill Stock (+qty)</label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={editAddQty || ''}
                                  onChange={(e) => setEditAddQty(Number(e.target.value))}
                                  className="w-full bg-white border border-rose-300 font-mono text-center font-bold px-2 py-1 rounded focus:ring-1 focus:ring-rose-400"
                                />
                                <span className="text-[10px] text-rose-500 mt-1 block">Current Stock: {editProdStock}</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-left text-xs pt-1">
                              <div className="flex justify-between items-center text-xs">
                                <label className="text-gray-500 font-medium">Product Photo</label>
                                <div className="flex bg-gray-200/50 p-0.5 rounded-lg border border-gray-200 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => setEditImageUploadMethod('upload')}
                                    className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer select-none ${editImageUploadMethod === 'upload' ? 'bg-white shadow-xs text-brand-charcoal text-bold' : 'text-gray-500 hover:text-gray-800'}`}
                                  >
                                    File Upload
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditImageUploadMethod('url')}
                                    className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer select-none ${editImageUploadMethod === 'url' ? 'bg-white shadow-xs text-brand-charcoal text-bold' : 'text-gray-500 hover:text-gray-800'}`}
                                  >
                                    Paste URL
                                  </button>
                                </div>
                              </div>

                              {editImageUploadMethod === 'upload' ? (
                                <div 
                                  onDragEnter={handleEditDrag}
                                  onDragOver={handleEditDrag}
                                  onDragLeave={handleEditDrag}
                                  onDrop={handleEditDrop}
                                  onClick={() => editFileInputRef.current?.click()}
                                  className={`border bg-white rounded-lg p-3 text-center cursor-pointer hover:bg-gray-55/50 transition flex flex-col items-center justify-center min-h-[90px] space-y-1 ${
                                    editDragActive ? 'border-brand-sage bg-brand-warm/15' : 'border-gray-200'
                                  }`}
                                >
                                  <input
                                    ref={editFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditFileChange}
                                    className="hidden"
                                  />
                                  {editProdImage ? (
                                    <div className="relative w-full flex items-center justify-between gap-3 p-0.5">
                                      <img 
                                        src={editProdImage} 
                                        alt="Edit preview" 
                                        className="w-10 h-10 rounded-md object-cover border border-gray-200" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="flex-1 text-[11px] text-gray-500 truncate text-left">Attached local photo file</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditProdImage('');
                                        }}
                                        className="p-1 text-gray-400 hover:text-rose-500 hover:bg-gray-100 rounded-full cursor-pointer transition"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 text-gray-400 mx-auto" />
                                      <span className="font-semibold text-[10px] text-gray-650 block">Click to browse or drop photo</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <input
                                  type="url"
                                  value={editProdImage}
                                  onChange={(e) => setEditProdImage(e.target.value)}
                                  className="w-full bg-white border border-gray-200 px-2 py-1.5 rounded focus:ring-1 focus:ring-rose-400 outline-none"
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Standard Directory read templates with actions */
                          <div className="flex gap-4 items-center">
                            <img src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase tracking-wider font-bold text-rose-500">{p.category}</span>
                                {isLow && (
                                  <span className="text-[9px] bg-red-100 text-red-800 font-extrabold px-1.5 py-0.5 rounded animate-pulse shadow-xs">
                                    LOW
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-xs text-gray-800 truncate">{p.name}</h4>
                              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[10px] text-gray-400 font-mono mt-1 font-medium">
                                <span>Buying: <strong className="text-gray-650">{p.buyingPrice} TK</strong></span>
                                <span>Selling: <strong className="text-gray-650">{p.sellingPrice} TK</strong></span>
                                {p.discountOffer > 0 && <span>DiscOffer: <strong className="text-emerald-600">{p.discountOffer}%</strong></span>}
                                <span>Stock: <strong className={isLow ? 'text-red-650 font-bold' : 'text-gray-650'}>{p.stockQuantity} Pcs</strong></span>
                              </div>
                            </div>

                            {/* Editing / Removing buttons panel */}
                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditProduct(p)}
                                className="flex items-center gap-1 bg-gray-50 hover:bg-rose-50 hover:text-rose-600 border border-gray-150 hover:border-rose-200 transition px-2 py-1.5 rounded-lg text-[10px] text-gray-600 font-semibold cursor-pointer select-none"
                                title={`Edit product "${p.name}"`}
                              >
                                <Edit className="w-3.5 h-3.5 text-rose-500" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                className="flex items-center gap-1 bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-gray-150 hover:border-red-200 transition px-2 py-1.5 rounded-lg text-[10px] text-gray-600 font-semibold cursor-pointer select-none"
                                title={`Delete product "${p.name}"`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUB-PAGE 04: MEMBERSHIP */}
        {activeTab === 'Membership' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">CRM Client Directory</h2>
              <p className="text-xs text-gray-500">Contact list aggregated chronologically from completed checkout transactions</p>
            </div>

            {/* Core tables mapping harvested clients */}
            <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-xs text-left">
              <table className="w-full text-xs text-neutral-800">
                <thead className="bg-gray-50/70 border-b border-gray-100">
                  <tr>
                    <th className="p-3 text-left">Client Name</th>
                    <th className="p-3 text-left">Mobile contact</th>
                    <th className="p-3 text-left">Delivery Address details</th>
                    <th className="p-3 text-center">Checkout Order #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length > 0 ? (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-semibold text-gray-900">{o.customerName}</td>
                        <td className="p-3 font-mono font-bold text-gray-600">{o.mobileNumber}</td>
                        <td className="p-3 whitespace-pre-wrap max-w-sm text-[11px] leading-tight text-gray-500">{o.address}</td>
                        <td className="p-3 text-center font-mono font-bold text-rose-500">{o.id}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 italic">No customer accounts harvested yet from shopping checkposts.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-PAGE 05: ORDER STATUS */}
        {activeTab === 'Order Status' && (
          <div className="space-y-6 animate-in fade-in duration-150 font-sans">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Fulfillment Status Center</h2>
              <p className="text-xs text-gray-500">Control shipping progress stages on the customer tracking panel</p>
            </div>

            {/* List and change workflow dropdown */}
            <div className="space-y-4 max-h-[540px] overflow-y-auto">
              {orders.length > 0 ? (
                orders.map((o) => (
                  <div key={o.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-xs">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-rose-500 font-mono tracking-widest">{o.id}</span>
                        <span className="text-[9px] bg-gray-50 border border-gray-200 text-gray-500 px-2 rounded-full font-sans font-medium">{o.date}</span>
                      </div>
                      <h4 className="font-bold text-xs text-neutral-900">{o.customerName} - {o.mobileNumber}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">Total paid: <strong>{o.totalAmount} TK</strong> ({o.paymentMethod}, {o.deliveryRegion})</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-500 select-none">Fulfillment:</span>
                      <select
                        value={o.orderStatus}
                        onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value as any)}
                        className={`text-xs py-1.5 px-3 rounded-lg border font-semibold outline-none ${
                          o.orderStatus === 'Delivery Done'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        <option value="Order Confirmed">Order Confirmed</option>
                        <option value="Packing Done">Packing Done</option>
                        <option value="Hand over to courier agent">Hand over to courier agent</option>
                        <option value="Delivery Done">Delivery Done</option>
                      </select>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs italic">No orders logged in system checkout datastore yet.</p>
              )}
            </div>
          </div>
        )}

        {/* SUB-PAGE 06: HOME ADVERTISEMENTS */}
        {activeTab === 'Home Advertisements' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Home Advertisement Banner Promotion Hub</h2>
              <p className="text-xs text-gray-500">Edit active advertising sliding card rules visible on client Page 1</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form trigger add advertising banner */}
              <div className="lg:col-span-1 p-5 bg-gray-50/50 border border-gray-150 rounded-2xl space-y-4">
                <span className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider block">Add Active Banner Ad</span>
                
                <form onSubmit={handleCreateBannerAd} className="space-y-3 font-semibold text-xs text-left">
                  <div className="space-y-0.5">
                    <label className="text-gray-500 block">Banner Main Title</label>
                    <input
                      type="text"
                      required
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      placeholder="e.g. Ramadan Glow Treats"
                      className="w-full bg-white border border-gray-250 py-2 px-3 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-gray-500 block">Offer Description Text</label>
                    <input
                      type="text"
                      required
                      value={newBannerDiscount}
                      onChange={(e) => setNewBannerDiscount(e.target.value)}
                      placeholder="e.g. Get 20% discount on Creams Collection!"
                      className="w-full bg-white border border-gray-250 py-2 px-3 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-gray-500 block font-semibold">Cover Image</label>
                      <div className="flex bg-gray-250/50 p-0.5 rounded-lg border border-gray-200 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setBannerImageUploadMethod('upload')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer select-none ${bannerImageUploadMethod === 'upload' ? 'bg-white shadow-xs text-brand-charcoal font-bold' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                          Attach File
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerImageUploadMethod('url')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer select-none ${bannerImageUploadMethod === 'url' ? 'bg-white shadow-xs text-brand-charcoal font-bold' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                          Paste URL
                        </button>
                      </div>
                    </div>

                    {bannerImageUploadMethod === 'upload' ? (
                      <div 
                        onDragEnter={handleBannerDrag}
                        onDragOver={handleBannerDrag}
                        onDragLeave={handleBannerDrag}
                        onDrop={handleBannerDrop}
                        onClick={() => bannerFileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[110px] space-y-1.5 ${
                          bannerDragActive 
                            ? 'border-rose-450 bg-rose-50/30' 
                            : newBannerImage 
                            ? 'border-rose-300 bg-white hover:bg-rose-50/10' 
                            : 'border-gray-250 bg-white hover:bg-gray-50/50'
                        }`}
                      >
                        <input
                          ref={bannerFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileChange}
                          className="hidden"
                        />
                        {newBannerImage ? (
                          <div className="relative w-full flex items-center justify-between gap-3 p-1">
                            <img 
                              src={newBannerImage} 
                              alt="New banner preview" 
                              className="w-12 h-12 rounded-lg object-cover border border-rose-200" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-bold text-[10px] text-gray-800 truncate">Attached Image</p>
                              <p className="text-[9px] text-gray-500 font-mono">Ready to assemble</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewBannerImage('');
                              }}
                              className="p-1 text-gray-400 hover:text-rose-500 hover:bg-gray-100 rounded-full cursor-pointer transition"
                              title="Clear image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="p-2 bg-rose-50 rounded-full border border-rose-100">
                              <Upload className="w-4 h-4 text-rose-500 animate-pulse" />
                            </div>
                            <p className="font-semibold text-[11px] text-gray-850 leading-none">Click to browse file</p>
                            <p className="text-[9px] text-gray-400">or drag & drop your banner here</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs text-left">
                        <input
                          type="url"
                          value={newBannerImage}
                          onChange={(e) => setNewBannerImage(e.target.value)}
                          placeholder="Paste landscape scenery Unsplash URL..."
                          className="w-full bg-white border border-gray-250 py-2 px-3 rounded-lg outline-none"
                        />
                        {newBannerImage && (
                          <div className="flex items-center gap-3 p-1.5 border border-rose-200 rounded-xl bg-rose-50/10">
                            <img 
                              src={newBannerImage} 
                              alt="URL preview" 
                              className="w-12 h-12 rounded-lg object-cover border border-rose-200" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-bold text-[10px] text-gray-800 truncate">URL Preview</p>
                              <p className="text-[9px] text-gray-500 font-mono truncate">{newBannerImage}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    Assemble Banner Ad
                  </button>
                </form>
              </div>

              {/* Show active banners control column */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-xs font-extrabold text-neutral-800 uppercase tracking-wide block">Active Banner Lists</span>

                <div className="space-y-4 max-h-[460px] overflow-y-auto">
                  {banners.map((b) => (
                    <div key={b.id} className="p-4 rounded-2xl border border-gray-150 bg-white flex flex-col sm:flex-row gap-4 justify-between items-stretch">
                      
                      {/* Left cover spec */}
                      <div className="flex gap-3 text-left">
                        <img src={b.imageUrl} className="w-16 h-16 rounded object-cover shrink-0 bg-gray-50" referrerPolicy="no-referrer" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-gray-800 leading-tight">{b.title}</h4>
                          <p className="text-[10px] text-gray-500">{b.discountText}</p>
                          <span className={`inline-block py-0.5 px-2 rounded-full font-bold text-[9px] ${
                            b.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-550'
                          }`}>
                            {b.isActive ? 'Active Display' : 'Ad Hidden'}
                          </span>
                        </div>
                      </div>

                      {/* Right control buttons */}
                      <div className="flex gap-2 items-center shrink-0">
                        <button
                          onClick={() => handleToggleBannerAd(b.id)}
                          className="px-3 py-1.5 border border-gray-250 bg-gray-50 rounded hover:bg-gray-100 text-[10px] font-bold text-gray-700 cursor-pointer"
                        >
                          Toggle Active
                        </button>
                        <button
                          onClick={() => handleDeleteBannerAd(b.id)}
                          className="p-1.5 border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-PAGE 07: LIVE CHAT */}
        {activeTab === 'Live Chat' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Active Support Messaging</h2>
              <p className="text-xs text-gray-500">Respond live in real-time to active customers beauty consultation queries</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[460px] border border-gray-150 rounded-2xl overflow-hidden bg-rose-50/10">
              
              {/* Left Column: Ongoing Sessions Threads selector list */}
              <div className="md:col-span-1 border-r border-gray-150 overflow-y-auto bg-white flex flex-col">
                <span className="p-3 text-[10px] uppercase font-bold text-gray-400 bg-gray-50/50 border-b border-gray-100">Inbox Threads ({chats.length})</span>
                
                <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
                  {chats.length > 0 ? (
                    chats.map((c) => {
                      const isSelected = selectedChatSessionId === c.id;
                      const textLines = c.messages || [];
                      const latest = textLines[textLines.length - 1];
                      
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedChatSessionId(isSelected ? null : c.id)}
                          className={`p-3 text-xs text-left cursor-pointer transition ${
                            isSelected ? 'bg-rose-50/50 border-l-4 border-rose-500' : 'hover:bg-gray-50/40'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-800 font-mono">{c.id.substring(0, 14)}</span>
                            <span className="text-[8px] text-gray-400">
                              {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate leading-snug">
                            {latest ? latest.text : 'Opened conversation support...'}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <p className="text-gray-400 text-xs italic font-medium">No live messaging inbox logs found.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Chat thread conversation window */}
              <div className="md:col-span-2 flex flex-col justify-between overflow-hidden relative">
                {selectedChatSessionId && activeChat ? (
                  <>
                    {/* Active message lists */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
                      {(activeChat.messages || []).map((msg, index) => {
                        const isCustomer = msg.sender === 'customer';
                        return (
                          <div
                            key={index}
                            className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs shadow-xs text-left ${
                                isCustomer
                                  ? 'bg-rose-50 text-neutral-800 rounded-tl-none border border-rose-100/50'
                                  : 'bg-neutral-900 text-white rounded-tr-none'
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              <span
                                className={`text-[8px] block mt-1 text-right ${
                                  isCustomer ? 'text-gray-400' : 'text-neutral-300'
                                }`}
                              >
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatsEndRef} />
                    </div>

                    {/* Simple Message Form reply box */}
                    <form onSubmit={handleSendAdminChatReply} className="p-3 bg-white border-t border-gray-150 flex gap-2">
                      <input
                        type="text"
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder="Reply customer back as admin..."
                        className="flex-1 bg-gray-50 border border-gray-250 py-2.5 px-4 rounded-xl text-xs outline-none focus:ring-1 focus:focus:ring-rose-400 text-gray-800"
                      />
                      <button
                        type="submit"
                        className="px-5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                      >
                        Reply
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 bg-white flex flex-col items-center justify-center text-center space-y-2 p-6">
                    <MessageSquare className="w-8 h-8 text-neutral-300 animate-bounce" />
                    <p className="text-gray-400 text-xs">Please select an open customer mailbox session on the left panel to reply live.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* SUB-PAGE 08: DELIVERY SLIPS */}
        {activeTab === 'Delivery Slips' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Delivery Slip Archive Search</h2>
              <p className="text-xs text-gray-500">Scan historical transactions, apply calendar dates boundaries, and reprint thermal roll sheets</p>
            </div>

            {/* Filter control row */}
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 p-4 border border-gray-150 rounded-2xl text-xs font-semibold">
              <div className="flex-1 space-y-1 block text-left">
                <label className="text-gray-500">Search Order No</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterSlipOrderNum}
                    onChange={(e) => setFilterSlipOrderNum(e.target.value)}
                    placeholder="e.g. HB-10001"
                    className="w-full bg-white border border-gray-200 py-1.5 pl-8 pr-3 rounded focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-1 block text-left">
                <label className="text-gray-550 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Narrow Day Date
                </label>
                <input
                  type="date"
                  value={filterSlipDate}
                  onChange={(e) => setFilterSlipDate(e.target.value)}
                  className="w-full bg-white border border-gray-220 py-1.5 px-3 rounded focus:outline-none text-[11px]"
                />
              </div>

              <button
                onClick={() => { setFilterSlipOrderNum(''); setFilterSlipDate(''); }}
                className="py-2.5 px-4 border border-rose-200 text-rose-500 font-bold bg-rose-50 rounded hover:bg-rose-100 transition cursor-pointer"
              >
                Reset Filter
              </button>
            </div>

            {/* Slip table matched logs */}
            <div className="overflow-x-auto border border-gray-150 rounded-2xl">
              <table className="w-full text-xs text-neutral-800">
                <thead className="bg-gray-50 border-b border-gray-150">
                  <tr>
                    <th className="p-3 text-left">Order #</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-right">Sum Bill</th>
                    <th className="p-3 text-center">Receipt slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-left">
                  {filteredArchiveRequests.length > 0 ? (
                    filteredArchiveRequests.map((o) => (
                      <tr key={o.id} className="hover:bg-rose-50/15">
                        <td className="p-3 font-mono font-bold text-gray-800">{o.id}</td>
                        <td className="p-3 font-mono text-gray-500">{o.date}</td>
                        <td className="p-3 text-gray-900 font-medium">{o.customerName}</td>
                        <td className="p-3 text-right font-black text-rose-600 font-mono">{o.totalAmount.toFixed(0)} TK</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedArchiveOrder(o)}
                            className="px-3 py-1.5 bg-neutral-900 text-white rounded hover:bg-neutral-850 cursor-pointer font-bold transition text-[10px]"
                          >
                            Generate POS
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 italic font-medium">No archived receipts matched filters criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Slip printed popup preview block */}
            {selectedArchiveOrder && (
              <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <DeliverySlip
                  order={selectedArchiveOrder}
                  // We simulate historical sub basket values or can compute from product listings
                  items={products.slice(0, 2).map(p => ({ product: p, qty: 1 }))}
                  onClose={() => setSelectedArchiveOrder(null)}
                />
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
