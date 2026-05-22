"use client";
import { useState, useRef, useCallback } from "react";
import type { GooglePayClient, GooglePayData } from "../types";
import { TAP_MERCHANT_ID, TAP_CURRENCY, GOOGLE_PAY_MERCHANT_ID } from "../lib/config";

export function useGooglePay() {
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googlePayReady, setGooglePayReady] = useState(false);
  const clientRef = useRef<GooglePayClient | null>(null);

  function getGooglePaymentDataRequest(amount: string, transactionId?: string) {
    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      merchantInfo: {
        merchantName: "KAJKARMA",
        merchantId: GOOGLE_PAY_MERCHANT_ID,
      },
      allowedPaymentMethods: [
        {
          type: "CARD",
          parameters: {
            allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
            allowedCardNetworks: [
              "AMEX",
              "DISCOVER",
              "JCB",
              "MASTERCARD",
              "VISA",
            ],
            allowPrepaidCards: true,
            allowCreditCards: true,
            assuranceDetailsRequired: true,
            billingAddressRequired: false,
          },
          tokenizationSpecification: {
            type: "PAYMENT_GATEWAY",
            parameters: {
              gateway: "tappayments",
              gatewayMerchantId: TAP_MERCHANT_ID,
            },
          },
        },
      ],
      transactionInfo: {
        currencyCode: TAP_CURRENCY,
        countryCode: "KW",
        transactionId: transactionId || Date.now().toString(),
        totalPriceStatus: "FINAL",
        totalPrice: amount,
        checkoutOption: "COMPLETE_IMMEDIATE_PURCHASE",
        displayItems: [
          {
            label: "Order Total",
            type: "LINE_ITEM",
            price: amount,
            status: "FINAL",
          },
        ],
      },
    };
  }

  function getGoogleIsReadyToPayRequest(amount: string) {
    const req = getGooglePaymentDataRequest(amount);
    return {
      apiVersion: req.apiVersion,
      apiVersionMinor: req.apiVersionMinor,
      allowedPaymentMethods: req.allowedPaymentMethods,
    };
  }

  const init = useCallback((amount = "1.000") => {
    if (!window.google?.payments?.api) return;

    // @todo update environment to "PRODUCTION" after testing
    clientRef.current = new window.google.payments.api.PaymentsClient({
      environment: "TEST",
    });

    clientRef.current
      .isReadyToPay(getGoogleIsReadyToPayRequest(amount))
      .then((res) => {
        if (res.result) {
          setGooglePayReady(true);
          // Prefetch payment data to improve sheet open performance
          clientRef.current?.prefetchPaymentData(
            getGooglePaymentDataRequest(amount),
          );
        }
      })
      .catch(() => setGooglePayReady(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPaymentData = async (amount: string): Promise<GooglePayData> => {
    if (!clientRef.current) throw new Error("Google Pay not initialized");
    return clientRef.current.loadPaymentData(
      getGooglePaymentDataRequest(amount, Date.now().toString()),
    );
  };

  return {
    googleScriptLoaded,
    setGoogleScriptLoaded,
    googlePayReady,
    init,
    loadPaymentData,
  };
}
