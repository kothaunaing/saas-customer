'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock3,
  Gift,
  MapPin,
  Pencil,
  Star,
  UserRound,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { canCustomerManage } from '@/customer/lib/booking';
import {
  CUSTOMER_DEMO_NOW,
  dateLabel,
  salons,
  timeLabel,
} from '@/customer/lib/customer-data';
import { duration } from '@/customer/lib/demo-data';
import { useCustomer, type Contact, type OwnedBooking } from './provider';

export default function AccountPage() {
  const customer = useCustomer();
  const router = useRouter();
  const [cancelTarget, setCancelTarget] = useState<OwnedBooking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<OwnedBooking | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [profile, setProfile] = useState<Contact>(customer.profile);
  const [profileError, setProfileError] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [saving, setSaving] = useState(false);
  const points = 1240;

  function details(owned: OwnedBooking) {
    const source = customer.catalog(owned.salonId);
    const appointment = source.appointments.find(
      (item) => item.id === owned.appointmentId,
    );
    return {
      source,
      appointment,
      service: source.services.find(
        (item) => item.id === appointment?.serviceId,
      ),
      staff: source.staff.find((item) => item.id === appointment?.staffId),
    };
  }

  const records = customer.owned
    .map((owned) => ({ owned, ...details(owned) }))
    .filter((record) => record.appointment && record.service && record.staff)
    .sort((a, b) =>
      `${b.appointment?.date}${b.appointment?.time}`.localeCompare(
        `${a.appointment?.date}${a.appointment?.time}`,
      ),
    );
  const upcoming = records.filter(
    (record) =>
      !['Completed', 'Cancelled', 'No-show'].includes(
        record.appointment!.status,
      ),
  );
  const past = records.filter((record) =>
    ['Completed', 'Cancelled', 'No-show'].includes(record.appointment!.status),
  );

  function reschedule(owned: OwnedBooking) {
    const appointment = details(owned).appointment;
    if (!appointment || !canCustomerManage(appointment, CUSTOMER_DEMO_NOW))
      return;
    customer.setDraft({
      salonId: owned.salonId,
      serviceId: appointment.serviceId,
      staffId: appointment.staffId,
      editingId: appointment.id,
    });
    router.push(`/${owned.salonId}/appointment`);
  }

  async function cancelBooking() {
    if (!cancelTarget) return;
    setSaving(true);
    setDialogError('');
    try {
      await customer.cancel(cancelTarget);
      setCancelTarget(null);
    } catch (cause) {
      setDialogError(
        cause instanceof Error
          ? cause.message
          : 'The booking could not be cancelled.',
      );
    } finally {
      setSaving(false);
    }
  }

  function sendReview() {
    if (!reviewTarget) return;
    setDialogError('');
    try {
      customer.addReview(reviewTarget, rating, review);
      setReviewTarget(null);
      setReview('');
      setRating(5);
    } catch (cause) {
      setDialogError(
        cause instanceof Error
          ? cause.message
          : 'The review could not be saved.',
      );
    }
  }

  async function saveProfile(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');
    if (
      !profile.name.trim() ||
      !/^\S+@\S+\.\S+$/.test(profile.email) ||
      profile.phone.replace(/\D/g, '').length < 7
    ) {
      setProfileError('Enter your name, a valid email, and phone number.');
      return;
    }
    setSaving(true);
    try {
      await customer.setProfile(profile);
    } catch {
      setProfileError('Your profile could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function BookingCard({ record }: { record: (typeof records)[number] }) {
    const appointment = record.appointment!;
    const service = record.service!;
    const staff = record.staff!;
    const manageable = canCustomerManage(appointment, CUSTOMER_DEMO_NOW);
    const reviewed = customer.reviews.some(
      (item) =>
        item.bookingId === appointment.id &&
        item.salonId === record.owned.salonId,
    );
    return (
      <article className="customer-panel account-booking">
        <div className="customer-between">
          <div>
            <h3>{service.name}</h3>
            <p className="customer-lead mt-1!">
              {salons[record.owned.salonId].name}
            </p>
          </div>
          <span
            className={`customer-status ${appointment.status === 'Cancelled' ? 'cancelled' : ''}`}
          >
            {appointment.status}
          </span>
        </div>
        <div className="customer-meta">
          <span>
            <CalendarDays size={15} />
            {dateLabel(appointment.date)}, {timeLabel(appointment.time)}
          </span>
          <span>
            <Clock3 size={15} />
            {duration(service.duration)}
          </span>
          <span>
            <UserRound size={15} />
            {staff.name}
          </span>
        </div>
        <div className="booking-card-line">
          <MapPin />
          {salons[record.owned.salonId].address}
        </div>
        <div className="customer-actions">
          {manageable && (
            <button
              className="customer-btn"
              onClick={() => reschedule(record.owned)}
            >
              <Pencil size={14} />
              Reschedule
            </button>
          )}
          {manageable && (
            <button
              className="customer-btn ghost"
              onClick={() => {
                setDialogError('');
                setCancelTarget(record.owned);
              }}
            >
              Cancel booking
            </button>
          )}
          {appointment.status === 'Completed' && !reviewed && (
            <button
              className="customer-btn"
              onClick={() => {
                setDialogError('');
                setReviewTarget(record.owned);
              }}
            >
              <Star size={14} />
              Leave a review
            </button>
          )}
          {reviewed && (
            <span className="customer-status">Review submitted</span>
          )}
          <Link
            className="customer-btn ghost"
            href={`/${record.owned.salonId}`}
          >
            View salon
          </Link>
        </div>
      </article>
    );
  }

  return (
    <main className="customer-container narrow">
      <div className="account-heading">
        <h1>My Serenity</h1>
        <p>Your bookings, rewards, and details in one quiet place.</p>
      </div>
      <Tabs defaultValue="bookings" className="account-tabs">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings">
          <section className="customer-account-section">
            <div className="customer-between">
              <h2>Upcoming</h2>
              <Link className="customer-btn primary" href="">
                Book something new
              </Link>
            </div>
            <div className="customer-account-list">
              {upcoming.length ? (
                upcoming.map((record) => (
                  <BookingCard
                    key={`${record.owned.salonId}-${record.owned.appointmentId}`}
                    record={record}
                  />
                ))
              ) : (
                <div className="customer-panel customer-empty">
                  <CalendarDays size={28} />
                  <h3>Your calendar is clear</h3>
                  <p>Choose a salon and find your next moment of care.</p>
                </div>
              )}
            </div>
          </section>
          <section className="customer-account-section mt-10">
            <h2>Past visits</h2>
            <div className="customer-account-list">
              {past.length ? (
                past.map((record) => (
                  <BookingCard
                    key={`${record.owned.salonId}-${record.owned.appointmentId}`}
                    record={record}
                  />
                ))
              ) : (
                <div className="customer-panel customer-empty">
                  No past visits in this demo account.
                </div>
              )}
            </div>
          </section>
        </TabsContent>
        <TabsContent value="rewards">
          <section id="rewards" className="customer-account-section">
            <div className="customer-panel">
              <div className="customer-between">
                <div>
                  <h2>Serenity points</h2>
                  <p className="customer-lead">
                    A little thank you for every visit.
                  </p>
                </div>
                <div>
                  <div className="customer-points">
                    {points.toLocaleString()}
                  </div>
                  <small className="muted">points available</small>
                </div>
              </div>
            </div>
            <div className="account-reward-grid">
              {[
                { name: '$10 off your next visit', points: 500 },
                { name: 'Complimentary gel manicure', points: 1500 },
                { name: 'Signature facial experience', points: 2500 },
              ].map((reward) => (
                <article className="customer-panel" key={reward.name}>
                  <Gift className="pink" />
                  <h3>{reward.name}</h3>
                  <p>{reward.points.toLocaleString()} points</p>
                  <button
                    className="customer-btn full"
                    disabled={points < reward.points}
                  >
                    {points >= reward.points
                      ? 'Redeem at the salon'
                      : `${(reward.points - points).toLocaleString()} more points`}
                  </button>
                </article>
              ))}
            </div>
            <p className="customer-profile-note">
              Reward redemption is a demo. Your points are not deducted.
            </p>
          </section>
        </TabsContent>
        <TabsContent value="profile">
          <section
            id="profile"
            className="customer-account-section customer-account-grid"
          >
            <form
              className="customer-panel customer-profile-form"
              onSubmit={saveProfile}
            >
              <div>
                <h2>Your details</h2>
                <p className="customer-lead">
                  Used to prefill your next booking.
                </p>
              </div>
              <label className="customer-field">
                Full name
                <input
                  value={profile.name}
                  onChange={(event) =>
                    setProfile({ ...profile, name: event.target.value })
                  }
                />
              </label>
              <label className="customer-field">
                Email
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    setProfile({ ...profile, email: event.target.value })
                  }
                />
              </label>
              <label className="customer-field">
                Phone
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value })
                  }
                />
              </label>
              {profileError && (
                <p className="customer-error" role="alert">
                  {profileError}
                </p>
              )}
              <button className="customer-btn primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </form>
            <aside className="customer-panel">
              <h2>Account demo</h2>
              <p>
                This customer area uses sample data and in-memory changes.
                Refreshing the page resets bookings, profile changes, reviews,
                and rewards.
              </p>
              <div className="booking-divider" />
              <p>No real email, SMS, payment, or reward transaction is sent.</p>
            </aside>
          </section>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent className="customer-dialog dark">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              You can cancel online until 24 hours before the appointment. This
              changes demo data only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialogError && (
            <p className="customer-error" role="alert">
              {dialogError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="customer-btn">
              Keep booking
            </AlertDialogCancel>
            <AlertDialogAction
              className="customer-btn primary"
              disabled={saving}
              onClick={cancelBooking}
            >
              {saving ? 'Cancelling…' : 'Cancel booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!reviewTarget}
        onOpenChange={(open) => !open && setReviewTarget(null)}
      >
        <AlertDialogContent className="customer-dialog dark">
          <AlertDialogHeader>
            <AlertDialogTitle>How was your visit?</AlertDialogTitle>
            <AlertDialogDescription>
              Your review will appear on the salon’s Reviews tab in this demo
              session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="review-stars-input" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-label={`${value} stars`}
                className={value <= rating ? 'selected' : ''}
                key={value}
                onClick={() => setRating(value)}
              >
                <Star fill="currentColor" />
              </button>
            ))}
          </div>
          <textarea
            aria-label="Your review"
            value={review}
            onChange={(event) => setReview(event.target.value)}
            placeholder="Tell other customers about your experience…"
          />
          {dialogError && (
            <p className="customer-error" role="alert">
              {dialogError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="customer-btn">
              Not now
            </AlertDialogCancel>
            <AlertDialogAction
              className="customer-btn primary"
              onClick={sendReview}
            >
              Submit review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
