import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { BASE } from "./site.config.js";

const websiteComponents = defineCollection({
  loader: () => {
    const data = Object.keys(
      import.meta.glob("./pages/website-components/*.astro", { eager: true })
    );

    return data.map((path) => {
      const id = path.split("/").pop()?.split(".")[0];
      const relativePath = path.split("/").slice(2).join("/").split(".")[0];
      const url = `/${BASE}/${relativePath}`;
      return { id, url };
    });
  },
});

const libraryLinks = defineCollection({
  loader: file("src/astro/libraryInfo.json"),
});

export const collections = { websiteComponents, libraryLinks };
