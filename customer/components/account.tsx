"use client";
/* oxlint-disable react/react-compiler -- synchronizes an editable draft with asynchronously loaded account data */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  Gift,
  MapPin,
  Pencil,
  Star,
  UserRound,
  Bell,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { canCustomerManage } from "@/customer/lib/booking";
import { dateLabel, timeLabel } from "@/customer/lib/domain";
import { duration } from "@/customer/lib/domain";
import type { Reward } from "@/customer/lib/api";
import { getCustomerNotifications } from "@/customer/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useCustomer, type Contact, type OwnedBooking } from "./provider";
import {
  pageVariants,
  sectionVariants,
  listVariants,
  itemVariants,
  bannerVariants,
  fadeVariants,
} from "@/customer/lib/motion";

export default function AccountPage() {
  const customer = useCustomer();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam &&
      ["bookings", "rewards", "notifications", "profile"].includes(tabParam)
      ? tabParam
      : "bookings",
  );
  const [cancelTarget, setCancelTarget] = useState<OwnedBooking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<OwnedBooking | null>(null);
  const [redeemReward, setRedeemReward] = useState<Reward | null>(null);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [profile, setProfile] = useState<Contact>(customer.profile);
  const [profileError, setProfileError] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [saving, setSaving] = useState(false);
  const points = customer.points;
  const notifications = useQuery({
    queryKey: ["customer-notifications"],
    queryFn: getCustomerNotifications,
    enabled: customer.authenticated,
  });
  useEffect(() => setProfile(customer.profile), [customer.profile]);
  useEffect(() => {
    if (
      tabParam &&
      ["bookings", "rewards", "notifications", "profile"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  if (customer.loading) {
    return (
      <motion.main
        className="customer-container narrow"
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
      >
        Loading your account…
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
          <h1>Sign in to your account</h1>
          <p className="customer-lead">
            View appointments, rewards, and profile details securely.
          </p>
          <Link
            className="customer-btn primary full"
            href="/login?next=/account"
          >
            Sign in
          </Link>
        </motion.section>
      </motion.main>
    );
  }

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
      !["Completed", "Cancelled", "No-show"].includes(
        record.appointment!.status,
      ),
  );
  const past = records.filter((record) =>
    ["Completed", "Cancelled", "No-show"].includes(record.appointment!.status),
  );

  function reschedule(owned: OwnedBooking) {
    const appointment = details(owned).appointment;
    if (
      !appointment ||
      !canCustomerManage(appointment, new Date().toISOString())
    )
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
    setDialogError("");
    try {
      await customer.cancel(cancelTarget);
      setCancelTarget(null);
    } catch (cause) {
      setDialogError(
        cause instanceof Error
          ? cause.message
          : "The booking could not be cancelled.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function sendReview() {
    if (!reviewTarget) return;
    setDialogError("");
    try {
      await customer.addReview(reviewTarget, rating, review);
      setReviewTarget(null);
      setReview("");
      setRating(5);
    } catch (cause) {
      setDialogError(
        cause instanceof Error
          ? cause.message
          : "The review could not be saved.",
      );
    }
  }

  async function saveProfile(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError("");
    if (
      !profile.name.trim() ||
      !/^\S+@\S+\.\S+$/.test(profile.email) ||
      profile.phone.replace(/\D/g, "").length < 7
    ) {
      setProfileError("Enter your name, a valid email, and phone number.");
      return;
    }
    setSaving(true);
    try {
      await customer.setProfile(profile);
    } catch {
      setProfileError("Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function BookingCard({ record }: { record: (typeof records)[number] }) {
    const appointment = record.appointment!;
    const service = record.service!;
    const staff = record.staff!;
    const manageable = canCustomerManage(appointment, new Date().toISOString());
    const reviewed = customer.reviews.some(
      (item) =>
        item.bookingId === appointment.id &&
        item.salonId === record.owned.salonId,
    );
    return (
      <motion.article
        className="customer-panel account-booking"
        variants={itemVariants}
        layout
      >
        <div className="customer-between">
          <div>
            <h3>{service.name}</h3>
            <p className="customer-lead mt-1!">{record.source.name}</p>
          </div>
          <span
            className={`customer-status ${appointment.status === "Cancelled" ? "cancelled" : ""}`}
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
          {record.source.address}
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
                setDialogError("");
                setCancelTarget(record.owned);
              }}
            >
              Cancel booking
            </button>
          )}
          {appointment.status === "Completed" && !reviewed && (
            <button
              className="customer-btn"
              onClick={() => {
                setDialogError("");
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
      </motion.article>
    );
  }

  return (
    <motion.main
      className="customer-container narrow"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="account-heading" variants={sectionVariants}>
        <h1>My account</h1>
        <p>Your bookings, rewards, and details in one quiet place.</p>
      </motion.div>
      <motion.div variants={sectionVariants}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="account-tabs"
        >
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {activeTab === "bookings" && (
              <TabsContent value="bookings" key="bookings">
                <motion.div
                  key="bookings-content"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <section className="customer-account-section">
                    <div className="customer-between">
                      <h2>Upcoming</h2>
                      <Link className="customer-btn primary" href="/">
                        Book something new
                      </Link>
                    </div>
                    <motion.div
                      className="customer-account-list"
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {upcoming.length ? (
                        upcoming.map((record) => (
                          <BookingCard
                            key={`${record.owned.salonId}-${record.owned.appointmentId}`}
                            record={record}
                          />
                        ))
                      ) : (
                        <motion.div
                          className="customer-panel customer-empty"
                          variants={itemVariants}
                        >
                          <CalendarDays size={28} />
                          <h3>Your calendar is clear</h3>
                          <p>Choose a salon and find your next moment of care.</p>
                        </motion.div>
                      )}
                    </motion.div>
                  </section>
                  <section className="customer-account-section mt-10">
                    <h2>Past visits</h2>
                    <motion.div
                      className="customer-account-list"
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {past.length ? (
                        past.map((record) => (
                          <BookingCard
                            key={`${record.owned.salonId}-${record.owned.appointmentId}`}
                            record={record}
                          />
                        ))
                      ) : (
                        <motion.div
                          className="customer-panel customer-empty"
                          variants={itemVariants}
                        >
                          No past visits yet.
                        </motion.div>
                      )}
                    </motion.div>
                  </section>
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "rewards" && (
              <TabsContent value="rewards" key="rewards">
                <motion.section
                  key="rewards-content"
                  id="rewards"
                  className="customer-account-section"
                  variants={pageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div className="customer-panel" variants={itemVariants}>
                    <div className="customer-between">
                      <div>
                        <h2>Loyalty points</h2>
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
                  </motion.div>
                  <motion.div
                    className="account-reward-grid"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {customer.rewards.map((reward) => (
                      <motion.article
                        className="customer-panel"
                        key={reward.name}
                        variants={itemVariants}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      >
                        <Gift className="pink" />
                        <h3>{reward.name}</h3>
                        <p>{reward.points.toLocaleString()} points</p>
                        <button
                          type="button"
                          className="customer-btn full"
                          disabled={reward.balance < reward.points}
                          onClick={() => {
                            setRedeemReward(reward);
                            setCopied(false);
                          }}
                        >
                          {reward.balance >= reward.points
                            ? "Redeem at the salon"
                            : `${(reward.points - reward.balance).toLocaleString()} more points`}
                        </button>
                      </motion.article>
                    ))}
                  </motion.div>
                  <p className="customer-profile-note">
                    Rewards are redeemed with the salon during your visit.
                  </p>
                </motion.section>
              </TabsContent>
            )}

            {activeTab === "notifications" && (
              <TabsContent value="notifications" key="notifications">
                <motion.section
                  key="notifications-content"
                  className="customer-panel"
                  variants={pageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2>Notifications</h2>
                  {notifications.isLoading && <p>Loading notifications…</p>}
                  {notifications.isError && (
                    <p>Notifications could not be loaded.</p>
                  )}
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {notifications.data?.map((item) => (
                      <motion.article
                        className="account-booking"
                        key={item.id}
                        variants={itemVariants}
                      >
                        <div className="customer-between">
                          <strong>{item.kind.replaceAll("_", " ")}</strong>
                          <span className="customer-status">{item.status}</span>
                        </div>
                        <div className="customer-meta">
                          <span>
                            <Bell size={15} />
                            {item.channel}
                          </span>
                          <span>{item.appointment.tenant.name}</span>
                          <span>{item.appointment.service.name}</span>
                          <span>{new Date(item.scheduledFor).toLocaleString()}</span>
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>
                  {!notifications.isLoading && !notifications.data?.length && (
                    <p>No notifications yet.</p>
                  )}
                </motion.section>
              </TabsContent>
            )}

            {activeTab === "profile" && (
              <TabsContent value="profile" key="profile">
                <motion.section
                  key="profile-content"
                  id="profile"
                  className="customer-account-section customer-account-grid"
                  variants={pageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.form
                    className="customer-panel customer-profile-form"
                    onSubmit={saveProfile}
                    variants={itemVariants}
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
                      <motion.p
                        className="customer-error"
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {profileError}
                      </motion.p>
                    )}
                    <button className="customer-btn primary" disabled={saving}>
                      {saving ? "Saving…" : "Save profile"}
                    </button>
                  </motion.form>
                  <motion.aside className="customer-panel" variants={itemVariants}>
                    <h2>Your customer account</h2>
                    <p>
                      Your bookings, profile, reviews, and reward balance are loaded
                      securely from the booking service.
                    </p>
                    <div className="booking-divider" />
                    <p>
                      Contact the salon if you need help within 24 hours of a visit.
                    </p>
                  </motion.aside>
                </motion.section>
              </TabsContent>
            )}
          </AnimatePresence>
        </Tabs>
      </motion.div>

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent className="customer-dialog dark">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              You can cancel online until 24 hours before the appointment. This
              updates your appointment immediately.
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
              {saving ? "Cancelling…" : "Cancel booking"}
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
              Your review will appear on the salon&apos;s Reviews tab session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="review-stars-input" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-label={`${value} stars`}
                className={value <= rating ? "selected" : ""}
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

      <AlertDialog
        open={!!redeemReward}
        onOpenChange={(open) => !open && setRedeemReward(null)}
      >
        <AlertDialogContent className="customer-dialog dark">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Gift className="text-[#fa3079]" size={20} />
              Redeem {redeemReward?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Use your accumulated loyalty points for this reward during your
              salon visit.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <motion.div
            style={{
              background: "#1c1917",
              border: "1px solid #332d29",
              borderRadius: "10px",
              padding: "16px",
              margin: "14px 0",
              textAlign: "center",
            }}
            variants={bannerVariants}
            initial="hidden"
            animate="visible"
          >
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#a8a29e",
              }}
            >
              Your Redemption Voucher Pass
            </span>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                letterSpacing: "0.1em",
                color: "#fa3079",
                margin: "8px 0",
                fontFamily: "monospace",
              }}
            >
              {`SERENITY-${redeemReward?.points ?? 100}PTS-${
                redeemReward?.id
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .slice(0, 6)
                  .toUpperCase() || "PASS"
              }`}
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#d6d3d1",
                margin: "4px 0 12px",
              }}
            >
              Present this code at reception during checkout.{" "}
              {redeemReward?.points} points will be deducted from your visit
              bill.
            </p>
            <button
              type="button"
              className="customer-btn"
              style={{
                margin: "0 auto",
                fontSize: "12px",
                padding: "6px 14px",
              }}
              onClick={() => {
                const code = `SERENITY-${redeemReward?.points ?? 100}PTS-${
                  redeemReward?.id
                    .replace(/[^a-zA-Z0-9]/g, "")
                    .slice(0, 6)
                    .toUpperCase() || "PASS"
                }`;
                void navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
            >
              {copied ? "✓ Code Copied to Clipboard!" : "Copy Voucher Code"}
            </button>
          </motion.div>

          <AlertDialogFooter>
            <AlertDialogCancel className="customer-btn">Done</AlertDialogCancel>
            <AlertDialogAction
              className="customer-btn primary"
              onClick={() => {
                setRedeemReward(null);
                router.push("/");
              }}
            >
              Book an appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.main>
  );
}
