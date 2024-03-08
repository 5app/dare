/* eslint-disable security/detect-unsafe-regex */
/* eslint-disable prefer-named-capture-group */
import DareError from './error.js';

/**
 * Unwrap a field expression to its components
 * @typedef {object} UnwrappedField
 * @property {string} [field] - The field expression
 * @property {string} [field_name] - The field name
 * @property {string} [field_path] - The field path
 * @property {string} [prefix] - The prefix
 * @property {string} [suffix] - The suffix
 * @property {string} [suffix] - The suffix
 * @property {string} [value] - The value
 * @property {string} [direction] - The orderby field direction
 */

/**
 * Unwrap a field expression to its components
 * @param {string} expression - The field expression
 * @param {boolean} allowValue - Allow a value to be returned
 * @returns {UnwrappedField} - The unwrapped field or value
 */
export default function unwrap_field(expression, allowValue = true) {
	if (typeof expression === 'string') {
		let m;
		let str = expression;
		let suffix = '';
		let prefix = '';

		// Match a function, "STRING_DENOTES_FUNCTION(.*)"
		while ((m = str.match(/^(!?[_a-z]+\()(.*)(\))$/i))) {
			// Change the string to match the inner string...
			str = m[2];

			// Capture the suffix,prefix
			prefix += m[1];
			suffix = m[3] + suffix;

			let int_m;

			// Remove suffix tweaks
			if ((int_m = str.match(/(.*)(\s+ORDER BY 1)\s*$/))) {
				suffix = int_m[2] + suffix;
				str = int_m[1];
			}

			// Split out comma variables
			while (
				(int_m = str.match(
					/(.*)(,\s*((?<quote>["'])?[\s\w%./-]*\k<quote>))$/i
				))
			) {
				/*
				 * Is there an unquoted parameter
				 * Ensure there are no lowercase strings (e.g. column names)
				 */
				if (!int_m[4] && int_m[3] && int_m[3].match(/[a-z]/)) {
					// Is this a valid field
					throw new DareError(
						DareError.INVALID_REFERENCE,
						`The field definition '${expression}' is invalid.`
					);
				}

				str = int_m[1];
				suffix = int_m[2] + suffix;
			}

			/*
			 * Deal with math and operators against a value
			 */
			const int_x = str.match(
				/(.*)(\s((\*|\/|>|<|=|<=|>=|<>|!=)\s([\d.]+|((?<quote>["'])[\s\w%.-]*\k<quote>))|is null|is not null))$/i
			);

			if (int_x) {
				str = int_x[1];
				suffix = int_x[2] + suffix;
			}
		}

		// Does the string start with a negation (!) ?
		if (str && str.startsWith('!')) {
			prefix += '!';
			str = str.slice(1);
		}

		// Remove any additional prefix in a function.. i.e. "YEAR_MONTH FROM " from "EXTRACT(YEAR_MONTH FROM field)"
		if (prefix && str && (m = str.match(/^[\sA-Z_]+\s/))) {
			prefix += m[0];
			str = str.slice(m[0].length);
		}

		// Finally check that the str is a match
		if (str.match(/^[\w$*.]*$/)) {
			const field = str;
			const a = str.split('.');
			const field_name = a.pop();
			const field_path = a.join('.');

			const resp = {
				field,
				field_name,
				field_path,
				prefix,
				suffix,
			};

			// This passes the test
			return resp;
		}

		// Return value...
		if (allowValue) {
			if (str.length === 0 || /^(["'])[\s\w]+\1$/.test(str)) {
				return {
					value: expression,
				};
			}
		}
	}

	// Else if this is not a reference to a db field, pass as a value
	else if (
		(allowValue && typeof expression === 'number') ||
		expression === null ||
		typeof expression === 'boolean'
	) {
		return {
			value: expression,
		};
	}

	// Is this a valid field
	throw new DareError(
		DareError.INVALID_REFERENCE,
		`The field definition '${expression}' is invalid.`
	);
}
