"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useCart } from "../hooks/useCart";
import { useCardSDK } from "../hooks/useCardSDK";
import { useGooglePay } from "../hooks/useGooglePay";
import { useApplePay } from "../hooks/useApplePay";
import { LoginForm } from "../components/LoginForm";
import { CartView } from "../components/CartView";
import { PaymentModal } from "../components/PaymentModal";
import { OrderConfirmed } from "../components/OrderConfirmed";
import type { PaymentSource, Step, User } from "../types";
import { API_URL, TAP_CURRENCY } from "../lib/config";

export default function Home() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<Step>("login");
  const [modalOpen, setModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [paymentSource, setPaymentSource] = useState<PaymentSource>("CARD");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [tapToken, setTapToken] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { cart, setCart, fetchCart, addToCart, addingToCart, addToCartError } = useCart();
  const cardSDK = useCardSDK();
  const googlePay = useGooglePay();
  const applePay = useApplePay();

  // Hydrate session from localStorage after mount (avoids SSR/client mismatch)
  useEffect(() => {
    const storedJwt = localStorage.getItem("tap_jwt");
    const storedUser = localStorage.getItem("tap_user");
    if (storedJwt) {
      setJwt(storedJwt);
      setStep("pay");
      fetchCart(storedJwt);
    }
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init Card SDK once script + user are ready
  // Modal is always in the DOM when step==="pay" so #tap-card-element exists
  useEffect(() => {
    if (cardSDK.cardScriptLoaded && user && step === "pay") {
      cardSDK.init(user, setTapToken, (msg) => { setPayError(msg); setPaying(false); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardSDK.cardScriptLoaded, user, step]);

  // Init Google Pay once script is ready
  useEffect(() => {
    if (googlePay.googleScriptLoaded && step === "pay") googlePay.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googlePay.googleScriptLoaded, step]);

  // Apple Pay token handler — called by SDK onSuccess callback
  const handleApplePayToken = async (token: string) => {
    if (!jwt) return;
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          paymentMethod: "ONLINE",
          paymentSource: "APPLE_PAY",
          token,
          whatsappNumber: user?.whatsappNumber,
          successUrl: `${window.location.origin}/payment-callback`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error?.message || "Failed to create order"); return; }
      setOrderId(data.data.id);
      const apUrl = data.checkoutSession?.threeDSUrl;
      if (!apUrl) { setModalOpen(false); setStep("done"); }
      else { localStorage.setItem("pending_order_id", data.data.id); window.location.href = apUrl; }
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPaying(false);
    }
  };

  // Init Apple Pay when script + user ready and Apple Pay tab is selected
  useEffect(() => {
    if (applePay.applePayScriptLoaded && user && step === "pay" && paymentSource === "APPLE_PAY") {
      const amount = cart?.totalAmount?.toFixed(3) ?? "1.000";
      applePay.init(user, amount, handleApplePayToken, (msg) => setPayError(msg));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applePay.applePayScriptLoaded, user, step, paymentSource]);

  // When card SDK fires onSuccess → tapToken is set → send to backend
  useEffect(() => {
    const sendToken = async () => {
      if (!tapToken || !jwt || !paying) return;
      try {
        const res = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
          body: JSON.stringify({
            paymentMethod: "ONLINE",
            paymentSource: "CARD",
            token: tapToken,
            whatsappNumber: user?.whatsappNumber,
            successUrl: `${window.location.origin}/payment-callback`,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setPayError(data.error?.message || "Failed to create order"); setPaying(false); return; }
        setOrderId(data.data.id);
        const url = data.checkoutSession?.threeDSUrl;
        if (!url) { setModalOpen(false); setStep("done"); setPaying(false); }
        else { localStorage.setItem("pending_order_id", data.data.id); window.location.href = url; }
      } catch (err: unknown) {
        setPayError(err instanceof Error ? err.message : "Something went wrong");
        setPaying(false);
      }
    };
    sendToken();
  }, [tapToken, jwt, paying, user]);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error?.message || "Login failed"); return; }
      const { token, user: userData } = data.data;
      setJwt(token);
      setUser(userData);
      localStorage.setItem("tap_jwt", token);
      localStorage.setItem("tap_user", JSON.stringify(userData));
      await fetchCart(token);
      setStep("pay");
    } catch {
      setLoginError("Network error — is the backend running?");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tap_jwt");
    localStorage.removeItem("tap_user");
    setJwt(null);
    setUser(null);
    setCart(null);
    setStep("login");
    setModalOpen(false);
    cardSDK.reset();
    applePay.reset();
  };

  const handleOpenModal = () => {
    setPayError("");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (paying) return;
    setModalOpen(false);
    setPayError("");
  };

  const payWithCard = async () => {
    if (!jwt) return;
    setPaying(true);
    setPayError("");
    setTapToken(null);
    try {
      await cardSDK.tokenize();
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Tokenization failed");
      setPaying(false);
    }
  };

  const payWithKnet = async () => {
    if (!jwt) return;
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          paymentMethod: "ONLINE",
          paymentSource: "KNET",
          whatsappNumber: user?.whatsappNumber,
          successUrl: `${window.location.origin}/payment-callback`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error?.message || "Failed to create order"); return; }
      const knetUrl = data.checkoutSession?.threeDSUrl;
      if (!knetUrl) { setPayError("No Knet URL returned from backend"); return; }
      localStorage.setItem("pending_order_id", data.data.id);
      window.location.href = knetUrl;
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPaying(false);
    }
  };

  const payWithGooglePay = async () => {
    if (!jwt) return;
    setPaying(true);
    setPayError("");
    try {
      const amount = cart?.totalAmount?.toFixed(3) ?? "1.000";
      const paymentData = await googlePay.loadPaymentData(amount, TAP_CURRENCY);
      const token = paymentData.paymentMethodData.tokenizationData.token;
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          paymentMethod: "ONLINE",
          paymentSource: "GOOGLE_PAY",
          token,
          whatsappNumber: user?.whatsappNumber,
          successUrl: `${window.location.origin}/payment-callback`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error?.message || "Failed to create order"); return; }
      setOrderId(data.data.id);
      const gpUrl = data.checkoutSession?.threeDSUrl;
      if (!gpUrl) { setModalOpen(false); setStep("done"); }
      else { localStorage.setItem("pending_order_id", data.data.id); window.location.href = gpUrl; }
    } catch (err: unknown) {
      const e = err as { statusCode?: string; message?: string };
      if (e?.statusCode !== "CANCELED") setPayError(e?.message || "Google Pay failed");
    } finally {
      setPaying(false);
    }
  };

  const handlePay = () => {
    if (paymentSource === "CARD") payWithCard();
    else if (paymentSource === "KNET") payWithKnet();
    else payWithGooglePay();
  };

  return (
    <>
      <Script
        src="https://tap-sdks.b-cdn.net/card/1.0.2/index.js"
        strategy="afterInteractive"
        onLoad={() => cardSDK.setCardScriptLoaded(true)}
        onError={() => {}}
      />
      <Script
        src="https://pay.google.com/gp/p/js/pay.js"
        strategy="afterInteractive"
        onLoad={() => googlePay.setGoogleScriptLoaded(true)}
      />
      <Script
        src="https://tap-sdks.b-cdn.net/apple-pay/build-1.2.0/main.js"
        strategy="afterInteractive"
        onLoad={() => applePay.setApplePayScriptLoaded(true)}
      />

      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5">

          {step === "login" && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Tap Payment Test</h1>
                <p className="text-sm text-gray-500 mt-1">Card · Knet · Google Pay · Apple Pay</p>
              </div>
              <LoginForm
                loginForm={loginForm}
                loginError={loginError}
                loginLoading={loginLoading}
                onChange={(field, value) => setLoginForm((f) => ({ ...f, [field]: value }))}
                onSubmit={handleLogin}
              />
            </>
          )}

          {step === "pay" && user && (
            <CartView
              user={user}
              cart={cart}
              addingToCart={addingToCart}
              addToCartError={addToCartError}
              onAddToCart={() => jwt && addToCart(jwt, "69ef0f480ef9c481aed1b816", 2)}
              onPay={handleOpenModal}
              onLogout={handleLogout}
            />
          )}

          {step === "done" && (
            <OrderConfirmed
              orderId={orderId}
              onReset={() => {
                setStep("pay");
                setOrderId(null);
                setPayError("");
                if (jwt) fetchCart(jwt);
              }}
            />
          )}
        </div>
      </main>

      {step === "pay" && user && (
        <PaymentModal
          isOpen={modalOpen}
          user={user}
          cart={cart}
          paymentSource={paymentSource}
          cardSdkReady={cardSDK.cardSdkReady}
          googlePayReady={googlePay.googlePayReady}
          applePayReady={applePay.applePayReady}
          applePaySupported={applePay.applePaySupported}
          applePayError={applePay.applePayError}
          paying={paying}
          payError={payError}
          onSelectSource={setPaymentSource}
          onPay={handlePay}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
