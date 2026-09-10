import type { Appointment, Staff, Service } from './demo-data';
export const minutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
export function bookingError(
  booking: Appointment,
  appointments: Appointment[],
  team: Staff[],
  services: Service[],
): string | null {
  const member = team.find((s) => s.id === booking.staffId),
    service = services.find((s) => s.id === booking.serviceId);
  if (
    !member ||
    !service ||
    !booking.customerId ||
    !booking.date ||
    !booking.time
  )
    return 'Choose a customer, service, team member, date, and time.';
  if (['Cancelled', 'No-show', 'Completed'].includes(booking.status))
    return null;
  if (!member.active) return 'This team member is inactive.';
  if (!service.active) return 'This service is currently unavailable.';
  if (!member.services.includes(service.id))
    return 'Choose a team member qualified for this service.';
  const day = member.hours[new Date(booking.date + 'T12:00:00').getDay()];
  const start = minutes(booking.time),
    end = start + service.duration;
  if (!day.enabled || start < minutes(day.start) || end > minutes(day.end))
    return `${member.name} is not available during these hours.`;
  if (day.breaks.some((b) => start < minutes(b.end) && end > minutes(b.start)))
    return 'This appointment overlaps a staff break.';
  const overlap = appointments.find(
    (a) =>
      a.id !== booking.id &&
      a.staffId === booking.staffId &&
      a.date === booking.date &&
      !['Cancelled', 'No-show'].includes(a.status) &&
      start <
        minutes(a.time) +
          (services.find((s) => s.id === a.serviceId)?.duration ?? 60) &&
      end > minutes(a.time),
  );
  return overlap
    ? 'This team member already has an appointment at that time. Please choose another slot.'
    : null;
}
export function hoursError(hours: Staff['hours']) {
  for (const day of hours) {
    if (!day.enabled) continue;
    if (day.start >= day.end)
      return `${day.day}: closing time must be after opening time.`;
    for (const b of day.breaks) {
      if (b.start >= b.end || b.start < day.start || b.end > day.end)
        return `${day.day}: breaks must fit inside working hours.`;
    }
    const sorted = [...day.breaks].sort((a, b) =>
      a.start.localeCompare(b.start),
    );
    if (sorted.some((b, i) => i > 0 && b.start < sorted[i - 1].end))
      return `${day.day}: breaks cannot overlap.`;
  }
  return null;
}

// The customer booking flow uses the same scheduling rules as the tenant editor.
export function availableSlots(
  date: string,
  serviceId: string,
  staffId: string,
  appointments: Appointment[],
  team: Staff[],
  services: Service[],
  now: string,
  excludeId = '',
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(`${date}T12:00:00`))
  )
    return [];
  const candidates = team.filter(
    (member) =>
      member.active &&
      member.services.includes(serviceId) &&
      (staffId === 'any' || member.id === staffId),
  );
  const slots: { time: string; staffIds: string[] }[] = [];
  for (let minute = 0; minute < 24 * 60; minute += 30) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    if (Date.parse(`${date}T${time}:00+06:30`) <= Date.parse(now)) continue;
    const free = candidates.filter(
      (member) =>
        !bookingError(
          {
            id: excludeId,
            customerId: 'availability',
            serviceId,
            staffId: member.id,
            date,
            time,
            status: 'Confirmed',
            notes: '',
          },
          appointments,
          team,
          services,
        ),
    );
    if (free.length)
      slots.push({ time, staffIds: free.map((member) => member.id) });
  }
  return slots;
}

export function canCustomerManage(booking: Appointment, now: string) {
  return (
    ['Confirmed', 'Pending'].includes(booking.status) &&
    Date.parse(`${booking.date}T${booking.time}:00+06:30`) - Date.parse(now) >=
      24 * 60 * 60 * 1000
  );
}
