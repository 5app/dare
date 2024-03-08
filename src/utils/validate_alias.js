import DareError from './error.js';

/**
 * Validate an alias
 * @param {string} key - The alias
 * @returns {void}
 * @throws {DareError} - If the alias is invalid
 */
export default function validate_alias(key) {
	const [name, label] = key.split('$');

	// Capture errors in the key
	if (!name.match(/^[_a-z]+$/i) || (label && !label.match(/^\w+$/i))) {
		throw new DareError(
			DareError.INVALID_REFERENCE,
			`The table reference '${key}' must match [a-z_]+($[a-z0-9_]+)`
		);
	}
}
