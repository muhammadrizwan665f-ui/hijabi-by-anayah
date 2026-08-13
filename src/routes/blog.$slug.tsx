import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Hijabi By Anayah Journal` },
      {
        name: "description",
        content: "Hijabi By Anayah styling guide: fabrics, drape and modest wardrobe care.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/blog/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
  }),
  component: Post,
});

function Post() {
  const { slug } = Route.useParams();
  const { blog } = useStore();
  const post = blog.find((p) => p.slug === slug);
  if (!post) throw notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">{post.category}</p>
      <h1 className="mt-3 text-4xl font-bold">{post.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {post.author} · {post.date}
      </p>
      <p className="mt-8 text-lg text-muted-foreground">{post.excerpt}</p>
      <p className="mt-6">{post.body}</p>
      <Link to="/blog" className="mt-10 inline-block font-semibold text-primary">
        ← Back to all posts
      </Link>
    </article>
  );
}
