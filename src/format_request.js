

const DareError = require('./utils/error');
const fieldReducer = require('./utils/field_reducer');
const groupbyReducer = require('./utils/groupby_reducer');
const orderbyReducer = require('./utils/orderby_reducer');
const checkKey = require('./utils/validate_field');
const checkTableAlias = require('./utils/validate_alias');
const formatDateTime = require('./utils/format_datetime');

module.exports = function(options) {

	return format_request.call(this, options);

};

async function format_request(options = {}) {

	// Use the alias to find the real table name
	if (!options.alias) {

		const alias = options.table;
		options.alias = alias;
		options.table = this.table_alias_handler(alias);

	}

	// Reject when the table is not recognised
	if (!options.table) {

		throw new DareError(DareError.INVALID_REFERENCE, `Unrecognized reference '${options.table}'`);

	}

	// Call bespoke table handler
	const method = this.options.method;
	const table = options.table;
	const handlers = this.options[method] || {};
	let handler;

	if (table in handlers) {

		handler = handlers[table];

	}
	else if ('default' in handlers) {

		handler = handlers.default;

	}
	if (handler) {

		// Trigger the handler which alters the options...
		await handler.call(this, options);

	}

	return format_specs.call(this, options);

}

async function format_specs(options) {

	const schema = this.options.schema || {};
	const table_schema = schema[options.table] || {};

	const joined = {};
	const filters = [];

	// Format filters
	{

		const filter = options.filter || {};

		// Filter must be an object with key=>values
		if (typeof filter !== 'object') {

			throw new DareError(DareError.INVALID_REFERENCE, `The filter '${filter}' is invalid.`);

		}

		// Explore the filter for any table joins
		for (let key in filter) {

			const value = filter[key];

			if (value && typeof value === 'object' && !Array.isArray(value)) {

				// Check this is a path
				checkTableAlias(key);

				// Add it to the join table
				joined[key] = joined[key] || {};
				joined[key].filter = Object.assign(joined[key].filter || {}, value);

			}
			else {

				let negate = false;

				// Does this have a negate operator?
				if (key.substring(0, 1) === '-') {

					// Mark as negative filter
					negate = true;

					// Strip the key
					key = key.substring(1);

				}

				// Check this is a path
				checkKey(key);

				const key_definition = table_schema[key];
				filters.push(prepCondition(key, value, key_definition, negate));

			}

		}

	}

	// Set the prefix if not already
	options.field_alias_path = options.field_alias_path || '';

	// Format fields
	let fields = options.fields;
	if (fields) {

		// Fields must be an array, or a dictionary (aka object)
		if (typeof fields !== 'object') {

			throw new DareError(DareError.INVALID_REFERENCE, `The field definition '${fields}' is invalid.`);

		}

		// Make the fields an array
		if (!Array.isArray(fields)) {

			fields = [fields];

		}

		// Filter out child fields
		fields = fields.reduce(fieldReducer.call(this, options.field_alias_path, joined, table_schema), []);

	}

	// Format conditional joins
	if (options.join) {

		const _join = {};
		const join = options.join;

		// Filter must be an object with key=>values
		if (typeof join !== 'object') {

			throw new DareError(DareError.INVALID_REFERENCE, `The join '${join}' is invalid.`);

		}

		// Explore the filter for any table joins
		for (const key in join) {

			const value = join[key];

			if (value && typeof value === 'object' && !Array.isArray(value)) {

				// Check this is a path
				checkTableAlias(key);

				// Add it to the join table
				joined[key] = joined[key] || {};
				joined[key].join = Object.assign(joined[key].join || {}, value);

			}
			else {

				_join[key] = value;

			}

		}

		// Set the reduced condtions
		options.join = _join;

	}

	/*
	 * Groupby
	 * If the content is grouped
	 */
	if (options.groupby) {

		// Explode the group formatter...
		options.groupby = toArray(options.groupby).reduce(groupbyReducer(options.field_alias_path || `${options.alias}.`, joined), []);

	}

	/*
	 * Orderby
	 * If the content is ordered
	 */
	if (options.orderby) {

		// Reduce
		options.orderby = toArray(options.orderby).reduce(orderbyReducer(options.field_alias_path || `${options.alias}.`, joined), []);

	}

	// Update the joined tables
	options.joined = joined;
	this.table_handler(options);
	delete options.joined;

	// Update the filters to be an array
	options._filter = filters.length ? filters : null;

	// Update the fields
	options.fields = fields;

	// Join
	if (options.join) {

		const _join = [];
		const join = options.join;

		for (let key in join) {

			const value = join[key];

			let negate = false;

			// Does this have a negate operator?
			if (key.substring(0, 1) === '-') {

				// Mark as negative filter
				negate = true;

				// Strip the key
				key = key.substring(1);

			}

			// Check this is a path
			checkKey(key);

			const key_definition = table_schema[key];
			_join.push(prepCondition(key, value, key_definition, negate));

		}
		options._join = _join;

	}

	// Set default limit
	limit(options, this.MAX_LIMIT);


	// Joins
	{

		const joins = options.joins || [];

		// Add additional joins which have been derived from nested fields and filters...
		for (const alias in joined) {

			// Furnish the join table a little more...
			const join_object = Object.assign(joined[alias], {
				alias,
				field_alias_path: `${options.field_alias_path + alias}.`
			});

			if (!join_object.table) {

				join_object.table = this.table_alias_handler(alias);

			}

			/*
			 * Do the smart bit...
			 * Augment the join object, with additional 'conditions'
			 */
			const new_join_object = this.join_handler(join_object, options);

			// Reject if the join handler returned a falsy value
			if (!new_join_object) {

				throw new DareError(DareError.INVALID_REFERENCE, `Could not understand field '${alias}'`);

			}

			// Help the GET parser

			// Does this contain a nested filter?
			join_object.has_filter = new_join_object.has_filter = !!join_object.filter;

			// Does this contain nested fields
			join_object.has_fields = new_join_object.has_fields = !!(Array.isArray(join_object.fields) ? join_object.fields.length : join_object.fields);

			// Update the request with this table join
			joins.push(new_join_object);

		}

		// Loop through the joins array
		if (joins.length) {

			// Loop through the joins and pass through the formatter
			const a = joins.map(join_object => {

				// Set the parent
				join_object.parent = options;

				// Format join...
				return format_request.call(this, join_object);

			});

			// Add Joins
			options._joins = await Promise.all(a);

		}

	}

	return options;

}


function limit(opts, MAX_LIMIT) {

	if (opts.limit === undefined) {

		opts.limit = 1;
		opts.single = true;

	}

	else {

		let limit = opts.limit;
		if (typeof limit === 'string' && limit.match(/^\d+$/)) {

			limit = +opts.limit;

		}
		if (isNaN(limit) || (MAX_LIMIT && limit > MAX_LIMIT) || limit < 1) {

			throw new DareError(DareError.INVALID_LIMIT, `Out of bounds limit value: '${limit}'`);

		}

	}

	let start = opts.start;

	if (start !== undefined) {

		if (typeof start === 'string' && start.match(/^\d+$/)) {

			start = +opts.start;

		}
		if (typeof start !== 'number' || isNaN(start) || start < 0) {

			throw new DareError(DareError.INVALID_START, `Out of bounds start value: '${start}'`);

		}
		opts.start = start;

	}

}

function prepCondition(field, value, key_definition, negate) {

	const {type} = key_definition || {};

	if (typeof key_definition === 'string') {

		// The key definition says the key is an alias
		field = key_definition;

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

		/*
		 * Extract values from SQL Functions
		 * Put the values back on the condition
		 */
		condition = rewrapFunctionValues(values, condition);

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
	else if (Array.isArray(value)) {

		// Sub
		const sub_values = [];
		const conds = [];

		// Format empty
		if (value.length === 0) {

			value.push(null);

		}

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

	else {

		condition = '= ?';
		values = [value];
		negate = negate ? '!' : '';

	}

	return [field, negate + condition, values];

}

function toArray(a) {

	if (typeof a === 'string') {

		a = a.split(',').map(s => s.trim());

	}
	else if (!Array.isArray(a)) {

		a = [a];

	}
	return a;

}

function rewrapFunctionValues(values, condition) {

	const date_sub_regex = new RegExp(/^(DATE_SUB\()(.*)(,[a-z0-9\s]*\))/i);

	values.forEach((value, index) => {

		const m = value.match(date_sub_regex);

		if (m) {

			values[index] = m[2];
			let i = 0;
			condition = condition.replace(/\?/g, () => {

				if (i++ === index) {

					return `${m[1]}?${m[3]}`;

				}
				return '?';

			});

		}

	});

	return condition;

}
