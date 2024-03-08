import unwrap_expression from './unwrap_field.js';

/**
 * Field Format
 * @typedef {object} FieldFormat
 * @property {string} [original] - The original field expression
 * @property {string} expression - The field expression
 * @property {string} label - The label
 * @property {boolean} [agg] - Is this an aggregate function
 */

/**
 * Format a field expression
 * @param {string} original - The original field expression
 * @param {string} label - The label
 * @param {string} table_prefix - The table prefix
 * @param {string} label_prefix - The label prefix
 * @returns {FieldFormat} - The field format
 */
export default function field_format(
	original,
	label,
	table_prefix,
	label_prefix
) {
	const {field, prefix, suffix, value} = unwrap_expression(original);

	if (value !== undefined) {
		return {
			label,
			expression: value,
		};
	}

	// Split it...
	const a = field.split('.');
	const name = a.pop();
	const address = a.join('.');

	// Prefix the label to show depth
	if (label_prefix) {
		// Does the expression contain a nested address?
		if (address) {
			// Deduct the nested address from the label_prefix
			label_prefix = label_prefix.slice(
				0,
				label_prefix.lastIndexOf(address)
			);
		}

		label = `${label_prefix}${label || name}`;
	}

	label = label || undefined;

	// Expression
	const expression = `${prefix || ''}${table_prefix}.${name}${suffix || ''}`;

	// Aggregate function flag
	let agg = false;

	if (
		prefix &&
		/\b(?:SUM|COUNT|AVG|MAX|MIN|GROUP_CONCAT)\(/.test(prefix.toUpperCase())
	) {
		agg = true;
	}

	return {
		original,
		expression,
		label,
		agg,
	};
}
