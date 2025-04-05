# markup-refine-lib

**markup-refine-lib** is a customizable, lightweight CSS and JS library designed to give a simple way to style HTML with an emphasis on a native HTML look. What's more, markup-refine-lib is fully responsive, just like the native styling of HTML

**Note**: markup-refine-lib is currently in the early stages of development and may not be suitable for production environments yet.

## How to Use

To integrate markup-refine-lib into your project, add the following link to the `<head>` section of your HTML file:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/bartlomiej-aleksiejczyk/markup-refine-lib@0.3.5/dist/markup-refine-lib.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/bartlomiej-aleksiejczyk/markup-refine-lib@0.3.5/dist/webComponents.css" />
<script src="https://cdn.jsdelivr.net/gh/bartlomiej-aleksiejczyk/markup-refine-lib@0.3.5/dist/webComponents.js"></script>
```

This link points to the latest stable version hosted on the jsDelivr CDN, ensuring you are always using the most up-to-date version of the library.

More detailed instructions and usage examples can be found on the [documentation page](https://bartlomiej-aleksiejczyk.github.io/markup-refine-lib/).

## Local Development

To devlop markup-refine-lib, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/bartlomiej-aleksiejczyk/markup-refine-lib.git
   cd markup-refine-lib
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Make your changes**: Modify the necessary files to improve or extend the functionality of markup-refine-lib.

4. **Build and release a new version**: After making changes, you can build and release a new version of markup-refine-lib by running the following command:

   ```bash
   npm run release <version-type> "<optional-comment>"
   ```

   The `releaseNewVersion.js` script manages versioning and prepares the project for release. Specify the type of version bump (`patch`, `minor`, or `major`), and optionally, add a comment to describe the update.

   Example:

   ```bash
   npm run release minor "Added new pill component"
   ```

   This command will increment the minor version number and add the specified comment to the release notes.

## Scripts

Here are the main scripts used for building and releasing markup-refine-lib:

```json
"scripts": {
  "release": "node src/build/releaseNewVersion.js"
}
```

These scripts automate the bundling, minification, and version management processes.
