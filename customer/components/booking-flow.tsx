'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Check,
  Clock3,
  Info,
  Mail,
  MapPin,
  Phone,
  Scissors,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { availableSlots } from '@/customer/lib/booking';
import {
  CUSTOMER_DEMO_NOW,
  CUSTOMER_FIRST_DATE,
  dateLabel,
  salons,
  timeLabel,
  type SalonId,
} from '@/customer/lib/customer-data';
import { duration, initials, money } from '@/customer/lib/demo-data';
import { useCustomer, type Contact, type OwnedBooking } from './provider';

const labels = [
  'Service',
  'Specialist',
  'Date & time',
  'Your details',
  'Confirm',
];

export default function BookingFlow({ salonId }: { salonId: SalonId }) {
  const customer = useCustomer();
  const router = useRouter();
  const source = customer.catalog(salonId);
  const original = customer.draft?.editingId
    ? source.appointments.find((item) => item.id === customer.draft?.editingId)
    : undefined;
  const [step, setStep] = useState(
    original ? 2 : customer.draft?.staffId ? 1 : 0,
  );
  const [serviceId, setServiceId] = useState(
    customer.draft?.serviceId ??
      original?.serviceId ??
      source.services.find((item) => item.active)?.id ??
      '',
  );
  const [staffId, setStaffId] = useState(
    customer.draft?.staffId ?? original?.staffId ?? 'any',
  );
  const [date, setDate] = useState(original?.date ?? CUSTOMER_FIRST_DATE);
  const [time, setTime] = useState(original?.time ?? '');
  const [contact, setContact] = useState<Contact>(() => {
    const owned = customer.owned.find(
      (item) => item.appointmentId === original?.id && item.salonId === salonId,
    );
    return owned?.contact ?? customer.profile;
  });
  const [error, setError] = useState('');
  const [result, setResult] = useState<OwnedBooking | null>(null);
  const [saving, setSaving] = useState(false);
  const service = source.services.find((item) => item.id === serviceId);
  const qualified = source.staff.filter(
    (item) => item.active && item.services.includes(serviceId),
  );
  const slots = serviceId
    ? availableSlots(
        date,
        serviceId,
        staffId,
        source.appointments,
        source.staff,
        source.services,
        CUSTOMER_DEMO_NOW,
        original?.id,
      )
    : [];
  const selectedSlot = slots.find((slot) => slot.time === time);
  const resolvedStaffId =
    staffId === 'any' ? (selectedSlot?.staffIds[0] ?? '') : staffId;
  const member = source.staff.find((item) => item.id === resolvedStaffId);

  function next() {
    setError('');
    if (step === 0 && !serviceId)
      return setError('Choose a treatment to continue.');
    if (step === 1 && !staffId)
      return setError('Choose a specialist to continue.');
    if (step === 2 && (!date || !time))
      return setError('Choose an available date and time.');
    if (
      step === 3 &&
      (!contact.name.trim() ||
        !/^\S+@\S+\.\S+$/.test(contact.email) ||
        contact.phone.replace(/\D/g, '').length < 7)
    )
      return setError('Enter your name, a valid email, and phone number.');
    setStep((value) => Math.min(4, value + 1));
  }

  async function confirm() {
    if (!service || !resolvedStaffId || !time) return;
    setSaving(true);
    setError('');
    try {
      const booking = await customer.reserve({
        ...contact,
        salonId,
        serviceId,
        staffId: resolvedStaffId,
        date,
        time,
        editingId: original?.id,
      });
      setResult(booking);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Your booking could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (result && service && member)
    return (
      <main className="customer-container narrow">
        <div className="booking-complete-banner">
          <Check size={20} />
          <div>
            <strong>Booking confirmed</strong>Reference {result.reference}
          </div>
        </div>
        <section className="customer-panel booking-success">
          <div className="customer-confirm-check">
            <Check size={30} />
          </div>
          <h1>{original ? 'Your booking is updated' : "You're booked in"}</h1>
          <p>
            A confirmation is on its way to your inbox. Reference{' '}
            <strong>{result.reference}</strong>
          </p>
          <div className="booking-divider" />
          <ul>
            <li>
              <CalendarDays />
              {dateLabel(date)}, {timeLabel(time)}
            </li>
            <li>
              <Clock3 />
              {service.name} · {duration(service.duration)} ·{' '}
              {money(service.price)}
            </li>
            <li>
              <UserRound />
              {member.name}
            </li>
            <li>
              <MapPin />
              {salons[salonId].name}
              <br />
              {salons[salonId].address}
            </li>
            <li>
              <Phone />
              {salons[salonId].phone}
            </li>
          </ul>
          <div className="customer-actions">
            <Link className="customer-btn primary" href="/account">
              See my bookings
            </Link>
            <Link className="customer-btn" href={`/${salonId}`}>
              Back to {salons[salonId].name}
            </Link>
          </div>
        </section>
      </main>
    );

  return (
    <main className="customer-container narrow">
      <div className="booking-steps" aria-label="Booking progress">
        {labels.map((label, index) => (
          <div className="contents" key={label}>
            <button
              type="button"
              className={`${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`}
              disabled={index > step}
              onClick={() => index < step && setStep(index)}
            >
              <span className="step-number">
                {index < step ? <Check size={12} /> : index + 1}
              </span>
              {label}
            </button>
            {index < labels.length - 1 && (
              <span className="step-separator">/</span>
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="booking-heading">
            <h1>What would you like?</h1>
            <p>Prices include your consultation. You can change this later.</p>
          </div>
          <RadioGroup
            value={serviceId}
            onValueChange={(value) => setServiceId(String(value))}
          >
            {source.services
              .filter((item) => item.active)
              .map((item) => (
                <label
                  htmlFor={`service-${item.id}`}
                  className={`booking-choice ${serviceId === item.id ? 'selected' : ''}`}
                  key={item.id}
                >
                  <RadioGroupItem id={`service-${item.id}`} value={item.id} />
                  <div className="booking-choice-body">
                    <div className="customer-between">
                      <h3>{item.name}</h3>
                      <strong>{money(item.price)}</strong>
                    </div>
                    <p>{item.description}</p>
                    <div className="customer-meta">
                      <span>
                        <Clock3 size={14} />
                        {duration(item.duration)}
                      </span>
                      <span className="customer-category">{item.category}</span>
                    </div>
                  </div>
                </label>
              ))}
          </RadioGroup>
        </>
      )}
      {step === 1 && (
        <>
          <div className="booking-heading">
            <h1>Who would you like?</h1>
            <p>
              Choose your specialist, or let us match you with anyone available.
            </p>
          </div>
          <RadioGroup
            value={staffId}
            onValueChange={(value) => {
              setStaffId(String(value));
              setTime('');
            }}
          >
            <label
              htmlFor="specialist-any"
              className={`booking-choice specialist-any ${staffId === 'any' ? 'selected' : ''}`}
            >
              <RadioGroupItem id="specialist-any" value="any" />
              <span className="customer-avatar">
                <UsersRound size={22} />
              </span>
              <div className="booking-choice-body">
                <h3>Anyone available</h3>
                <p>
                  We’ll match you with a qualified specialist who is free at
                  your chosen time.
                </p>
              </div>
            </label>
            {qualified.map((person) => (
              <label
                htmlFor={`specialist-${person.id}`}
                className={`booking-choice ${staffId === person.id ? 'selected' : ''}`}
                key={person.id}
              >
                <RadioGroupItem
                  id={`specialist-${person.id}`}
                  value={person.id}
                />
                <span className="customer-avatar">{initials(person.name)}</span>
                <div className="booking-choice-body">
                  <h3>{person.name}</h3>
                  <p>
                    {person.role === 'Staff'
                      ? 'Beauty specialist'
                      : person.role}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>
          {qualified.length === 0 && (
            <div className="customer-error">
              No active specialist is assigned to this treatment yet.
            </div>
          )}
        </>
      )}
      {step === 2 && (
        <>
          <div className="booking-heading">
            <h1>Pick a time</h1>
            <p>
              Only genuinely free slots are shown from the salon’s working
              diary.
            </p>
          </div>
          <div className="booking-date-grid">
            <div className="customer-panel">
              <Calendar
                className="booking-calendar"
                mode="single"
                selected={new Date(date + 'T12:00:00')}
                defaultMonth={new Date(CUSTOMER_FIRST_DATE + 'T12:00:00')}
                disabled={{
                  before: new Date(CUSTOMER_FIRST_DATE + 'T12:00:00'),
                }}
                onSelect={(value) => {
                  if (value) {
                    setDate(
                      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`,
                    );
                    setTime('');
                  }
                }}
              />
            </div>
            <div className="customer-panel">
              <h2>{dateLabel(date)}</h2>
              {slots.length ? (
                <RadioGroup
                  className="booking-time-grid"
                  value={time}
                  onValueChange={(value) => setTime(String(value))}
                >
                  {slots.map((slot) => (
                    <label
                      htmlFor={`time-${slot.time.replace(':', '-')}`}
                      className={`time-choice ${time === slot.time ? 'selected' : ''}`}
                      key={slot.time}
                    >
                      <RadioGroupItem
                        id={`time-${slot.time.replace(':', '-')}`}
                        value={slot.time}
                      />
                      {timeLabel(slot.time)}
                    </label>
                  ))}
                </RadioGroup>
              ) : (
                <div className="customer-empty">
                  <Clock3 size={27} />
                  <h3>No open times</h3>
                  <p>Try another date or specialist.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <div className="booking-heading">
            <h1>Your details</h1>
            <p>No account needed. We use these details for this booking.</p>
          </div>
          <div className="booking-form">
            <label className="customer-field">
              Full name
              <input
                required
                value={contact.name}
                autoComplete="name"
                onChange={(event) =>
                  setContact({ ...contact, name: event.target.value })
                }
              />
            </label>
            <label className="customer-field">
              Email
              <input
                required
                type="email"
                value={contact.email}
                autoComplete="email"
                onChange={(event) =>
                  setContact({ ...contact, email: event.target.value })
                }
              />
              <small>Your confirmation and reminder are sent here.</small>
            </label>
            <label className="customer-field">
              Phone
              <input
                required
                type="tel"
                value={contact.phone}
                autoComplete="tel"
                onChange={(event) =>
                  setContact({ ...contact, phone: event.target.value })
                }
              />
              <small>
                Only used if the salon needs to reach you on the day.
              </small>
            </label>
            <label className="customer-field">
              Anything we should know?{' '}
              <span className="font-normal muted">(optional)</span>
              <textarea
                value={contact.notes}
                onChange={(event) =>
                  setContact({ ...contact, notes: event.target.value })
                }
                placeholder="Allergies, sensitivities, or what you’d like from the appointment."
              />
            </label>
          </div>
        </>
      )}
      {step === 4 && service && member && (
        <>
          <div className="booking-heading">
            <h1>Check and confirm</h1>
            <p>One last look before we book it in.</p>
          </div>
          <div className="booking-confirm-grid">
            <div>
              <div className="booking-notice">
                <Info size={17} />
                <span>
                  Nothing is charged now. You’ll pay at the salon. Free to
                  cancel or move up to 24 hours before your appointment.
                </span>
              </div>
              <div className="customer-actions">
                <button
                  className="customer-btn primary"
                  disabled={saving}
                  onClick={confirm}
                >
                  {saving
                    ? 'Confirming…'
                    : original
                      ? 'Confirm new time'
                      : 'Confirm booking'}
                </button>
                <button
                  className="customer-btn ghost"
                  onClick={() => setStep(2)}
                >
                  Change time
                </button>
              </div>
            </div>
            <aside className="customer-panel booking-summary">
              <h2>Your booking</h2>
              <ul>
                <li>
                  <Scissors />
                  {service.name}
                </li>
                <li>
                  <Clock3 />
                  {duration(service.duration)}
                </li>
                <li>
                  <UserRound />
                  {member.name}
                </li>
                <li>
                  <CalendarDays />
                  {dateLabel(date)}, {timeLabel(time)}
                </li>
              </ul>
              <div className="booking-divider" />
              <ul>
                <li>
                  <strong>{contact.name}</strong>
                </li>
                <li>
                  <Mail />
                  {contact.email}
                </li>
                <li>
                  <Phone />
                  {contact.phone}
                </li>
              </ul>
              <div className="booking-divider" />
              <div className="booking-total">
                <span>Total, payable at the salon</span>
                <strong>{money(service.price)}</strong>
              </div>
            </aside>
          </div>
        </>
      )}
      {error && (
        <p className="customer-error" role="alert">
          {error}
        </p>
      )}
      {step < 4 && (
        <div className="booking-nav">
          <button
            className="customer-btn ghost"
            onClick={() =>
              step ? setStep(step - 1) : router.push(`/${salonId}`)
            }
          >
            Back
          </button>
          <button
            className="customer-btn primary"
            onClick={next}
            disabled={
              (step === 1 && qualified.length === 0) ||
              (step === 2 && slots.length === 0)
            }
          >
            Continue
          </button>
        </div>
      )}
    </main>
  );
}
