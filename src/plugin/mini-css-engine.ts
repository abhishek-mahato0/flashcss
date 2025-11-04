// src/plugin/mini-css-engine.ts
// src/plugin/mini-css-engine.ts
import type { Plugin } from "vite";
import path from "path";
import fs from "fs";
import {
  extractClasses,
  extractClassesFromFile,
  extractClassesFromString,
} from "../core/extractClasses.js";
import { createEngine } from "../core/rules.js";
import { fileURLToPath } from "url";

type BreakPointConfig = {
  [key: string]: number; // key: prefix, value: min-width px
};

type VitePluginMiniCSSEngineOptions = {
  preDefinedClasses?: string[];
  breakpoints?: BreakPointConfig;
  colors?: Record<string, string>;
  fontSizes?: Record<string, string>;
  borderRadius?: Record<string, string>;
  customRules?: Array<{
    re: RegExp;
    body: RuleBodyFn;
  }>;
  customVariants?: Array<{
    prefix: string;
    wrap: (cssBlock: string) => string;
  }>;
  outputpath?: string;
};

type CSSObject = Record<string, string>;

type RuleBodyFn = (
  captures: RegExpMatchArray | null,
  token: string
) => CSSObject | null;

const SKIP_DYNAMIC_REGEX = /\$\{.*\}/;

function shouldSkip(className: string): boolean {
  return SKIP_DYNAMIC_REGEX.test(className);
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function flashCss(
  _opts?: VitePluginMiniCSSEngineOptions
): Plugin {
  const engine = createEngine(_opts);
  const generatedClasses = new Set<string>();
  const outputPath = _opts?.outputpath || "assets/custom.css";
  let generatedCss = "";
  const oldFileContent = new Map<string, string>();

  // Helper to (re)generate CSS from a list of classes
  function generateFor(classes: string[]) {
    const unique = classes
      .filter((c) => !!c)
      .filter((c) => !generatedClasses.has(c))
      .filter((c) => !shouldSkip(c));
    if (unique.length === 0) return "";
    const css = engine.generate(unique.join(" "));
    unique.forEach((c) => generatedClasses.add(c));
    generatedCss += (generatedCss ? "\n" : "") + css;
    return css;
  }

  return {
    name: "vite-plugin-mini-css-engine",
    buildStart() {
      if (typeof process !== "undefined") {
        try {
          const classes = extractClasses();
          generateFor([...classes, ...(_opts?.preDefinedClasses || [])]);
        } catch (e) {
          this.warn(
            "mini-css-engine: buildStart extraction failed: " + String(e)
          );
        }
      }
    },
    configureServer(server) {
      const watchPath = path.resolve(__dirname, "src");
      server.watcher.add(watchPath);

      server.watcher.on("change", (file) => {
        if (!/\.(js|ts|jsx|tsx|vue|svelte|html)$/.test(file)) return [];
        const fileContent = fs.readFileSync(file, "utf-8");
        const classes = extractClassesFromString(fileContent);
        // Generate new CSS dynamically
        const css = generateFor(classes);
        if (!css) return [];

        // Invalidate module to trigger reload
        const module = server.moduleGraph.getModuleById("/@custom.css");
        if (module) {
          server.moduleGraph.invalidateModule(module);
        }
        // Send HMR update to browser
        server.ws.send({
          type: "update",
          updates: [
            {
              type: "js-update", // virtual module loaded via JS
              path: "/@custom.css",
              acceptedPath: "/@custom.css",
              timestamp: Date.now(),
            },
          ],
        });
      });
    },
    resolveId(id) {
      if (id === "/@custom.css") return id;
    },
    load(id) {
      if (id === "/@custom.css") {
        return generatedCss;
      }
    },
    generateBundle(_options, bundle) {
      if (!generatedCss) return;
      const outDir = path.resolve(
        process.cwd(),
        "dist",
        path.dirname(outputPath)
      );
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      // Write CSS file
      fs.writeFileSync(
        path.resolve(process.cwd(), "dist", outputPath),
        generatedCss
      );
      this.warn(`✅ Generated CSS: ${outputPath}`);
    },
    transformIndexHtml(html) {
      return html.replace(
        "</head>",
        `  <link rel="stylesheet" href="/${outputPath}">\n</head>`
      );
    },
  };
}
