"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { User } from "../types";
import { TAP_PUBLIC_KEY, TAP_CURRENCY, TAP_MERCHANT_ID } from "../lib/config";

const APPLE_PAY_CSS = "https://tap-sdks.b-cdn.net/apple-pay/build-1.2.0/main.css";

// True if the browser supports Apple Pay (Safari on Apple devices)
// canMakePayments() is NOT used here — it returns false on localhost/non-HTTPS
// even in Safari, so we just check for the API's existence
function canUseApplePay(): boolean {
  try {
    return typeof window !== "undefined" && "ApplePaySession" in window;
  } catch {
    return false;
  }
}

export function useApplePay() {
  const [applePayScriptLoaded, setApplePayScriptLoaded] = useState(false);
  const [applePayReady, setApplePayReady] = useState(false);
  const [applePayError, setApplePayError] = useState<string | null>(null);
  // undefined = not checked yet, false = unavailable, true = available
  const [applePaySupported, setApplePaySupported] = useState<boolean | undefined>(undefined);
  const initialized = useRef(false);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check device/browser support immediately on mount
  useEffect(() => {
    setApplePaySupported(canUseApplePay());
  }, []);

  // Inject Apple Pay CSS only if supported
  useEffect(() => {
    if (!applePaySupported) return;
    if (document.querySelector(`link[href="${APPLE_PAY_CSS}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = APPLE_PAY_CSS;
    document.head.appendChild(link);
  }, [applePaySupported]);

  const init = useCallback((
    user: User,
    amount: string,
    onToken: (token: string) => void,
    onError: (msg: string) => void,
  ) => {
    if (!window.TapApplepaySDK || initialized.current) return;
    initialized.current = true;
    setApplePayError(null);

    // If onReady doesn't fire within 6s, the domain isn't registered with Tap
    readyTimer.current = setTimeout(() => {
      if (!initialized.current) return;
      const msg = "Apple Pay could not initialise. Your domain must be registered with Tap and the verification file must be hosted at /.well-known/apple-developer-merchantid-domain-association";
      setApplePayError(msg);
      onError(msg);
    }, 6000);

    window.TapApplepaySDK.render({
      publicKey: TAP_PUBLIC_KEY,
      environment: "development",
      debug: false,
      merchant: {
        domain: window.location.hostname,
        id: TAP_MERCHANT_ID,
      },
      transaction: { amount, currency: TAP_CURRENCY },
      scope: "TapToken",
      acceptance: {
        supportedBrands: ["visa", "masterCard", "mada"],
      },
      customer: {
        name: [{ locale: "en", first: user.firstName || user.username, last: user.lastName || "" }],
        contact: {
          email: user.email,
          phone: {
            number: user.phoneNumber || "50000000",
            countryCode: user.countryCode || "+965",
          },
        },
      },
      interface: { locale: "en", theme: "dark", type: "buy", edges: "curved" },
      onReady: () => {
        if (readyTimer.current) clearTimeout(readyTimer.current);
        setApplePayReady(true);
      },
      onSuccess: (data: { id?: string }) => {
        const token = data?.id || "";
        if (token) onToken(token);
        else onError("No token received from Apple Pay");
      },
      onError: (err: { message?: string } | string) => {
        if (readyTimer.current) clearTimeout(readyTimer.current);
        const msg = typeof err === "string" ? err : (err?.message || "Apple Pay error");
        setApplePayError(msg);
        onError(msg);
      },
      onCancel: () => {},
    }, "apple-pay-button");
  }, []);

  const reset = () => {
    if (readyTimer.current) clearTimeout(readyTimer.current);
    initialized.current = false;
    setApplePayReady(false);
    setApplePayError(null);
  };

  return { applePayScriptLoaded, setApplePayScriptLoaded, applePaySupported, applePayReady, applePayError, init, reset };
}
