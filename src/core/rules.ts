// src/core/rules.ts
import { MiniCSSEngine, RuleBodyFn } from "./engine.js";

export type BreakPointConfig = { [key: string]: number };

type VitePluginMiniCSSEngineOptions = {
  preDefinedClasses?: string[];
  breakpoints?: BreakPointConfig;
  colors?: Record<string, string>;
  fontSizes?: Record<string, string>;
  borderRadius?: Record<string, string>;
  customRules?: Array<{ re: RegExp; body: RuleBodyFn }>;
  customVariants?: Array<{
    prefix: string;
    wrap: (cssBlock: string) => string;
  }>;
  themes?: Record<string, string>; // Generic theme support
};

const defaultBreakpoints: BreakPointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};
const baseRem = 16;

function parseArbitrary(token: string) {
  const m = token.match(/\[([^\]]+)\]/);
  return m ? m[1] : null;
}

export function createEngine(opt: VitePluginMiniCSSEngineOptions = {}) {
  const engine = new MiniCSSEngine();
  const breakpoints = opt.breakpoints || defaultBreakpoints;

  // Custom rules
  (opt.customRules || []).forEach(({ re, body }) => engine.addRule(re, body));

  // Spacing: margin and padding
  const spaceProps = [
    { prefix: "m", prop: "margin" },
    { prefix: "p", prop: "padding" },
  ];

  const directions = {
    "": "", // all sides
    x: ["left", "right"],
    y: ["top", "bottom"],
    t: "top",
    r: "right",
    b: "bottom",
    l: "left",
  };

  spaceProps.forEach(({ prefix, prop }) => {
    Object.entries(directions).forEach(([dirKey, dirVal]) => {
      // Numeric values
      engine.addRule(
        new RegExp(`^${prefix}${dirKey ? dirKey : ""}-(\\d+)$`),
        (m) => {
          const remValue = `${+m![1] / baseRem}rem`;
          if (Array.isArray(dirVal)) {
            return Object.fromEntries(
              dirVal.map((d) => [`${prop}-${d}`, remValue])
            );
          } else if (dirVal) {
            return { [`${prop}-${dirVal}`]: remValue };
          } else {
            return { [prop]: remValue };
          }
        }
      );

      // Arbitrary values
      engine.addRule(
        new RegExp(`^${prefix}${dirKey ? dirKey : ""}-\\[([^\\]]+)\\]$`),
        (m, token) => {
          const val = parseArbitrary(token) || "";
          if (Array.isArray(dirVal)) {
            return Object.fromEntries(dirVal.map((d) => [`${prop}-${d}`, val]));
          } else if (dirVal) {
            return { [`${prop}-${dirVal}`]: val };
          } else {
            return { [prop]: val };
          }
        }
      );
    });
  });

  //rule for width and height
  engine.addRule(
    /^(w|h|min-w|max-w|min-h|max-h)-(full|screen|\d+|\[.+\])$/,
    (m) => {
      const type = m![1]; // w, h, min-w, max-w, min-h, max-h
      const value = m![2];

      let prop;

      // Map type to CSS property
      switch (type) {
        case "w":
          prop = "width";
          break;
        case "h":
          prop = "height";
          break;
        case "min-w":
          prop = "min-width";
          break;
        case "max-w":
          prop = "max-width";
          break;
        case "min-h":
          prop = "min-height";
          break;
        case "max-h":
          prop = "max-height";
          break;
        default:
          return {};
      }

      // Numeric scale (e.g., w-2 → 0.5rem)
      if (/^\d+$/.test(value)) {
        return { [prop]: `${Number(value) * 0.25}rem` };
      }

      // Arbitrary value (e.g., w-[20px])
      if (/^\[.+\]$/.test(value)) {
        return { [prop]: value.slice(1, -1) }; // remove brackets
      }

      // Keywords
      if (value === "full") return { [prop]: "100%" };
      if (value === "screen") {
        if (prop.includes("Width")) return { [prop]: "100vw" };
        if (prop.includes("Height")) return { [prop]: "100vh" };
      }

      return {}; // fallback
    }
  );
  // Font styles
  engine.addRule(
    /^(italic|not-italic|underline|line-through|dec-none)$/,
    (m) => {
      const value = m![1] || "dec-none";
      let css = {};
      switch (value) {
        case "italic":
          css = { "font-style": "italic" };
          break;
        case "not-italic":
          css = { "font-style": "normal" };
          break;
        case "underline":
          css = { "text-decoration": "underline" };
          break;
        case "line-through":
          css = { "text-decoration": "line-through" };
          break;
        case "dec-none":
          css = { "text-decoration": "none" };
          break;
        default:
          css = { "text-decoration": "none" };
      }
      return css;
    }
  );

  // Colors
  engine.addRule(/^bg-([a-z0-9-]+)$/, (m) => ({
    "background-color": opt.colors?.[m![1]] || m![1],
  }));
  engine.addRule(/^bg-\[([^\]]+)\]$/, (m) => ({
    "background-color": parseArbitrary(m![0]) || m![1],
  }));

  engine.addRule(/^text-([a-z0-9-]+)$/, (m) => ({
    color: opt.colors?.[m![1]] || m![1],
  }));
  engine.addRule(/^text-\[([^\]]+)\]$/, (m) => ({
    color: parseArbitrary(m![0]) || m![1],
  }));
  engine.addRule(/^border-(\d+)$/, (m) => ({
    border: `${+m![1] / baseRem}rem solid transparent`,
  }));
  engine.addRule(/^border-(?!\d+$)([a-z0-9-]+)$/, (m) => ({
    "border-color": opt.colors?.[m![1]] || m![1],
  }));
  engine.addRule(/^border-\[([^\]]+)\]$/, (m, token) => ({
    "border-color": parseArbitrary(token) || "",
  }));

  // Typography
  engine.addRule(/^size-(\w+)$/, (m) => {
    const key = m![1];
    if (opt.fontSizes?.[key]) return { "font-size": opt.fontSizes[key] };
    const n = parseFloat(key);
    return !isNaN(n) ? { "font-size": `${+n / baseRem}rem` } : null;
  });
  engine.addRule(/^size-\[(\d+(?:\.\d+)?)px\]$/, (m) => ({
    "font-size": `${m![1]}px`,
  }));
  engine.addRule(/^size-\[([^\]]+)\]$/, (m, token) => ({
    "font-size": parseArbitrary(token) || "",
  }));
  engine.addRule(/^text-(left|center|right|justify)$/, (m) => ({
    "text-align": m![1],
  }));
  engine.addRule(/^font-(bold|semibold|medium|light|thin)$/, (m) => ({
    "font-weight": m![1],
  }));
  engine.addRule(/^font-\[([^\]]+)\]$/, (m, token) => ({
    "font-family": parseArbitrary(token) || "",
  }));
  engine.addRule(/^leading-\[([^\]]+)\]$/, (m, token) => ({
    "line-height": parseArbitrary(token) || "",
  }));
  engine.addRule(/^tracking-\[([^\]]+)\]$/, (m, token) => ({
    "letter-spacing": parseArbitrary(token) || "",
  }));

  // Flex & Grid
  engine.addRule(/^(flex|inline-flex|block|inline-block|grid)$/, (m) => ({
    display: m![1],
  }));
  engine.addRule(/^flex-(row|col)$/, (m) => ({
    "flex-direction": m![1] === "col" ? "column" : "row",
  }));
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

  // Grid columns
  engine.addRule(/^grid-cols-(\d+)$/, (m) => ({
    "grid-template-columns": `repeat(${m![1]}, minmax(0, 1fr))`,
  }));
  engine.addRule(/^grid-cols-\[([^\]]+)\]$/, (m, token) => ({
    "grid-template-columns": parseArbitrary(token) || "",
  }));

  // Grid rows
  engine.addRule(/^grid-rows-(\d+)$/, (m) => ({
    "grid-template-rows": `repeat(${m![1]}, minmax(0, 1fr))`,
  }));
  engine.addRule(/^grid-rows-\[([^\]]+)\]$/, (m, token) => ({
    "grid-template-rows": parseArbitrary(token) || "",
  }));

  //gaps
  engine.addRule(/^gap-(\d+)$/, (m) => ({ gap: `${+m![1] / baseRem}rem` }));
  engine.addRule(/^gap-\[([^\]]+)\]$/, (m) => ({ gap: m![1] }));

  // Borders & Radius
  engine.addRule(/^rounded$/, () => ({ "border-radius": "4px" }));
  engine.addRule(/^rounded-(sm|md|lg|xl|full)$/, (m) => {
    const map = opt.borderRadius || {
      sm: "0.25rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      full: "9999px",
    };

    return { "border-radius": map[m![1]] };
  });
  engine.addRule(/^rounded-\[([^\]]+)\]$/, (m, token) => ({
    "border-radius": parseArbitrary(token) || "",
  }));

  // Positioning
  engine.addRule(/^(absolute|relative|fixed|sticky)$/, (m) => ({
    position: m![1],
  }));
  engine.addRule(/^(top|right|bottom|left)-(\d+)$/, (m) => ({
    [m![1]]: `${m![2]}px`,
  }));
  engine.addRule(/^(top|right|bottom|left)-\[([^\]]+)\]$/, (m, token) => ({
    [m![1]]: parseArbitrary(token) || "",
  }));
  engine.addRule(/^z-(\d+)$/, (m) => ({ "z-index": m![1] }));

  // Other utilities
  engine.addRule(/^opacity-(\d+)$/, (m) => ({ opacity: `${+m![1] / 100}` }));
  engine.addRule(/^cursor-(pointer|default|not-allowed)$/, (m) => ({
    cursor: m![1],
  }));
  engine.addRule(/^overflow-(hidden|auto|scroll|clip|visible)$/, (m) => ({
    overflow: m![1],
  }));
  engine.addRule(
    /^overflow(?:-(x|y))?-(hidden|auto|scroll|clip|visible)$/,
    (m) => {
      const axis = m![1];
      const val = m![2];

      const result: Record<string, string> = {};
      if (!axis) {
        result.overflow = val;
      } else if (axis === "x") {
        result["overflow-x"] = val;
      } else {
        result["overflow-y"] = val;
      }

      return result;
    }
  );

  engine.addRule(/^shadow$/, () => ({
    "box-shadow": "0 1px 2px rgba(0,0,0,0.1)",
  }));
  engine.addRule(/^shadow-lg$/, () => ({
    "box-shadow": "0 4px 6px rgba(0,0,0,0.1)",
  }));
  engine.addRule(/^shadow-\[([^\]]+)\]$/, (m, token) => ({
    "box-shadow": parseArbitrary(token) || "",
  }));

  // Variants
  engine.addVariant({
    prefix: "hover:",
    wrap: (css) => css.replace(/^(\.[^{\s]+)(\s*{)/, "$1:hover$2"),
  });
  engine.addVariant({
    prefix: "focus:",
    wrap: (css) => css.replace(/^(\.[^{\s]+)(\s*{)/, "$1:focus$2"),
  });

  (opt.customVariants || []).forEach(({ prefix, wrap }) =>
    engine.addVariant({ prefix, wrap })
  );

  // Theme variants
  if (opt.themes) {
    Object.entries(opt.themes).forEach(([themeName, selector]) => {
      const cls = selector.startsWith(".") ? selector : `.${selector}`; // add dot if missing
      engine.addVariant({
        prefix: `${themeName}:`,
        wrap: (css) => css.replace(/^(\.[^{\s]+)(\s*{)/, `${cls} $1$2`),
      });
    });
  }

  // Responsive breakpoints
  Object.entries(breakpoints).forEach(([prefix, minWidth]) =>
    engine.addMediaQuery(prefix, minWidth)
  );

  return engine;
}
