'use client';
import { createContext, useContext, useRef, useState } from 'react';
import { useWorkspace } from '@/customer/components/workspace-provider';
import { bookingError, canCustomerManage } from '@/customer/lib/booking';
import {
  CUSTOMER_DEMO_NOW,
  lotusServices,
  lotusStaff,
  sampleReviews,
  type SalonId,
  type CustomerReview,
} from '@/customer/lib/customer-data';
import type { Appointment, Service, Staff } from '@/customer/lib/demo-data';
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
type Context = {
  profile: Contact;
  setProfile: (p: Contact) => Promise<void>;
  owned: OwnedBooking[];
  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
  reviews: CustomerReview[];
  catalog: (id: SalonId) => {
    services: Service[];
    staff: Staff[];
    appointments: Appointment[];
  };
  reserve: (input: ReserveInput) => Promise<OwnedBooking>;
  cancel: (b: OwnedBooking) => Promise<void>;
  addReview: (booking: OwnedBooking, rating: number, text: string) => void;
};
const Context = createContext<Context | null>(null);
export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const workspace = useWorkspace();
  const [profile, setProfileState] = useState<Contact>({
    name: 'Ei Ei Khaing',
    email: 'ei.khaing@example.com',
    phone: '+95 9 250 111 222',
    notes: '',
  });
  const [owned, setOwned] = useState<OwnedBooking[]>([
    {
      salonId: 'serenity',
      appointmentId: 'a1',
      reference: 'SRN-2026-0001',
      contact: {
        name: 'Ei Ei Khaing',
        email: 'ei.khaing@example.com',
        phone: '+95 9 250 111 222',
        notes: '',
      },
    },
  ]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [lotusAppointments, setLotusAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState(sampleReviews);
  const busy = useRef(false);
  function catalog(id: SalonId) {
    return id === 'serenity'
      ? {
          services: workspace.data.services,
          staff: workspace.data.staff,
          appointments: workspace.data.appointments,
        }
      : {
          services: lotusServices,
          staff: lotusStaff,
          appointments: lotusAppointments,
        };
  }
  async function reserve(input: ReserveInput) {
    if (busy.current)
      throw new Error('Please wait while your booking is saved.');
    busy.current = true;
    try {
      const data = workspace.data;
      const old = input.editingId
        ? owned.find(
            (b) =>
              b.salonId === input.salonId &&
              b.appointmentId === input.editingId,
          )
        : undefined;
      if (input.editingId && !old)
        throw new Error('That booking could not be found.');
      const source =
        input.salonId === 'serenity'
          ? {
              services: data.services,
              staff: data.staff,
              appointments: data.appointments,
            }
          : {
              services: lotusServices,
              staff: lotusStaff,
              appointments: lotusAppointments,
            };
      if (old) {
        const existing = source.appointments.find(
          (a) => a.id === old.appointmentId,
        );
        if (!existing || !canCustomerManage(existing, CUSTOMER_DEMO_NOW))
          throw new Error(
            'Bookings can only be moved at least 24 hours before the appointment.',
          );
      }
      if (
        !input.name.trim() ||
        !/^\S+@\S+\.\S+$/.test(input.email) ||
        input.phone.replace(/\D/g, '').length < 7
      )
        throw new Error(
          'Please enter your name, a valid email, and phone number.',
        );
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
        !/^\d{2}:\d{2}$/.test(input.time) ||
        !Number.isFinite(
          Date.parse(input.date + 'T' + input.time + ':00+06:30'),
        ) ||
        Date.parse(input.date + 'T' + input.time + ':00+06:30') <=
          Date.parse(CUSTOMER_DEMO_NOW)
      )
        throw new Error('Please choose a future appointment time.');
      const existingCustomer = data.customers.find(
        (c) => c.email.toLowerCase() === input.email.trim().toLowerCase(),
      );
      const customerId = existingCustomer?.id ?? crypto.randomUUID();
      const booking: Appointment = {
        id: old?.appointmentId ?? crypto.randomUUID(),
        customerId,
        serviceId: input.serviceId,
        staffId: input.staffId,
        date: input.date,
        time: input.time,
        status: 'Confirmed',
        notes: input.notes,
      };
      const issue = bookingError(
        booking,
        source.appointments,
        source.staff,
        source.services,
      );
      if (issue) throw new Error(issue);
      const updated = old
        ? source.appointments.map((a) => (a.id === booking.id ? booking : a))
        : [...source.appointments, booking];
      if (input.salonId === 'serenity') {
        const customers = existingCustomer
          ? data.customers
          : [
              ...data.customers,
              {
                id: customerId,
                name: input.name.trim(),
                email: input.email.trim(),
                phone: input.phone,
                visits: 0,
                noShow: 0,
                points: 0,
                spent: 0,
                last: 'Not visited yet',
                notes: '',
              },
            ];
        await workspace.save(
          { ...data, customers, appointments: updated },
          old
            ? 'Your demo booking was rescheduled.'
            : 'Your demo booking is confirmed.',
        );
      } else setLotusAppointments(updated);
      const result: OwnedBooking = {
        salonId: input.salonId,
        appointmentId: booking.id,
        reference:
          old?.reference ??
          `${input.salonId === 'serenity' ? 'SRN' : 'LTS'}-${booking.id.slice(0, 8).toUpperCase()}`,
        contact: {
          name: input.name.trim(),
          email: input.email.trim(),
          phone: input.phone,
          notes: input.notes,
        },
      };
      setOwned((list) =>
        old
          ? list.map((b) =>
              b.salonId === old.salonId && b.appointmentId === old.appointmentId
                ? result
                : b,
            )
          : [...list, result],
      );
      setDraft(null);
      return result;
    } finally {
      busy.current = false;
    }
  }
  async function cancel(ownedBooking: OwnedBooking) {
    if (busy.current)
      throw new Error('Please wait while your changes are saved.');
    busy.current = true;
    try {
      if (
        !owned.some(
          (b) =>
            b.salonId === ownedBooking.salonId &&
            b.appointmentId === ownedBooking.appointmentId,
        )
      )
        throw new Error('This booking does not belong to this demo account.');
      const rows =
        ownedBooking.salonId === 'serenity'
          ? workspace.data.appointments
          : lotusAppointments;
      const booking = rows.find((a) => a.id === ownedBooking.appointmentId);
      if (!booking || !canCustomerManage(booking, CUSTOMER_DEMO_NOW))
        throw new Error(
          'Online cancellation closes 24 hours before the appointment. Please contact the salon.',
        );
      const updated = rows.map((a) =>
        a.id === booking.id ? { ...a, status: 'Cancelled' } : a,
      );
      if (ownedBooking.salonId === 'serenity')
        await workspace.save(
          { ...workspace.data, appointments: updated },
          'Your demo appointment was cancelled.',
        );
      else setLotusAppointments(updated);
    } finally {
      busy.current = false;
    }
  }
  function addReview(b: OwnedBooking, rating: number, text: string) {
    const record = owned.find(
      (x) => x.salonId === b.salonId && x.appointmentId === b.appointmentId,
    );
    const source = catalog(b.salonId);
    const appointment = source.appointments.find(
      (a) => a.id === b.appointmentId,
    );
    if (!record || appointment?.status !== 'Completed')
      throw new Error('Reviews are available after a completed appointment.');
    if (
      reviews.some(
        (r) => r.bookingId === b.appointmentId && r.salonId === b.salonId,
      )
    )
      throw new Error('You have already reviewed this visit.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !text.trim())
      throw new Error('Choose a star rating and write a short review.');
    setReviews((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        salonId: b.salonId,
        bookingId: b.appointmentId,
        name: record.contact.name,
        service:
          source.services.find((s) => s.id === appointment.serviceId)?.name ??
          '',
        staff:
          source.staff.find((s) => s.id === appointment.staffId)?.name ?? '',
        rating,
        text: text.trim(),
        date: '2026-08-07',
      },
    ]);
  }
  async function setProfile(p: Contact) {
    const data = workspace.data;
    await workspace.save(
      {
        ...data,
        customers: data.customers.map((c) =>
          c.id === 'c1'
            ? { ...c, name: p.name, email: p.email, phone: p.phone }
            : c,
        ),
      },
      'Your demo profile was updated.',
    );
    setProfileState(p);
  }
  return (
    <Context.Provider
      value={{
        profile,
        setProfile,
        owned,
        draft,
        setDraft,
        reviews,
        catalog,
        reserve,
        cancel,
        addReview,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCustomer() {
  const value = useContext(Context);
  if (!value) throw new Error('CustomerProvider is required');
  return value;
}
