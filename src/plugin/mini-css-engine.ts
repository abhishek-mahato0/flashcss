// src/plugin/mini-css-engine.ts
// src/plugin/mini-css-engine.ts
import type { Plugin } from "vite";
import path from "path";
import fs from "fs";
import {
  extractClasses,
  extractClassesFromString,
  getFileLength,
  getOnlyChangedLines,
} from "../core/utils.js";
import { createEngine } from "../core/rules.js";
import { fileURLToPath } from "url";
import { LRUCache } from "../core/LRU.js";

type BreakPointConfig = {
  [key: string]: number;
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
  cacheSize?: number;
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
  const outputPath = _opts?.outputpath || "assets/flash.css";
  let generatedCss = "";
  const oldFileContent = new LRUCache<string, string>(_opts?.cacheSize || 20);

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
    name: "flash-css-vite-plugin",
    buildStart() {
      if (typeof process !== "undefined") {
        try {
          const classes = extractClasses();
          generateFor([...classes, ...(_opts?.preDefinedClasses || [])]);
        } catch (e) {
          this.warn("flashcss: buildStart extraction failed: " + String(e));
        }
      }
    },
    configureServer(server) {
      const watchPath = path.resolve(__dirname, "src");
      server.watcher.add(watchPath);

      server.watcher.on("change", (file) => {
        if (!/\.(js|ts|jsx|tsx|vue|svelte|html)$/.test(file)) return [];
        const fileContent = fs.readFileSync(file, "utf-8");
        const oldContent = oldFileContent.get(file) || "";
        let newCss = "";
        if (oldContent) {
          const changedLines = getOnlyChangedLines(oldContent, fileContent);
          oldFileContent.set(file, fileContent);
          if (changedLines.trim() !== "") {
            const classes = extractClassesFromString(changedLines);
            newCss = generateFor(classes);
          }
        } else {
          const classes = extractClassesFromString(fileContent);
          newCss = generateFor(classes);
          const fileLength = getFileLength(fileContent);
          if (fileLength > 50) {
            oldFileContent.set(file, fileContent);
          }
        }
        if (!newCss) return [];

        // Invalidate module to trigger reload
        const module = server.moduleGraph.getModuleById("/@flash.css");
        if (module) {
          server.moduleGraph.invalidateModule(module);
        }
        // Send HMR update to browser
        server.ws.send({
          type: "update",
          updates: [
            {
              type: "js-update", // virtual module loaded via JS
              path: "/@flash.css",
              acceptedPath: "/@flash.css",
              timestamp: Date.now(),
            },
          ],
        });
      });
    },
    resolveId(id) {
      if (id === "/@flash.css") return id;
    },
    load(id) {
      if (id === "/@flash.css") {
        return generatedCss;
      }
    },
  };
}
