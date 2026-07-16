export const SITE_URL = "https://read-the-room-bot.lovable.app";

type Meta =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

export function seoHead(opts: {
  path: string;
  title: string;
  description: string;
  ogType?: string;
  image?: string;
}) {
  const url = `${SITE_URL}${opts.path}`;
  const meta: Meta[] = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:type", content: opts.ogType ?? "website" },
    { name: "twitter:card", content: opts.image ? "summary_large_image" : "summary" },
  ];
  if (opts.image) {
    meta.push({ property: "og:image", content: opts.image });
    meta.push({ name: "twitter:image", content: opts.image });
  }
  return {
    meta,
    links: [{ rel: "canonical", href: url }],
  };
}
