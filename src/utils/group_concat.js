
// Wrap all the fields in a GROUP_CONCAT statement
module.exports = function group_concat(fields) {

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

	field = `CONCAT('[', GROUP_CONCAT(${field}), ']')`;
	alias = `[${alias}]`;

	return {
		field,
		alias
	};
};

// function escape(str) {
// 	return str.replace(/\"/g, '\\"');
// }
