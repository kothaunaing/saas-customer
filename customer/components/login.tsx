"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { apiError, login, logout } from "@/customer/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const user = await login(email.trim().toLowerCase(), password);
      if (user.role !== "CUSTOMER") {
        await logout();
        throw new Error("Please use a customer account to sign in here.");
      }
      await queryClient.invalidateQueries({ queryKey: ["customer-session"] });
      await queryClient.invalidateQueries({ queryKey: ["customer-account"] });
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") ? next : "/account");
    } catch (cause) {
      setError(apiError(cause, "Email or password is incorrect."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="customer-container customer-login">
      <section className="customer-panel customer-login-card">
        <span className="customer-login-icon">
          <LockKeyhole />
        </span>
        <div>
          <h1>Welcome back</h1>
          <p className="customer-lead">
            Sign in to manage your bookings and rewards.
          </p>
        </div>
        <form onSubmit={submit}>
          <label className="customer-field">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="customer-field">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && (
            <p className="customer-error" role="alert">
              {error}
            </p>
          )}
          <button className="customer-btn primary full" disabled={saving}>
            {saving ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link href="/" className="customer-back-link">
          Continue browsing salons
        </Link>
      </section>
    </main>
  );
}
