import { Order, Product } from '../types';
import { Printer, X } from 'lucide-react';

interface DeliverySlipProps {
  order: Order;
  items: { product: Product; qty: number }[];
  onClose?: () => void;
}

export default function DeliverySlip({ order, items, onClose }: DeliverySlipProps) {
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-auto print:shadow-none print:p-0 border border-brand-sand">
      {/* Action panel shown on-screen only */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-brand-sand print:hidden">
        <h3 className="font-serif font-bold text-brand-charcoal text-lg">Order Checkout Complete!</h3>
        <button 
          onClick={onClose}
          id="close-slip-btn"
          className="text-brand-charcoal/50 hover:text-brand-charcoal transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Receipt Area */}
      <div className="receipt-container mx-auto font-mono text-xs text-brand-charcoal border border-brand-sand/80 p-4 rounded-lg bg-brand-warm/35 print:bg-white print:border-0 print:p-0 print:w-[2.50in]">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .receipt-container, .receipt-container * {
              visibility: visible;
            }
            .receipt-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 2.50in !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              background: transparent !important;
            }
          }
        `}} />

        <div className="text-center mb-4">
          <h2 className="text-sm font-serif font-bold tracking-wide uppercase text-brand-charcoal">Hello Beautiful</h2>
          <p className="text-[10px] text-brand-mud">Premium Cosmetics & Beauty Care</p>
          <p className="text-[9px] text-brand-charcoal/60">Dhaka, Bangladesh</p>
          <div className="border-b border-dashed border-brand-sand my-2"></div>
        </div>

        <div className="space-y-1 text-[11px] mb-4 text-left">
          <p><strong>Order No:</strong> {order.id}</p>
          <p><strong>Date:</strong> {order.date}</p>
          <p><strong>Customer:</strong> {order.customerName}</p>
          <p><strong>Mobile:</strong> {order.mobileNumber}</p>
          <p className="whitespace-pre-wrap"><strong>Address:</strong> {order.address}</p>
          <p><strong>Zone:</strong> {order.deliveryRegion}</p>
          <p><strong>Payment:</strong> {order.paymentMethod}</p>
        </div>

        <div className="border-b border-dashed border-brand-sand my-2"></div>

        {/* Items List */}
        <div className="space-y-1 text-[10px] my-3 text-left">
          <div className="flex justify-between font-bold">
            <span>Item</span>
            <span>Qty x Price</span>
          </div>
          {items.map((item, idx) => {
            const finalPrice = item.product.sellingPrice * (1 - item.product.discountOffer / 100);
            return (
              <div key={idx} className="flex justify-between leading-tight">
                <span className="truncate max-w-[120px]">{item.product.name}</span>
                <span>{item.qty}x {finalPrice.toFixed(0)} TK</span>
              </div>
            );
          })}
        </div>

        <div className="border-b border-dashed border-brand-sand my-2"></div>

        {/* Calculating summaries */}
        <div className="space-y-1 text-[11px] text-right font-semibold">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{order.subtotal.toFixed(0)} TK</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery:</span>
            <span>+{order.deliveryCharge} TK</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-dashed border-brand-sand pt-1 mt-1">
            <span>Total:</span>
            <span>{order.totalAmount.toFixed(0)} TK</span>
          </div>
        </div>

        <div className="border-b border-dashed border-brand-sand my-3"></div>

        {/* Barcode representation */}
        <div className="text-center space-y-1 py-1">
          <div className="inline-block tracking-[3px] font-bold text-[10px] border border-brand-sand px-2 py-1 leading-none text-brand-charcoal">
            ||||||||||||||||||||||||||||||
            <div className="text-[8px] tracking-[1px] pt-1 font-mono">{order.id}</div>
          </div>
          <p className="text-[8px] text-brand-charcoal/60 pt-1">Thank you for shopping with us!</p>
        </div>
      </div>

      {/* Print action trigger button */}
      <div className="mt-6 flex gap-3 print:hidden">
        <button
          onClick={triggerPrint}
          id="print-slip-btn"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-sage hover:bg-brand-sage/90 text-brand-warm font-medium rounded-xl transition duration-200 cursor-pointer text-sm shadow-md"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-brand-sand/50 hover:bg-brand-sand text-brand-charcoal font-medium rounded-xl transition duration-200 cursor-pointer text-sm border border-brand-sand/60"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}
