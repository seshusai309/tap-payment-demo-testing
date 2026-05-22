"use client";
import { useEffect } from "react";
import { PaymentPanel } from "./PaymentPanel";
import type { Cart, PaymentSource, User } from "../types";

interface Props {
  isOpen: boolean;
  user: User;
  cart: Cart | null;
  paymentSource: PaymentSource;
  cardSdkReady: boolean;
  googlePayReady: boolean;
  applePayReady: boolean;
  applePaySupported: boolean | undefined;
  applePayError: string | null;
  paying: boolean;
  payError: string;
  onSelectSource: (src: PaymentSource) => void;
  onPay: () => void;
  onClose: () => void;
}

export function PaymentModal({
  isOpen, user, cart, paymentSource, cardSdkReady, googlePayReady, applePayReady, applePaySupported, applePayError,
  paying, payError, onSelectSource, onPay, onClose,
}: Props) {
  // Lock body scroll only while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    // Always in DOM — visibility toggled so #tap-card-element is always mounted
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center transition-all duration-300"
      style={{ pointerEvents: isOpen ? "auto" : "none", opacity: isOpen ? 1 : 0 }}
      inert={!isOpen ? true : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!paying ? onClose : undefined}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl transition-transform duration-300"
        style={{ transform: isOpen ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <span className="text-sm font-medium text-gray-700">Complete Payment</span>
          <button
            onClick={onClose}
            disabled={paying}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-8">
          <PaymentPanel
            user={user}
            cart={cart}
            paymentSource={paymentSource}
            cardSdkReady={cardSdkReady}
            googlePayReady={googlePayReady}
            applePayReady={applePayReady}
            applePaySupported={applePaySupported}
            applePayError={applePayError}
            paying={paying}
            payError={payError}
            onSelectSource={onSelectSource}
            onPay={onPay}
            onLogout={() => {}}
          />
        </div>

        {/* tap branding footer */}
        <div className="flex items-center justify-center gap-1.5 pb-6">
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs text-gray-400">Secured by </span>
          <span className="text-xs font-extrabold text-[#33C9A0] tracking-tight">tap</span>
          <span className="text-xs text-gray-400">payments</span>
        </div>
      </div>
    </div>
  );
}
