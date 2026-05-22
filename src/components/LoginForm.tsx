"use client";
import React from "react";

interface Props {
  loginForm: { email: string; password: string };
  loginError: string;
  loginLoading: boolean;
  onChange: (field: "email" | "password", value: string) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export function LoginForm({ loginForm, loginError, loginLoading, onChange, onSubmit }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      {/* tap branding header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className="text-2xl font-extrabold text-[#141414] tracking-tight">pay</span>
          <span className="text-2xl font-extrabold text-[#33C9A0] tracking-tight">tap</span>
        </div>
        <p className="text-sm font-semibold text-gray-800">Sign in to your account</p>
        <p className="text-xs text-gray-400">Enter your credentials to continue</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Email</label>
          <input
            type="email"
            required
            value={loginForm.email}
            onChange={(e) => onChange("email", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#33C9A0] focus:border-transparent transition"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Password</label>
          <input
            type="password"
            required
            value={loginForm.password}
            onChange={(e) => onChange("password", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#33C9A0] focus:border-transparent transition"
            placeholder="••••••••"
          />
        </div>

        {loginError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
            <span className="text-red-500 mt-0.5 text-xs">✕</span>
            <p className="text-xs text-red-600">{loginError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loginLoading}
          className="w-full py-3 rounded-2xl bg-[#141414] hover:bg-[#2a2a2a] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-1"
        >
          {loginLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-white text-sm font-medium">Signing in…</span>
            </>
          ) : (
            <>
              <span className="text-white text-sm font-medium">Continue with</span>
              <span className="text-[#33C9A0] text-sm font-extrabold tracking-tight">tap</span>
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center">Secured by tap payments</p>
    </div>
  );
}
