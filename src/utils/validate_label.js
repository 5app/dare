import DareError from './error.js';

/**
 * Validate a label
 * @param {string} label - The label
 * @returns {void}
 * @throws {DareError} - If the label is invalid
 */
export default function validate_label(label) {
	const reg = /^[^"'?`]+$/i;

	// Capture errors in the key
	if (!label.match(reg)) {
		throw new DareError(
			DareError.INVALID_REFERENCE,
			`The label '${label}' must match ${reg}`
		);
	}
}
