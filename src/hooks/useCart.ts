"use client";
import { useState, useCallback } from "react";
import type { Cart } from "../types";
import { API_URL } from "../lib/config";

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState("");

  const fetchCart = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const items = data.data.items || [];
        const totalAmount = items.reduce(
          (sum: number, i: { price: number; quantity: number }) =>
            sum + i.price * i.quantity,
          0,
        );
        setCart({ totalAmount: parseFloat(totalAmount.toFixed(3)), totalItems: items.length, items });
      }
    } catch {
      // non-critical
    }
  }, []);

  const addToCart = useCallback(async (
    token: string,
    productId: string,
    quantity: number,
  ) => {
    setAddingToCart(true);
    setAddToCartError("");
    try {
      const res = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddToCartError(data.error?.message || "Failed to add item");
        return false;
      }
      await fetchCart(token);
      return true;
    } catch {
      setAddToCartError("Network error");
      return false;
    } finally {
      setAddingToCart(false);
    }
  }, [fetchCart]);

  return { cart, setCart, fetchCart, addToCart, addingToCart, addToCartError };
}
