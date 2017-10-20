'use strict';

const getHandler = require('./get');

const DareError = require('./utils/error');

module.exports = Dare;

function Dare(options) {

	// Overwrite default properties
	this.options = options || {};
}

// Set default function
Dare.prototype.execute = (query, callback) => callback(new Error('Define dare.execute to continue'));

// Group concat
Dare.prototype.group_concat = '$$';


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

Dare.prototype.sql = function sql(sql, prepared) {

	prepared = prepared || [];

	return new Promise((accept, reject) => {
		this.execute(this.prepare(sql, prepared), (err, results) => {

			if (err) {
				reject(err);
				return;
			}
			accept(results);

		});
	});
};


Dare.prototype.get = function get(table, fields, filter, opts = {}) {

	// Get Request Object
	if (typeof table === 'object') {
		opts = table;
	}
	else {

		// Shuffle
		if (typeof fields === 'object' && !Array.isArray(fields)) {
			opts = filter || {};
			filter = fields;
			fields = ['*'];
		}

		opts = Object.assign(opts, {table, fields, filter});
	}

	// define method
	opts.method = 'get';

	const _this = this.use(opts);

	return _this.format_request(_this.options)
		.then(opts => getHandler.call(_this, opts))
		.then(resp => _this.after(resp));
};

Dare.prototype.patch = function patch(table, filter, body, opts = {}) {

	// Get Request Object
	opts = typeof table === 'object' ? table : Object.assign(opts, {table, filter, body});

	// define method
	opts.method = 'patch';

	const _this = this.use(opts);

	return _this.format_request(opts)
		.then(opts => {

			// Skip this operation?
			if (opts.skip) {
				return opts.skip;
			}

			const table = opts.table;
			// Clone
			const post = clone(opts.body);

			// Prepare post
			const a = prepare(post);

			// Prepare query
			const sql_query = opts._filter.map(([field, condition, values]) => {
				a.push(...values);
				return `${field} ${condition}`;
			});

			// Construct a db update
			const sql = `UPDATE ${table}
					SET
						${serialize(post, '=', ',')}
					WHERE
						${sql_query.join(' AND ')}
					LIMIT ${opts.limit}`;

			return this.sql(sql, a)
				.then(mustAffectRows);
		})
		.then(resp => _this.after(resp));
};


// Insert new data into database
// @table string
// @post object
// @opts object
// return Promise

Dare.prototype.post = function post(table, body, opts = {}) {

	// Get Request Object
	opts = typeof table === 'object' ? table : Object.assign(opts, {table, body});

	// Post
	opts.method = 'post';

	const _this = this.use(opts);

	// Table
	return _this.format_request(opts)
		.then(opts => {

			// Skip this operation?
			if (opts.skip) {
				return opts.skip;
			}

			// Set table
			const table = opts.table;
			let post = opts.body;

			// Clone object before formatting
			if (!Array.isArray(post)) {
				post = [post];
			}

			// If ignore duplicate keys is stated as ignore
			let exec = '';
			if (opts.duplicate_keys && opts.duplicate_keys.toString().toLowerCase() === 'ignore') {
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

			// Construct a db update
			const sql = `INSERT ${exec} INTO ${table}
					(${fields.join(',')})
					VALUES
					${data.join(',')}`;

			return _this.sql(sql, prepared);
		})
		.then(resp => _this.after(resp));
};


// Delete a record
// @table string
// @query object
// @opts object
// return Promise
Dare.prototype.del = function del(table, filter, opts = {}) {

	// Get Request Object
	opts = typeof table === 'object' ? table : Object.assign(opts, {table, filter});

	// Delete
	opts.method = 'del';

	const _this = this.use(opts);

	return _this.format_request(opts)
		.then(opts => {

			// Skip this operation?
			if (opts.skip) {
				return opts.skip;
			}

			// Table
			const table = opts.table;

			// Clone object before formatting
			const a = [];
			const sql_query = opts._filter.map(([field, condition, values]) => {
				a.push(...values);
				return `${field} ${condition}`;
			});

			// Construct a db update
			return _this.sql(

				`DELETE FROM ${table}
			WHERE
			${sql_query.join(' AND ')}
			LIMIT ${opts.limit}`,
				a)
				.then(mustAffectRows);
		})
		.then(resp => _this.after(resp));
};


function clone(obj) {
	const r = {};
	for (const x in obj) {
		r[x] = obj[x];
	}
	return r;
}


function prepare(obj) {

	const a = [];

	for (const x in obj) {

		// Add to the array of items
		a.push(obj[x]);

		// Replace with the question
		obj[x] = '?';
	}

	return a;
}

function serialize(obj, separator, delimiter) {
	const r = [];
	for (const x in obj) {
		const val = obj[x];
		r.push(`${x} ${separator} ${val}`);
	}
	return r.join(` ${delimiter} `);
}

function mustAffectRows(result) {
	if (result.affectedRows === 0) {
		throw new DareError(DareError.NOT_FOUND);
	}
	return result;
}
