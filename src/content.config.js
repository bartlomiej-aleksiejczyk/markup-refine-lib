import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const rawComponents = defineCollection({
  loader: () => {
    const data = Object.keys(
      import.meta.glob("./pages/rawComponents/*.html", { eager: true })
    );
    return data.map((path) => ({
      id: path.split("/").pop(),
      url: path.split("/").slice(2).join("/"),
    }));
  },
});

export const collections = { rawComponents };
