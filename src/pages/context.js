/**
 * @typedef {Object} NavigationItem
 * @property {string} title - The display name of the navigation link.
 * @property {string} url - The URL path of the navigation item.
 */

/**
 * @typedef {Object} SiteMetadata
 * @property {string} title - The site title.
 * @property {string} description - A short description of the site.
 * @property {string} version - The current version of the site/library.
 */

/**
 * @typedef {Object} GlobalContext
 * @property {SiteMetadata} site - Metadata about the site.
 * @property {NavigationItem[]} navigation - List of top-level navigation links.
 */

/** @type {GlobalContext} */
export const globalContext = {
  site: {
    title: "Markup Refine Library",
    description: "A library for refining markup",
    version: "0.0.0",
  },
  navigation: [
    { title: "Home", url: "/" },
    { title: "Documentation", url: "/docs" },
  ],
};
