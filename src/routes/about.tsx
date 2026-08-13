import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Hijabi By Anayah Pakistan" },
      {
        name: "description",
        content:
          "Hijabi By Anayah selects every hijab, namaz chadar and accessory by hand before it ships anywhere in Pakistan.",
      },
      { property: "og:title", content: "Our Story — Hijabi By Anayah" },
      {
        property: "og:description",
        content: "Why thousands of Pakistani customers trust Hijabi By Anayah.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Reveal>
        <h1 className="text-4xl font-bold">Made for women who want modesty without compromise</h1>
        <p className="mt-4 text-muted-foreground">
          Hijabi By Anayah began in Lahore with a simple frustration: hijabs online looked beautiful in
          photos and disappointed in person. Thin fabric, harsh dyes, awkward lengths. So we started
          sourcing fabric ourselves, checking every piece by hand, and answering every WhatsApp message
          personally.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-10 overflow-hidden rounded-[2rem] border border-primary/20 shadow-premium">
        <img
          src={hero}
          alt="Hijabi By Anayah fabric studio"
          loading="lazy"
          width={1920}
          height={1088}
          className="aspect-video w-full object-cover"
        />
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {[
          "6,000+ orders delivered nationwide",
          "Hand-checked fabric and stitching on every piece",
          "Cash on delivery in 400+ cities",
          "Colour-fast dyes tested wash after wash",
          "7-day exchange on unworn pieces",
          "Real reviews — we never delete them",
        ].map((t, i) => (
          <Reveal key={t} delay={i * 0.05} className="premium-card flex items-start gap-3 p-5">
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm">{t}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
