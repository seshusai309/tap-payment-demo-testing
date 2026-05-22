"use client";
import { useState, useRef, useCallback } from "react";
import type { TapCardInstance, User } from "../types";
import { TAP_PUBLIC_KEY, TAP_CURRENCY } from "../lib/config";

export function useCardSDK() {
  const [cardScriptLoaded, setCardScriptLoaded] = useState(false);
  const [cardSdkReady, setCardSdkReady] = useState(false);
  const [cardFilled, setCardFilled] = useState(false);
  const cardInstance = useRef<TapCardInstance | null>(null);
  // becomes true on first onChange — blocks the spurious onValidInput the SDK
  // fires on init before the user has touched anything
  const hasInteracted = useRef(false);
  // timestamp of last onValidInput — used to ignore onChange events fired by
  // the SDK's own auto-formatting immediately after real validation
  const validatedAt = useRef(0);

  const init = useCallback(
    (
      user: User,
      onToken: (id: string) => void,
      onError: (msg: string) => void,
    ) => {
      if (!window.CardSDK || cardInstance.current) return;

      window.CardSDK.renderTapCard("tap-card-element", {
        publicKey: TAP_PUBLIC_KEY,
        scope: "Token",
        purpose: "Transaction",
        transaction: { amount: 1, currency: TAP_CURRENCY },
        customer: {
          id: user._id,
          name: [{ lang: "en", first: user.firstName || user.username, middle: "", last: user.lastName || "" }],
          nameOnCard: user.firstName || user.username,
          editable: true,
          contact: {
            email: user.email,
            phone: {
              countryCode: (user.countryCode || "+965").replace("+", ""),
              number: user.phoneNumber || "50000000",
            },
          },
        },
        acceptance: { supportedBrands: ["VISA", "MASTERCARD", "MADA", "AMEX"], supportedCards: "ALL" },
        fields: { cardHolder: true },
        addons: { displayPaymentBrands: true, loader: true, saveCard: false, autoSaveCard: false },
        interface: { locale: "en", theme: "light", edges: "curved", direction: "ltr" },
        onReady: () => setCardSdkReady(true),
        onSuccess: (data: { id: string }) => onToken(data.id),
        onError: (data: { message?: string }) => onError(data.message || "Card SDK error"),
        onValidInput: () => {
          if (!hasInteracted.current) return;
          validatedAt.current = Date.now();
          setCardFilled(true);
        },
        onChange: () => {
          hasInteracted.current = true;
          // Ignore onChange events within 300ms of onValidInput — those are
          // the SDK re-formatting the display after validation, not user edits
          if (Date.now() - validatedAt.current < 300) return;
          setCardFilled(false);
        },
      });

      cardInstance.current = { tokenize: window.CardSDK.tokenize };
      setTimeout(() => setCardSdkReady(true), 2000);
    },
    [],
  );

  const tokenize = async () => {
    await window.CardSDK.tokenize();
  };

  const reset = () => {
    cardInstance.current = null;
    hasInteracted.current = false;
    validatedAt.current = 0;
    setCardSdkReady(false);
    setCardFilled(false);
  };

  return { cardScriptLoaded, setCardScriptLoaded, cardSdkReady, cardFilled, init, tokenize, reset };
}
