import BookingFlow from "@/customer/components/booking-flow";
import type { SalonId } from "@/customer/lib/domain";

export default async function Page({
  params,
}: {
  params: Promise<{ salon: SalonId }>;
}) {
  const { salon } = await params;
  return <BookingFlow salonId={salon} />;
}
