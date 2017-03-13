
module.exports = function field_format(expression, label, table_prefix, label_prefix) {

	const m = expression.match(/^(([a-z\_]+)\((DISTINCT\s)?)*([a-z0-9\.\_\*]+?)(\))*$/i);

	const path = m[4];
	const fn = m[2];
	const prefix = m[1];
	const suffix = m[5];

	// Split it...
	const a = path.split('.');
	const name = a.pop();
	const address = a.join('.');


	// Prefix the label to show depth
	if (label_prefix) {

		// Does the expression contain a nested address?
		if (address) {
			// Deduct the nested address from the label_prefix
			label_prefix = label_prefix.slice(0, label_prefix.lastIndexOf(address));
		}

		label = `${label_prefix}${label || name}`;
	}

	label = label || undefined;

	// Expression
	expression = `${prefix || ''}${table_prefix}.${name}${suffix || ''}`;

	// Else if this is a *
	if (name === '*') {
		expression = `${prefix || ''}*${suffix || ''}`;
	}

	// aggregate function flag
	let agg = false;

	if (prefix && ['SUM', 'COUNT', 'AVG', 'MAX', 'MIN', 'GROUP_CONCAT'].includes(fn.toUpperCase())) {
		agg = true;
	}

	return {expression, label, agg};
};
