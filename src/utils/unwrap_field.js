const error = require('./error');

module.exports = function unwrap_field(expression) {

	const m = typeof expression === 'string' && expression.match(/^(([a-z\_]+)\(([a-z\_]+\s)*)*([a-z0-9\.\_\*]+?)(\))*$/i);

	if (m) {
		const field = m[4];
		const prefix = m[1] || '';
		const suffix = m[5] || '';

		if ((prefix.match(/\(/g) || []).length === suffix.length) {

			// This passes the test
			return {
				field,
				prefix,
				suffix
			};
		}
	}

	// Is this a valid field
	throw Object.assign(error.INVALID_REFERENCE, {
		message: `The field definition '${expression}' is invalid.`
	});
};
