"use client";
import type { Cart, PaymentSource, User } from "../types";
import { TAP_CURRENCY } from "../lib/config";

interface Props {
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
  onLogout: () => void;
}

const METHODS: { id: PaymentSource; emoji: string; label: string }[] = [
  { id: "CARD",       emoji: "💳", label: "Card"       },
  { id: "KNET",       emoji: "🏦", label: "Knet"       },
  { id: "GOOGLE_PAY", emoji: "G",  label: "Google Pay" },
  { id: "APPLE_PAY",  emoji: "",   label: "Apple Pay"  },
];

export function PaymentPanel({
  cart, paymentSource, cardSdkReady, googlePayReady, applePayReady, applePaySupported, applePayError,
  paying, payError, onSelectSource, onPay,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Cart total pill */}
      {cart && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
          <span className="text-xs text-gray-500">{cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}</span>
          <span className="text-sm font-bold text-gray-900">
            {cart.totalAmount.toFixed(3)} <span className="text-xs font-medium text-gray-400">{TAP_CURRENCY}</span>
          </span>
        </div>
      )}

      {/* Method selector */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment method</p>
        <div className="flex gap-2">
          {METHODS.map(({ id, emoji, label }) => (
            <button
              key={id}
              onClick={() => onSelectSource(id)}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                paymentSource === id
                  ? "bg-[#141414] text-white border-[#141414] shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#33C9A0] hover:text-gray-800"
              }`}
            >
              <span className="mr-1">{emoji}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Card SDK — always in DOM, collapsed when not selected */}
      <div className={`relative transition-all duration-200 ${
        paymentSource === "CARD"
          ? "border border-gray-200 rounded-2xl p-3"
          : "h-0 overflow-hidden border-0 p-0"
      }`}>
        <div id="tap-card-element" style={{ minHeight: paymentSource === "CARD" ? 180 : 0 }} />

        {/* Loading overlay */}
        {paymentSource === "CARD" && !cardSdkReady && (
          <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center gap-2.5">
            <svg className="animate-spin h-5 w-5 text-[#33C9A0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="text-xs text-gray-400">Loading card form…</p>
          </div>
        )}

        {/* Processing overlay */}
        {paymentSource === "CARD" && cardSdkReady && paying && (
          <div className="absolute inset-0 bg-white/90 rounded-2xl flex flex-col items-center justify-center gap-2.5">
            <svg className="animate-spin h-5 w-5 text-[#33C9A0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="text-xs text-gray-500 font-medium">Securing your payment…</p>
          </div>
        )}
      </div>

      {/* Knet info */}
      {paymentSource === "KNET" && (
        <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <span className="text-xl mt-0.5">🏦</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Knet Payment</p>
            <p className="text-xs text-gray-500 mt-0.5">You will be securely redirected to the Knet payment page to complete your transaction.</p>
          </div>
        </div>
      )}

      {/* Google Pay info */}
      {paymentSource === "GOOGLE_PAY" && (
        <div className={`flex items-start gap-3 rounded-2xl px-4 py-4 border ${
          googlePayReady
            ? "bg-[#33C9A0]/10 border-[#33C9A0]/30"
            : "bg-gray-50 border-gray-100"
        }`}>
          <span className="text-xl mt-0.5">G</span>
          <div>
            <p className={`text-sm font-semibold ${googlePayReady ? "text-gray-800" : "text-gray-500"}`}>
              {googlePayReady ? "Google Pay ready" : "Google Pay unavailable"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {googlePayReady
                ? "Click Pay below to open the Google Pay sheet."
                : "Google Pay is not supported on this device or browser."}
            </p>
          </div>
        </div>
      )}

      {/* Apple Pay — SDK renders native button directly into this container */}
      {paymentSource === "APPLE_PAY" && (
        <div className="space-y-3">
          {/* Not supported on this device/browser */}
          {applePaySupported === false && (
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
              <span className="text-xl mt-0.5"></span>
              <div>
                <p className="text-sm font-semibold text-gray-700">Apple Pay unavailable</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Apple Pay requires Safari on an iPhone, iPad, or Mac with a card saved in Apple Wallet. It also requires domain registration with Tap.
                </p>
              </div>
            </div>
          )}
          {/* Supported but SDK button not yet ready */}
          {applePaySupported === true && !applePayReady && !applePayError && (
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
              <svg className="animate-spin h-4 w-4 text-gray-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gray-500">Initialising Apple Pay…</p>
                <p className="text-xs text-gray-400 mt-0.5">Setting up the payment button.</p>
              </div>
            </div>
          )}
          {/* SDK init failed — domain not registered or other error */}
          {applePayError && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
              <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Apple Pay setup required</p>
                <p className="text-xs text-amber-700 mt-0.5">{applePayError}</p>
              </div>
            </div>
          )}
          {/* SDK renders the native Apple Pay button here when ready */}
          <div id="apple-pay-button" className={applePaySupported ? "w-full" : "hidden"} />
        </div>
      )}

      {/* Error */}
      {payError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
          <span className="text-red-500 mt-0.5 text-xs">✕</span>
          <p className="text-xs text-red-600">{payError}</p>
        </div>
      )}

      {/* Generic Pay button — hidden for Apple Pay since SDK renders its own button */}
      {paymentSource !== "APPLE_PAY" && (
        <button
          onClick={onPay}
          disabled={
            paying ||
            (paymentSource === "CARD" && !cardSdkReady) ||
            (paymentSource === "GOOGLE_PAY" && !googlePayReady)
          }
          className="w-full py-3.5 rounded-2xl bg-[#141414] hover:bg-[#2a2a2a] disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {paying ? (
            <>
              <svg className="animate-spin h-4 w-4 text-[#33C9A0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-white text-sm font-medium">Processing…</span>
            </>
          ) : (
            <span className="text-white text-sm font-medium">
              {paymentSource === "CARD" ? "Pay with Card"
                : paymentSource === "KNET" ? "Pay with Knet"
                : "Pay with Google Pay"}
            </span>
          )}
        </button>
      )}

      {/* Apple Pay processing overlay */}
      {paymentSource === "APPLE_PAY" && paying && (
        <div className="flex items-center justify-center gap-2 py-3">
          <svg className="animate-spin h-4 w-4 text-[#33C9A0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm text-gray-500 font-medium">Processing payment…</span>
        </div>
      )}
    </div>
  );
}
