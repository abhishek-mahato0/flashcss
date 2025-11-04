# FlashCSS Vite Plugin

A **super fast custom CSS engine plugin for Vite**. Inspired by Tailwind and UnoCSS, this plugin generates CSS from your classes in development and production, with HMR support. Perfect for React, Vue, or plain JS projects.

---

## Features

- Generates CSS from class names automatically.
- Supports **variants** like `sm:`, `md:`, `hover:` etc.
- Supports **shortcuts** like `btn` → `px-12 py-6 bg-blue text-white`.
- HMR support in development for live updates.
- Production build emits a single CSS file.
- Configurable colors, font sizes, breakpoints, and predefined classes.

---

## Installation

```bash
npm install flashcss-vite --save-dev
# or
yarn add flashcss-vite -D
```

## Usage

Main Entry (React Example) main.tsx

```bash
import "/@custom.css";

```

## Vite Configuration

In vite.config.ts:

```bash
import flashcss from "flashcss-vite";

export default defineConfig({
  plugins: [
    react(),
    ...,
    flashcss();
    ]
    }),
```

## Custom Configuration

```bash
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import flashcss from "flashcss-vite";

export default defineConfig({
  plugins: [
    react(),
    flashcss({
      preDefinedClasses: ["text-[30px]", "text-[20px]"], // optional
      breakpoints: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      colors: {
        primary: "#3490dc",
        secondary: "#ffed4a",
        danger: "#e3342f",
      },
      fontSizes: {
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "30px",
      },
    }),
  ],
});

```

## React Component

```bash
export default function App() {
  const size = 20; // Dynamic classes not supported unless pre-defined
  return (
    <div className="bg-black p-4 flex text-[30px]">
      <div className="text-white">🚀 FlashCSS Works!</div>
      <div className="text-primary bg-secondary sm:text-red hover:text-blue">Dynamic colors from config</div>
    </div>
  );
}
```

## Dynamic Classes

Important: Classes with fully dynamic values, e.g., text-[${size}], cannot be automatically detected. You must:

Predefine classes in preDefinedClasses:

```bash
flashcss({
  preDefinedClasses: ["text-[20px]", "text-[30px]"],
});
```

Or use inline styles:

```bash
<div style={{ fontSize: `${size}px` }}>Dynamic text</div>
```

### Notes

Notes

- HMR works automatically in development.

- Production builds emit a single CSS file (flashcss.css).

- You can extend colors, font sizes, and breakpoints in the plugin config.

- Shortcuts (like btn) and variants (hover:, sm:) are fully supported.
