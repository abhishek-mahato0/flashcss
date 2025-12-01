# FlashCSS Vite Plugin

A **super fast custom CSS engine plugin for Vite**. Inspired by Tailwind and UnoCSS, this plugin generates CSS from your classes in development and production, with HMR support. Perfect for React, Vue, or plain JS projects.

---

## Features

- Generates CSS from class names automatically.
- Supports **variants** like `sm:`, `md:`, `hover:` etc.
- Supports **shortcuts** like `px-12 py-6 bg-blue text-white`.
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
import "/@flash.css";

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
      customRules: [
        {
         re: /^float-(right|left|none)$/ ,
         body: (m)=> ({
          "float":m![1]
         })
      }
      ],
      preDefinedClasses: ["size-[30px]", "text-primary"], // optional
      breakpoints: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        2xl: 1536,
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
      <div className="text-white">FlashCSS Works!</div>
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

for JS template literals class.

```bash
<div classname={`true? "text-red":"text-black"`}>Flash Css</div>
```

in this condition CSS for both "text-red" and "text-black" will be generated.

## Typography

### Font Size – size-\*

```bash
   size-16          --> font-size: 1rem;
   size-24          --> font-size: 1.5rem;
   size-[20px]      --> font-size: 20px;
```

### Font Weight

```bash
   font-bold  --> font-weight: bold
   font-[600] --> font-weight: 600
```

### Spacing

#### Margin

```bash
m-4           --> margin: 1rem;
m-[20px]      --> margin: 20px;

mt-8          --> margin-top: 2rem;
mt-[10px]     --> margin-top: 10px;

mb-12         --> margin-bottom: 3rem;
mb-[15px]     --> margin-bottom: 15px;

ml-2          --> margin-left: 0.5rem;
ml-[5px]      --> margin-left: 5px;

mr-6          --> margin-right: 1.5rem;
mr-[25px]     --> margin-right: 25px;

mx-4          --> margin-left: 1rem; margin-right: 1rem;
mx-[30px]     --> margin-left: 30px; margin-right: 30px;

my-8          --> margin-top: 2rem; margin-bottom: 2rem;
my-[40px]     --> margin-top: 40px; margin-bottom: 40px;

```

#### Padding

```bash
p-4           --> padding: 1rem;
p-[20px]      --> padding: 20px;

pt-8          --> padding-top: 2rem;
pt-[10px]     --> padding-top: 10px;

pb-12         --> padding-bottom: 3rem;
pb-[15px]     --> padding-bottom: 15px;

pl-2          --> padding-left: 0.5rem;
pl-[5px]      --> padding-left: 5px;

pr-6          --> padding-right: 1.5rem;
pr-[25px]     --> padding-right: 25px;

px-4          --> padding-left: 1rem; padding-right: 1rem;
px-[30px]     --> padding-left: 30px; padding-right: 30px;

py-8          --> padding-top: 2rem; padding-bottom: 2rem;
py-[40px]     --> padding-top: 40px; padding-bottom: 40px;

```

### Sizing

### Width

```bash
w-16          --> width: 4rem;
w-full        --> width: 100%;
w-screen      --> width: 100vw;
w-[200px]     --> width: 200px;
```

### Height

```bash
h-16          --> height: 4rem;
h-full        --> height: 100%;
h-screen      --> height: 100vh;
h-[200px]     --> height: 200px;

```

### Max Min

```bash
min-w-16      --> min-width: 4rem;
min-w-[150px] --> min-width: 150px;

max-w-32      --> max-width: 8rem;
max-w-[300px] --> max-width: 300px;

```

```bash
min-h-16      --> min-height: 4rem;
min-h-[150px] --> min-height: 150px;

max-h-32      --> max-height: 8rem;
max-h-[300px] --> max-height: 300px;

```

### Text Decoration

```bash
italic        --> font-style: italic;
not-italic    --> font-style: normal;
```

```bash
underline     --> text-decoration: underline;
line-through  --> text-decoration: line-through;
no-underline  --> text-decoration: none;
```

### Font Weight

```bash
font-bold       --> font-weight: 700;
font-semibold   --> font-weight: 600;
font-medium     --> font-weight: 500;
font-light      --> font-weight: 300;
```

### Text Align

```bash
text-left       --> text-align: left;
text-center     --> text-align: center;
text-right      --> text-align: right;
text-justify    --> text-align: justify;
```

### Font Family

```bash
font-[Arial]     --> font-family: Arial;
font-[Roboto]    --> font-family: Roboto;
```

### Tracking

```bash
tracking-[2px]   --> letter-spacing: 2px;
tracking-[0.1em] --> letter-spacing: 0.1em;
```

### Color

```bash
text-red        --> color: red;
text-[#333333]  --> color: #333333;
```

### Background

```bash
bg-blue         --> background-color: blue;
bg-[#fafafa]    --> background-color: #fafafa;
```

### Border

```bash
border           --> border-width: 1px solid transparent;
border-2         --> border-width: 2px solid transparent;
border-4         --> border-width: 4px solid transparent;
```

```bash
border-red       --> border-color: red;
border-[#333]    --> border-color: #333;
border-[green]   --> border-color: green;
```

```bash
rounded          --> border-radius: 0.25rem;
rounded-sm       --> border-radius: 0.25rem;
rounded-md       --> border-radius: 0.5rem;
rounded-lg       --> border-radius: 0.75rem;
rounded-xl       --> border-radius: 1rem;
rounded-full     --> border-radius: 9999px;
rounded-[10px]   --> border-radius: 10px;
```

### Flex Row

```bash
flex-row       --> flex-direction: row;
flex-col       --> flex-direction: column;
```

```bash
grid-cols-2       --> grid-template-columns: repeat(2, minmax(0, 1fr));
grid-cols-[1fr_2fr] --> grid-template-columns: 1fr 2fr;
```

```bash
grid-rows-3       --> grid-template-rows: repeat(3, minmax(0, 1fr));
grid-rows-[100px_auto] --> grid-template-rows: 100px auto;
```

### Alignment

```bash
justify-start      --> justify-content: flex-start;
justify-center     --> justify-content: center;
justify-end        --> justify-content: flex-end;
justify-between    --> justify-content: space-between;
justify-around     --> justify-content: space-around;
```

```bash
items-start      --> align-items: flex-start;
items-center     --> align-items: center;
items-end        --> align-items: flex-end;
items-stretch    --> align-items: stretch;
```

### Gap

```bash
gap-4 --> gap: 1rem;
gap-[20px]      --> gap: 20px;
```

### Z-index

```bash
z-0             --> z-index: 0;
z-10            --> z-index: 10;
z-50            --> z-index: 50;
```

### Position

```bash
relative        --> position: relative;
absolute        --> position: absolute;
fixed           --> position: fixed;
sticky          --> position: sticky;
```

### Top / Right / Bottom / Left

```bash
top-4           --> top: 1rem;
top-[10px]      --> top: 10px;

right-8         --> right: 2rem;
right-[15px]    --> right: 15px;

bottom-16       --> bottom: 4rem;
bottom-[20px]   --> bottom: 20px;

left-2          --> left: 0.5rem;
left-[5px]      --> left: 5px;

```

### Overflow

```bash
overflow-hidden --> overflow: hidden;
overflow-auto   --> overflow: auto;
overflow-scroll --> overflow: scroll;
overflow-clip   --> overflow: clip;
overflow-visible--> overflow: visible;
overflow-x-hidden  --> overflow-x: hidden;
overflow-x-auto    --> overflow-x: auto;
overflow-x-scroll  --> overflow-x: scroll;

overflow-y-hidden  --> overflow-y: hidden;
overflow-y-auto    --> overflow-y: auto;
overflow-y-scroll  --> overflow-y: scroll;

```

### Hover

```bash
hover:bg-red         --> changes background-color to red on hover
hover:text-white     --> changes text color to white on hover
hover:border-2       --> changes border-width to 2px on hover
```

### Focus

```bash
focus:bg-blue        --> changes background-color to blue on focus
focus:text-black     --> changes text color to black on focus
focus:border-4       --> changes border-width to 4px on focus

```

### Notes

Notes

- HMR works automatically in development.

- Production builds embeds generated css in index file.

- You can extend colors, font sizes, and breakpoints in the plugin config.

- Shortcuts (like btn) and variants (hover:, sm:) are fully supported.
