import type { Service, Staff } from "@/customer/lib/demo-data";
import { workingHours } from "@/customer/lib/demo-data";
export const CUSTOMER_DEMO_NOW = new Date().toISOString();
export const CUSTOMER_FIRST_DATE = new Date().toLocaleDateString("en-CA");
export const salonIds = ["serenity", "lotus"] as const;
export type SalonId = (typeof salonIds)[number];
export const salons = {
  serenity: {
    id: "serenity",
    name: "Serenity Spa & Salon",
    tagline: "Unhurried treatments in the middle of the city",
    address: "42 Inya Road, Kamayut, Yangon",
    phone: "+95 9 250 111 000",
    description:
      "A quiet six-room studio where every appointment gets its own room, its own playlist, and time to breathe. Our experienced therapists take care of the little details, so you can settle in and switch off.",
    amenities: [
      "Free parking",
      "Herbal tea bar",
      "Private rooms",
      "Card & mobile payment",
    ],
    image: "/images/spa.jpg",
  },
  lotus: {
    id: "lotus",
    name: "Lotus Beauty Lounge",
    tagline: "Colour specialists and a very good cup of coffee",
    address: "18 University Avenue, Bahan, Yangon",
    phone: "+95 9 420 555 880",
    description:
      "A light-filled neighbourhood salon for fresh cuts, thoughtful colour, and a little time to yourself. Talk through your ideas with our stylists and leave feeling like you.",
    amenities: [
      "Complimentary coffee",
      "Colour consultation",
      "Free Wi-Fi",
      "Card & mobile payment",
    ],
    image: "/images/salon.jpg",
  },
};
export const lotusServices: Service[] = [
  {
    id: "l-s1",
    name: "Signature Cut & Style",
    category: "Hair",
    duration: 60,
    price: 45,
    active: true,
    description: "A tailored cut, a relaxing wash, and an effortless finish.",
  },
  {
    id: "l-s2",
    name: "Balayage & Gloss",
    category: "Hair",
    duration: 150,
    price: 220,
    active: true,
    description:
      "Hand-painted lightening, a toning gloss, and a finishing blow-dry.",
  },
  {
    id: "l-s3",
    name: "Gel Manicure",
    category: "Nails",
    duration: 45,
    price: 32,
    active: true,
    description:
      "Precise shaping and long-lasting colour, finished with cuticle care.",
  },
];
export const lotusStaff: Staff[] = [
  {
    id: "l-t1",
    name: "Nilar Win",
    email: "nilar@lotus.example",
    phone: "",
    role: "Master stylist",
    active: true,
    services: ["l-s1", "l-s2"],
    hours: workingHours(),
  },
  {
    id: "l-t2",
    name: "Su Su Hlaing",
    email: "su@lotus.example",
    phone: "",
    role: "Nail artist",
    active: true,
    services: ["l-s3"],
    hours: workingHours(),
  },
];
export type CustomerReview = {
  id: string;
  salonId: SalonId;
  bookingId?: string;
  name: string;
  service: string;
  staff: string;
  rating: number;
  text: string;
  date: string;
};
export const sampleReviews: CustomerReview[] = [
  {
    id: "review1",
    salonId: "serenity",
    name: "Ei Phyu",
    service: "Hydrating Facial",
    staff: "Hnin Wai",
    rating: 5,
    text: "Hnin Wai actually looked at my skin instead of running a script. My skin felt calm and hydrated afterwards.",
    date: "2026-07-30",
  },
  {
    id: "review2",
    salonId: "serenity",
    name: "Zaw Min",
    service: "Aromatherapy Massage",
    staff: "Su Latt",
    rating: 5,
    text: "A quiet room, thoughtful care, and exactly the reset I needed.",
    date: "2026-07-24",
  },
  {
    id: "review3",
    salonId: "serenity",
    name: "May Yu Kyaw",
    service: "Signature Cut & Style",
    staff: "Nandar Aye",
    rating: 5,
    text: "Listened to what I wanted and made it easy to style at home. I will be back.",
    date: "2026-07-20",
  },
  {
    id: "review4",
    salonId: "serenity",
    name: "Thandar Kyaw",
    service: "Gel Manicure",
    staff: "May Zin",
    rating: 4,
    text: "Lovely colour selection and careful work. A very welcoming team.",
    date: "2026-07-15",
  },
  {
    id: "review5",
    salonId: "serenity",
    name: "Su Myat Noe",
    service: "Body Scrub & Wrap",
    staff: "Su Latt",
    rating: 5,
    text: "My favourite place to slow down. The herbal tea afterwards is a lovely touch.",
    date: "2026-07-10",
  },
  {
    id: "review6",
    salonId: "serenity",
    name: "Nilar Soe",
    service: "Hydrating Facial",
    staff: "Hnin Wai",
    rating: 5,
    text: "Everything was explained clearly and the treatment felt personal.",
    date: "2026-07-05",
  },
  {
    id: "review7",
    salonId: "serenity",
    name: "Phyu Phyu Win",
    service: "Hair Color & Treatment",
    staff: "Nandar Aye",
    rating: 5,
    text: "The colour is exactly what I hoped for. Thank you for taking your time.",
    date: "2026-06-29",
  },
  {
    id: "review8",
    salonId: "serenity",
    name: "Aung Kyaw Moe",
    service: "Aromatherapy Massage",
    staff: "Su Latt",
    rating: 4,
    text: "Professional, friendly, and a comfortable space.",
    date: "2026-06-24",
  },
];
export const treatmentImage = (category: string) =>
  category === "Hair" || category === "Nails"
    ? "/images/salon.jpg"
    : category === "Massage" || category === "Body"
      ? "/images/treatment.jpg"
      : "/images/spa.jpg";
export const staffBio = (name: string, services: string[]) => ({
  title: services.includes("s1")
    ? "Skin & facial specialist"
    : services.includes("s5")
      ? "Massage therapist"
      : services.includes("s4")
        ? "Stylist & colour specialist"
        : "Beauty specialist",
  text: `${name} brings a thoughtful, personal approach to every visit. Talk through what you need, then settle in for a treatment tailored to you.`,
});
export function dateLabel(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
export function timeLabel(value: string) {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
