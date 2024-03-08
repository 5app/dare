/* eslint-disable jsdoc/valid-types */
/**
 * @typedef {import('./field_format.js').FieldFormat} FieldFormat
 */
/* eslint-enable jsdoc/valid-types */

/**
 * Generate GROUP_CONCAT statement given an array of fields definitions
 * Label the GROUP CONCAT(..) AS 'address[fields,...]'
 * Wrap all the fields in a GROUP_CONCAT statement
 *
 * @param {Array<FieldFormat>} fields - The fields to group
 * @param {string} address - The address of the fields
 * @param {string} sql_alias - The SQL alias of the table
 * @param {string} rowid - The rowid field _rowid
 * @returns {{expression: string, label: string}} - The field definition and the label
 */
export default function group_concat(fields, address = '', sql_alias, rowid) {
	// Is this an aggregate list?
	const agg = fields.reduce(
		(prev, curr) => prev || curr.agg || curr.label.indexOf(address) !== 0,
		false
	);
	let label = fields.map(field => field.label).join(',');
	let expression;

	// Return solitary value
	if (agg && fields.length === 1) {
		expression = fields[0].expression;
		return {
			expression,
			label,
		};
	}

	// Convert to JSON Array
	if (process.env.MYSQL_VERSION === '5.6') {
		expression = fields.map(
			field =>
				`'"', REPLACE(REPLACE(${field.expression}, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"'`
		);
		expression = `CONCAT_WS('', '[', ${expression.join(", ',', ")}, ']')`;
	} else {
		expression = fields.map(field => field.expression);
		expression = `JSON_ARRAY(${expression.join(',')})`;
	}

	if (agg) {
		return {
			expression,
			label,
		};
	}

	// Multiple
	expression = `CONCAT('[', GROUP_CONCAT(IF(${sql_alias}.${rowid} IS NOT NULL, ${expression}, NULL)), ']')`;

	label = fields
		.map(field => {
			const {label} = field;
			// Trim the parent address from the start of the label
			return label.slice(address.length);
		})
		.join(',');

	label = `${address.slice(0, address.lastIndexOf('.'))}[${label}]`;

	return {
		expression,
		label,
	};
}
