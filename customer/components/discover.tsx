"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getSalons } from "@/customer/lib/api";
import {
  pageVariants,
  sectionVariants,
  listVariants,
  itemVariants,
} from "@/customer/lib/motion";

export default function Discover() {
  const query = useQuery({ queryKey: ["salon-list"], queryFn: getSalons });
  const rows = query.data ?? [];
  return (
    <motion.main
      className="customer-container discover"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="customer-intro" variants={sectionVariants}>
        <div className="customer-eyebrow">A little time, just for you</div>
        <h1>Book your next appointment</h1>
        <p>
          Find your place to unwind. Pick a treatment, choose your specialist,
          <br className="desktop-break" /> and make a little space for yourself.
        </p>
      </motion.div>
      <motion.div
        className="customer-section-heading"
        variants={sectionVariants}
      >
        <h2>Salons taking bookings</h2>
        <span>Available locations</span>
      </motion.div>
      <motion.div
        className="salon-grid"
        variants={listVariants}
        initial="hidden"
        animate="visible"
      >
        {rows.map((salon) => {
          const id = salon.slug;
          return (
            <motion.div key={id} variants={itemVariants}>
              <Link href={`/${id}`} className="salon-card">
                <div className="salon-card-image">
                  <Image
                    src={salon.imageUrl || "/images/spa.jpg"}
                    alt={`${salon.name} location`}
                    fill
                    sizes="(max-width: 700px) 100vw, 50vw"
                    priority
                  />
                  <span className="salon-image-label">
                    {salon.serviceCount} SERVICES
                  </span>
                </div>
                <div className="salon-card-body">
                  <div className="customer-between">
                    <h2>{salon.name}</h2>
                    <ArrowUpRight size={18} />
                  </div>
                  <p>{salon.tagline}</p>
                  <div className="customer-meta">
                    {salon.reviewCount > 0 && (
                      <span className="customer-rating">
                        <Star size={14} fill="currentColor" />
                        {(salon.rating ?? 5).toFixed(1)}{" "}
                        <small>({salon.reviewCount} reviews)</small>
                      </span>
                    )}
                    <span>
                      <MapPin size={14} />
                      {salon.city ??
                        salon.address ??
                        "Location available on request"}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
      {query.isLoading && <p className="customer-empty">Loading salons…</p>}
      {query.isError && (
        <p className="customer-empty">Salons could not be loaded.</p>
      )}
      <motion.p className="discovery-note" variants={sectionVariants}>
        Thoughtful treatments. Lovely people. Nothing to pay until your visit.
      </motion.p>
    </motion.main>
  );
}
