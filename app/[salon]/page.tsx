import SalonPage from '@/customer/components/salon';
import { salonIds, type SalonId } from '@/customer/lib/customer-data';
export function generateStaticParams() {
  return salonIds.map((salon) => ({ salon }));
}
export const dynamicParams = false;
export default async function Page({
  params,
}: {
  params: Promise<{ salon: SalonId }>;
}) {
  const { salon } = await params;
  return <SalonPage salonId={salon} />;
}
