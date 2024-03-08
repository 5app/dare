/**
 * Join paths
 * Given two strings, e.g. 'this.is.not' and 'is.not.over'
 * Find the over laping section in this case 'is.not'
 * Return the various parts as an array ['this', '.is.not', '.over']
 * @param {string} a - The first path
 * @param {string} b - The second path
 * @returns {string} - The relative path
 */
export default function pathJoin(a, b) {
	let path = b;

	/*
	 * Remove chunks off the end of the second string and see if it matches the end of the first
	 * Continue to do this
	 */
	while (path && !a.endsWith(path)) {
		// What is the position of the separator
		const i = path.lastIndexOf('.', path.length - 2);

		if (i <= 0) {
			// No, this is relative field
			path = '';
			break;
		}

		path = path.slice(0, i + 1);
	}

	return b.slice(path.length);
}
