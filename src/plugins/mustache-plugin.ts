import type { Plugin } from 'vite';
import fs from 'fs/promises';
import path from 'path';
import mustache from 'mustache';

interface MustachePluginOptions {
  templatesDir: string;
  pagesDir: string;
  baseTemplate: string;
}

export default function mustachePlugin(options: MustachePluginOptions): Plugin {
  const { templatesDir, pagesDir, baseTemplate } = options;

  return {
    name: 'vite-plugin-mustache',
    async configureServer(server) {
      // Handle all routes
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/') {
          req.url = '/index.html';
        }

        // Skip if not a .html request
        if (!req.url?.endsWith('.html')) {
          return next();
        }

        try {
          // Remove .html extension and leading slash
          const pagePath = req.url.slice(1, -5);
          const pageFile = path.join(pagesDir, `${pagePath}.mustache`);
          
          // Check if page exists
          try {
            await fs.access(pageFile);
          } catch {
            return next();
          }

          // Read page template
          const pageTemplate = await fs.readFile(pageFile, 'utf-8');
          
          // Read base template
          const baseTemplateContent = await fs.readFile(
            path.join(templatesDir, baseTemplate),
            'utf-8'
          );

          // Mock data (replace with your actual data source)
          const data = {
            title: pagePath.charAt(0).toUpperCase() + pagePath.slice(1),
            components: [
              { id: 'component1', url: '/about' },
              { id: 'component2', url: '/about' },
            ],
          };

          // Render page content
          const content = mustache.render(pageTemplate, data);
          
          // Render final HTML
          const html = mustache.render(baseTemplateContent, {
            ...data,
            content,
          });

          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        } catch (error) {
          console.error('Error rendering page:', error);
          next(error);
        }
      });
    },
    async buildStart() {
      // Read all page files
      const pages = await fs.readdir(pagesDir);
      const htmlPages = pages.filter(page => page.endsWith('.mustache'));

      // Build each page
      for (const page of htmlPages) {
        const pagePath = path.join(pagesDir, page);
        const pageTemplate = await fs.readFile(pagePath, 'utf-8');
        const baseTemplateContent = await fs.readFile(
          path.join(templatesDir, baseTemplate),
          'utf-8'
        );

        // Mock data (replace with your actual data source)
        const data = {
          title: page.slice(0, -9).charAt(0).toUpperCase() + page.slice(0, -9).slice(1),
          components: [
            { id: 'component1', url: '/about' },
            { id: 'component2', url: '/about' },
          ],
        };

        // Render page content
        const content = mustache.render(pageTemplate, data);
        
        // Render final HTML
        const html = mustache.render(baseTemplateContent, {
          ...data,
          content,
        });

        // Write to dist
        const outputPath = path.join('dist', page.replace('.mustache', '.html'));
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, html);
      }
    },
  };
}