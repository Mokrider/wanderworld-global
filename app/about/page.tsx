export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 lg:py-28">
      <p className="eyebrow mb-3 text-center">About</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-10 text-center">
        Built by one person, for careful travelers
      </h1>

      <div className="space-y-6 text-ink/70 leading-relaxed">
        <p>
          WanderWorld Global started as a spreadsheet of stays I'd actually
          want to book myself — no stock-photo villas, no vanishing service
          fees, no "price shown" that turns into a different price at
          checkout. It's still run that way: every listing gets a second
          look before it goes live, and the price you see is the price you
          pay.
        </p>
        <p>
          Right now that means one thing, done properly: stays. Real
          places across six continents, from a stone house in Lamu to a
          zinc-roofed apartment in the Marais, each one picked rather than
          pulled from a feed. No flights, no car rentals, no marketplace —
          just the part of travel planning that actually takes judgment.
        </p>
        <p>
          Checkout works the way travelers actually pay, not the way it's
          easiest for us to build: card, PayPal, and Paystack for
          international guests, M-Pesa for travelers paying in East
          Africa. Prices are shown in USD unless noted, and nothing is
          converted behind your back at the last step.
        </p>
        <p>
          If you're planning something and don't know where to start, the
          AI concierge will ask a few real questions — budget, pace,
          what you actually want out of the trip — and build a day-by-day
          itinerary with real, bookable stays already attached to it.
        </p>
        <p className="pt-2">
          Questions, a listing you think should be here, or something that
          looks off — the <a href="/contact" className="text-amber underline underline-offset-4">contact page</a> reaches a real person, not a queue.
        </p>
      </div>
    </div>
  );
}
