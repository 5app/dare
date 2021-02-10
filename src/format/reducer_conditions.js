const DareError = require('../utils/error');

const checkKey = require('../utils/validate_field');
const checkTableAlias = require('../utils/validate_alias');
const formatDateTime = require('../utils/format_datetime');
const getFieldAttributes = require('../utils/field_attributes');

/**
 * Reduce conditions, call extract
 *
 * @param {object} filter - Filter conditions
 * @param {object} options - Options object
 * @param {Function} options.extract - Extract (key, value) related to nested model
 * @param {string} options.propName - PropName, e.g. 'filter', 'join'
 * @param {object} options.table_schema - Table schema
 * @returns {Array} Conditions object converted to SQL
 */
module.exports = function reduceConditions(filter, {extract, propName, table_schema}) {

	const filterArr = [];

	// Filter must be an object with key=>values
	if (typeof filter !== 'object') {

		throw new DareError(DareError.INVALID_REFERENCE, `The ${propName} '${filter}' is invalid.`);

	}

	// Explore the filter for any table joins
	for (let key in filter) {

		let value = filter[key];

		// Explode -key.path:value
		const {rootKey, negate, subKey} = stripKey(key);

		// Update rootKey, this is stripped of negation prefix and sub paths
		key = rootKey;

		if (subKey) {

			value = {[`${negate ? '-' : ''}${subKey}`]: value};

		}

		if (value && typeof value === 'object' && !Array.isArray(value)) {

			// Check this is a path
			checkTableAlias(key);

			// Add it to the join table
			extract(key, value);

		}
		else {

			// Format key and validate path
			key = checkKey(key);

			const key_definition = table_schema[key];
			filterArr.push(prepCondition(key, value, key_definition, negate));

		}

	}

	return filterArr;

};

/**
 * Strip the key, removing the negate prefix, and any shorthand nested properties
 * @param {string} key - Full length key, e.g. table, field, or `-root.path`
 * @returns {object} Containing the parts of the key
 */
function stripKey(key) {

	let negate = false;

	// Does this have a negate operator?
	if (key.substring(0, 1) === '-') {

		// Mark as negative filter
		negate = true;

		// Strip the key
		key = key.substring(1);

	}

	const [rootKey, subKey] = key.split(/\.(.*)/);

	return {rootKey, subKey, negate};

}

function prepCondition(field, value, key_definition, negate) {

	const {type, alias} = getFieldAttributes(key_definition);

	if (alias) {

		// The key definition says the key is an alias
		field = alias;

	}

	if (type === 'datetime') {

		value = formatDateTime(value);

	}

	// Set the default negate operator, if appropriate
	negate = negate ? 'NOT ' : '';

	/*
	 * Range
	 * A range is denoted by two dots, e.g 1..10
	 */
	let condition;
	let values;
	const a = (typeof value === 'string') && value.split('..');

	if (a.length === 2) {

		if (a[0] && a[1]) {

			condition = 'BETWEEN ? AND ?';
			values = a;

		}
		else if (a[0]) {

			condition = '$$ > ?';
			values = [a[0]];

		}
		else {

			condition = '$$ < ?';
			values = [a[1]];

		}

		if (negate) {

			condition = `(NOT ${condition} OR $$ IS NULL)`;
			negate = '';

		}

	}

	// Not match
	else if (typeof value === 'string' && value[0] === '!') {

		condition = 'LIKE ?';
		values = [value.slice(1)];
		negate = 'NOT ';

	}

	// String partial match
	else if (typeof value === 'string' && value.match('%')) {

		condition = 'LIKE ?';
		values = [value];

	}

	// Null
	else if (value === null) {

		condition = `IS ${negate}NULL`;
		values = [];
		negate = ''; // Already negated

	}

	// Add to the array of items
	else if (Array.isArray(value) && value.length > 0) {

		// Sub
		const sub_values = [];
		const conds = [];

		// Clone the values
		value = [...value];

		// Filter the results of the array...
		value = value.filter(item => {

			// Remove the items which can't in group statement...
			if (item !== null && !(typeof item === 'string' && item.match('%'))) {

				return true;

			}

			// Put into a separate list...
			sub_values.push(item);

			return false;

		});

		// Use the `IN(...)` for items which can be grouped...
		if (value.length) {

			conds.push(`${negate}IN (${value.map(() => '?')})`);

		}

		// Other Values which can't be grouped ...
		if (sub_values.length) {

			// Cond
			sub_values.forEach(item => {

				const [, cond, values] = prepCondition(null, item, key_definition, negate);

				// Add to condition
				conds.push(cond);

				// Add Values
				value.push(...values);

			});

		}

		if (conds.length === 1) {

			condition = conds[0];

		}
		else {

			// Join...
			condition = `(${conds.map(cond => `$$ ${cond}`).join(negate ? ' AND ' : ' OR ')})`;

		}

		negate = ''; // Already negated

		values = value;

	}

	/*
	 * Request filter includes empty array of possible values
	 * @todo break execution and return empty resultset.
	 * This workaround adds SQL `...AND false` to the conditions which makes the response empty
	 */
	else if (Array.isArray(value) && value.length === 0) {

		// If the filter array is empty, then if negated ignore it (... AND true), else exclude everything (... AND false)
		condition = `AND ${Boolean(negate)}`;
		values = [];
		negate = ''; // Already negated

	}
	else {

		condition = '= ?';
		values = [value];
		negate = negate ? '!' : '';

	}

	return [field, negate + condition, values];

}
