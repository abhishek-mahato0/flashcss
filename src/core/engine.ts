// src/core/engine.ts
export type CSSObject = Record<string, string>;
export type RuleBodyFn = (
  captures: RegExpMatchArray | null,
  token: string
) => CSSObject | null;

export interface RuleEntry {
  re: RegExp;
  body: RuleBodyFn;
}

export type Shortcut = {
  match: (token: string) => boolean;
  expand: (token: string) => string[];
};

export type VariantHandler = {
  prefix: string;
  wrap: (cssBlock: string) => string;
};

export class MiniCSSEngine {
  private rules: RuleEntry[] = [];
  private shortcuts: Shortcut[] = [];
  private variants: VariantHandler[] = [];
  private produced = new Map<string, string>(); // token -> block

  addRule(re: RegExp, body: RuleBodyFn) {
    this.rules.push({ re, body });
  }

  addShortcut(sc: Shortcut) {
    this.shortcuts.push(sc);
  }

  addVariant(v: VariantHandler) {
    this.variants.push(v);
  }

  addMediaQuery(prefix: string, minWidth: number) {
    this.addVariant({
      prefix: prefix + ":",
      wrap: (cssBlock: string) => {
        return `@media (min-width: ${minWidth}) {\n${cssBlock}\n}`;
      },
    });
  }
  // Expand shortcut token to list of tokens (e.g., btn -> px-4 py-2 bg-blue)
  private expandShortcuts(token: string): string[] {
    for (const sc of this.shortcuts) {
      if (sc.match(token)) return sc.expand(token);
    }
    return [token];
  }

  // Peel variants from left until none match (support chaining like sm:hover:bg-red)
  private peelVariants(token: string): {
    base: string;
    wrappers: ((s: string) => string)[];
  } {
    const wrappers: ((s: string) => string)[] = [];
    let base = token;

    // repeat until no prefix found
    let again = true;
    while (again) {
      again = false;
      for (const v of this.variants) {
        if (base.startsWith(v.prefix)) {
          base = base.slice(v.prefix.length);
          wrappers.push(v.wrap);
          again = true;
          break;
        }
      }
    }
    return { base, wrappers };
  }

  private matchRule(
    token: string
  ): { cssObj: CSSObject; selector?: string } | null {
    for (const r of this.rules) {
      const m = token.match(r.re);
      if (m) {
        const obj = r.body(m, token);
        if (obj && Object.keys(obj).length > 0) {
          return { cssObj: obj };
        }
      }
    }
    return null;
  }

  // Convert CSSObject to css text for a selector
  private objectToCSS(selector: string, obj: CSSObject): string {
    const props = Object.entries(obj)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n");
    return `${selector} {\n${props}\n}`;
  }

  // Generate CSS for a space-separated list of tokens
  generate(input: string): string {
    const tokens = input.split(/\s+/).filter(Boolean);
    const blocks: string[] = [];

    for (const raw of tokens) {
      // expand shortcuts
      const expanded = this.expandShortcuts(raw);
      for (const tok of expanded) {
        // handle variants
        const { base, wrappers } = this.peelVariants(tok);
        // match a rule
        const matched = this.matchRule(base);
        if (!matched) continue;

        // escape selector dots/colons and brackets properly
        const esc = raw
          .replace(/([\[\]\s])/g, (m) => (m === " " ? "_" : `\\${m}`))
          .replace(/:/g, "\\:");
        const selector = `.${esc}`;

        // if we've already produced this exact selector+rules, skip
        const key = selector + JSON.stringify(matched.cssObj) + wrappers.length;
        if (this.produced.has(key)) continue;

        let block = this.objectToCSS(selector, matched.cssObj);

        // apply wrappers in reverse order (outermost variant should wrap outer)
        for (let i = wrappers.length - 1; i >= 0; i--) {
          block = wrappers[i](block);
        }

        this.produced.set(key, block);
        blocks.push(block);
      }
    }

    return blocks.join("\n");
  }
}
