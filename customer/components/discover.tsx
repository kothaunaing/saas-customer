"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSalons } from "@/customer/lib/api";
import { salons, salonIds, sampleReviews } from "@/customer/lib/customer-data";
export default function Discover() {
  const query = useQuery({ queryKey: ["salon-list"], queryFn: getSalons });
  const rows =
    query.data ??
    salonIds.map((slug) => ({
      slug,
      name: salons[slug].name,
      tagline: salons[slug].tagline,
      address: salons[slug].address,
      city: "Yangon",
      imageUrl: salons[slug].image,
      reviewCount: sampleReviews.filter((review) => review.salonId === slug)
        .length,
      serviceCount: 0,
      rating: null,
    }));
  return (
    <main className="customer-container discover">
      <div className="customer-intro">
        <div className="customer-eyebrow">A little time, just for you</div>
        <h1>Book your next appointment</h1>
        <p>
          Find your place to unwind. Pick a treatment, choose your specialist,
          <br className="desktop-break" /> and make a little space for yourself.
        </p>
      </div>
      <div className="customer-section-heading">
        <h2>Salons taking bookings</h2>
        <span>Yangon, Myanmar</span>
      </div>
      <div className="salon-grid">
        {rows.map((salon) => {
          const id = salon.slug;
          const fallback = salons[id];
          return (
            <Link href={`/${id}`} className="salon-card" key={id}>
              <div className="salon-card-image">
                <Image
                  src={salon.imageUrl || fallback.image}
                  alt={
                    id === "serenity"
                      ? "A peaceful spa setting with soft towels and flowers"
                      : "A welcoming salon with styling chairs and mirrors"
                  }
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                  priority
                />
                <span className="salon-image-label">
                  {id === "serenity" ? "SPA & WELLNESS" : "HAIR & BEAUTY"}
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
                    {salon.city ?? "Yangon"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="discovery-note">
        Thoughtful treatments. Lovely people. Nothing to pay until your visit.
      </p>
    </main>
  );
}
