export type SalonId = string;
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
export type Service = {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  active: boolean;
  description: string;
};
export type WorkDay = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
  breaks: { start: string; end: string }[];
};
export type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  services: string[];
  hours: WorkDay[];
};
export type Appointment = {
  id: string;
  startsAt?: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  status: string;
  notes: string;
};
export const firstBookableDate = () => new Date().toLocaleDateString("en-CA");
export const treatmentImage = (category: string) =>
  category === "Hair" || category === "Nails"
    ? "/images/salon.jpg"
    : category === "Massage" || category === "Body"
      ? "/images/treatment.jpg"
      : "/images/spa.jpg";
export const staffSpecialty = (role: string) => role || "Beauty specialist";
export function dateLabel(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
export function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}
export const money = (value: number, currency = "MMK") =>
  currency === "MMK"
    ? `Ks ${new Intl.NumberFormat("en-MM").format(value)}`
    : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
export const duration = (mins: number) =>
  `${Math.floor(mins / 60) ? `${Math.floor(mins / 60)} hr` : ""}${mins % 60 ? ` ${mins % 60} min` : ""}`.trim();
