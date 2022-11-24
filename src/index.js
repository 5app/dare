
import SQL, {raw, join, empty} from 'sql-template-tag';

import getHandler from './get.js';

import DareError from './utils/error.js';

import validateBody from './utils/validate_body.js';

import getFieldAttributes from './utils/field_attributes.js';

import extend from './utils/extend.js';

import clone from 'tricks/object/clone.js';

import format_request from './format_request.js';

import response_handler from './response_handler.js';

/*
 * Export Dare Error object
 */
export {DareError};

/**
 * Dare
 * Sets up a new instance of Dare
 *
 * @param {object} options - Initial options defining the instance
 * @returns {object} instance of dare
 */
function Dare(options = {}) {

	// Backwards compatibility for {schema}
	migrateToModels(options);

	// Overwrite default properties
	this.options = extend(clone(this.options), options);

	return this;

}

export default Dare;

// Export the DareError object
Dare.DareError = DareError;

// Set default function
Dare.prototype.execute = async () => {

	throw new DareError(DareError.INVALID_SETUP, 'Define dare.execute to continue');

};

// Group concat
Dare.prototype.group_concat = '$$';

// Set the Max Limit for SELECT statements
Dare.prototype.MAX_LIMIT = null;

// Default options
Dare.prototype.options = {
	// Infer intermediate tables when two models are not directly linked
	infer_intermediate_models: true,

	// Allow conditional operators in value
	conditional_operators_in_value: '%!~'
};

// Set default table_alias handler
Dare.prototype.table_alias_handler = function(name) {

	return name.replace(/^-/, '').split('$')[0];

};

Dare.prototype.unique_alias_index = 0;

Dare.prototype.get_unique_alias = function(iterate = 1) {

	this.unique_alias_index += iterate;
	const i = this.unique_alias_index;
	const str = String.fromCharCode(96 + i);
	if (i <= 26) {

		return str;

	}
	return `\`${str}\``;

};

Dare.prototype.format_request = format_request;

Dare.prototype.response_handler = response_handler;

/**
 * Dare.after
 * Defines where the instance goes looking to apply post execution handlers and potentially mutate the response
 *
 * @param {object|Array} resp - Response object
 * @returns {object} response data formatted or not
 */
Dare.prototype.after = function(resp) {

	// Define the after handler
	const handler = `after${this.options.method.replace(/^[a-z]/, m => m.toUpperCase())}`;
	const table = this.options.name;

	// Trigger after handlers following a request
	if (handler in this.options && table in this.options[handler]) {

		// Trigger handler
		return this.options[handler][table].call(this, resp) || resp;

	}

	return resp;

};

/**
 * Use
 * Creates a new instance of Dare and merges new options with the base options
 * @param {object} options - set of instance options
 * @returns {object} Instance of Dare
 */
Dare.prototype.use = function(options = {}) {

	const inst = Object.create(this);

	// Backwards compatibility for {schema}
	migrateToModels(options);

	// Create a new options, merging inheritted and new
	inst.options = extend(clone(this.options), options);

	// Set the generate_fields array
	inst.generated_fields = [];

	// Set SQL level states
	inst.unique_alias_index = 0;
	return inst;

};

/**
 * Dare.sql
 * Prepares and processes SQL statements
 *
 * @param {string} sql - SQL string containing the query
 * @param {Array<Array, string, number, boolean>} values - List of prepared statement values
 * @returns {Promise<object|Array>} Returns response object or array of values
 */
Dare.prototype.sql = async function sql(sql, values) {

	let req = {sql, values};

	if (typeof sql === 'object') {

		req = sql;

	}

	return this.execute(req);

};

/**
 * Dare.get
 * Triggers a DB SELECT request to rerieve records from the database.
 *
 * @param {string} table - Name of the table to query
 * @param {Array} fields - Fields array to return
 * @param {object} filter - Filter Object to query
 * @param {object} opts - An Options object containing all other request options
 * @returns {Promise<object|Array>} Results
 */
Dare.prototype.get = async function get(table, fields, filter, opts = {}) {

	// Get Request Object
	if (typeof table === 'object') {

		opts = {...table};

	}
	else {

		// Shuffle
		if (typeof fields === 'object' && !Array.isArray(fields)) {

			// Fields must be defined
			throw new DareError(DareError.INVALID_REQUEST);

		}

		opts = {...opts, table, fields, filter};

	}

	// Define method
	opts.method = 'get';

	// Set default notfound handler
	setDefaultNotFoundHandler(opts);

	const dareInstance = this.use(opts);

	const req = await dareInstance.format_request(dareInstance.options);

	const query = getHandler(req, dareInstance);

	// Execute the query
	const sql_response = await dareInstance.sql(query);

	// Format the response
	let resp = await dareInstance.response_handler(sql_response);

	// If limit was not defined we should return the first result only.
	if (dareInstance.options.single) {

		if (resp.length) {

			resp = resp[0];

		}
		else if (typeof dareInstance.options.notfound === 'function') {

			dareInstance.options.notfound();

		}
		else {

			resp = dareInstance.options.notfound;

		}

	}

	return dareInstance.after(resp);

};

/**
 * Dare.getCount
 * Returns the total number of results which match the conditions
 *
 * @param {string} table - Name of the table to query
 * @param {object} filter - Filter Object to query
 * @param {object} opts - An Options object containing all other request options
 * @returns {Promise<integer>} Number of matched items
 */
Dare.prototype.getCount = async function getCount(table, filter, opts = {}) {

	// Get Request Object
	if (typeof table === 'object') {

		// Clone
		opts = {...table};

	}
	else {

		// Clone and extend
		opts = {...opts, table, filter};

	}

	// Define method
	opts.method = 'get';

	// Flag Count all rows
	opts.countRows = true;

	// Remove the fields...
	opts.fields = [];

	// Remove any orderby
	opts.orderby = undefined;

	// Remove the limit and start
	opts.limit = undefined;
	opts.start = undefined;

	const dareInstance = this.use(opts);

	const req = await dareInstance.format_request(dareInstance.options);

	const query = getHandler(req, dareInstance);

	// Execute the query
	const [resp] = await dareInstance.sql(query);

	// Return the count
	return resp.count;

};

/**
 * Dare.patch
 * Updates records matching the conditions
 *
 * @param {string} table - Name of the table to query
 * @param {object} filter - Filter Object to query
 * @param {object} body - Body containing new data
 * @param {object} [opts] - An Options object containing all other request options
 * @param {string} [opts.duplicate_keys] - 'ignore' to prevent throwing Duplicate key errors
 * @param {number} [opts.limit=1] - Number of items to change
 * @returns {Promise<object>} Affected Rows statement
 */
Dare.prototype.patch = async function patch(table, filter, body, opts = {}) {

	// Get Request Object
	opts = typeof table === 'object' ? table : Object.assign(opts, {table, filter, body});

	// Define method
	opts.method = 'patch';

	// Set default notfound handler
	setDefaultNotFoundHandler(opts);

	const dareInstance = this.use(opts);

	const req = await dareInstance.format_request(opts);

	// Skip this operation?
	if (req.skip) {

		return dareInstance.after(req.skip);

	}

	// Validate Body
	validateBody(req.body);

	// Options
	const {models, validateInput} = dareInstance.options;

	// Get the model structure
	const {schema: tableSchema} = models?.[req.name] || {};

	// Prepare post
	const sql_set = prepareSQLSet(req.body, req.sql_alias, tableSchema, validateInput);

	// If ignore duplicate keys is stated as ignore
	let exec = '';
	if (req.duplicate_keys && req.duplicate_keys.toString().toLowerCase() === 'ignore') {

		exec = 'IGNORE ';

	}

	// Construct a db update
	const sql = SQL`UPDATE ${raw(exec)}${raw(req.sql_table)} ${raw(req.sql_alias)}
			${req.sql_joins.length ? join(req.sql_joins, '\n') : empty}
			SET
				${sql_set}
			WHERE
				${join(req.sql_where_conditions, ' AND ')}
			${!req.sql_joins.length ? SQL`LIMIT ${req.limit}` : empty}`;

	let resp = await this.sql(sql);

	resp = mustAffectRows(resp, opts.notfound);

	return dareInstance.after(resp);

};


/**
 * Dare.post
 * Insert new data into database
 *
 * @param {string} table - Name of the table to query
 * @param {object|Array<objects>} body - Body containing new data
 * @param {object} [opts] - An Options object containing all other request options
 * @param {Array} [opts.duplicate_keys_update] - An array of fields to update on presence of duplicate key constraints
 * @param {string} [opts.duplicate_keys] - 'ignore' to prevent throwing Duplicate key errors
 * @returns {Promise<object>} Affected Rows statement
 */

Dare.prototype.post = async function post(table, body, opts = {}) {

	// Get Request Object
	opts = typeof table === 'object' ? table : Object.assign(opts, {table, body});

	// Post
	opts.method = 'post';

	const _this = this.use(opts);

	// Table
	const req = await _this.format_request(opts);

	// Skip this operation?
	if (req.skip) {

		return _this.after(req.skip);

	}

	// Capture fields...
	const fields = [];

	// Capture values
	const values = [];

	// If this is a query
	let query;

	if (req.query) {

		/*
		 * Validate all fields are simple ones
		 * Test: are there nested fields
		 */
		const invalidQueryFields = req.query.fields
			.flatMap(field => (typeof field === 'string' ? field : Object.values(field)))
			.some(value => value !== null && typeof(value) === 'object');

		// Throw an error if the fields are missing, perhaps indented
		if (invalidQueryFields) {

			throw new DareError(DareError.INVALID_REQUEST, 'Nested fields forbidden in post-query');

		}

		const getInstance = this.use(req.query);

		getInstance.options.method = 'get';

		const getRequest = await getInstance.format_request(getInstance.options);

		// Throw an error if there are any generated fields
		if (getInstance.generated_fields.length) {

			throw new DareError(DareError.INVALID_REQUEST, 'Generated fields forbidden in post-query');

		}

		const {sql, values: getValues} = getHandler(getRequest, getInstance);

		// Update the capturing variables...
		query = sql;

		fields.push(...walkRequestGetField(getRequest));


		values.push(...getValues);

	}
	else {

		// Validate Body
		validateBody(req.body);

	}

	// Set table
	let post = req.body || [];

	// Clone object before formatting
	if (!Array.isArray(post)) {

		post = [post];

	}

	// If ignore duplicate keys is stated as ignore
	const exec = req.ignore ? 'IGNORE' : '';

	// Instance options
	const {models, validateInput} = _this.options;

	// Get the schema
	const {schema: modelSchema = {}} = models?.[req.name] || {};

	const data = post.map(item => {

		const _data = [];

		/*
		 * Iterate through the properties
		 * Format, validate and insert
		 */
		for (const prop in item) {

			// Format key and values...
			const {field, value} = formatInputValue(modelSchema, prop, item[prop], validateInput);

			// Get the index in the field list
			let i = fields.indexOf(field);

			if (i === -1) {

				i = fields.length;

				fields.push(field);

			}

			// Insert the value at that position
			_data[i] = value;

		}

		/*
		 * Let's catch the omitted properties
		 * --> Loop through the modelSchema
		 */
		Object.entries(modelSchema).forEach(([field, fieldObject]) => {

			// For each property which was not covered by the input
			if (field !== 'default' && !(field in item)) {

				// Get a formatted object of field attributes
				const fieldAttributes = getFieldAttributes(fieldObject);

				/*
				 * Get the default Value of the post operation
				 * -> Reassign it back to the fieldAttributes.defaultValue, no need for the others
				 */
				const defaultValue = fieldAttributes.defaultValue?.post;
				if (fieldAttributes.defaultValue) {

					Object.assign(fieldAttributes, {defaultValue});

				}

				// Validate with an undefined value
				validateInput?.(fieldAttributes, field);

				// Default values?
				if (defaultValue) {

					// Get the index in the field list
					let i = fields.indexOf(field);

					if (i === -1) {

						i = fields.length;

						fields.push(field);

					}

					// Insert the defaultValue at that position
					_data[i] = defaultValue;

				}

			}

		});

		return _data;

	}).map(_data => {

		// Create prepared values
		const a = fields.map((_, index) => {

			// If any of the values are missing, set them as DEFAULT
			if (_data[index] === undefined) {

				return 'DEFAULT';

			}

			// Else add the value to prepared statement list
			values.push(_data[index]);

			// Return the prepared statement placeholder
			return '?';

		});

		return `(${a.join(',')})`;

	});


	// Create unalias function
	const unAliaser = field => unAliasFields(modelSchema, field);

	// Options
	let on_duplicate_keys_update = '';
	if (req.duplicate_keys_update) {

		on_duplicate_keys_update = onDuplicateKeysUpdate(req.duplicate_keys_update.map(unAliaser));

	}
	else if (req.duplicate_keys && req.duplicate_keys.toString().toLowerCase() === 'ignore') {

		on_duplicate_keys_update = `${onDuplicateKeysUpdate()}${req.sql_table}._rowid=${req.sql_table}._rowid`;

	}

	// Construct a db update
	const sql = `INSERT ${exec} INTO ${req.sql_table}
			(${fields.map(field => `\`${field}\``).join(',')})
			${data.length ? `VALUES ${data.join(',')}` : ''}
			${query || ''}
			${on_duplicate_keys_update}`;

	const resp = await _this.sql({sql, values});

	return _this.after(resp);

};


/**
 * Dare.del
 * Delete a record matching condition
 *
 * @param {string} table - Name of the table to query
 * @param {object} filter - Filter Object to query
 * @param {object} opts - An Options object containing all other request options
 * @returns {Promise<object>} Affected Rows statement
 */
Dare.prototype.del = async function del(table, filter, opts = {}) {

	// Get Request Object
	opts = typeof table === 'object' ? table : Object.assign(opts, {table, filter});

	// Delete
	opts.method = 'del';

	// Set default notfound handler
	setDefaultNotFoundHandler(opts);

	const dareInstance = this.use(opts);

	const req = await dareInstance.format_request(opts);

	// Skip this operation?
	if (req.skip) {

		return dareInstance.after(req.skip);

	}

	// Construct a db update
	const sql = SQL`DELETE ${req.sql_joins.length ? raw(req.sql_table) : empty} FROM ${raw(req.sql_table)}
					${req.sql_joins.length ? join(req.sql_joins, '\n') : empty}
					WHERE
					${join(req.sql_where_conditions, ' AND ')}
					${!req.sql_joins.length ? SQL`LIMIT ${req.limit}` : empty}`;

	let resp = await this.sql(sql);

	resp = mustAffectRows(resp, opts.notfound);

	return dareInstance.after(resp);

};


/**
 * Prepared SQL Set
 * Prepare a SET assignments used in Patch
 * @param {object} body - body to format
 * @param {string} sql_alias - SQL Alias for update table
 * @param {object} [tableSchema={}] - Schema for the current table
 * @param {Function} [validateInput] - Validate input function
 * @returns {object} {assignment, values}
 */
function prepareSQLSet(body, sql_alias, tableSchema = {}, validateInput) {

	const assignments = [];

	for (const label in body) {

		/*
		 * Get the real field in the db,
		 * And formatted value...
		 */
		const {field, value} = formatInputValue(tableSchema, label, body[label], validateInput);

		// Replace value with a question using any mapped fieldName
		assignments.push(SQL`${raw(sql_alias)}.\`${raw(field)}\` = ${value}`);

	}

	return join(assignments, ', ');

}

function mustAffectRows(result, notfound) {

	if (result.affectedRows === 0) {

		if (typeof notfound === 'function') {

			return notfound();

		}
		return notfound;

	}
	return result;

}

function onDuplicateKeysUpdate(keys = []) {

	const s = keys.map(name => `\`${name}\`=VALUES(\`${name}\`)`).join(',');

	return `ON DUPLICATE KEY UPDATE ${s}`;

}

/**
 * Format Input Value
 * For a given field definition, return the db key (alias) and format the input it required
 *
 * @param {object} [tableSchema={}] - An object containing the table schema
 * @param {string} field - field identifier
 * @param {*} value - Given value
 * @param {Function} [validateInput] - Custom validation function
 * @throws Will throw an error if the field is not writable
 * @returns {string} A singular value which can be inserted
 */
function formatInputValue(tableSchema = {}, field, value, validateInput) {

	const fieldAttributes = (field in tableSchema)
		? getFieldAttributes(tableSchema[field])
		: ('default' in tableSchema
			? getFieldAttributes(tableSchema.default)
			: null);

	const {alias, writeable, type} = fieldAttributes || {};

	// Execute custom field validation
	validateInput?.(fieldAttributes, field, value);

	// Rudimentary validation of content
	if (writeable === false) {

		throw new DareError(DareError.INVALID_REFERENCE, `Field '${field}' is not writeable`);

	}

	// Stringify object
	if (type === 'json') {

		// Value must be an object
		if (typeof value !== 'object') {

			throw new DareError(DareError.INVALID_VALUE, `Field '${field}' must be an object: ${JSON.stringify(value)} provided`);

		}

		// Stringify
		if (value !== null) {

			value = JSON.stringify(value);

		}

	}

	// Check this is not an object
	if (value && typeof value === 'object') {

		throw new DareError(DareError.INVALID_VALUE, `Field '${field}' does not accept objects as values: '${JSON.stringify(value)}'`);

	}

	if (alias) {

		if (/[^\w$.]/.test(alias)) {

			throw new DareError(DareError.INVALID_REQUEST, `Field '${field}' is an alias for a derived value '${field}', cannot mutate`);

		}

		field = alias;

	}

	return {field, value};

}


/**
 * Return un-aliased field names
 *
 * @param {object} [tableSchema={}] - An object containing the table schema
 * @param {string} field - field identifier
 * @returns {string} Unaliased field name
 */
function unAliasFields(tableSchema = {}, field) {

	const {alias} = getFieldAttributes(tableSchema[field]);
	return alias || field;

}

/**
 * SetDefaultNotFoundHandler
 * As the name suggests
 * @param {object} opts - request options
 * @returns {void}
 */
function setDefaultNotFoundHandler(opts) {

	if (!('notfound' in opts)) {

		// Default handler is called when there are no results on a request for a single item
		opts.notfound = () => {

			throw new DareError(DareError.NOT_FOUND);

		};

	}

	return opts;

}


/**
 * Migrate to Models
 * Backwards compatibility for {schema}
 * @param {object} options - Options object
 * @returns {void} Extends paramater
 */
function migrateToModels(options) {

	if (options.models) {

		// Nothing to do
		return;

	}

	// Legacy input...
	for (const prop in options) {

		if (!['schema', 'patch', 'post', 'del', 'get'].includes(prop) || !options[prop]) {

			continue;

		}

		for (const table in options[prop]) {

			extend(options, {
				models: {
					[table]: {
						[prop]: options[prop][table]
					}
				}
			});

		}

	}

}

/**
 * Because Dare does not maintain field orders within the select, or the Get function maintaining the list of fields
 * We've resorted to acquiring the new list order where the SELECT fields... is used within an INSERT statement
 * @param {object} request - Object returned from format_request function
 * @returns {Array} an array of field names
 */
function walkRequestGetField(request) {

	const fields = [];

	// Get the field names of the current request...
	if (Array.isArray(request.fields)) {

		fields.push(...request.fields.flatMap(field => (typeof field === 'string' ? field : Object.keys(field))));

	}

	// Iterate through the nested table joins and retrieve their fields
	if (Array.isArray(request._joins)) {

		fields.push(...request._joins.flatMap(walkRequestGetField));

	}

	return fields;

}
