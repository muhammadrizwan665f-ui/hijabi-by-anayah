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
        <h1 className="text-4xl font-bold font-display leading-tight">From a Dream to Hijabi by Anayah</h1>
        <div className="mt-8 space-y-6 text-lg text-muted-foreground leading-relaxed">
          <p>
            Every beautiful journey begins with a single step, and so did Hijabi by Anayah. When I personally started this journey, I began with absolutely zero knowledge. We learned everything step by step—visiting every single market, from wholesalers to retailers, understanding fabrics, and even learning the local market language and codes. With time, effort, and patience, we finally took our first real step with just 5k and a few stoles.
          </p>
          
          <p>
            There were countless moments of uncertainty, doubt, and challenges behind the scenes. From carefully selecting fabrics to packing each order with love and attention, every small step carried our dedication and heart. Every customer who trusted Hijabi by Anayah became a part of this journey, and their support gave us the strength to keep going even when things felt difficult.
          </p>

          <p>
            Today, Hijabi by Anayah is more than just a modest fashion page—it is a growing community of women who believe that modesty is timeless, graceful, and deeply empowering. Every hijab and abaya we offer is a reflection of confidence, comfort, and elegance, made with sincerity and care.
          </p>

          <p>
            This is only the beginning of our story. With Allah’s blessings and your continued love and support, we hope to grow further, inspire more hearts, and serve you with even more passion and dedication in the years to come. ❤️
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-16 overflow-hidden rounded-[2rem] border border-primary/20 shadow-premium">
        <img
          src={hero}
          alt="Hijabi By Anayah fabric studio"
          loading="lazy"
          width={1920}
          height={1088}
          className="aspect-video w-full object-cover opacity-90 grayscale-[20%] hover:grayscale-0 transition-all duration-700"
        />
      </Reveal>

      <div className="mt-16 grid gap-4 sm:grid-cols-2">
        {[
          "6,000+ orders delivered nationwide",
          "Hand-checked fabric and stitching on every piece",
          "Cash on delivery in 400+ cities",
          "Colour-fast dyes tested wash after wash",
          "Secure payments & cash on delivery",
          "Real reviews — we never delete them",
        ].map((t, i) => (
          <Reveal key={t} delay={i * 0.05} className="premium-card flex items-start gap-3 p-6 bg-surface/50">
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm font-medium">{t}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
