"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Star,
  Check,
  Clock3,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  treatmentImage,
  staffSpecialty,
  dateLabel,
  timeLabel,
  type SalonId,
} from "@/customer/lib/domain";
import { initials, duration, money } from "@/customer/lib/domain";
import { useCustomer } from "./provider";
import {
  pageVariants,
  sectionVariants,
  listVariants,
  itemVariants,
  heroContentVariants,
  heroChildVariants,
  fadeVariants,
} from "@/customer/lib/motion";

export function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <span className="customer-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          fill={n <= Math.round(rating) ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}
export default function SalonPage({ salonId }: { salonId: SalonId }) {
  const customer = useCustomer();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("All");
  const catalog = customer.catalog(salonId);
  const services = catalog.services.filter((s) => s.active);
  const reviews = customer.reviews.filter((r) => r.salonId === salonId);
  const average = reviews.length
    ? reviews.reduce((v, r) => v + r.rating, 0) / reviews.length
    : 0;
  const name = catalog.name ?? "Salon";
  function book(serviceId?: string, staffId?: string) {
    const selectedService =
      serviceId ??
      (staffId
        ? catalog.services.find((item) =>
            catalog.staff
              .find((person) => person.id === staffId)
              ?.services.includes(item.id),
          )?.id
        : undefined);
    customer.setDraft({ salonId, serviceId: selectedService, staffId });
    router.push(`/${salonId}/appointment`);
  }
  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <motion.nav
          className="customer-tabs"
          aria-label="Salon sections"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <TabsList>
            {[
              ["overview", "Overview"],
              ["treatments", "Treatments"],
              ["team", "Our team"],
              ["reviews", "Reviews"],
            ].map(([value, label]) => (
              <TabsTrigger value={value} key={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </motion.nav>

        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <TabsContent value="overview" key="overview">
              <motion.div
                key="overview-content"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <section className="salon-hero">
                  <Image
                    src={catalog.imageUrl || "/images/spa.jpg"}
                    alt="A welcoming setting for your next moment of care"
                    fill
                    sizes="100vw"
                    priority
                  />
                  <motion.div
                    className="salon-hero-content"
                    variants={heroContentVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.h1 variants={heroChildVariants}>{name}</motion.h1>
                    <motion.p variants={heroChildVariants}>{catalog.tagline}</motion.p>
                    <motion.div className="customer-meta" variants={heroChildVariants}>
                      {reviews.length > 0 && (
                        <button
                          className="flex items-center gap-2"
                          onClick={() => setTab("reviews")}
                        >
                          <Stars rating={average} />
                          <span>
                            {average.toFixed(1)} · {reviews.length} reviews
                          </span>
                        </button>
                      )}
                      <span>
                        <MapPin size={16} />
                        {catalog.address}
                      </span>
                    </motion.div>
                  </motion.div>
                </section>
                <div className="customer-container pt-0!">
                  <motion.div
                    className="customer-actions"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <button className="customer-btn primary" onClick={() => book()}>
                      Book an appointment
                      <ArrowRight size={15} />
                    </button>
                    <button
                      className="customer-btn"
                      onClick={() => setTab("treatments")}
                    >
                      See treatments
                    </button>
                  </motion.div>
                  <motion.div
                    className="salon-overview-grid"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="customer-panel" variants={itemVariants}>
                      <h2>About {name}</h2>
                      <p>{catalog.description}</p>
                      <div className="salon-amenities">
                        {(catalog.amenities ?? []).map((a) => (
                          <span key={a}>
                            <Check />
                            {a}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                    <motion.div className="customer-panel" variants={itemVariants}>
                      <h2>Opening hours</h2>
                      <div className="salon-hours">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (day, i) => {
                            const shifts = catalog.staff
                              .filter((t) => t.active)
                              .map((t) => t.hours[i])
                              .filter((h) => h.enabled);
                            return (
                              <div key={day}>
                                <span>{day}</span>
                                <strong className="font-normal">
                                  {shifts.length
                                    ? `${timeLabel(shifts.map((h) => h.start).sort()[0])} – ${timeLabel(
                                        shifts
                                          .map((h) => h.end)
                                          .sort()
                                          .at(-1)!,
                                      )}`
                                    : "Closed"}
                                </strong>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>
          )}

          {tab === "treatments" && (
            <TabsContent value="treatments" key="treatments">
              <motion.main
                key="treatments-content"
                className="customer-container"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div variants={sectionVariants}>
                  <h1 className="text-[26px]!">Treatments</h1>
                  <p className="customer-lead">
                    Every price includes consultation time. Pick anything to start a
                    booking.
                  </p>
                </motion.div>
                <Tabs
                  value={filter}
                  onValueChange={(v) => setFilter(String(v))}
                  className="treatment-filters"
                >
                  <TabsList>
                    {["All", ...new Set(services.map((s) => s.category))].map(
                      (c) => (
                        <TabsTrigger value={c} key={c}>
                          {c}
                        </TabsTrigger>
                      ),
                    )}
                  </TabsList>
                </Tabs>
                <motion.div
                  className="treatment-grid"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {services
                    .filter((s) => filter === "All" || s.category === filter)
                    .map((service, i) => (
                      <motion.article
                        className="treatment-card"
                        key={service.id}
                        variants={itemVariants}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      >
                        <div className="treatment-photo">
                          <Image
                            src={treatmentImage(service.category)}
                            alt={`${service.category} treatment setting`}
                            fill
                            sizes="(max-width: 700px) 100vw, 33vw"
                          />
                          {i < 3 && <span>Popular</span>}
                        </div>
                        <div className="treatment-body">
                          <div className="customer-between">
                            <h3>{service.name}</h3>
                            <strong>{money(service.price)}</strong>
                          </div>
                          <p>{service.description}</p>
                          <div className="customer-meta">
                            <span>
                              <Clock3 size={14} />
                              {duration(service.duration)}
                            </span>
                            <span className="customer-category">
                              {service.category}
                            </span>
                          </div>
                          <button
                            className="customer-btn primary full"
                            onClick={() => book(service.id)}
                          >
                            Book this
                          </button>
                        </div>
                      </motion.article>
                    ))}
                </motion.div>
                {services.length === 0 && (
                  <div className="customer-empty">
                    No treatments are currently available for booking.
                  </div>
                )}
              </motion.main>
            </TabsContent>
          )}

          {tab === "team" && (
            <TabsContent value="team" key="team">
              <motion.main
                key="team-content"
                className="customer-container"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div variants={sectionVariants}>
                  <h1 className="text-[26px]!">Our team</h1>
                  <p className="customer-lead">
                    Book with whoever you like, or let us match you to whoever&apos;s free.
                  </p>
                </motion.div>
                <motion.div
                  className="customer-team-grid"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {catalog.staff
                    .filter((t) => t.active)
                    .map((t) => {
                      const specialty = staffSpecialty(t.role);
                      const ratings = reviews.filter((r) => r.staff === t.name);
                      return (
                        <motion.article
                          className="customer-panel customer-team-card"
                          key={t.id}
                          variants={itemVariants}
                          whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        >
                          <div className="customer-person">
                            <span className="customer-avatar">
                              {initials(t.name)}
                            </span>
                            <div>
                              <h3>{t.name}</h3>
                              <p>{specialty}</p>
                            </div>
                          </div>
                          {ratings.length > 0 && (
                            <div className="customer-meta">
                              <Stars />
                              <span>
                                {(
                                  ratings.reduce((s, r) => s + r.rating, 0) /
                                  ratings.length
                                ).toFixed(1)}{" "}
                                · {ratings.length} reviews
                              </span>
                            </div>
                          )}
                          <button
                            className="customer-btn"
                            onClick={() => book(undefined, t.id)}
                          >
                            Book with {t.name.split(" ")[0]}
                            <ArrowRight size={13} />
                          </button>
                        </motion.article>
                      );
                    })}
                </motion.div>
              </motion.main>
            </TabsContent>
          )}

          {tab === "reviews" && (
            <TabsContent value="reviews" key="reviews">
              <motion.main
                key="reviews-content"
                className="customer-container narrow"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div variants={sectionVariants}>
                  <h1 className="text-[26px]!">Reviews</h1>
                  <p className="customer-lead">
                    Left by customers after a completed appointment.
                  </p>
                </motion.div>
                {reviews.length > 0 ? (
                  <>
                    <motion.div
                      className="customer-panel customer-review-summary"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <div>
                        <strong>{average.toFixed(1)}</strong>
                        <Stars rating={average} />
                        <small>{reviews.length} reviews</small>
                      </div>
                      <div>
                        {[5, 4, 3, 2, 1].map((n) => {
                          const count = reviews.filter(
                            (r) => r.rating === n,
                          ).length;
                          return (
                            <div className="review-meter" key={n}>
                              <span>{n}</span>
                              <Progress
                                aria-label={`${n} star reviews`}
                                value={(count / reviews.length) * 100}
                              />
                              <span>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                    <motion.div
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {[...reviews].reverse().map((r) => (
                        <motion.article
                          className="customer-panel customer-review"
                          key={r.id}
                          variants={itemVariants}
                        >
                          <div className="customer-between">
                            <div className="customer-person">
                              <span className="customer-avatar">
                                {initials(r.name)}
                              </span>
                              <div>
                                <h3>{r.name}</h3>
                                <small>
                                  {r.service} with {r.staff} · {dateLabel(r.date)}
                                </small>
                              </div>
                            </div>
                            <Stars rating={r.rating} />
                          </div>
                          <p>{r.text}</p>
                        </motion.article>
                      ))}
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    className="customer-panel customer-empty mt-7"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Star size={28} />
                    <h3>A fresh chapter</h3>
                    <p>No reviews yet. Your experience could be the first.</p>
                  </motion.div>
                )}
              </motion.main>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
      <motion.div
        className="customer-container py-0! pb-7!"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Link href="/" className="customer-back-link">
          <ArrowLeft size={14} />
          All salons
        </Link>
      </motion.div>
    </>
  );
}
