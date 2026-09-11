import axios from "axios";
import type {
  Appointment,
  Service,
  Staff,
  CustomerReview,
  SalonId,
} from "./domain";
import type {
  Contact,
  OwnedBooking,
  ReserveInput,
} from "../components/provider";

export type Reward = {
  id: string;
  salonId: SalonId;
  name: string;
  points: number;
  description: string | null;
  active: boolean;
  balance: number;
};
export type SalonCatalog = {
  id: string;
  slug: SalonId;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  imageUrl: string | null;
  amenities: string[];
  timezone: string;
  currency: string;
  services: Service[];
  staff: Staff[];
  reviews: CustomerReview[];
  rewards: Reward[];
};
export type CustomerAccount = {
  profile: Contact;
  points: number;
  rewards: Reward[];
  owned: Array<OwnedBooking & { appointment: Appointment }>;
};
export type SalonSummary = {
  slug: SalonId;
  name: string;
  tagline: string | null;
  address: string | null;
  city: string | null;
  imageUrl: string | null;
  reviewCount: number;
  serviceCount: number;
  rating: number | null;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  withCredentials: true,
  headers: {
    "x-serenity-portal": "customer",
  },
});
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};
export async function login(email: string, password: string) {
  return (
    await api.post<{ user: SessionUser }>("/auth/login", { email, password })
  ).data.user;
}
export async function logout() {
  await api.post("/auth/logout");
}
export async function getSession() {
  try {
    return (await api.get<SessionUser>("/auth/me")).data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        await logout();
      } catch {
        // ignore
      }
      return null;
    }
    throw error;
  }
}
export const getSalon = async (slug: SalonId) =>
  (await api.get<SalonCatalog>(`/public/salons/${slug}`)).data;
export const getSalons = async () =>
  (await api.get<SalonSummary[]>("/public/salons")).data;
export const getAccount = async () => {
  return (await api.get<CustomerAccount>("/customer/me")).data;
};
export const getAvailability = async (
  slug: SalonId,
  date: string,
  serviceId: string,
  staffId: string,
) =>
  (
    await api.get<Array<{ time: string; staffIds: string[] }>>(
      `/public/salons/${slug}/availability`,
      { params: { date, serviceId, staffId } },
    )
  ).data;
const bookingBody = (input: ReserveInput) => ({
  serviceId: input.serviceId,
  staffId: input.staffId,
  date: input.date,
  time: input.time,
  customerName: input.name,
  customerEmail: input.email,
  customerPhone: input.phone,
  notes: input.notes,
});
export async function reserveBooking(input: ReserveInput) {
  const url = `/public/salons/${input.salonId}/bookings${input.editingId ? `/${input.editingId}` : ""}`;
  return (
    await api.request({
      url,
      method: input.editingId ? "patch" : "post",
      data: bookingBody(input),
    })
  ).data;
}
export async function cancelBooking(id: string) {
  return (await api.post(`/customer/bookings/${id}/cancel`)).data;
}
export async function updateProfile(profile: Contact) {
  return (await api.patch<Contact>("/customer/profile", profile)).data;
}
export async function createReview(
  appointmentId: string,
  rating: number,
  text: string,
) {
  return (await api.post("/customer/reviews", { appointmentId, rating, text }))
    .data;
}
export type CustomerNotification = {
  id: string;
  kind: string;
  channel: string;
  status: string;
  scheduledFor: string;
  sentAt: string | null;
  appointment: {
    startsAt: string;
    service: { name: string };
    tenant: { name: string; slug: string };
  };
};
export async function getCustomerNotifications() {
  return (await api.get<CustomerNotification[]>("/customer/notifications"))
    .data;
}
export function apiError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return Array.isArray(message) ? message.join(". ") : message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
