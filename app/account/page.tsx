import { Suspense } from "react";
import AccountPage from "@/customer/components/account";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="customer-container narrow">Loading your account…</main>
      }
    >
      <AccountPage />
    </Suspense>
  );
}
