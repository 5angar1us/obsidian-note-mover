import { normalizePath as obsidianNormalizePath } from "obsidian";

export type NormalizedPath = string & { __brand: "normalized_path" };

export function normalizePath(path: string): NormalizedPath {
    return obsidianNormalizePath(path) as NormalizedPath;
}