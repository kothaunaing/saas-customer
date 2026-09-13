"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { apiError, login, registerCustomer } from "@/customer/lib/api";

export default function CustomerRegister() {
  const router = useRouter();
  const client = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const email = form.email.trim().toLowerCase();
      await registerCustomer({ ...form, email, phone: form.phone || undefined });
      await login(email, form.password);
      await client.invalidateQueries({ queryKey: ["customer-session"] });
      router.replace("/account");
    } catch (cause) {
      setError(apiError(cause, "Could not create your account."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="customer-container customer-login">
      <section className="customer-panel customer-login-card">
        <span className="customer-login-icon"><UserPlus /></span>
        <div><h1>Create your account</h1><p className="customer-lead">Register once to manage bookings across salons.</p></div>
        <form onSubmit={submit}>
          <label className="customer-field">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="customer-field">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="customer-field">Phone<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="customer-field">Password<input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="customer-error" role="alert">{error}</p>}
          <button className="customer-btn primary full" disabled={saving}>{saving ? "Creating account…" : "Create account"}</button>
        </form>
        <Link href="/login" className="customer-back-link">Already have an account? Sign in</Link>
      </section>
    </main>
  );
}
