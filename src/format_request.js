'use strict';

const error = require('./utils/error');

module.exports = function format_request(options) {

	// Set default limit
	limit(options);

	const schema = this.options.schema || {};

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
	{

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
			handler(options);
		}
	}


	const joined = {};

	// Format filters
	{

		const filter = options.filter;

		if (filter) {

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

				if (typeof value === 'object' && !Array.isArray(value)) {

					// remove this from the filter
					delete options.filter[key];

					// Add it to the join table
					joined[key] = {
						filter: value
					};
				}
			}
		}
	}

	// Format fields
	{
		const fields = options.fields;

		if (fields) {

			// Fields must be an array
			if (!Array.isArray(fields)) {
				throw Object.assign(error.INVALID_REFERENCE, {
					message: `The field definition '${fields}' is invalid.`
				});
			}

			// Filter out child fields
			const table_schema = schema[options.table] || {};
			options.fields = fields.reduce(fieldReducer.call(this, joined, table_schema), []);
		}
	}

	// Joins
	{
		const joins = options.joins || [];

		// Add additional joins which have been derived from nested fields and filters...
		for (const alias in joined) {

			// Furnish the join table a little more...
			const join_object = Object.assign(joined[alias], {
				table: this.table_alias_handler(alias),
				alias,
				field_alias_prefix: `${alias}.`
			});

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
			options.joins = joins.map(join_object => format_request.call(this, join_object));
		}
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

		let test = options.orderby;

		if (typeof test === 'string') {
			test = test.replace(/\s*(DESC|ASC)$/, '');
		}

		// Check format
		checkFormat(test);
	}

	return options;

};


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
		if (isNaN(limit) || limit > 100 || limit < 1) {
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
function fieldReducer(join, table_schema = {}) {

	// Handle each field property
	return (a, field) => {

		if (typeof field !== 'string') {

			for (const key in field) {

				if (Array.isArray(field[key])) {
					join[key] = join[key] || {};
					join[key].fields = field[key];
				}
				else {
					// This field has an alias
					// i.e. latest: MAX(created_time)

					// Check errors in the key field
					checkKey(key);

					// Check the new value field
					checkFormat(field[key]);

					a.push({
						[key]: field[key]
					});
				}
			}
		}
		else {

			// Check errors in the key field
			checkKey(field);

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

function checkFormat(str) {

	if (typeof str !== 'string') {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The field definition '${str}' is invalid.`
		});
	}

	let c = str;
	let m;

	// strip away the `str(`...`)`
	while ((m = c.match(/^\s*[a-z]+\((.*?)\)\s*$/i))) {
		// match
		c = m[1];
	}

	// Is this a valid field
	if (!c.match(/^(((DISTINCT)\s)?[a-z\_\.]+|\*)$/i)) {
		throw Object.assign(error.INVALID_REFERENCE, {
			message: `The field definition '${str}' is invalid.`
		});
	}
}
