import DareError from './error.js';

/**
 * Validate the body of a POST request
 * @param {object} body - The body of the request
 * @returns {void}
 * @throws {DareError} - If the body is invalid
 */
export default function validate_body(body) {
	if (
		!body ||
		typeof body !== 'object' ||
		Object.keys(body).length === 0 ||
		(Array.isArray(body) && body.length === 0)
	) {
		throw new DareError(
			DareError.INVALID_REQUEST,
			`The body ${body ? JSON.stringify(body) : body} is invalid`
		);
	}
}
