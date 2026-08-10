import { getAllBookingsForAdmin, getAdminBookingStats } from "@/lib/bookings";
import type { Prisma } from "@prisma/client";

type AdminBooking = Prisma.BookingGetPayload<{
  include: { hotel: true; user: true; payment: true };
}>;

export const metadata = { title: "Admin · Bookings" };
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDateTime(d: Date) {
  return d.toISOString().replace("T", " ").slice(0, 16);
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-amber/15 text-amber-dark",
  PENDING: "bg-ink/5 text-ink/50",
  CANCELLED: "bg-rust/10 text-rust",
  COMPLETED: "bg-charcoal/10 text-charcoal",
};

export default async function AdminDashboardPage() {
  const [bookings, stats] = await Promise.all([
    getAllBookingsForAdmin(),
    getAdminBookingStats(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-10 py-16">
      <p className="eyebrow mb-2">Admin</p>
      <h1 className="text-3xl font-light mb-10">Bookings</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="border border-ink/10 bg-cream p-5">
          <p className="text-xs uppercase tracking-widest text-ink/40 mb-2">
            Total bookings
          </p>
          <p className="font-display text-2xl">{stats.totalBookings}</p>
        </div>
        <div className="border border-ink/10 bg-cream p-5">
          <p className="text-xs uppercase tracking-widest text-ink/40 mb-2">
            Confirmed
          </p>
          <p className="font-display text-2xl">{stats.confirmedBookings}</p>
        </div>
        <div className="border border-ink/10 bg-cream p-5">
          <p className="text-xs uppercase tracking-widest text-ink/40 mb-2">
            This week
          </p>
          <p className="font-display text-2xl">{stats.bookingsThisWeek}</p>
        </div>
        <div className="border border-ink/10 bg-cream p-5">
          <p className="text-xs uppercase tracking-widest text-ink/40 mb-2">
            Revenue (confirmed)
          </p>
          <p className="font-display text-2xl">
            ${stats.totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Bookings table */}
      {bookings.length === 0 ? (
        <div className="border border-ink/10 bg-cream p-12 text-center text-ink/60">
          No bookings yet.
        </div>
      ) : (
        <div className="border border-ink/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-cream text-left">
                <th className="px-4 py-3 font-medium text-ink/50 text-xs uppercase tracking-wider">Booked</th>
                <th className="px-4 py-3 font-medium text-ink/50 text-xs uppercase tracking-wider">Guest</th>
                <th className="px-4 py-3 font-medium text-ink/50 text-xs uppercase tracking-wider">Stay</th>
                <th className="px-4 py-3 font-medium text-ink/50 text-xs uppercase tracking-wider">Dates</th>
                <th className="px-4 py-3 font-medium text-ink/50 text-xs uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 font-medium text-ink/50 text-xs uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 font-medium text-ink/50 text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-medium text-ink/50 text-xs uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking: AdminBooking) => (
                <tr key={booking.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3 text-ink/50 whitespace-nowrap">
                    {formatDateTime(booking.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{booking.guestName}</p>
                    <p className="text-ink/40 text-xs">{booking.guestEmail}</p>
                    {booking.paidByName && (
                      <p className="text-amber-dark text-xs mt-0.5">
                        Paid by {booking.paidByName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">{booking.hotel.name}</td>
                  <td className="px-4 py-3 text-ink/60 whitespace-nowrap">
                    {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                  </td>
                  <td className="px-4 py-3 text-ink whitespace-nowrap">
                    {booking.currency} {booking.total.toString()}
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {booking.payment ? (
                      <>
                        <span className="capitalize">{booking.payment.provider.toLowerCase()}</span>
                        <span className="text-ink/40"> · {booking.payment.status.toLowerCase()}</span>
                      </>
                    ) : (
                      <span className="text-ink/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs ${
                        STATUS_STYLES[booking.status] ?? "bg-ink/5 text-ink/50"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/50">
                    {booking.reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
