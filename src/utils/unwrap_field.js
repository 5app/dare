const DareError = require('./error');

module.exports = function unwrap_field(expression, formatter = (obj => obj)) {

	if (typeof expression === 'string') {

		let m;
		let str = expression;
		let suffix = '';
		let prefix = '';

		while ((m = str.match(/^([a-z_]+\()(.*)(\))$/i))) {
			// Change the string to match the inner string...
			str = m[2];

			// Capture the suffix,prefix
			prefix += m[1];
			suffix += m[3];
		}

		// Remove any additional prefix in a function.. i.e. "YEAR_MONTH FROM " from "EXTRACT(YEAR_MONTH FROM field)"
		if (prefix && str && (m = str.match(/^[a-z_\s]+\s/i))) {
			prefix += m[0];
			str = str.slice(m[0].length);
		}

		// Finally check that the str is a match
		if (str.match(/^[a-z0-9$._*]*$/i)) {

			const field = str;
			const a = str.split('.');
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