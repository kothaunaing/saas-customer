'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, CalendarDays, Gift, UserRound } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
export default function CustomerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  return (
    <div className="customer-app dark">
      <header className="customer-header">
        <Link href="" className="customer-brand">
          Serenity Booking
          <span className="customer-brand-dot" />
        </Link>
        <div className="customer-header-right">
          <span className="customer-demo">Demo experience</span>
          <Link className="customer-my-bookings" href="/account">
            <CalendarDays size={15} />
            My bookings
          </Link>
          <Popover>
            <PopoverTrigger
              className="customer-avatar"
              aria-label="Open customer account"
            >
              EE
            </PopoverTrigger>
            <PopoverContent align="end" className="customer-menu dark">
              <strong>Ei Ei Khaing</strong>
              <p>Customer demo account</p>
              <Link href="/account">
                <CalendarDays size={15} />
                My bookings
              </Link>
              <Link href="/account">
                <Gift size={15} />
                My rewards
              </Link>
              <Link href="/account">
                <UserRound size={15} />
                My profile
              </Link>
              <Link href="/">
                <ArrowUpRight size={15} />
                Tenant workspace
              </Link>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      {children}
      <footer className="customer-footer">
        <span>Serenity Booking · A little time for you.</span>
        <span>Sample data · Changes reset on refresh</span>
        {path !== '' && (
          <Link href="">
            Explore salons
            <ArrowUpRight size={13} />
          </Link>
        )}
      </footer>
    </div>
  );
}
