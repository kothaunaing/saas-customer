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
import { useCustomer } from "./provider";
import { initials } from "@/customer/lib/demo-data";
import { logout } from "@/customer/lib/api";
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
    <div className="customer-app dark">
      <header className="customer-header">
        <Link href="/" className="customer-brand">
          Serenity Booking
          <span className="customer-brand-dot" />
        </Link>
        <div className="customer-header-right">
          <span className="customer-demo">Online booking</span>
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
              <PopoverContent align="end" className="customer-menu dark">
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
                  href="http://localhost:3000"
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
      </header>
      {children}
      <footer className="customer-footer">
        <span>Serenity Booking · A little time for you.</span>
        <span>Secure online appointments</span>
        {path !== "/" && (
          <Link href="/">
            Explore salons
            <ArrowUpRight size={13} />
          </Link>
        )}
      </footer>
    </div>
  );
}
