import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/site/reveal";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Hijab Styling Journal — Hijabi By Anayah" },
      {
        name: "description",
        content:
          "Styling guides, fabric care tips and modest-wear inspiration from the Hijabi By Anayah studio.",
      },
      { property: "og:title", content: "Hijab Styling Journal — Anayah" },
      { property: "og:description", content: "Styling and fabric care advice for modest wardrobes." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: Blog,
});

function Blog() {
  const { blog } = useStore();
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-4xl font-bold">Guides & Reviews</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {blog.map((post, i) => (
          <Reveal key={post.id} delay={i * 0.06}>
            <article className="premium-card h-full p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                {post.category}
              </p>
              <h2 className="mt-2 font-display text-xl font-bold">
                <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-primary">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                {post.author} · {post.date}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
