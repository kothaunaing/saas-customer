"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Gift,
  LogOut,
  UserRound,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { motion } from "framer-motion";
import { useCustomer } from "./provider";
import { initials } from "@/customer/lib/domain";
import { logout } from "@/customer/lib/api";
import { ease } from "@/customer/lib/motion";

export default function CustomerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customer = useCustomer();
  async function signOut() {
    await logout();
    queryClient.setQueryData(["customer-session"], null);
    queryClient.removeQueries({ queryKey: ["customer-account"] });
    router.push("/");
  }
  return (
    <div className="customer-app">
      <motion.header
        className="customer-header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <Link href="/" className="customer-brand">
          Serenity Booking
          <span className="customer-brand-dot" />
        </Link>
        <div className="customer-header-right">
          <span className="customer-mode">Online booking</span>
          <Link
            className="customer-my-bookings"
            href={customer.authenticated ? "/account" : "/login?next=/account"}
          >
            <CalendarDays size={15} />
            My bookings
          </Link>
          {customer.authenticated ? (
            <Popover>
              <PopoverTrigger
                className="customer-avatar"
                aria-label="Open customer account"
              >
                {initials(customer.profile.name || "Customer")}
              </PopoverTrigger>
              <PopoverContent align="end" className="customer-menu">
                <strong>{customer.profile.name || "Customer"}</strong>
                <p>Customer account</p>
                <Link href="/account?tab=bookings">
                  <CalendarDays size={15} />
                  My bookings
                </Link>
                <Link href="/account?tab=rewards">
                  <Gift size={15} />
                  My rewards
                </Link>
                <Link href="/account?tab=profile">
                  <UserRound size={15} />
                  My profile
                </Link>
                <a
                  href="https://saas-tenant-iota.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowUpRight size={15} />
                  Tenant workspace
                </a>
                <button type="button" onClick={signOut}>
                  <LogOut size={15} />
                  Sign out
                </button>
              </PopoverContent>
            </Popover>
          ) : (
            <Link className="customer-btn primary" href="/login">
              Sign in
            </Link>
          )}
        </div>
      </motion.header>
      {children}
      <motion.footer
        className="customer-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease, delay: 0.3 }}
      >
        <span>Serenity Booking · A little time for you.</span>
        <span>Secure online appointments</span>
        {path !== "/" && (
          <Link href="/">
            Explore salons
            <ArrowUpRight size={13} />
          </Link>
        )}
      </motion.footer>
    </div>
  );
}
