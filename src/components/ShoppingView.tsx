import React, { useState, useEffect } from 'react';
import { dbService } from '../firebase';
import { Product, Category, Order } from '../types';
import { Search, ShoppingBag, X, Plus, Minus, Check, ChevronRight, MapPin, Phone, CreditCard, Sparkles } from 'lucide-react';
import DeliverySlip from './DeliverySlip';

interface ShoppingViewProps {
  initialCategory?: string;
}

export default function ShoppingView({ initialCategory }: ShoppingViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');

  // Shopping cart bag state: id mapped to qty
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [isBagOpen, setIsBagOpen] = useState(false);

  // Checkout overlay triggers
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Bkash' | 'Nagad'>('Cash on Delivery');
  const [deliveryRegion, setDeliveryRegion] = useState<'Inside Dhaka' | 'Outside Dhaka'>('Inside Dhaka');

  // Receipt printed modal trigger
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedItems, setCompletedItems] = useState<{ product: Product, qty: number }[]>([]);

  useEffect(() => {
    async function loadShopData() {
      const cats = await dbService.getCategories();
      setCategories(cats);

      const prods = await dbService.getProducts();
      setProducts(prods);

      if (initialCategory) {
        setSelectedCategory(initialCategory);
      }
    }
    loadShopData();
  }, [initialCategory]);

  // Handle bag actions
  const addToCart = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // Check stock limit
    const currentInCart = cart[productId] || 0;
    if (currentInCart >= prod.stockQuantity) {
      alert(`Cannot add more. Only ${prod.stockQuantity} pieces available in stock.`);
      return;
    }

    setCart(prev => ({
      ...prev,
      [productId]: currentInCart + 1
    }));
    setIsBagOpen(true);
  };

  const updateCartQty = (productId: string, val: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (val <= 0) {
      setCart(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      return;
    }

    if (val > prod.stockQuantity) {
      alert(`Only ${prod.stockQuantity} items in stock.`);
      return;
    }

    setCart(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  const clearCart = () => {
    setCart({});
  };

  // Derivative calculations
  const cartItems: { product: Product; qty: number }[] = Object.entries(cart).map(([pid, qty]) => {
    const product = products.find(p => p.id === pid)!;
    return { product, qty: Number(qty) };
  }).filter(item => !!item.product);

  const subtotal = cartItems.reduce((acc, curr) => {
    const priceWithDiscount = curr.product.sellingPrice * (1 - curr.product.discountOffer / 100);
    return acc + (priceWithDiscount * curr.qty);
  }, 0);

  const deliveryCharge = deliveryRegion === 'Inside Dhaka' ? 80 : 120;
  const totalAmount = subtotal + deliveryCharge;

  // Filters math
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'All Products' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const cartItemsCount: number = Object.values(cart).reduce((a, b) => Number(a) + Number(b), 0) as number;

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !address || !mobileNumber) {
      alert('Please fill out all billing shipping details.');
      return;
    }

    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(mobileNumber.trim())) {
      alert('Please put in a valid 11-digit Bangladeshi mobile phone number (e.g. 01712345678).');
      return;
    }

    const orderInput: Omit<Order, 'id' | 'date' | 'createdAt'> = {
      customerName: customerName.trim(),
      address: address.trim(),
      mobileNumber: mobileNumber.trim(),
      paymentMethod,
      deliveryRegion,
      deliveryCharge,
      subtotal,
      totalAmount,
      orderStatus: 'Order Confirmed'
    };

    try {
      // Save order, which decrements stock inside dbService
      const savedDoc = await dbService.saveOrder(orderInput, cartItems);
      
      // Keep copy of items bought for printable Delivery Slip rendering
      setCompletedItems([...cartItems]);
      
      // Save created order structure to state to trigger recipe popup display
      setCompletedOrder(savedDoc);

      // Clean billing forms and shopping cart bag
      setCustomerName('');
      setAddress('');
      setMobileNumber('');
      setCart({});
      setIsCheckoutOpen(false);
      setIsBagOpen(false);

      // Reload products to sync updated stock counters
      const freshProds = await dbService.getProducts();
      setProducts(freshProds);

    } catch (err) {
      console.error('Order reservation failure: ', err);
      alert('Could not complete order reservation. Try again.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-16 font-sans relative">
      
      {/* Primary Products view */}
      <div className="flex-1 space-y-6">
        
        {/* Real-time search and Header banner */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-6 rounded-3xl border border-brand-sand shadow-sm text-left">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-brand-charcoal tracking-tight">Cosmetic Bar</h1>
            <p className="text-xs text-brand-charcoal/70">Pick from our premium original collections</p>
          </div>
          {/* Custom styled search bar */}
          <div className="relative text-brand-charcoal/50 focus-within:text-brand-sage transition duration-150">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product names..."
              className="pl-10 pr-4 py-2.5 text-xs w-full sm:w-64 border border-brand-sand rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-sage bg-brand-warm/30 text-brand-charcoal placeholder:text-brand-charcoal/40"
            />
          </div>
        </div>

        {/* Dynamic categories selector row */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All Products')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'All Products'
                ? 'bg-brand-sage text-brand-warm shadow-md'
                : 'bg-white text-brand-charcoal border border-brand-sand hover:bg-brand-warm'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-brand-sage text-brand-warm shadow-md'
                  : 'bg-white text-brand-charcoal border border-brand-sand hover:bg-brand-warm'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Catalogue Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
              const discountedPrice = p.sellingPrice * (1 - p.discountOffer / 100);
              const outOfStock = p.stockQuantity <= 0;
              const lowStock = p.stockQuantity > 0 && p.stockQuantity < 10;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border border-brand-sand overflow-hidden flex flex-col justify-between text-left group transition duration-300 ${
                    outOfStock ? 'opacity-85 shadow-none' : 'hover:-translate-y-1 hover:shadow-md'
                  }`}
                >
                  {/* Photo Cover Wrapper */}
                  <div className="relative pt-[115%] bg-brand-warm/10 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Discount Sticker */}
                    {p.discountOffer > 0 && !outOfStock && (
                      <div className="absolute top-3 left-3 bg-brand-peach text-brand-charcoal text-[10px] font-extrabold px-2.5 py-1 rounded shadow border border-brand-sand/40">
                        {p.discountOffer}% OFF
                      </div>
                    )}

                    {/* Stock Alert Label */}
                    {outOfStock ? (
                      <div className="absolute inset-0 bg-brand-charcoal/65 backdrop-blur-xs flex items-center justify-center font-serif italic text-brand-warm text-sm tracking-widest uppercase">
                        SOLD OUT
                      </div>
                    ) : lowStock ? (
                      <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                        Only {p.stockQuantity} Safe left!
                      </div>
                    ) : null}
                  </div>

                  {/* Body Text */}
                  <div className="p-4 space-y-4 flex flex-col justify-between flex-grow">
                    <div className="space-y-1">
                      <span className="text-[10px] text-brand-mud font-extrabold uppercase tracking-wider">
                        {p.category}
                      </span>
                      <h3 className="font-serif font-bold text-sm text-brand-charcoal tracking-tight leading-snug line-clamp-2">
                        {p.name}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-extrabold text-brand-charcoal font-sans">
                            {discountedPrice.toFixed(0)} TK
                          </span>
                          {p.discountOffer > 0 && (
                            <span className="text-xs line-through text-brand-charcoal/40 font-mono">
                              {p.sellingPrice} TK
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-brand-charcoal/50 font-mono font-medium">
                          QTY: {p.stockQuantity}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(p.id)}
                        disabled={outOfStock}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                          outOfStock
                            ? 'bg-brand-sand text-brand-charcoal/30 cursor-not-allowed border border-brand-sand shadow-none'
                            : 'bg-brand-sage hover:bg-brand-sage/90 text-brand-warm hover:shadow'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 bg-white border border-brand-sand rounded-3xl text-center space-y-2">
            <p className="text-brand-charcoal/60 text-sm">No beauty items matched your exact lookup query.</p>
            <button
              onClick={() => { setSelectedCategory('All Products'); setSearchQuery(''); }}
              className="text-xs font-semibold text-brand-sage hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Floating Cart Launcher Button on Mobile (only shown if bag is hidden) */}
      {!isBagOpen && cartItemsCount > 0 && (
        <button
          onClick={() => setIsBagOpen(true)}
          className="lg:hidden fixed bottom-6 left-6 z-40 h-14 w-14 bg-brand-sage hover:bg-brand-sage/90 text-brand-warm rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition transform scale-100 hover:scale-105 border border-brand-sand"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6 text-brand-warm" />
            <span className="absolute -top-1.5 -right-1.5 bg-brand-charcoal text-brand-warm font-extrabold border-2 border-brand-sand text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemsCount}
            </span>
          </div>
        </button>
      )}

      {/* Side Shopping Bag (Overlay panel/Sidebar) */}
      {isBagOpen && (
        <div 
          id="cart-sidebar"
          className="fixed inset-0 z-50 overflow-hidden lg:relative lg:inset-auto lg:z-10 lg:w-96 flex justify-end"
        >
          {/* Backdrop on mobile screen */}
          <div 
            className="absolute inset-0 bg-brand-charcoal/50 backdrop-blur-xs lg:hidden"
            onClick={() => setIsBagOpen(false)}
          />

          <div className="relative w-85 sm:w-96 max-w-full h-full bg-white lg:rounded-3xl border border-brand-sand shadow-2xl flex flex-col justify-between text-left lg:h-[620px] lg:sticky lg:top-24">
            
            {/* Header */}
            <div className="p-4 border-b border-brand-sand flex justify-between items-center bg-brand-warm/60 lg:rounded-t-3xl">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-sage" />
                <h3 className="font-serif font-bold text-brand-charcoal text-sm">Shopping Bag</h3>
                <span className="text-xs font-bold bg-brand-warm text-brand-sage px-2 py-0.5 rounded-full border border-brand-sand/55">
                  {cartItemsCount} items
                </span>
              </div>
              <button
                onClick={() => setIsBagOpen(false)}
                id="close-cart-btn"
                className="text-brand-charcoal/60 hover:text-brand-charcoal p-1 bg-white border border-brand-sand rounded-lg shadow-xs cursor-pointer transition duration-150"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.length > 0 ? (
                cartItems.map((item) => {
                  const finalPrice = item.product.sellingPrice * (1 - item.product.discountOffer / 100);
                  return (
                    <div
                      key={item.product.id}
                      className="flex gap-3 bg-brand-warm/20 p-3 rounded-xl border border-brand-sand/65 font-sans"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div className="space-y-0.5 text-left">
                          <h4 className="text-xs font-serif font-bold text-brand-charcoal line-clamp-1">{item.product.name}</h4>
                          <p className="text-[10px] text-brand-mud uppercase tracking-wider">{item.product.category}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-brand-sage font-mono">
                            {(finalPrice * item.qty).toFixed(0)} TK
                          </span>
                          
                          {/* Qty selectors */}
                          <div className="flex items-center gap-1.5 border border-brand-sand rounded-lg p-0.5 bg-white shadow-xs">
                            <button
                              onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                              className="text-brand-charcoal/60 hover:bg-brand-warm h-5 w-5 flex items-center justify-center rounded cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-brand-charcoal w-4 text-center select-none font-mono">{item.qty}</span>
                            <button
                              onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                              className="text-brand-charcoal/60 hover:bg-brand-warm h-5 w-5 flex items-center justify-center rounded cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                  <div className="p-3 bg-brand-warm rounded-full text-brand-sage border border-brand-sand">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="text-brand-charcoal/50 text-xs">Your shopping bag is empty.</p>
                </div>
              )}
            </div>

            {/* Sticky summary footer */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-brand-sand space-y-4 bg-brand-warm/40 lg:rounded-b-3xl">
                <div className="flex justify-between items-center bg-transparent">
                  <span className="text-xs text-brand-charcoal/60 font-medium">Cart Subtotal:</span>
                  <span className="text-base font-black text-brand-charcoal font-sans">{subtotal.toFixed(0)} TK</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="flex-1 py-3 text-xs bg-brand-sand/40 hover:bg-brand-sand/70 text-brand-charcoal font-bold rounded-xl transition duration-150 cursor-pointer border border-brand-sand"
                  >
                    Clear Bag
                  </button>
                  <button
                    onClick={() => setIsCheckoutOpen(true)}
                    id="trigger-checkout-btn"
                    className="flex-3 py-3 text-xs bg-brand-sage hover:bg-brand-sage/90 text-brand-warm font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <span>Proceed to Checkout</span>
                    <ChevronRight className="w-4 h-4 text-brand-peach" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Screen Modal Overlay */}
      {isCheckoutOpen && (
        <div 
          id="checkout-overlay"
          className="fixed inset-0 z-50 bg-brand-charcoal/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans"
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-brand-sand flex flex-col text-left max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-brand-warm via-brand-sand/30 to-brand-peach/10 border-b border-brand-sand flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-sage" />
                <h3 className="font-serif font-bold text-brand-charcoal text-lg tracking-tight">Delivery Billing Check</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                id="close-checkout-modal-btn"
                className="text-brand-charcoal/60 hover:text-brand-charcoal bg-white border border-brand-sand rounded-full p-1 cursor-pointer transition shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form checkout body */}
            <form onSubmit={handleSubmitCheckout} className="p-6 md:p-8 space-y-5 overflow-y-auto">
              
              <div className="space-y-4">
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5 matches-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name..."
                    className="w-full text-xs bg-brand-warm/30 border border-brand-sand rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-brand-sage text-brand-charcoal"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5 matches-label">
                    <Phone className="w-3.5 h-3.5 text-brand-mud" />
                    Mobile Contact
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. 01712345678"
                    className="w-full text-xs bg-brand-warm/30 border border-brand-sand rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-brand-sage text-brand-charcoal font-mono"
                  />
                  <p className="text-[10px] text-brand-charcoal/50 font-medium">Please enter an active 11-digit mobile contact number.</p>
                </div>

                {/* Shipping Location Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-mud" />
                    Complete Delivery Address
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter complete house, street, area, and city address..."
                    className="w-full text-xs bg-brand-warm/30 border border-brand-sand rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-brand-sage text-brand-charcoal"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Delivery Region radios */}
                  <div className="p-4 bg-brand-warm/20 rounded-xl border border-brand-sand space-y-2">
                    <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider block">Delivery Region</span>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-brand-charcoal">
                        <input
                          type="radio"
                          name="deliveryRegion"
                          checked={deliveryRegion === 'Inside Dhaka'}
                          onChange={() => setDeliveryRegion('Inside Dhaka')}
                          className="accent-brand-sage h-4 w-4"
                        />
                        Inside Dhaka City (80 TK)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-brand-charcoal">
                        <input
                          type="radio"
                          name="deliveryRegion"
                          checked={deliveryRegion === 'Outside Dhaka'}
                          onChange={() => setDeliveryRegion('Outside Dhaka')}
                          className="accent-brand-sage h-4 w-4"
                        />
                        Outside Dhaka City (120 TK)
                      </label>
                    </div>
                  </div>

                  {/* Payment dropdown */}
                  <div className="p-4 bg-brand-warm/20 rounded-xl border border-brand-sand space-y-2">
                    <label className="text-xs font-bold text-brand-charcoal uppercase tracking-wider block flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-brand-mud" />
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full text-xs bg-white border border-brand-sand py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-sage text-brand-charcoal font-semibold"
                    >
                      <option value="Cash on Delivery">💵 Cash on Delivery (COD)</option>
                      <option value="Bkash">📱 bKash Wallet Transfer</option>
                      <option value="Nagad">📱 Nagad Wallet Transfer</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Bill Details Box */}
              <div className="p-4 bg-brand-warm/40 border border-brand-sand rounded-2xl space-y-1.5 text-xs text-brand-charcoal">
                <div className="flex justify-between">
                  <span>Basket Subtotal</span>
                  <span className="font-bold">{subtotal.toFixed(0)} TK</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-bold">+{deliveryCharge} TK</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-brand-sand pt-1.5 mt-1.5 font-extrabold text-sm text-brand-charcoal">
                  <span>Order Grand Total</span>
                  <span className="font-black text-brand-sage font-mono">{totalAmount.toFixed(0)} TK</span>
                </div>
              </div>

              {/* Trigger confirm button */}
              <button
                type="submit"
                id="submit-order-checkout-btn"
                className="w-full py-3.5 bg-brand-sage hover:bg-brand-sage/90 text-brand-warm font-bold rounded-2xl transition duration-200 cursor-pointer text-sm shadow-md flex items-center justify-center gap-2 hover:shadow-lg"
              >
                <Check className="w-5 h-5 text-brand-peach" />
                Confirm Beauty Order
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Successful Complete Order Receipt Display Slip Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <DeliverySlip
            order={completedOrder}
            items={completedItems}
            onClose={() => setCompletedOrder(null)}
          />
        </div>
      )}

    </div>
  );
}
