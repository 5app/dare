/**
 * Rewrite relative `.ts` import specifiers to `.js` in the emitted
 * declaration files, so they resolve to the neighbouring `.d.ts` files
 * when consumed by TypeScript.
 */
import fs from 'node:fs';
import path from 'node:path';

const TYPES_DIR = 'types';

/**
 * Walk a directory recursively, rewriting `.ts` specifiers in `.d.ts` files
 * @param dir - Directory to walk
 * @returns void
 */
function walk(dir: string): void {
	for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
		const file = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(file);
		} else if (file.endsWith('.d.ts')) {
			const content = fs.readFileSync(file, 'utf8');
			const rewritten = content.replace(
				/(?<specifier>from\s+'\.\.?\/[^']*)\.ts'/g,
				"$<specifier>.js'"
			);
			if (rewritten !== content) {
				fs.writeFileSync(file, rewritten);
			}
		}
	}
}

walk(TYPES_DIR);
