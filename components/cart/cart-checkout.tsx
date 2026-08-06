'use client';

import React, { useState } from 'react';
import { useCart } from '@/lib/hooks/use-cart';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, MessageCircle, CreditCard, Trash2, Plus, Minus } from 'lucide-react';

export function CartCheckout() {
  const { items, subtotal, clearCart, removeItem, updateQuantity } = useCart();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    const orderDetails = items
      .map(
        (item) =>
          `• ${item.name} x${item.quantity} - UGX ${(item.price * item.quantity).toLocaleString()}`
      )
      .join('\n');

    const message = `Hello! I would like to place an order:\n\n${orderDetails}\n\nTotal: UGX ${subtotal.toLocaleString()}\n\nPlease confirm availability and delivery details.`;
    return encodeURIComponent(message);
  };

  const handleWhatsAppCheckout = () => {
    const whatsappNumber = '256700000000'; // Replace with your WhatsApp number
    const message = generateWhatsAppMessage();
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappURL, '_blank');
  };

  const handlePaymentCheckout = async () => {
    setIsProcessing(true);
    try {
      // TODO: Integrate with payment gateway (Stripe, PayPal, etc.)
      console.log('Processing payment for order:', items);
      // After successful payment:
      // await clearCart();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>{items.length} item(s) in cart</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between gap-4 pb-4 border-b last:border-b-0">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-muted-foreground">
                  UGX {item.price.toLocaleString()} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  UGX {(item.price * item.quantity).toLocaleString()}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.productId)}
                  className="text-destructive hover:text-destructive mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>UGX {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax:</span>
            <span>UGX {(subtotal * 0.18).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping:</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>UGX {(subtotal * 1.18).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Checkout */}
        <Button
          onClick={handleWhatsAppCheckout}
          className="w-full bg-green-600 hover:bg-green-700 gap-2"
          size="lg"
        >
          <MessageCircle className="h-5 w-5" />
          Order via WhatsApp
        </Button>

        {/* Payment Checkout */}
        <Button
          onClick={handlePaymentCheckout}
          disabled={isProcessing}
          className="w-full gap-2"
          size="lg"
        >
          <CreditCard className="h-5 w-5" />
          {isProcessing ? 'Processing...' : 'Checkout'}
        </Button>
      </div>

      {/* Clear Cart Button */}
      <Button
        onClick={clearCart}
        variant="outline"
        className="w-full"
      >
        Clear Cart
      </Button>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>WhatsApp:</strong> Send your order details directly to our sales team for personalized assistance.
        </p>
        <p className="text-sm text-blue-900 dark:text-blue-100 mt-2">
          <strong>Card Payment:</strong> Process payment securely with your credit or debit card.
        </p>
      </div>
    </div>
  );
}
