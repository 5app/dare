// Prevent a bad format from killing the service, instead return undefined

/**
 * Parse JSON
 * @param {string} value - The value to parse
 * @returns {any} - The parsed value
 */
export default function JSONParse(value) {
	try {
		// Ensure Buffers are converted..
		if (Buffer.isBuffer(value)) {
			value = value.toString();
		}

		// TODO: @legacy versions do not use JSON_ARRAY and so we pass the version here...
		if (typeof value !== 'string') {
			return value;
		}

		return JSON.parse(
			value
				.replace(/\t/g, '\\t')
				.replace(/\n/g, '\\n')
				.replace(/\r/g, '\\r')
				.replace(/\f/g, '\\f')
		);
	} catch {
		// Continue
	}
}
