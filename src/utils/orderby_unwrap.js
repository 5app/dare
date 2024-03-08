/**
 * @typedef {"" | "asc" | "desc"} DirectionType
 */

/**
 * Unwrap the orderBy string into field and direction
 * @param {string} str - The orderBy string
 * @returns {{field: string, direction: DirectionType}} - The unwrapped orderBy
 */
export default function orderByUnwrap(str) {
	/** @type {DirectionType} */
	let direction = '';
	const field = str.replace(/\s*(?:desc|asc)$/i, m => {
		direction = /** @type {DirectionType} */ (m.toUpperCase());
		return '';
	});

	return {
		field,
		direction,
	};
}
