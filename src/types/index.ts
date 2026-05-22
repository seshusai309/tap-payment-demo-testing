export type PaymentSource = "CARD" | "KNET" | "GOOGLE_PAY" | "APPLE_PAY";
export type Step = "login" | "pay" | "done";

export interface User {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  countryCode?: string;
}

export interface CartItem {
  productId: string;
  title: { en: string; ar: string };
  price: number;
  quantity: number;
  thumbnail: string;
}

export interface Cart {
  totalAmount: number;
  totalItems: number;
  items: CartItem[];
}

export interface TapCardInstance {
  tokenize: () => Promise<{ id: string }>;
}

export interface GooglePayClient {
  isReadyToPay: (req: object) => Promise<{ result: boolean }>;
  loadPaymentData: (req: object) => Promise<GooglePayData>;
  prefetchPaymentData: (req: object) => void;
  createButton: (options: object) => HTMLElement;
}

export interface GooglePayData {
  paymentMethodData: { tokenizationData: { token: string } };
}

declare global {
  interface Window {
    CardSDK: {
      renderTapCard: (containerID: string, config: object) => { unmount: () => void };
      tokenize: () => Promise<{ id: string }>;
    };
    google: {
      payments: {
        api: {
          PaymentsClient: new (config: object) => GooglePayClient;
        };
      };
    };
    TapApplepaySDK: {
      render: (config: object, elementId: string) => void;
    };
  }
}
