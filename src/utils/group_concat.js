
// Wrap all the fields in a GROUP_CONCAT statement
module.exports = function group_concat(fields, address = '') {

	// Is this an aggregate list?
	const agg = fields.reduce((prev, curr) => (prev || curr.agg), false);
	let label = fields.map(field => field.label || field.expression).join(',');
	let expression;

	// Return solitary value
	if (agg && fields.length === 1) {
		expression = fields[0].expression;
		return {
			expression,
			label
		};
	}

	// convert to JSON Array
	// fields = fields.map(field => `'"${escape(field.label || field.expression)}":', '"', REPLACE(${field.def}, '"', '\\"'), '"'`);
	expression = fields.map(field => `'"', REPLACE(${field.expression}, '"', '\\"'), '"'`);
	expression = `CONCAT('[', ${expression.join(', \',\', ')}, ']')`;
	if (agg) {
		return {
			expression,
			label
		};
	}

	// Multiple
	expression = `CONCAT('[', GROUP_CONCAT(${expression}), ']')`;

	label = fields.map(field => {
		const label = (field.label || field.expression);
		// trim the parent address from the start of the label
		return label.indexOf(address) === 0 ? label.slice(address.length) : label;
	}).join(',');

	label = `${address.slice(0, address.lastIndexOf('.'))}[${label}]`;

	return {
		expression,
		label
	};
};

// function escape(str) {
// 	return str.replace(/\"/g, '\\"');
// }
