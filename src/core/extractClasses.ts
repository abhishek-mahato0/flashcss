// src/core/extractClasses.ts
import { diffLines } from "diff";
import fs from "fs";
import { glob } from "glob";

/**
 * NOTE: This extractor is intentionally simple and regex-based.
 * For production-grade extraction, use AST parsing (babel/esbuild) to handle dynamic templates.
 */

const CLASS_REGEX = /(?:class|className|:class)\s*=\s*["'`]([^"'`]+)["'`]/g;

// also capture simple template literal forms: className={`p-${size}`} -> we capture inner string segments only
const TEMPLATE_REGEX = /class(Name)?\s*=\s*{?\s*`([^`]+)`\s*}?/g;

export function extractClasses(): string[] {
  const files = glob.sync("src/**/*.{tsx,jsx,js,ts,html}");
  const classes: string[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      let m: RegExpExecArray | null;
      while ((m = CLASS_REGEX.exec(content)) !== null) {
        classes.push(...m[1].split(/\s+/).filter(Boolean));
      }
      while ((m = TEMPLATE_REGEX.exec(content)) !== null) {
        classes.push(...m[2].split(/\s+/).filter(Boolean));
      }
    } catch {
      // skip unreadable files
    }
  }

  return Array.from(new Set(classes));
}

export function extractClassesFromString(input: string): string[] {
  const classes: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = CLASS_REGEX.exec(input)) !== null) {
    classes.push(...m[1].split(/\s+/).filter(Boolean));
  }
  while ((m = TEMPLATE_REGEX.exec(input)) !== null) {
    classes.push(...m[2].split(/\s+/).filter(Boolean));
  }
  return Array.from(new Set(classes));
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
  newContent: string
): string {
  const diffs = diffLines(oldContent, newContent);
  let changedLines: string = "";
  diffs.forEach((part) => {
    if (part.added) {
      changedLines += part.value + "\n";
    }
  });
  return changedLines;
}

export const getFileLength = (content: string): number => {
  const lines = content.split(/\r?\n/);
  const classLines = lines.filter(
    (line) => line.includes("class=") || line.includes("className=")
  );
  return classLines.length;
};
