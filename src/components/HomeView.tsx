import { useState, useEffect } from 'react';
import { dbService } from '../firebase';
import { Product, Category } from '../types';
import { Sparkles, ArrowRight, Star, Heart, CheckCircle } from 'lucide-react';

interface HomeViewProps {
  onNavigateToShop: (catName?: string) => void;
}

export default function HomeView({ onNavigateToShop }: HomeViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  useEffect(() => {
    async function loadHomeData() {
      const cats = await dbService.getCategories();
      setCategories(cats);

      const prods = await dbService.getProducts();
      // Filter products containing any discount percentage greater than 0, ordered descending
      const topDiscounts = prods
        .filter(p => p.discountOffer > 0 && p.stockQuantity > 0)
        .sort((a, b) => b.discountOffer - a.discountOffer)
        .slice(0, 4);
      setDiscountProducts(topDiscounts);

      const ads = await dbService.getBanners();
      setBanners(ads.filter(b => b.isActive));
    }
    loadHomeData();
  }, []);

  // Set up banner slideshow interval
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="space-y-12 pb-16 font-sans">
      {/* Dynamic Slide Advertisements Banner */}
      {banners.length > 0 ? (
        <div className="relative overflow-hidden rounded-3xl bg-brand-charcoal text-brand-warm min-h-[340px] flex items-center shadow-lg transition-transform duration-500 border border-brand-sand">
          <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply">
            <img 
              src={banners[activeBannerIdx].imageUrl} 
              alt={banners[activeBannerIdx].title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal via-brand-charcoal/80 to-transparent z-10"></div>
          
          <div className="relative z-20 px-8 sm:px-12 md:px-16 max-w-2xl py-12 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-brand-sage text-brand-warm font-bold rounded-full uppercase tracking-widest leading-none">
              <Sparkles className="w-3.5 h-3.5 text-brand-peach" />
              Special Promo
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold italic tracking-tight leading-none text-brand-warm transition-opacity duration-300">
              {banners[activeBannerIdx].title}
            </h1>
            <p className="text-sm sm:text-base text-brand-sand">
              {banners[activeBannerIdx].discountText}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigateToShop()}
                className="inline-flex items-center gap-2 bg-brand-warm hover:bg-brand-sand text-brand-charcoal font-bold px-6 py-3 rounded-full shadow-lg transition duration-300 transform scale-100 hover:scale-105 cursor-pointer text-sm"
              >
                Explore Beauty Shop
                <ArrowRight className="w-4 h-4 text-brand-sage" />
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 right-8 sm:right-12 z-30 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
                    i === activeBannerIdx ? 'bg-brand-sage animate-pulse' : 'bg-brand-sand/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Fallback Clean Minimalist Static Hero if banners are loading or empty */
        <div className="rounded-3xl bg-gradient-to-r from-brand-warm via-brand-sand/35 to-brand-peach/20 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row justify-between items-center gap-8 border border-brand-sand shadow-inner text-left">
          <div className="max-w-xl space-y-4 text-left">
            <span className="text-xs bg-brand-sage/10 text-brand-sage font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-brand-sage/20">
              Exclusive Beauty Essentials
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-brand-charcoal tracking-tight leading-tight">
              Ramadan Glow Collection
            </h1>
            <p className="text-sm sm:text-base text-brand-charcoal/80 leading-relaxed font-sans">
              Unlock the magic of pristine face and body therapy. Specially formulated creams, serums, and lip balms curated to nourish your exquisite natural aura.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigateToShop()}
                className="inline-flex items-center gap-2 bg-brand-sage hover:bg-brand-sage/90 text-brand-warm font-bold px-6 py-3 rounded-full shadow-md transition duration-200 cursor-pointer"
              >
                Shop All Products
                <ArrowRight className="w-4.5 h-4.5 text-brand-peach" />
              </button>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=420"
              alt="Cosmetics Bottle"
              className="w-72 h-72 rounded-2xl object-cover shadow-xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Featured Core Value Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-brand-sand space-y-2 relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-md text-left">
          <div className="h-10 w-10 bg-brand-warm text-brand-sage border border-brand-sand flex items-center justify-center rounded-xl font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-brand-charcoal text-base">100% Authentic Products</h3>
          <p className="text-xs text-brand-charcoal/70">直接 importation from verified certified beauty laboratories in Korea & France.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-brand-sand space-y-2 relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-md text-left">
          <div className="h-10 w-10 bg-brand-warm text-brand-sage border border-brand-sand flex items-center justify-center rounded-xl font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-brand-charcoal text-base">Cruelty-Free Therapy</h3>
          <p className="text-xs text-brand-charcoal/70">Nourish with high clinical standard components, fully organic and environment safe.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-brand-sand space-y-2 relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-md text-left">
          <div className="h-10 w-10 bg-brand-warm text-brand-sage border border-brand-sand flex items-center justify-center rounded-xl font-bold">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-brand-charcoal text-base">Fast Express Delivery</h3>
          <p className="text-xs text-brand-charcoal/70">Dhaka shipping within 24 hours, outside Dhaka courier service in is safe 2 days.</p>
        </div>
      </div>

      {/* Product Categories Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-end text-left">
          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Browse by Beauty Focus</h2>
            <p className="text-xs text-brand-charcoal/70">Clean solutions engineered specifically for skin needs</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          {categories.map((cat, idx) => (
            <button
              key={cat.id || idx}
              onClick={() => onNavigateToShop(cat.name)}
              className="group relative h-28 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition bg-gradient-to-br from-brand-warm to-brand-sand/50 border border-brand-sand mb-2 cursor-pointer p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-sage bg-brand-sage/10 px-2.5 py-0.5 rounded-full border border-brand-sage/10">
                  Focus {idx + 1}
                </span>
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center group-hover:bg-brand-sage group-hover:text-brand-warm transition duration-200 shadow-xs">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-serif font-bold text-brand-charcoal group-hover:text-brand-sage transition">{cat.name}</p>
                <p className="text-[10px] text-brand-charcoal/50">View Catalog</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Exceptional Deals / Discount Section */}
      {discountProducts.length > 0 && (
        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-end text-left">
            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Best Discounted Deals</h2>
              <p className="text-xs text-brand-charcoal/70">Grab our highest active skincare saving bargains today</p>
            </div>
            <button
              onClick={() => onNavigateToShop()}
              className="text-xs font-bold text-brand-sage hover:text-brand-sage/80 inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              View Shop
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
            {discountProducts.map((p) => {
              const discountedPrice = p.sellingPrice * (1 - p.discountOffer / 100);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-brand-sand shadow-sm overflow-hidden flex flex-col h-full group transform transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Image Wrapper */}
                  <div className="relative pt-[115%] bg-brand-warm/20 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-brand-peach text-brand-charcoal text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded z-10 shadow border border-brand-sand/40">
                      {p.discountOffer}% OFF
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex-grow flex flex-col justify-between text-left space-y-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-brand-charcoal/60 tracking-wider">
                        {p.category}
                      </span>
                      <h4 className="text-xs font-serif font-bold text-brand-charcoal line-clamp-1 group-hover:text-brand-sage transition">
                        {p.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-brand-charcoal font-mono">
                          {discountedPrice.toFixed(0)} TK
                        </span>
                        <span className="text-[10px] line-through text-brand-charcoal/40 font-mono">
                          {p.sellingPrice} TK
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigateToShop()}
                        className="text-[10px] font-bold text-brand-sage bg-brand-warm hover:bg-brand-sand transition py-1 px-2.5 rounded-lg border border-brand-sand cursor-pointer font-sans"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
