"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function CallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");

  useEffect(() => {
    const tapId = params.get("tap_id");
    const jwt = localStorage.getItem("tap_jwt");

    localStorage.removeItem("pending_order_id");

    if (!tapId || !jwt) {
      router.replace("/");
      return;
    }

    // 2B — call backend which calls Tap API directly for instant status
    // 2A (webhook) is already updating DB in background server-to-server
    fetch(`${API_URL}/api/orders/verify-payment/${tapId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const chargeStatus = data.data?.chargeStatus;
        if (chargeStatus === "CAPTURED") {
          setStatus("success");
          setTimeout(() => router.replace("/"), 2000);
        } else {
          setStatus("failed");
          setTimeout(() => router.replace("/"), 3000);
        }
      })
      .catch(() => {
        setStatus("failed");
        setTimeout(() => router.replace("/"), 3000);
      });
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center space-y-4">
        {status === "checking" && (
          <>
            <div className="text-5xl">⏳</div>
            <h1 className="text-lg font-semibold text-gray-900">Verifying Payment…</h1>
            <p className="text-sm text-gray-500">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="text-lg font-semibold text-gray-900">Payment Successful!</h1>
            <p className="text-sm text-gray-500">Redirecting you back…</p>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="text-5xl">❌</div>
            <h1 className="text-lg font-semibold text-gray-900">Payment Not Confirmed</h1>
            <p className="text-sm text-gray-500">Please check your order history.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
