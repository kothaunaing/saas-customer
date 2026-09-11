"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";
import { apiError, login, logout } from "@/customer/lib/api";
import { pageVariants, sectionVariants, itemVariants } from "@/customer/lib/motion";
import { useCustomer } from "./provider";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { authenticated } = useCustomer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authenticated) {
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") ? next : "/account");
    }
  }, [authenticated, searchParams, router]);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const user = await login(email.trim().toLowerCase(), password);
      if (user.role !== "CUSTOMER") {
        await logout();
        const portalHint =
          user.role === "TENANT_ADMIN"
            ? " Use the Salon Dashboard (https://saas-tenant-iota.vercel.app) to manage your workspace."
            : user.role === "PLATFORM_ADMIN"
              ? " Use the Super Admin Console (https://saas-provider-opal.vercel.app) to manage the platform."
              : "";
        throw new Error(
          `This portal is for customers only.${portalHint}`,
        );
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
    <motion.main
      className="customer-container customer-login"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section
        className="customer-panel customer-login-card"
        variants={sectionVariants}
      >
        <motion.span
          className="customer-login-icon"
          variants={itemVariants}
        >
          <LockKeyhole />
        </motion.span>
        <motion.div variants={itemVariants}>
          <h1>Welcome back</h1>
          <p className="customer-lead">
            Sign in to manage your bookings and rewards.
          </p>
        </motion.div>
        <motion.form variants={itemVariants} onSubmit={submit}>
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
            <motion.p
              className="customer-error"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {error}
            </motion.p>
          )}
          <button className="customer-btn primary full" disabled={saving}>
            {saving ? "Signing in…" : "Sign in"}
          </button>
        </motion.form>
        <motion.div variants={itemVariants}>
          <Link href="/" className="customer-back-link">
            Continue browsing salons
          </Link>
        </motion.div>
      </motion.section>
    </motion.main>
  );
}
