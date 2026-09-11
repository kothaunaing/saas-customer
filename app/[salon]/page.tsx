import SalonPage from "@/customer/components/salon";
import type { SalonId } from "@/customer/lib/domain";
export default async function Page({
  params,
}: {
  params: Promise<{ salon: SalonId }>;
}) {
  const { salon } = await params;
  return <SalonPage salonId={salon} />;
}
