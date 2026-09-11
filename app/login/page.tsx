import { Suspense } from "react";
import LoginPage from "@/customer/components/login";

export default function Page() {
  return (
    <Suspense
      fallback={<main className="customer-container narrow">Loading…</main>}
    >
      <LoginPage />
    </Suspense>
  );
}
