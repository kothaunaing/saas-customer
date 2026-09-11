"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { getAvailability } from "@/customer/lib/api";
import {
  firstBookableDate,
  dateLabel,
  timeLabel,
  type SalonId,
} from "@/customer/lib/domain";
import { duration, initials, money } from "@/customer/lib/domain";
import { useCustomer, type Contact, type OwnedBooking } from "./provider";
import {
  pageVariants,
  sectionVariants,
  listVariants,
  itemVariants,
  bannerVariants,
  fadeVariants,
  ease,
} from "@/customer/lib/motion";

const labels = [
  "Service",
  "Specialist",
  "Date & time",
  "Your details",
  "Confirm",
];

/** Direction-aware slide variants for the booking wizard steps. */
function stepVariants(direction: number) {
  return {
    hidden: { opacity: 0, x: direction > 0 ? 40 : -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.32, ease },
    },
    exit: {
      opacity: 0,
      x: direction > 0 ? -30 : 30,
      transition: { duration: 0.2, ease },
    },
  };
}

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
  const [direction, setDirection] = useState(0);

  const [serviceId, setServiceId] = useState(
    customer.draft?.serviceId ??
      original?.serviceId ??
      source.services.find((item) => item.active)?.id ??
      "",
  );
  const [staffId, setStaffId] = useState(
    customer.draft?.staffId ?? original?.staffId ?? "any",
  );
  const firstDate = firstBookableDate();
  const [date, setDate] = useState(original?.date ?? firstDate);
  const [time, setTime] = useState(original?.time ?? "");
  const [contact, setContact] = useState<Contact>(() => {
    const owned = customer.owned.find(
      (item) => item.appointmentId === original?.id && item.salonId === salonId,
    );
    return owned?.contact ?? customer.profile;
  });
  const [error, setError] = useState("");
  const [result, setResult] = useState<OwnedBooking | null>(null);
  const [saving, setSaving] = useState(false);
  const service = source.services.find((item) => item.id === serviceId);
  const qualified = source.staff.filter(
    (item) => item.active && item.services.includes(serviceId),
  );
  const availability = useQuery({
    queryKey: ["availability", salonId, date, serviceId, staffId],
    queryFn: () => getAvailability(salonId, date, serviceId, staffId),
    enabled: Boolean(date && serviceId && staffId),
  });
  const slots = availability.data ?? [];
  const selectedSlot = slots.find((slot) => slot.time === time);
  const resolvedStaffId =
    staffId === "any" ? (selectedSlot?.staffIds[0] ?? "") : staffId;
  const member = source.staff.find((item) => item.id === resolvedStaffId);

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  if (customer.loading) {
    return (
      <motion.main
        className="customer-container narrow"
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
      >
        Loading booking details…
      </motion.main>
    );
  }
  if (!customer.authenticated) {
    return (
      <motion.main
        className="customer-container customer-login"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.section
          className="customer-panel customer-login-card"
          variants={sectionVariants}
        >
          <h1>Sign in to book</h1>
          <p className="customer-lead">
            Your account keeps confirmations and appointment changes in one
            place.
          </p>
          <Link
            className="customer-btn primary full"
            href={`/login?next=/${salonId}/appointment`}
          >
            Sign in to continue
          </Link>
          <Link className="customer-back-link" href={`/${salonId}`}>
            Back to the salon
          </Link>
        </motion.section>
      </motion.main>
    );
  }

  function next() {
    setError("");
    if (step === 0 && !serviceId)
      return setError("Choose a treatment to continue.");
    if (step === 1 && !staffId)
      return setError("Choose a specialist to continue.");
    if (step === 2 && (!date || !time))
      return setError("Choose an available date and time.");
    if (
      step === 3 &&
      (!contact.name.trim() ||
        !/^\S+@\S+\.\S+$/.test(contact.email) ||
        contact.phone.replace(/\D/g, "").length < 7)
    )
      return setError("Enter your name, a valid email, and phone number.");
    goToStep(Math.min(4, step + 1));
  }

  async function confirm() {
    if (!service || !resolvedStaffId || !time) return;
    setSaving(true);
    setError("");
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
          : "Your booking could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (result && service && member)
    return (
      <motion.main
        className="customer-container narrow"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="booking-complete-banner"
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
        >
          <Check size={20} />
          <div>
            <strong>Booking confirmed</strong>Reference {result.reference}
          </div>
        </motion.div>
        <motion.section
          className="customer-panel booking-success"
          variants={sectionVariants}
        >
          <motion.div
            className="customer-confirm-check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <Check size={30} />
          </motion.div>
          <motion.h1 variants={itemVariants}>
            {original ? "Your booking is updated" : "You're booked in"}
          </motion.h1>
          <motion.p variants={itemVariants}>
            A confirmation is on its way to your inbox. Reference{" "}
            <strong>{result.reference}</strong>
          </motion.p>
          <div className="booking-divider" />
          <motion.ul variants={listVariants} initial="hidden" animate="visible">
            {[
              [<CalendarDays key="c" />, `${dateLabel(date)}, ${timeLabel(time)}`],
              [<Clock3 key="cl" />, `${service.name} · ${duration(service.duration)} · ${money(service.price)}`],
              [<UserRound key="u" />, member.name],
              [<MapPin key="m" />, `${source.name} · ${source.address}`],
              [<Phone key="p" />, source.phone],
            ].map(([icon, text], i) => (
              <motion.li key={i} variants={itemVariants}>
                {icon}
                {text}
              </motion.li>
            ))}
          </motion.ul>
          <motion.div
            className="customer-actions"
            variants={sectionVariants}
          >
            <Link className="customer-btn primary" href="/account">
              See my bookings
            </Link>
            <Link className="customer-btn" href={`/${salonId}`}>
              Back to {source.name}
            </Link>
          </motion.div>
        </motion.section>
      </motion.main>
    );

  return (
    <motion.main
      className="customer-container narrow"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Progress steps */}
      <motion.div
        className="booking-steps"
        aria-label="Booking progress"
        variants={sectionVariants}
      >
        {labels.map((label, index) => (
          <div className="contents" key={label}>
            <button
              type="button"
              className={`${index === step ? "active" : ""} ${index < step ? "done" : ""}`}
              disabled={index > step}
              onClick={() => index < step && goToStep(index)}
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
      </motion.div>

      {/* Step content — slides left/right based on navigation direction */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants(direction)}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
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
                <motion.div variants={listVariants} initial="hidden" animate="visible">
                  {source.services
                    .filter((item) => item.active)
                    .map((item) => (
                      <motion.label
                        htmlFor={`service-${item.id}`}
                        className={`booking-choice ${serviceId === item.id ? "selected" : ""}`}
                        key={item.id}
                        variants={itemVariants}
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
                      </motion.label>
                    ))}
                </motion.div>
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
                  setTime("");
                }}
              >
                <motion.div variants={listVariants} initial="hidden" animate="visible">
                  <motion.label
                    htmlFor="specialist-any"
                    className={`booking-choice specialist-any ${staffId === "any" ? "selected" : ""}`}
                    variants={itemVariants}
                  >
                    <RadioGroupItem id="specialist-any" value="any" />
                    <span className="customer-avatar">
                      <UsersRound size={22} />
                    </span>
                    <div className="booking-choice-body">
                      <h3>Anyone available</h3>
                      <p>
                        We&apos;ll match you with a qualified specialist who is free at
                        your chosen time.
                      </p>
                    </div>
                  </motion.label>
                  {qualified.map((person) => (
                    <motion.label
                      htmlFor={`specialist-${person.id}`}
                      className={`booking-choice ${staffId === person.id ? "selected" : ""}`}
                      key={person.id}
                      variants={itemVariants}
                    >
                      <RadioGroupItem
                        id={`specialist-${person.id}`}
                        value={person.id}
                      />
                      <span className="customer-avatar">{initials(person.name)}</span>
                      <div className="booking-choice-body">
                        <h3>{person.name}</h3>
                        <p>
                          {person.role === "Staff"
                            ? "Beauty specialist"
                            : person.role}
                        </p>
                      </div>
                    </motion.label>
                  ))}
                </motion.div>
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
                  Only genuinely free slots are shown from the salon&apos;s working
                  diary.
                </p>
              </div>
              <motion.div
                className="booking-date-grid"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="customer-panel" variants={itemVariants}>
                  <Calendar
                    className="booking-calendar"
                    mode="single"
                    selected={new Date(date + "T12:00:00")}
                    defaultMonth={new Date(firstDate + "T12:00:00")}
                    disabled={{
                      before: new Date(firstDate + "T12:00:00"),
                    }}
                    onSelect={(value) => {
                      if (value) {
                        setDate(
                          `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`,
                        );
                        setTime("");
                      }
                    }}
                  />
                </motion.div>
                <motion.div className="customer-panel" variants={itemVariants}>
                  <h2>{dateLabel(date)}</h2>
                  {availability.isLoading ? (
                    <div className="customer-empty">Checking availability…</div>
                  ) : slots.length ? (
                    <RadioGroup
                      className="booking-time-grid"
                      value={time}
                      onValueChange={(value) => setTime(String(value))}
                    >
                      {slots.map((slot) => (
                        <label
                          htmlFor={`time-${slot.time.replace(":", "-")}`}
                          className={`time-choice ${time === slot.time ? "selected" : ""}`}
                          key={slot.time}
                        >
                          <RadioGroupItem
                            id={`time-${slot.time.replace(":", "-")}`}
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
                </motion.div>
              </motion.div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="booking-heading">
                <h1>Your details</h1>
                <p>No account needed. We use these details for this booking.</p>
              </div>
              <motion.div
                className="booking-form"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {[
                  {
                    label: "Full name",
                    type: "text",
                    autoComplete: "name",
                    value: contact.name,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      setContact({ ...contact, name: e.target.value }),
                    note: undefined,
                  },
                  {
                    label: "Email",
                    type: "email",
                    autoComplete: "email",
                    value: contact.email,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      setContact({ ...contact, email: e.target.value }),
                    note: "Your confirmation and reminder are sent here.",
                  },
                  {
                    label: "Phone",
                    type: "tel",
                    autoComplete: "tel",
                    value: contact.phone,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      setContact({ ...contact, phone: e.target.value }),
                    note: "Only used if the salon needs to reach you on the day.",
                  },
                ].map(({ label, type, autoComplete, value, onChange, note }) => (
                  <motion.label key={label} className="customer-field" variants={itemVariants}>
                    {label}
                    <input
                      required
                      type={type}
                      value={value}
                      autoComplete={autoComplete}
                      onChange={onChange}
                    />
                    {note && <small>{note}</small>}
                  </motion.label>
                ))}
                <motion.label className="customer-field" variants={itemVariants}>
                  Anything we should know?{" "}
                  <span className="font-normal muted">(optional)</span>
                  <textarea
                    value={contact.notes}
                    onChange={(event) =>
                      setContact({ ...contact, notes: event.target.value })
                    }
                    placeholder="Allergies, sensitivities, or what you'd like from the appointment."
                  />
                </motion.label>
              </motion.div>
            </>
          )}

          {step === 4 && service && member && (
            <>
              <div className="booking-heading">
                <h1>Check and confirm</h1>
                <p>One last look before we book it in.</p>
              </div>
              <motion.div
                className="booking-confirm-grid"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <div className="booking-notice">
                    <Info size={17} />
                    <span>
                      Nothing is charged now. You&apos;ll pay at the salon. Free to
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
                        ? "Confirming…"
                        : original
                          ? "Confirm new time"
                          : "Confirm booking"}
                    </button>
                    <button
                      className="customer-btn ghost"
                      onClick={() => goToStep(2)}
                    >
                      Change time
                    </button>
                  </div>
                </motion.div>
                <motion.aside
                  className="customer-panel booking-summary"
                  variants={itemVariants}
                >
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
                </motion.aside>
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="customer-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      {step < 4 && (
        <motion.div
          className="booking-nav"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <button
            className="customer-btn ghost"
            onClick={() =>
              step ? goToStep(step - 1) : router.push(`/${salonId}`)
            }
          >
            Back
          </button>
          <button
            className="customer-btn primary"
            onClick={next}
            disabled={
              (step === 1 && qualified.length === 0) ||
              (step === 2 && (availability.isLoading || slots.length === 0))
            }
          >
            Continue
          </button>
        </motion.div>
      )}
    </motion.main>
  );
}
