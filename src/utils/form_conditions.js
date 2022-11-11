/**
 * Create form Conditions
 * @param {string} tbl_alias - SQL Alias table reference
 * @param {string} field - Field
 * @param {string} condition - And comparison to perform agains the field
 * @returns {string}
 */

export default function formCondition(tbl_alias, field, condition) {

	const field_definition = `${tbl_alias}.${field}`;

	// Insert the field name in place
	return condition.includes('$$') ? condition.replace(/\$\$/g, field_definition) : `${field_definition} ${condition}`;

}
