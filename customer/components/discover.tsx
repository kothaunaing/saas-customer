'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, MapPin, Star } from 'lucide-react';
import { salons, salonIds, sampleReviews } from '@/customer/lib/customer-data';
export default function Discover() {
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
        {salonIds.map((id) => {
          const s = salons[id];
          const reviews = sampleReviews.filter((r) => r.salonId === id);
          return (
            <Link href={`/${id}`} className="salon-card" key={id}>
              <div className="salon-card-image">
                <Image
                  src={s.image}
                  alt={
                    id === 'serenity'
                      ? 'A peaceful spa setting with soft towels and flowers'
                      : 'A welcoming salon with styling chairs and mirrors'
                  }
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                  priority
                />
                <span className="salon-image-label">
                  {id === 'serenity' ? 'SPA & WELLNESS' : 'HAIR & BEAUTY'}
                </span>
              </div>
              <div className="salon-card-body">
                <div className="customer-between">
                  <h2>{s.name}</h2>
                  <ArrowUpRight size={18} />
                </div>
                <p>{s.tagline}</p>
                <div className="customer-meta">
                  {reviews.length > 0 && (
                    <span className="customer-rating">
                      <Star size={14} fill="currentColor" />
                      4.8 <small>({reviews.length} reviews)</small>
                    </span>
                  )}
                  <span>
                    <MapPin size={14} />
                    Yangon
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
