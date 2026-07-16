import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { TOOL_LIST } from "@/lib/tools";

const BASE_URL = "https://read-the-room-bot.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", priority: "1.0", changefreq: "weekly" as const },
          { path: "/cadastro", priority: "0.4", changefreq: "monthly" as const },
          { path: "/novidades", priority: "0.6", changefreq: "monthly" as const },
          { path: "/raio-x", priority: "0.9", changefreq: "weekly" as const },
          { path: "/foto-mensagem", priority: "0.9", changefreq: "weekly" as const },
          { path: "/foto-story", priority: "0.9", changefreq: "weekly" as const },
          { path: "/responder-story", priority: "0.9", changefreq: "weekly" as const },
          { path: "/primeiro-contato", priority: "0.9", changefreq: "weekly" as const },
          { path: "/leitura", priority: "0.9", changefreq: "weekly" as const },
          { path: "/flow", priority: "0.9", changefreq: "weekly" as const },
          { path: "/perfil-ig", priority: "0.8", changefreq: "weekly" as const },
          { path: "/cantadas", priority: "0.8", changefreq: "weekly" as const },
          { path: "/modo-18", priority: "0.7", changefreq: "weekly" as const },
          { path: "/memoria", priority: "0.6", changefreq: "monthly" as const },
          { path: "/historico", priority: "0.5", changefreq: "weekly" as const },
          { path: "/perfil", priority: "0.4", changefreq: "monthly" as const },
          ...TOOL_LIST.map((t) => ({
            path: `/scan/${t.slug}`,
            priority: "0.8",
            changefreq: "weekly" as const,
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            `    <changefreq>${e.changefreq}</changefreq>`,
            `    <priority>${e.priority}</priority>`,
            `  </url>`,
          ].join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
