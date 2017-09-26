const DareError = require('./error');

module.exports = function unwrap_field(expression, formatter = (obj => obj)) {

	const m = typeof expression === 'string' && expression.match(/^(([a-z_]+)\(([a-z_]+\s)*)*([a-z0-9$._*]+?)(\))*$/i);

	if (m) {
		const field = m[4];
		const prefix = m[1] || '';
		const suffix = m[5] || '';

		if ((prefix.match(/\(/g) || []).length === suffix.length) {

			const a = field.split('.');
			const field_name = a.pop();
			const field_path = a.join('.');

			// This passes the test
			return formatter({
				field,
				field_name,
				field_path,
				prefix,
				suffix
			});
		}
	}

	// Is this a valid field
	throw new DareError(DareError.INVALID_REFERENCE, `The field definition '${expression}' is invalid.`);
};