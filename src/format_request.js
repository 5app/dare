

const DareError = require('./utils/error');
const fieldReducer = require('./utils/field_reducer');
const groupbyReducer = require('./utils/groupby_reducer');
const orderbyReducer = require('./utils/orderby_reducer');
const reduceConditions = require('./format/reducer_conditions');


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

	// Create a shared object to provide nested objects
	const joined = {};

	/**
	 * Extract nested Handler
	 * @param {string} propName - Type of item
	 * @param {boolean} isArray - Is array, otherwise expect object
	 * @param {string} key - Key to extract
	 * @param {*} value - Value to extract
	 * @returns {void} - Nothing
	 */
	function extractJoined(propName, isArray, key, value) {

		if (!joined[key]) {

			joined[key] = {};

		}

		// Set default...
		joined[key][propName] = joined[key][propName] || (isArray ? [] : {});

		// Handle differently
		if (isArray) {

			joined[key][propName].push(...value);

		}
		else {

			joined[key][propName] = {...joined[key][propName], ...value};

		}

	}

	// Format filters
	if (options.filter) {

		// Define the handler for saving nest join information
		const extract = extractJoined.bind(null, 'filter', false);

		const arr = reduceConditions(options.filter, {extract, propName: 'filter', table_schema});

		options._filter = arr.length ? arr : null;

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

		// Define the handler for saving nest join information
		const extract = extractJoined.bind(null, 'join', false);

		options._join = reduceConditions(options.join, {extract, propName: 'join', table_schema});

	}

	/*
	 * Groupby
	 * If the content is grouped
	 */
	if (options.groupby) {

		// Define the handler for saving nest join information
		const extract = extractJoined.bind(null, 'groupby', true);

		// Reducer
		const reducer = groupbyReducer({current_path: options.field_alias_path || `${options.alias}.`, extract, table_schema});

		// Reduce
		options.groupby = toArray(options.groupby).reduce(reducer, []);


	}

	/*
	 * Orderby
	 * If the content is ordered
	 */
	if (options.orderby) {

		// Define the handler for saving nest join information
		const extract = extractJoined.bind(null, 'orderby', true);

		// Reducer
		const reducer = orderbyReducer({current_path: options.field_alias_path || `${options.alias}.`, extract, table_schema});

		// Reduce
		options.orderby = toArray(options.orderby).reduce(reducer, []);

	}

	// Update the fields
	options.fields = fields;

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
				field_alias_path: `${options.field_alias_path + alias}.`,
				table: this.table_alias_handler(alias)
			});


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


function toArray(a) {

	if (typeof a === 'string') {

		a = a.split(',').map(s => s.trim());

	}
	else if (!Array.isArray(a)) {

		a = [a];

	}
	return a;

}
