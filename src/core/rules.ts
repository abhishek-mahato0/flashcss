// src/core/rules.ts
// src/core/rules.ts
import { MiniCSSEngine, RuleBodyFn } from "./engine.js";

export type BreakPointConfig = {
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
};

const defaultBreakpoints: BreakPointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

function parseArbitrary(token: string) {
  const m = token.match(/\[([^\]]+)\]/);
  return m ? m[1] : null;
}

export function createEngine(opt: VitePluginMiniCSSEngineOptions = {}) {
  const engine = new MiniCSSEngine();
  const userBreakpoints: BreakPointConfig | undefined = opt.breakpoints;

  const breakpoints = userBreakpoints || defaultBreakpoints;

  //add custom rules first
  (opt.customRules || []).forEach(({ re, body }) => {
    engine.addRule(re, body);
  });

  // ─────────────────────────────
  // 📦 SPACING (margin / padding)
  // ─────────────────────────────

  // Margin (all sides)
  engine.addRule(/^m-(\d+)$/, (m) => ({ margin: `${m![1]}px` }));
  engine.addRule(/^m-\[(.+)\]$/, (m, token) => ({
    margin: parseArbitrary(token) || "",
  }));

  // Margin (x, y, top, right, bottom, left)
  engine.addRule(/^mx-(\d+)$/, (m) => ({
    "margin-left": `${m![1]}px`,
    "margin-right": `${m![1]}px`,
  }));
  engine.addRule(/^my-(\d+)$/, (m) => ({
    "margin-top": `${m![1]}px`,
    "margin-bottom": `${m![1]}px`,
  }));
  engine.addRule(/^mt-(\d+)$/, (m) => ({ "margin-top": `${m![1]}px` }));
  engine.addRule(/^mr-(\d+)$/, (m) => ({ "margin-right": `${m![1]}px` }));
  engine.addRule(/^mb-(\d+)$/, (m) => ({ "margin-bottom": `${m![1]}px` }));
  engine.addRule(/^ml-(\d+)$/, (m) => ({ "margin-left": `${m![1]}px` }));

  // Padding (all sides)
  engine.addRule(/^p-(\d+)$/, (m) => ({ padding: `${m![1]}px` }));
  engine.addRule(/^p-\[(.+)\]$/, (m, token) => ({
    padding: parseArbitrary(token) || "",
  }));

  // Padding (x, y, top, right, bottom, left)
  engine.addRule(/^px-(\d+)$/, (m) => ({
    "padding-left": `${m![1]}px`,
    "padding-right": `${m![1]}px`,
  }));
  engine.addRule(/^py-(\d+)$/, (m) => ({
    "padding-top": `${m![1]}px`,
    "padding-bottom": `${m![1]}px`,
  }));
  engine.addRule(/^pt-(\d+)$/, (m) => ({ "padding-top": `${m![1]}px` }));
  engine.addRule(/^pr-(\d+)$/, (m) => ({ "padding-right": `${m![1]}px` }));
  engine.addRule(/^pb-(\d+)$/, (m) => ({ "padding-bottom": `${m![1]}px` }));
  engine.addRule(/^pl-(\d+)$/, (m) => ({ "padding-left": `${m![1]}px` }));

  // ─────────────────────────────
  // 🎨 COLORS
  // ─────────────────────────────
  engine.addRule(/^bg-([a-z0-9-]+)$/, (m) => {
    const name = m![1];
    if (opt.colors && opt.colors[name])
      return { "background-color": opt.colors[name] };
    return { "background-color": name }; // fallback to literal name
  });
  engine.addRule(
    /^bg-\[(#(?:[0-9a-fA-F]{3,6})|[a-z]+|rgba?\([^\)]+\))\]$/,
    (m, token) => {
      return { "background-color": m![1] };
    }
  );
  engine.addRule(/^bg-\[(.+)\]$/, (m, token) => ({
    "background-color": parseArbitrary(token) || "",
  }));

  engine.addRule(/^text-([a-z0-9-]+)$/, (m) => {
    const name = m![1];
    if (opt.colors && opt.colors[name]) return { color: opt.colors[name] };
    return { color: name }; // fallback to literal name
  });
  engine.addRule(
    /^text-\[(#(?:[0-9a-fA-F]{3,6})|[a-z]+|rgba?\([^\)]+\))\]$/,
    (m, token) => ({
      color: parseArbitrary(token) || "",
    })
  );

  engine.addRule(/^border-([a-z0-9-]+)$/, (m) => ({ "border-color": m![1] }));
  engine.addRule(/^border-\[(.+)\]$/, (m, token) => ({
    "border-color": parseArbitrary(token) || "",
  }));

  // ─────────────────────────────
  // ✍️ TYPOGRAPHY
  // ─────────────────────────────
  engine.addRule(/^size-(\w+)$/, (m) => {
    const key = m![1];
    if (opt?.fontSizes?.[key]) return { "font-size": opt.fontSizes[key] };
    const n = parseInt(key, 10);
    if (!isNaN(n)) return { "font-size": `${n}px` };
    return null;
  });
  engine.addRule(/^size-\[(.+)px\]$/, (m, token) => {
    // e.g., text-[20px]
    return { "font-size": `${m![1]}px` };
  });

  engine.addRule(/^size-\[(.+)\]$/, (m, token) => ({
    "font-size": parseArbitrary(token) || "",
  }));

  // Text align
  engine.addRule(/^text-(left|center|right|justify)$/, (m) => ({
    "text-align": m![1],
  }));

  // Font weight
  engine.addRule(/^font-(bold|semibold|medium|light|thin)$/, (m) => ({
    "font-weight": m![1],
  }));
  // Arbitrary font family and size (using square brackets) font-[sans-serif], text-[20px]
  engine.addRule(/^font-fam-\[(.+)\]$/, (m, token) => ({
    "font-family": parseArbitrary(token) || "",
  }));

  engine.addRule(/^leading-(\d+)$/, (m) => ({ "line-height": `${m![1]}px` }));
  engine.addRule(/^leading-\[(.+)\]$/, (m, token) => ({
    "line-height": parseArbitrary(token) || "",
  }));
  engine.addRule(/^tracking-\[(.+)\]$/, (m, token) => ({
    "letter-spacing": parseArbitrary(token) || "",
  }));
  engine.addRule(/^underline$/, () => ({ "text-decoration": "underline" }));
  engine.addRule(/^line-through$/, () => ({
    "text-decoration": "line-through",
  }));
  engine.addRule(/^no-underline$/, () => ({ "text-decoration": "none" }));

  // ─────────────────────────────
  // 📐 FLEX & GRID
  // ─────────────────────────────
  engine.addRule(/^(flex|inline-flex|block|inline-block|grid)$/, (m) => ({
    display: m![1],
  }));

  // Flex direction
  engine.addRule(/^flex-(row|col)$/, (m) => ({
    "flex-direction": m![1] === "row" ? "row" : "column",
  }));

  // Justify content
  engine.addRule(/^justify-(start|center|end|between|around)$/, (m) => ({
    "justify-content":
      m![1] === "start"
        ? "flex-start"
        : m![1] === "end"
        ? "flex-end"
        : m![1] === "between"
        ? "space-between"
        : m![1] === "around"
        ? "space-around"
        : "center",
  }));

  // Align items
  engine.addRule(/^items-(start|center|end|stretch)$/, (m) => ({
    "align-items":
      m![1] === "start"
        ? "flex-start"
        : m![1] === "end"
        ? "flex-end"
        : m![1] === "stretch"
        ? "stretch"
        : "center",
  }));

  // Gap
  engine.addRule(/^gap-(\d+)$/, (m) => ({ gap: `${m![1]}px` }));
  engine.addRule(/^gap-x-(\d+)$/, (m) => ({ "column-gap": `${m![1]}px` }));
  engine.addRule(/^gap-y-(\d+)$/, (m) => ({ "row-gap": `${m![1]}px` }));

  // Grid templates
  engine.addRule(/^grid-cols-(\d+)$/, (m) => ({
    "grid-template-columns": `repeat(${m![1]}, minmax(0, 1fr))`,
  }));
  engine.addRule(/^grid-rows-(\d+)$/, (m) => ({
    "grid-template-rows": `repeat(${m![1]}, minmax(0, 1fr))`,
  }));

  // ─────────────────────────────
  // 📏 SIZING
  // ─────────────────────────────
  engine.addRule(/^w-(\d+)$/, (m) => ({ width: `${m![1]}px` }));
  engine.addRule(/^w-\[(.+)\]$/, (m, token) => ({
    width: parseArbitrary(token) || "",
  }));
  engine.addRule(/^h-(\d+)$/, (m) => ({ height: `${m![1]}px` }));
  engine.addRule(/^h-\[(.+)\]$/, (m, token) => ({
    height: parseArbitrary(token) || "",
  }));
  engine.addRule(/^min-w-(\d+)$/, (m) => ({ "min-width": `${m![1]}px` }));
  engine.addRule(/^max-w-(\d+)$/, (m) => ({ "max-width": `${m![1]}px` }));

  // ─────────────────────────────
  // 🟦 BORDERS & RADIUS
  // ─────────────────────────────
  engine.addRule(/^border$/, () => ({ borderWidth: "1px" }));
  engine.addRule(/^border-(\d+)$/, (m) => ({
    borderWidth: `${m![1]}px`,
  }));

  // border color
  engine.addRule(/^border-(.+)$/, (m) => {
    const color = m![1];
    if (opt.colors && opt.colors[color]) {
      return { borderColor: opt.colors[color] };
    }
    return { borderColor: color }; // fallback to literal name
  });

  //radius
  engine.addRule(/^rounded$/, () => ({ "border-radius": "4px" }));
  engine.addRule(/^rounded-(sm|md|lg|xl)$/, (m) => {
    const map: Record<string, string> = opt.borderRadius || {
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
    };
    return { "border-radius": map[m![1]] };
  });
  engine.addRule(/^rounded-\[(.+)\]$/, (m, token) => ({
    "border-radius": parseArbitrary(token) || "",
  }));

  // ─────────────────────────────
  // 📌 POSITIONING
  // ─────────────────────────────
  engine.addRule(/^(absolute|relative|fixed|sticky)$/, (m) => ({
    position: m![1],
  }));
  engine.addRule(/^(top|right|bottom|left)-(\d+)$/, (m) => ({
    [m![1]]: `${m![2]}px`,
  }));
  engine.addRule(/^(top|right|bottom|left)-\[(.+)\]$/, (m, token) => ({
    [m![1]]: parseArbitrary(token) || "",
  }));
  engine.addRule(/^z-(\d+)$/, (m) => ({ "z-index": m![1] }));

  // ─────────────────────────────
  // 🌟 OTHER UTILITIES
  // ─────────────────────────────
  engine.addRule(/^opacity-(\d+)$/, (m) => ({ opacity: `${+m![1] / 100}` }));
  engine.addRule(/^cursor-(pointer|default|not-allowed)$/, (m) => ({
    cursor: m![1],
  }));
  engine.addRule(/^overflow-(hidden|auto|scroll)$/, (m) => ({
    overflow: m![1],
  }));
  engine.addRule(/^shadow$/, () => ({
    "box-shadow": "0 1px 2px rgba(0,0,0,0.1)",
  }));
  engine.addRule(/^shadow-lg$/, () => ({
    "box-shadow": "0 4px 6px rgba(0,0,0,0.1)",
  }));
  engine.addRule(/^shadow-\[(.+)\]$/, (m, token) => ({
    "box-shadow": parseArbitrary(token) || "",
  }));

  // ─────────────────────────────
  // 📱 VARIANTS
  // ─────────────────────────────
  engine.addVariant({
    prefix: "hover:",
    wrap: (css) => css.replace(/^([^{\s]+)\s*{/, "$1:hover{"),
  });

  engine.addVariant({
    prefix: "focus:",
    wrap: (css) => css.replace(/^([^{\s]+)\s*{/, "$1:focus{"),
  });

  Object.entries(opt.customVariants || { dark: "" }).forEach(
    ([prefix, selector]) => {
      engine.addVariant({
        prefix: `${prefix}:`,
        wrap: (css) => css.replace(/^(\.[^{\s]+)\s*{/, `${selector} $1{`),
      });
    }
  );

  Object.entries(breakpoints).forEach(([prefix, minWidth]) =>
    engine.addMediaQuery(prefix, minWidth)
  );

  return engine;
}
