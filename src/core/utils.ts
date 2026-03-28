// src/core/extractClasses.ts
import { diffLines } from "diff";
import fs from "fs";
import { glob } from "glob";

/**
 * NOTE: This extractor is intentionally simple and regex-based.
 * For production-grade extraction, use AST parsing (babel/esbuild) to handle dynamic templates.
 */

export function extractClasses(): string[] {
  const files = glob.sync("src/**/*.{tsx,jsx,js,ts,html}");
  const classes = new Set<string>();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const fileClasses = extractClassesFromString(content);
      for (const cls of fileClasses) {
        classes.add(cls);
      }
    } catch {
      // skip unreadable files
    }
  }

  return Array.from(classes);
}

/**
 * Extract potential CSS classes from a string (usually file content).
 * We scan for all string literals ('...', "...", `...`) and split their content.
 * This handles class="...", className={...}, template literals, and variables.
 */
export function extractClassesFromString(input: string): string[] {
  const classes = new Set<string>();

  function scan(str: string) {
    // We need a fresh regex for each level of nesting to avoid shared lastIndex issues
    const stringRegex = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
    let m: RegExpExecArray | null;

    while ((m = stringRegex.exec(str)) !== null) {
      const quote = m[1];
      const content = m[0].slice(1, -1);

      if (quote === "`") {
        // Recursively scan template literals to find nested strings in ${...}
        // but first extract static parts
        const staticParts = content.replace(/\$\{[\s\S]*?\}/g, " ");
        staticParts.split(/\s+/).forEach((t) => {
          if (t && !t.includes("${")) classes.add(t);
        });

        // Scan the inner content for more strings (like in ternaries)
        scan(content);
      } else {
        content.split(/\s+/).forEach((t) => {
          if (t) classes.add(t);
        });
      }
    }
  }

  scan(input);

  // Fallback: Also capture standard class="fixed-string" attributes
  let m: RegExpExecArray | null;
  const ATTR_REGEX = /(?:class|className|:class)\s*=\s*["'`]([^"'`]+)["'`]/g;
  while ((m = ATTR_REGEX.exec(input)) !== null) {
    m[1].split(/\s+/).forEach((c) => {
      if (c) classes.add(c);
    });
  }

  return Array.from(classes);
}

export function extractClassesFromFile(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return extractClassesFromString(content);
  } catch {
    return [];
  }
}

export function getOnlyChangedLines(
  oldContent: string,
  newContent: string,
): string {
  const diffs = diffLines(oldContent, newContent);
  let changedLines: string[] = [];
  const classRegex = /\b(className|class)\s*=/;
  diffs.forEach((part) => {
    if (part.added) {
      const lines = part.value.split(/\r?\n/);
      for (const line of lines) {
        if (line.trim() && classRegex.test(line)) {
          changedLines.push(line);
        }
      }
    }
  });
  return changedLines.join("\n");
}

export const getFileLength = (content: string): number => {
  const lines = content.split(/\r?\n/);
  const classLines = lines.filter(
    (line) => line.includes("class=") || line.includes("className="),
  );
  return classLines.length;
};
