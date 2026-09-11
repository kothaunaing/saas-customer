"use client";
import { createContext, useContext, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiError,
  cancelBooking,
  createReview,
  getAccount,
  getSession,
  getSalon,
  reserveBooking,
  updateProfile,
  type Reward,
} from "@/customer/lib/api";
import {
  salonIds,
  type SalonId,
  type CustomerReview,
} from "@/customer/lib/customer-data";
import {
  appointments,
  services,
  staff,
  type Appointment,
  type Service,
  type Staff,
} from "@/customer/lib/demo-data";

export type Contact = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};
export type OwnedBooking = {
  salonId: SalonId;
  appointmentId: string;
  reference: string;
  contact: Contact;
};
export type Draft = {
  salonId: SalonId;
  serviceId?: string;
  staffId?: string;
  editingId?: string;
};
export type ReserveInput = Contact & {
  salonId: SalonId;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  editingId?: string;
};
type Catalog = {
  services: Service[];
  staff: Staff[];
  appointments: Appointment[];
  name?: string;
  address?: string | null;
  tagline?: string | null;
  description?: string | null;
  amenities?: string[];
  imageUrl?: string | null;
};
type Value = {
  profile: Contact;
  points: number;
  rewards: Reward[];
  setProfile: (p: Contact) => Promise<void>;
  owned: OwnedBooking[];
  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
  reviews: CustomerReview[];
  catalog: (id: SalonId) => Catalog;
  reserve: (input: ReserveInput) => Promise<OwnedBooking>;
  cancel: (b: OwnedBooking) => Promise<void>;
  addReview: (b: OwnedBooking, rating: number, text: string) => Promise<void>;
  loading: boolean;
  error: string;
  authenticated: boolean;
};
const Context = createContext<Value | null>(null);
const emptyContact: Contact = { name: "", email: "", phone: "", notes: "" };

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const catalogs = useQuery({
    queryKey: ["public-salons"],
    queryFn: async () =>
      Object.fromEntries(
        await Promise.all(salonIds.map(async (id) => [id, await getSalon(id)])),
      ),
  });
  const session = useQuery({
    queryKey: ["customer-session"],
    queryFn: getSession,
    retry: false,
  });
  const account = useQuery({
    queryKey: ["customer-account"],
    queryFn: getAccount,
    enabled: Boolean(session.data),
    retry: false,
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const profile = account.data?.profile ?? emptyContact;
  function catalog(id: SalonId): Catalog {
    const remote = catalogs.data?.[id];
    const rows = (account.data?.owned ?? [])
      .filter((row) => row.salonId === id)
      .map((row) => row.appointment);
    if (remote)
      return {
        services: remote.services,
        staff: remote.staff,
        appointments: rows,
        name: remote.name,
        address: remote.address,
        tagline: remote.tagline,
        description: remote.description,
        amenities: remote.amenities,
        imageUrl: remote.imageUrl,
      };
    return id === "serenity"
      ? { services, staff, appointments }
      : { services: [], staff: [], appointments: [] };
  }
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["customer-account"] }),
      client.invalidateQueries({ queryKey: ["public-salons"] }),
    ]);
  }
  async function reserve(input: ReserveInput) {
    try {
      const saved = await reserveBooking(input);
      await refresh();
      setDraft(null);
      return {
        salonId: input.salonId,
        appointmentId: saved.id,
        reference: `${input.salonId.slice(0, 3).toUpperCase()}-${saved.id.slice(0, 8).toUpperCase()}`,
        contact: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          notes: input.notes,
        },
      };
    } catch (error) {
      throw new Error(apiError(error, "Your booking could not be saved."));
    }
  }
  async function cancel(row: OwnedBooking) {
    try {
      await cancelBooking(row.appointmentId);
      await refresh();
    } catch (error) {
      throw new Error(apiError(error, "The booking could not be cancelled."));
    }
  }
  async function addReview(row: OwnedBooking, rating: number, text: string) {
    try {
      await createReview(row.appointmentId, rating, text);
      await refresh();
    } catch (error) {
      throw new Error(apiError(error, "The review could not be saved."));
    }
  }
  async function setProfile(value: Contact) {
    try {
      await updateProfile(value);
      await refresh();
    } catch (error) {
      throw new Error(apiError(error, "Your profile could not be saved."));
    }
  }
  const reviews = salonIds.flatMap((id) => catalogs.data?.[id]?.reviews ?? []);
  const owned = (account.data?.owned ?? []).map(
    ({ appointment: _appointment, ...row }) => row,
  );
  const error = catalogs.error || session.error || account.error;
  return (
    <Context.Provider
      value={{
        profile,
        points: account.data?.points ?? 0,
        rewards: account.data?.rewards ?? [],
        setProfile,
        owned,
        draft,
        setDraft,
        reviews,
        catalog,
        reserve,
        cancel,
        addReview,
        loading:
          catalogs.isLoading ||
          session.isLoading ||
          (Boolean(session.data) && account.isLoading),
        authenticated: Boolean(session.data),
        error: error
          ? apiError(error, "Could not connect to the booking API.")
          : "",
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCustomer() {
  const value = useContext(Context);
  if (!value) throw new Error("CustomerProvider is required");
  return value;
}
