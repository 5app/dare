

const getHandler = require('./get');

const DareError = require('./utils/error');

const promisify = require('./utils/promisify');

const validateBody = require('./utils/validate_body');

const getFieldAttributes = require('./utils/field_attributes');

module.exports = Dare;

function Dare(options) {

	// Overwrite default properties
	this.options = options || {};

}

// Set default function
Dare.prototype.execute = (query, callback) => callback(new DareError(DareError.INVALID_SETUP, 'Define dare.execute to continue'));

// Group concat
Dare.prototype.group_concat = '$$';

// Set the Max Limit for SELECT statements
Dare.prototype.MAX_LIMIT = null;

// Default prepare statement.
Dare.prototype.prepare = require('./utils/prepare');

// Set default table_alias handler
Dare.prototype.table_alias_handler = function(name) {

	name = name.split('$')[0];
	return (this.options.table_alias ? this.options.table_alias[name] : null) || name;

};

Dare.prototype.unique_alias_index = 0;

Dare.prototype.get_unique_alias = function(iterate = 1) {

	if (iterate) {

		this.unique_alias_index += iterate;

	}
	const i = this.unique_alias_index;
	const str = String.fromCharCode(96 + i);
	if (i <= 26) {

		return str;

	}
	return `\`${str}\``;

};

Dare.prototype.format_request = require('./format_request');

Dare.prototype.join_handler = require('./join_handler');

Dare.prototype.table_handler = require('./table_handler');

Dare.prototype.response_handler = require('./response_handler');

Dare.prototype.after = function(resp) {

	// Define the after handler
	const handler = `after${this.options.method.replace(/^([a-z])/, (m, l) => l.toUpperCase())}`;
	const table = this.options.table;

	// Trigger after handlers following a request
	if (handler in this.options && table in this.options[handler]) {

		// Trigger handler
		return this.options[handler][table].call(this, resp) || resp;

	}

	return resp;

};

// Create an instance
Dare.prototype.use = function(options) {

	const inst = Object.create(this);
	inst.options = Object.assign({}, this.options, options);

	// Set SQL level states
	inst.unique_alias_index = 0;
	return inst;

};

Dare.prototype.sql = async function sql(sql, prepared) {

	prepared = prepared || [];

	const sql_prepared = this.prepare(sql, prepared);

	return promisify(this.execute)(sql_prepared);

};


Dare.prototype.get = async function get(table, fields, filter, opts = {}) {

	// Get Request Object
	if (typeof table === 'object') {

		opts = table;

	}
	else {

		// Shuffle
		if (typeof fields === 'object' && !Array.isArray(fields)) {

			// Fields must be defined
			throw new DareError(DareError.INVALID_REQUEST);

		}

		opts = Object.assign(opts, {table, fields, filter});

	}

	// Define method
	opts.method = 'get';

	const _this = this.use(opts);

	const req = await _this.format_request(_this.options);

	const resp = await getHandler.call(_this, req);

	return _this.after(resp);

};

Dare.prototype.patch = async function patch(table, filter, body, opts = {}) {

	// Get Request Object
	opts = typeof table === 'object' ? table : Object.assign(opts, {table, filter, body});

	// Define method
	opts.method = 'patch';

	const _this = this.use(opts);

	const req = await _this.format_request(opts);

	// Skip this operation?
	if (req.skip) {

		return _this.after(req.skip);

	}

	// Validate Body
	validateBody(req.body);

	// Get the schema
	const tableSchema = this.options.schema && this.options.schema[req.table];

	// Prepare post
	const {assignments, preparedValues} = prepareSet(req.body, tableSchema);

	// Prepare query
	const sql_query = req._filter.map(([field, condition, values]) => {

		preparedValues.push(...values);
		return `${field} ${condition}`;

	});

	// Construct a db update
	const sql = `UPDATE ${req.table}
			SET
				${serialize(assignments, '=', ',')}
			WHERE
				${sql_query.join(' AND ')}
			LIMIT ${req.limit}`;

	let resp = await this.sql(sql, preparedValues);

	resp = mustAffectRows(resp);

	return _this.after(resp);

};


/*
 * Insert new data into database
 * @table string
 * @post object
 * @opts object
 * return Promise
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

	// Validate Body
	validateBody(req.body);

	// Set table
	let post = req.body;

	// Clone object before formatting
	if (!Array.isArray(post)) {

		post = [post];

	}

	// If ignore duplicate keys is stated as ignore
	let exec = '';
	if (req.duplicate_keys && req.duplicate_keys.toString().toLowerCase() === 'ignore') {

		exec = 'IGNORE';

	}

	// Capture keys
	const fields = [];
	const prepared = [];
	const data = post.map(item => {

		const _data = [];
		for (const prop in item) {

			// Get the index in the field list
			let i = fields.indexOf(prop);

			if (i === -1) {

				i = fields.length;

				fields.push(prop);

			}

			// Insert the value at that position
			_data[i] = item[prop];

		}

		return _data;

	}).map(_data => {

		// Create prepared values
		const a = fields.map((prop, index) => {

			if (_data[index] === undefined) {

				return 'DEFAULT';

			}
			// Add the value to prepared statement list
			prepared.push(_data[index]);

			// Return the prepared statement placeholder
			return '?';

		});

		return `(${a.join(',')})`;

	});

	// Get the schema
	const tableSchema = this.options.schema && this.options.schema[req.table];

	// Format fields
	const columns = mapFieldNames(fields, tableSchema);

	// Options
	const on_duplicate_keys_update = onDuplicateKeysUpdate(mapFieldNames(req.duplicate_keys_update, tableSchema)) || '';

	// Construct a db update
	const sql = `INSERT ${exec} INTO ${req.table}
			(${columns.map(field => `\`${field}\``).join(',')})
			VALUES
			${data.join(',')}
			${on_duplicate_keys_update}`;

	const resp = await _this.sql(sql, prepared);

	return _this.after(resp);

};


/*
 * Delete a record
 * @table string
 * @query object
 * @opts object
 * return Promise
 */
Dare.prototype.del = async function del(table, filter, opts = {}) {

	// Get Request Object
	opts = typeof table === 'object' ? table : Object.assign(opts, {table, filter});

	// Delete
	opts.method = 'del';

	const _this = this.use(opts);

	const req = await _this.format_request(opts);

	// Skip this operation?
	if (req.skip) {

		return _this.after(req.skip);

	}

	// Clone object before formatting
	const a = [];
	const sql_query = req._filter.map(([field, condition, values]) => {

		a.push(...values);
		return `${field} ${condition}`;

	});

	// Construct a db update
	const sql = `DELETE FROM ${req.table}
					WHERE
					${sql_query.join(' AND ')}
					LIMIT ${req.limit}`;

	let resp = await this.sql(sql, a);

	resp = mustAffectRows(resp);

	return _this.after(resp);

};


/**
 * Prepared Set
 * Prepare a SET assignments used in Patch
 * @param {object} body - body to format
 * @param {object|undefined} tableSchema - Schema for the current table
 * @returns {object} {assignment, preparedValues}
 */
function prepareSet(body, tableSchema = {}) {

	const preparedValues = [];
	const assignments = {};

	for (const label in body) {

		// Assignments
		{

			// By default the fieldName is the label of the key.
			let fieldName = label;

			// Check for aliases of the label
			const {alias} = getFieldAttributes(tableSchema[label]);

			if (alias) {

				fieldName = alias;

			}

			// Replace value with a question using any mapped fieldName
			assignments[fieldName] = '?';

		}

		// Values
		{

			let value = body[label];

			if (value && typeof value === 'object') {

				value = JSON.stringify(value);

			}

			// Add to the array of items
			preparedValues.push(value);

		}

	}

	return {
		assignments,
		preparedValues
	};

}

function serialize(obj, separator, delimiter) {

	const r = [];
	for (const x in obj) {

		const val = obj[x];
		r.push(`\`${x}\` ${separator} ${val}`);

	}
	return r.join(` ${delimiter} `);

}

function mustAffectRows(result) {

	if (result.affectedRows === 0) {

		throw new DareError(DareError.NOT_FOUND);

	}
	return result;

}

function onDuplicateKeysUpdate(keys) {

	if (!keys) {

		return null;

	}

	const s = keys.map(name => `${name}=VALUES(${name})`).join(',');

	return `ON DUPLICATE KEY UPDATE ${s}`;

}

function mapFieldNames(fields, tableSchema = {}) {

	if (!fields) {

		return;

	}

	return fields.map(label => {

		const {alias} = getFieldAttributes(tableSchema[label]);

		if (alias) {

			label = alias;

		}

		return label;

	});

}
