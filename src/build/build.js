import { promises as fs } from "fs";
import { resolve, dirname, join } from "path";
import mustache from "mustache";
import { fileURLToPath } from "url";

/**
 * Get the current directory path using ESM
 * @type {string}
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Directory paths for templates, pages, and distribution
 * @type {Object.<string, string>}
 */
const paths = {
  templates: resolve(__dirname, "../templates"),
  pages: resolve(__dirname, "../pages"),
  dist: resolve(__dirname, "../../dist"),
  distPages: resolve(__dirname, "../../dist/pages"),
};

// Log directory paths for debugging
console.log("Directory paths:", {
  templates: paths.templates,
  pages: paths.pages,
  dist: paths.dist,
  distPages: paths.distPages,
});

/**
 * Copies HTML files from pages directory to dist/pages directory
 * @async
 * @function copyHtmlFiles
 * @returns {Promise<void>}
 */
async function copyHtmlFiles() {
  try {
    console.log("Checking pages directory:", paths.pages);
    const files = await fs.readdir(paths.pages);
    console.log("Found files:", files);

    const htmlFiles = files.filter((file) => file.endsWith(".html"));
    console.log("HTML files to copy:", htmlFiles);

    for (const file of htmlFiles) {
      const sourcePath = join(paths.pages, file);
      const destPath = join(paths.distPages, file);

      console.log(`Copying from ${sourcePath} to ${destPath}`);
      await fs.mkdir(dirname(destPath), { recursive: true });
      await fs.copyFile(sourcePath, destPath);
      console.log(`Copied ${file} to dist/pages directory`);
    }
  } catch (error) {
    console.error("Error copying HTML files:", error);
    throw error; // Re-throw to stop the build
  }
}

/**
 * Renders Mustache templates and writes them to the dist/pages directory
 * @async
 * @function renderMustacheTemplates
 * @returns {Promise<void>}
 */
async function renderMustacheTemplates() {
  try {
    console.log(
      "Reading base template from:",
      join(paths.templates, "base.mustache")
    );
    // Read base template
    const baseTemplate = await fs.readFile(
      join(paths.templates, "base.mustache"),
      "utf-8"
    );
    console.log("Base template loaded successfully");

    // Read all page templates
    const files = await fs.readdir(paths.pages);
    console.log("Found files in pages directory:", files);

    const mustacheFiles = files.filter((file) => file.endsWith(".mustache"));
    console.log("Mustache files to render:", mustacheFiles);

    for (const file of mustacheFiles) {
      const templatePath = join(paths.pages, file);
      console.log(`Reading template from: ${templatePath}`);

      const pageTemplate = await fs.readFile(templatePath, "utf-8");
      console.log(`Template ${file} loaded successfully`);

      /**
       * Template data for rendering
       * @type {Object.<string, any>}
       */
      const data = {
        title:
          file.slice(0, -9).charAt(0).toUpperCase() +
          file.slice(0, -9).slice(1),
        components: [
          { id: "component1", url: "/about" },
          { id: "component2", url: "/about" },
        ],
      };

      // Render page content
      const content = mustache.render(pageTemplate, data);
      console.log(`Content rendered for ${file}`);

      // Render final HTML
      const html = mustache.render(baseTemplate, {
        ...data,
        content,
      });
      console.log(`Final HTML rendered for ${file}`);

      // Write to dist/pages
      const outputPath = join(
        paths.distPages,
        file.replace(".mustache", ".html")
      );
      console.log(`Writing to: ${outputPath}`);

      await fs.mkdir(dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, html);
      console.log(`Rendered ${file} to dist/pages directory`);
    }
  } catch (error) {
    console.error("Error rendering Mustache templates:", error);
    throw error; // Re-throw to stop the build
  }
}

/**
 * Main build function that orchestrates the build process
 * @async
 * @function build
 * @returns {Promise<void>}
 */
async function build() {
  try {
    console.log("Starting build process...");

    // Create dist and dist/pages directories if they don't exist
    console.log("Creating directories...");
    await fs.mkdir(paths.dist, { recursive: true });
    await fs.mkdir(paths.distPages, { recursive: true });
    console.log("Directories created successfully");

    // Copy HTML files
    console.log("Starting HTML file copy...");
    await copyHtmlFiles();
    console.log("HTML files copied successfully");

    // Render Mustache templates
    console.log("Starting Mustache template rendering...");
    await renderMustacheTemplates();
    console.log("Mustache templates rendered successfully");

    console.log("Build completed successfully");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

// Run the build process
build();
