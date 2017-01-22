'use strict';

const error = require('./utils/error');

module.exports = format_request;

function format_request(options) {

	// Use the alias to find the real table name
	if (!options.alias) {
		const alias = options.table;
		options.alias = alias;
		options.table = this.table_alias_handler(alias);
	}

	// Reject when the table is not recognised
	if (!options.table) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `Unrecognized reference '${options.table}'`
		});
	}

	// Call bespoke table handler
	const method = options.method;
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
		return Promise.resolve(handler(options)).then(format_specs.bind(this, options));
	}

	return format_specs.call(this, options);
}

function format_specs(options) {

	const schema = this.options.schema || {};
	const table_schema = schema[options.table] || {};

	const joined = {};
	const filters = [];

	// Format filters
	{
		const filter = options.filter || {};

		// filter must be an object with key=>values
		if (typeof filter !== 'object') {
			throw Object.assign(error.INVALID_REFERENCE, {
				message: `The filter '${filter}' is invalid.`
			});
		}

		// Explore the filter for any table joins
		for (const key in filter) {

			checkKey(key);

			const value = filter[key];

			if (value && typeof value === 'object' && !Array.isArray(value)) {

				// Add it to the join table
				joined[key] = joined[key] || {};
				joined[key].filter = Object.assign(joined[key].filter || {}, value);
			}
			else {
				const type = table_schema[key] && table_schema[key].type;
				filters.push(prepCondition(key, value, type));
			}
		}
	}

	// Format fields
	let fields = options.fields;
	if (fields) {

		// Fields must be an array, or a dictionary (aka object)
		if (typeof fields !== 'object') {
			throw Object.assign(error.INVALID_REFERENCE, {
				message: `The field definition '${fields}' is invalid.`
			});
		}

		// Make the fields an array
		if (!Array.isArray(fields)) {
			fields = [fields];
		}

		// Filter out child fields
		fields = fields.reduce(fieldReducer.call(this, options.alias, joined, table_schema), []);
	}

	// Format conditional joins
	if (options.join) {

		const _join = {};
		const join = options.join;

		// filter must be an object with key=>values
		if (typeof join !== 'object') {
			throw Object.assign(error.INVALID_REFERENCE, {
				message: `The join '${join}' is invalid.`
			});
		}

		// Explore the filter for any table joins
		for (const key in join) {

			checkKey(key);

			const value = join[key];

			if (typeof value === 'object' && !Array.isArray(value)) {

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

		for (const key in join) {
			const value = join[key];
			const type = table_schema[key] && table_schema[key].type;
			_join.push(prepCondition(key, value, type));
		}
		options._join = _join;
	}

	// Groupby
	// If the content is grouped
	if (options.groupby) {
		// Check inject
		checkFormat(options.groupby);
	}

	// Orderby
	// If the content is ordered
	if (options.orderby) {

		let a = options.orderby;

		if (typeof a === 'string') {
			a = a.split(/\s*,\s*/);
		}
		else if (!Array.isArray(a)) {
			checkFormat(a);
		}

		a.forEach(def => {

			if (typeof def === 'string') {
				def = def.replace(/\s*(DESC|ASC)$/i, '');
			}

			// Check format
			checkFormat(def);
		});
	}

	// Set default limit
	limit(options);


	// Joins
	{
		const joins = options.joins || [];

		// Add additional joins which have been derived from nested fields and filters...
		for (const alias in joined) {

			// Furnish the join table a little more...
			const join_object = Object.assign(joined[alias], {
				alias,
				field_alias_prefix: `${alias}.`
			});

			if (!join_object.table) {
				join_object.table = this.table_alias_handler(alias);
			}

			// Do the smart bit...
			// Augment the join object, with additional 'conditions'
			const new_join_object = this.join_handler(join_object, options.table);

			// Reject if the join handler returned a falsy value
			if (!new_join_object) {
				throw Object.assign(error.INVALID_REFERENCE, {
					message: `Could not understand field '${alias}'`
				});
			}

			// Help the GET parser, tell it that this can be run in nested isolation, i.e.
			new_join_object.nested_query = !join_object.filter;

			// Update the request with this table join
			joins.push(new_join_object);
		}

		// Loop through the joins array
		if (joins.length) {
			// Loop through the joins and pass through the formatter
			return Promise.all(joins.map(join_object => format_request.call(this, join_object)))
				.then(a => {
					options._joins = a;
					return options;
				});
		}
	}

	return options;
}


function limit(opts) {

	if (opts.limit === undefined) {
		opts.limit = 1;
		opts.single = true;
	}

	else {
		let limit = opts.limit;
		if (typeof limit === 'string' && limit.match(/^\d+$/)) {
			limit = +opts.limit;
		}
		if (isNaN(limit) || limit > 10000 || limit < 1) {
			throw Object.assign(error.INVALID_LIMIT, {
				message: `Out of bounds limit value: '${limit}'`
			});
		}
	}

	let start = opts.start;

	if (start !== undefined) {
		if (typeof start === 'string' && start.match(/^\d+$/)) {
			start = +opts.start;
		}
		if (typeof start !== 'number' || isNaN(start) || start < 0) {
			throw Object.assign(error.INVALID_START, {
				message: `Out of bounds start value: '${start}'`
			});
		}
		opts.start = start;
	}
}

// Return a reducer function
function fieldReducer(scope, join, table_schema = {}) {

	const addToJoin = (field, label) => {
		const path_str = checkFormat(field);
		const path = path_str.split('.');
		const key = path.shift();
		if (path.length && key !== scope) {
			const f = field.replace(path_str, path.join('.'));
			const d = label ? {[label]: f} : f;
			const a = join[key] || {};
			a.fields = (a.fields || []);
			a.fields.push(d);
			join[key] = a;
			return true;
		}
	};

	// Handle each field property
	return (a, field) => {

		if (typeof field !== 'string') {

			for (const key in field) {

				const value = field[key];
				if (typeof value === 'object') {
					join[key] = join[key] || {};
					join[key].fields = value;
				}
				else {
					// This field has an alias
					// i.e. latest: MAX(created_time)

					// Check errors in the key field
					checkLabel(key);

					// Check the new value field parents, aka `parent_table.field`
					if (addToJoin(value, key)) {
						continue;
					}

					a.push({
						[key]: value
					});
				}
			}

		}

		else {
			// Check errors in the key field
			checkKey(field);

			// This is also a field, so check that its a valid field
			// + If it contains a nested value: create a join.
			if (addToJoin(field)) {
				return a;
			}

			// Does this field have a handler in the schema
			const def = table_schema[field];

			if (typeof def === 'function') {

				// Execute the handler, add the response to the field list
				a.push({
					[field]: def.call(this, a)
				});
			}
			else {
				// Add the field to the array
				a.push(field);
			}
		}

		return a;
	};
}


function checkKey(key) {
	const reg = /^([a-z\_]+\.)?([a-z\_]+|\*)+$/i;

	// Capture errors in the key
	if (!key.match(reg)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The key '${key}' must match ${reg}`
		});
	}
}


function checkLabel(label) {
	const reg = /^[^\'\"]+$/i;

	// Capture errors in the key
	if (!label.match(reg)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The label '${label}' must match ${reg}`
		});
	}
}

function checkFormat(str) {

	if (typeof str !== 'string') {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The field definition '${str}' is invalid.`
		});
	}

	let s = str;
	let m;

	// strip away the `str(`...`)`
	while ((m = s.match(/^\s*[a-z\_]+\((DISTINCT\s)?(.*?)\)\s*$/i))) {
		// match
		s = m[2];
	}

	// Is this a valid field
	if (!s.match(/^([a-z\_\.]+|\*)$/i)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The field definition '${str}' is invalid.`
		});
	}

	return s;
}


function prepCondition(field, value, type) {

	if (type === 'datetime') {
		value = formatDateTime(value);
	}

	// Range
	// A range is denoted by two dots, e.g 1..10
	let condition;
	let values;
	const a = (typeof value === 'string') && value.split('..');

	if (a.length === 2) {

		if (a[0] && a[1]) {
			condition = 'BETWEEN ? AND ?';
			values = a;
		}
		else if (a[0]) {
			condition = '> ?';
			values = [a[0]];
		}
		else {
			condition = '< ?';
			values = [a[1]];
		}
	}

	// Not match
	else if (typeof value === 'string' && value[0] === '!') {
		condition = 'NOT LIKE ?';
		values = [value.slice(1)];
	}

	// String partial match
	else if (typeof value === 'string' && value.match('%')) {
		condition = 'LIKE ?';
		values = [value];
	}

	// Null
	else if (value === null) {
		condition = 'IS NULL';
		values = [];
	}

	// Add to the array of items
	else if (Array.isArray(value)) {
		condition = `IN (${value.map(() => '?')})`;
		values = value;
	}

	else {
		condition = '= ?';
		values = [value];
	}

	return [field, condition, values];
}


function formatDateTime(values) {
	if (typeof values === 'string') {

		if (values.indexOf('..') === -1) {
			values = `${values}..${values}`;
		}

		let i = 0;

		return values.replace(/(\d{4})(-\d{1,2})?(-\d{1,2})?/g, (str, y, m, d) => {

			const date = new Date(str);

			if (i++) {
				if (!m) {
					date.setFullYear(date.getFullYear() + 1);
				}
				else if (!d) {
					date.setMonth(date.getMonth() + 1);
				}
				else {
					date.setDate(date.getDate() + 1);
				}
				date.setSeconds(date.getSeconds() - 1);
			}

			return date.toISOString().replace(/\.\d+Z/, '');
		});
	}
	return values;
}
