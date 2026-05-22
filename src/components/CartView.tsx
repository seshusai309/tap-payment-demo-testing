"use client";
import Image from "next/image";
import type { Cart, User } from "../types";
import { TAP_CURRENCY } from "../lib/config";

interface Props {
  user: User;
  cart: Cart | null;
  addingToCart: boolean;
  addToCartError: string;
  onAddToCart: () => void;
  onPay: () => void;
  onLogout: () => void;
}

export function CartView({ user, cart, addingToCart, addToCartError, onAddToCart, onPay, onLogout }: Props) {
  const hasItems = (cart?.items.length ?? 0) > 0;

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{user.username || user.email}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
        <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-600 transition-colors">
          Logout
        </button>
      </div>

      {/* Order summary card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Order Summary</h2>
            <p className="text-xs text-gray-400 mt-0.5">{cart?.totalItems ?? 0} item{cart?.totalItems !== 1 ? "s" : ""}</p>
          </div>
          {/* Add to cart button */}
          <button
            onClick={onAddToCart}
            disabled={addingToCart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#2a2a2a] disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
          >
            {addingToCart ? (
              <svg className="animate-spin h-3.5 w-3.5 text-[#33C9A0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-[#33C9A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
            <span className="text-white text-xs font-medium">
              {addingToCart ? "Adding…" : "Add item"}
            </span>
          </button>
        </div>

        {/* Add to cart error */}
        {addToCartError && (
          <div className="flex items-start gap-2 mx-4 mt-3 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
            <span className="text-red-500 text-xs mt-0.5">✕</span>
            <p className="text-xs text-red-600">{addToCartError}</p>
          </div>
        )}

        {/* Items */}
        <ul className="divide-y divide-gray-50">
          {hasItems ? cart!.items.map((item) => (
            <li key={item.productId} className="flex gap-3 px-5 py-4">
              <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                <Image
                  src={item.thumbnail}
                  alt={item.title.en}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">{item.title.en}</p>
                <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-gray-900">{(item.price * item.quantity).toFixed(3)}</p>
                <p className="text-xs text-gray-400">{TAP_CURRENCY}</p>
              </div>
            </li>
          )) : (
            <li className="px-5 py-10 text-center space-y-2">
              <p className="text-2xl">🛒</p>
              <p className="text-sm text-gray-400">Your cart is empty</p>
              <p className="text-xs text-gray-300">Click &quot;Add item&quot; above to add a test product</p>
            </li>
          )}
        </ul>

        {/* Total */}
        {hasItems && (
          <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="text-base font-bold text-gray-900">
              {cart!.totalAmount.toFixed(3)} <span className="text-sm font-medium text-gray-400">{TAP_CURRENCY}</span>
            </span>
          </div>
        )}
      </div>

      {/* Pay with tap */}
      <button
        onClick={onPay}
        disabled={!hasItems}
        className="w-full py-4 rounded-2xl bg-[#141414] hover:bg-[#2a2a2a] disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg"
      >
        <span className={`text-sm font-medium ${hasItems ? "text-white" : "text-gray-400"}`}>Pay with</span>
        <span className={`text-base font-extrabold tracking-tight ${hasItems ? "text-[#33C9A0]" : "text-gray-400"}`}>tap</span>
      </button>

      <p className="text-xs text-gray-400 text-center">Secured by tap payments</p>
    </div>
  );
}
