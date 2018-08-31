const DareError = require('./error');

module.exports = function unwrap_field(expression, formatter = (obj => obj)) {

	if (typeof expression === 'string') {

		let m;
		let str = expression;
		let suffix = '';
		let prefix = '';

		while ((m = str.match(/^([a-z]+\()(.*)(\))$/i))) {
			// Change the string to match the inner string...
			str = m[2];

			// Capture the suffix,prefix
			prefix += m[1];
			suffix = m[3] + suffix;

			//split out comma variables
			let int_m;
			while ((int_m = str.match(/(.*)(,\s*((["'])?[a-z0-9%_\s]+?\4))$/i))) {
				str = int_m[1];
				suffix = int_m[2] + suffix;
			}

			//deal with math on string
			// testing for * (multiplication for now) and only when inside a round as a precaution
			if (str && m[1].toLowerCase() === 'round(') {
				//split out multiplication
				const int_x = str.match(/(.*)(\s\*\s[0-9]+)$/i);

				if (int_x) {
					str = int_x[1];
					suffix = int_x[2] + suffix;
				}
			}
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
