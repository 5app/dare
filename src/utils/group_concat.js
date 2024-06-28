import semverCompare from 'semver-compare';
/*
 * Generate GROUP_CONCAT statement given an array of fields definitions
 * Label the GROUP CONCAT(..) AS 'address[fields,...]'
 * Wrap all the fields in a GROUP_CONCAT statement
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
	if (
		process.env.DB_ENGINE &&
		semverCompare(process.env.DB_ENGINE.split(':').at(1), '5.7') < 0
	) {
		expression = fields.map(
			field =>
				`'"', REPLACE(REPLACE(${field.expression}, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"'`
		);
		expression = `CONCAT_WS('', '[', ${expression.join(", ',', ")}, ']')`;
	} else {

		// JSON_ARRAY in postgres default to ABSENT ON NULL, so we need to add NULL ON NULL
		const json_array_settings = process.env.DB_ENGINE?.startsWith('postgres') ? ' NULL ON NULL' : '';

		expression = fields.map(field => field.expression);
		expression = `JSON_ARRAY(${expression.join(',')}${json_array_settings})`;
	}

	if (agg) {
		return {
			expression,
			label,
		};
	}

	// Multiple
	if (
		process.env.DB_ENGINE &&
		semverCompare(process.env.DB_ENGINE.split(':').at(1), '5.7.21') <= 0
	) {
		expression = `CONCAT('[', GROUP_CONCAT(IF(${sql_alias}.${rowid} IS NOT NULL, ${expression}, NULL)), ']')`;
	} else {
		expression = `JSON_ARRAYAGG(CASE WHEN (${sql_alias}.${rowid} IS NOT NULL) THEN (${expression}) ELSE NULL END)`;
	}

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
