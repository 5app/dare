
// Wrap all the fields in a GROUP_CONCAT statement
module.exports = function group_concat(fields, address = '') {

	// Is this an aggregate list?
	const agg = fields.reduce((prev, curr) => (prev || curr.agg), false);
	let alias = fields.map(field => field.label || field.expression).join(',');
	let field;

	// Return solitary value
	if (agg && fields.length === 1) {
		field = fields[0].expression;
		return {
			field,
			alias,
			decode: null
		};
	}

	// convert to JSON Array
	// fields = fields.map(field => `'"${escape(field.label || field.expression)}":', '"', REPLACE(${field.def}, '"', '\\"'), '"'`);
	field = fields.map(field => `'"', REPLACE(${field.expression}, '"', '\\"'), '"'`);
	field = `CONCAT('[', ${field.join(', \',\', ')}, ']')`;
	if (agg) {
		return {
			field,
			alias
		};
	}

	// Multiple
	field = `CONCAT('[', GROUP_CONCAT(${field}), ']')`;

	alias = fields.map(field => {
		const label = (field.label || field.expression);
		// trim the parent address from the start of the label
		return label.indexOf(address) === 0 ? label.slice(address.length) : label;
	}).join(',');

	alias = `${address.slice(0, address.lastIndexOf('.'))}[${alias}]`;

	return {
		field,
		alias
	};
};

// function escape(str) {
// 	return str.replace(/\"/g, '\\"');
// }
