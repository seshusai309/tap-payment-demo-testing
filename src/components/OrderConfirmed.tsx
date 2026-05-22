"use client";

interface Props {
  orderId: string | null;
  onReset: () => void;
}

export function OrderConfirmed({ orderId, onReset }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div className="text-center space-y-3">
        {/* Tap-teal checkmark circle */}
        <div className="flex items-center justify-center mx-auto w-16 h-16 rounded-full bg-[#33C9A0]/15">
          <svg className="w-8 h-8 text-[#33C9A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h2 className="text-base font-bold text-gray-900">Payment Successful</h2>
          <p className="text-xs text-gray-500 mt-1">Your order has been confirmed.</p>
        </div>

        {orderId && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
            <p className="text-xs text-gray-400 mb-0.5">Order ID</p>
            <p className="text-xs font-mono text-gray-700 break-all">{orderId}</p>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="w-full py-3 rounded-2xl bg-[#141414] hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-white text-sm font-medium">Make another order with</span>
        <span className="text-[#33C9A0] text-sm font-extrabold tracking-tight">tap</span>
      </button>
    </div>
  );
}
