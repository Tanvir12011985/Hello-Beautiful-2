import React, { useState } from 'react';
import { dbService } from '../firebase';
import { Order } from '../types';
import { Search, Compass, CheckCircle2, Package, Truck, Smile, Sparkles } from 'lucide-react';

export default function OrderTrackingView() {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderIdInput.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setStatusChecked(false);
    setTargetOrder(null);

    try {
      const orders = await dbService.getOrders();
      const match = orders.find(o => o.id === cleanId);
      if (match) {
        setTargetOrder(match);
      }
    } catch (err) {
      console.error('Order tracking lookup error: ', err);
    } finally {
      setLoading(false);
      setStatusChecked(true);
    }
  };

  // Define phases
  const steps = [
    { title: 'Order Confirmed', icon: CheckCircle2, desc: 'Your order details have been secured.' },
    { title: 'Packing Done', icon: Package, desc: 'Sterilized products wrapped and sealed.' },
    { title: 'Hand over to courier agent', icon: Truck, desc: 'Package forwarded to delivery fleet.' },
    { title: 'Delivery Done', icon: Smile, desc: 'Dispatched and hand-delivered safely!' }
  ];

  const getStepProgressIndex = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Order Confirmed': return 0;
      case 'Packing Done': return 1;
      case 'Hand over to courier agent': return 2;
      case 'Delivery Done': return 3;
      default: return 0;
    }
  };

  const currentStepIdx = targetOrder ? getStepProgressIndex(targetOrder.orderStatus) : -1;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16 font-sans text-left">
      
      {/* Header card panel */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-brand-sand shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <Compass className="w-8 h-8 text-brand-sage animate-spin-slow" />
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-brand-charcoal tracking-tight">Track Your Package</h1>
            <p className="text-xs text-brand-charcoal/70">Enter order ID to trace real-time fulfillment status</p>
          </div>
        </div>

        {/* Input box */}
        <form onSubmit={handleTrackSubmit} className="flex gap-2 text-xs">
          <div className="flex-1 relative text-brand-charcoal/50 focus-within:text-brand-sage transition duration-150">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="e.g. HB-10001"
              className="w-full text-xs bg-brand-warm/30 border border-brand-sand rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-brand-sage text-brand-charcoal font-mono tracking-widest font-semibold placeholder:tracking-normal placeholder:font-normal uppercase"
            />
          </div>
          <button
            type="submit"
            id="track-order-btn"
            className="px-6 py-3 bg-brand-sage hover:bg-brand-sage/90 text-brand-warm font-bold rounded-xl shadow transition cursor-pointer"
          >
            Track
          </button>
        </form>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-brand-charcoal/70 font-sans">
          <span className="inline-block animate-bounce mr-2">✨</span> Searching database...
        </div>
      )}

      {/* Lookup outcomes */}
      {statusChecked && (
        targetOrder ? (
          <div 
            id="tracking-progress-card"
            className="bg-white rounded-3xl border border-brand-sand p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Top Order specs label */}
            <div className="flex flex-col sm:flex-row justify-between border-b border-brand-sand/55 pb-5 gap-3 text-left">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-sage bg-brand-warm py-1 px-3.5 rounded-full border border-brand-sand/65">
                  Status Live Active
                </span>
                <p className="text-sm font-bold text-brand-charcoal">
                  Order No: <span className="font-mono text-brand-sage">{targetOrder.id}</span>
                </p>
              </div>
              <div className="space-y-1 text-left sm:text-right text-xs">
                <p className="text-brand-charcoal/60">Creation Date: <span className="font-mono text-brand-charcoal/70">{targetOrder.date}</span></p>
                <p className="text-brand-charcoal font-extrabold">Total Amount: {targetOrder.totalAmount.toFixed(0)} TK</p>
              </div>
            </div>

            {/* 4 Steps timeline progress indicators */}
            <div className="relative space-y-6">
              
              {/* Desktop Progress Line */}
              <div className="absolute left-[20px] top-3 bottom-3 w-[2px] bg-brand-warm -z-10 hidden sm:block">
                <div 
                  className="w-full bg-brand-sage transition-all duration-500" 
                  style={{ height: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {/* Dynamic steps loop mapping */}
              <div className="space-y-8 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-4 relative text-left">
                {steps.map((st, idx) => {
                  const StepIcon = st.icon;
                  const isCompleted = idx <= currentStepIdx;
                  const isActive = idx === currentStepIdx;

                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-4 sm:flex-col sm:items-center sm:text-center transition duration-300 ${
                        isCompleted ? 'text-brand-charcoal' : 'text-brand-charcoal/40'
                      }`}
                    >
                      {/* Step Indicator Avatar Circle bubble */}
                      <div 
                        className={`flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center border-2 transition duration-300 font-bold ${
                          isActive
                            ? 'bg-brand-sage text-brand-warm border-brand-sage shadow-md ring-4 ring-brand-warm'
                            : isCompleted
                            ? 'bg-brand-sand text-brand-charcoal border-brand-sand'
                            : 'bg-white text-brand-charcoal/30 border-brand-sand/50'
                        }`}
                      >
                        {isCompleted && !isActive ? (
                          <svg className="w-5 h-5 text-brand-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </div>

                      {/* Step description detail texts block */}
                      <div className="space-y-1 text-left sm:text-center pt-1 sm:pt-0">
                        <h4 className={`text-xs font-serif font-bold leading-none ${isActive ? 'text-brand-sage' : 'text-brand-charcoal'}`}>
                          {st.title}
                        </h4>
                        <p className="text-[10px] text-brand-charcoal/60 font-normal max-w-[150px] leading-snug mx-auto">
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Note alert */}
            <div className="bg-brand-peach/10 p-4 border border-brand-sand rounded-2xl flex items-center gap-3 text-left">
              <div className="text-xl">👩‍🎨</div>
              <p className="text-[11px] text-brand-sage font-medium">To edit/modify delivery location or address, contact our instant Help Concierge chat agent on the bottom right!</p>
            </div>

          </div>
        ) : (
          <div 
            id="tracking-not-found-card"
            className="bg-white rounded-3xl border border-brand-sand p-8 text-center space-y-4 shadow-sm animate-in fade-in duration-200"
          >
            <div className="text-3xl">🏜️</div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-brand-charcoal text-sm">Order ID Not Found</h3>
              <p className="text-xs text-brand-charcoal/60">We could not retrieve any active shipping order matching <span className="font-mono text-brand-sage font-bold uppercase">"{orderIdInput}"</span>.</p>
            </div>
            <p className="text-[10px] text-brand-charcoal/50">Please audit the receipt code or contact administration if you require immediate shipping validation.</p>
          </div>
        )
      )}

    </div>
  );
}
