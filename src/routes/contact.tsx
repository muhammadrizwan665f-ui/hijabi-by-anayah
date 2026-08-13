import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Support — Hijabi By Anayah" },
      {
        name: "description",
        content:
          "Message the Hijabi By Anayah support team on WhatsApp, phone or email for orders, sizing and exchanges anywhere in Pakistan.",
      },
      { property: "og:title", content: "Contact & Support — Hijabi By Anayah" },
      { property: "og:description", content: "WhatsApp support that actually replies." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(1000),
});

function Contact() {
  const { settings } = useStore();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-4xl font-bold">Contact & Support</h1>
      <p className="mt-2 text-muted-foreground">
        WhatsApp is the fastest way to reach us — usually under 10 minutes.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <form
          className="premium-card space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = schema.safeParse(form);
            if (!parsed.success) {
              toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
              return;
            }
            toast.success("Message sent! We'll reply shortly.");
            setForm({ name: "", email: "", message: "" });
          }}
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-1.5"
              maxLength={80}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="mt-1.5"
              maxLength={255}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              className="mt-1.5"
              maxLength={1000}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Send message
          </Button>
        </form>

        <div className="space-y-4">
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="premium-card block p-6"
          >
            <p className="font-display font-bold">WhatsApp</p>
            <p className="mt-1 text-sm text-muted-foreground">{settings.supportPhone}</p>
          </a>
          <div className="premium-card p-6">
            <p className="flex items-center gap-2 font-display font-bold">
              <Phone className="size-4 text-primary" /> Call us
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{settings.supportPhone}</p>
          </div>
          <div className="premium-card p-6">
            <p className="flex items-center gap-2 font-display font-bold">
              <Mail className="size-4 text-primary" /> Email
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{settings.email}</p>
          </div>
          <div className="premium-card p-6">
            <p className="flex items-center gap-2 font-display font-bold">
              <MapPin className="size-4 text-primary" /> Address
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{settings.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
