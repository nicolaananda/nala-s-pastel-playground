import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "book" | "product";
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const SITE = "https://artstudionala.com";
const DEFAULT_IMAGE = `${SITE}/og-nala-art-studio.png`;

const setMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
};

const Seo = ({ title, description, path, image = DEFAULT_IMAGE, type = "website", noindex = false, jsonLd }: SeoProps) => {
  useEffect(() => {
    const url = `${SITE}${path === "/" ? "/" : path}`;
    const absoluteImage = new URL(image, SITE).href;
    document.title = title;
    setMeta('meta[name="description"]', { name: "description", content: description });
    setMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" });
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: url });
    setMeta('meta[property="og:type"]', { property: "og:type", content: type === "article" ? "article" : "website" });
    setMeta('meta[property="og:image"]', { property: "og:image", content: absoluteImage });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: absoluteImage });
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = url;
    document.getElementById("page-jsonld")?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.id = "page-jsonld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [description, image, jsonLd, noindex, path, title, type]);
  return null;
};

export default Seo;
