// Export Dare

'use strict';

var SQL_ERROR_DICTIONARY = {
	ER_DUP_ENTRY: 'duplicate entry',
	NOT_FOUND: 'Not Found'
};

var SQL_ERROR_STATUSCODES = {
	ER_DUP_ENTRY: 409,
	NOT_FOUND: 404
};

module.exports = Dare;

function Dare(options) {

	// Overwrite default properties
	this.options = options || {};
}

// Set default function
Dare.prototype.execute = (query, callback) => callback(new Error('Define dare.execute to continue'));

// Default prepare statement.
Dare.prototype.prepare = require('./utils/prepare');

// Set default table_alias handler
Dare.prototype.table_alias_handler = function(name) {
	return (this.options.table_alias ? this.options.table_alias[name] : null) || name;
};

// deciding on how to connect two tables depends on which one holds the connection
// The join_handler here looks columns on both tables to find one which has a reference field to the other.
Dare.prototype.join_handler = function(join_table, root_table) {

	let schema = this.options.schema;

	// Get the references
	let map = {};

	let a = [join_table, root_table];

	for (let i = 0, len = a.length; i < len; i++) {

		// Mark the focus table
		let alias_a = a[i];
		let ref_a = this.table_alias_handler(alias_a);
		let table_a = schema[ref_a];

		// Loop through the
		if (table_a) {

			// Get the reference table
			let alias_b = a[(i + 1) % len];
			let ref_b = this.table_alias_handler(alias_b);
			// let table_b = schema[ref_b];

			// Loop through the table fields
			for (let field in table_a) {
				let column = table_a[field];

				let ref = [];

				if (typeof column === 'string' || Array.isArray(column)) {
					ref = column;
				}
				else if (column.references) {
					ref = column.references;
				}

				if (typeof ref === 'string') {
					ref = [ref];
				}

				ref.forEach(ref => {
					let a = ref.split('.');
					if (a[0] === ref_b) {
						map[alias_b + '.' + a[1]] = alias_a + '.' + field;
					}
				});
			}
		}
	}

	return map;
};


// Create an instance
Dare.prototype.use = function(options) {
	let inst = Object.create(this);
	inst.options = Object.assign({}, this.options);
	for (var x in options) {
		inst.options[x] = options[x];
	}
	return inst;
};

Dare.prototype.sql = function sql(sql, prepared) {

	prepared = prepared || [];

	return new Promise((accept, reject) => {
		this.execute(this.prepare(sql, prepared), (err, results) => {

			if (err) {
				reject(error(err));
				return;
			}
			accept(results);

		});
	});
};


Dare.prototype.get = require('./get');

Dare.prototype.patch = function patch(table, filter, body, opts) {

	if (typeof table === 'object') {
		opts = table;
	}
	else {
		opts = opts || {};
		opts.table = table;
		opts.filter = filter;
		opts.body = body;
	}

	// Set default limit
	limit(opts);

	// Table
	table = this.table_alias_handler(opts.table);

	// Clone
	let post = clone(opts.body);
	let query = clone(opts.filter);

	// Prepare post
	let a = prepare(post);

	// Prepare query
	a = a.concat(prepare(query));

	// Construct a db update
	let sql = `UPDATE ${table}
				SET
					${serialize(post, '=', ',')}
				WHERE
					${serialize(query, '=', 'AND')}
				LIMIT ${opts.limit}`;

	return this.sql(sql, a)
	.then(mustAffectRows);
};


// Insert new data into database
// @table string
// @post object
// @opts object
// return Promise

Dare.prototype.post = function post(table, post, opts) {

	if (typeof table === 'object') {
		opts = table;
		table = opts.table;
		post = opts.body;
	}
	else {
		opts = opts || {};
		opts.table = table;
		opts.body = post;
	}

	// Table
	table = this.table_alias_handler(opts.table);

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
	let fields = [];
	let prepared = [];
	let data = post.map(item => {
		let _data = [];
		for (var prop in item) {

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
		return '(' + fields.map((prop, index) => {
			if (_data[index] === undefined) {
				return 'DEFAULT';
			}
			// Add the value to prepared statement list
			prepared.push(_data[index]);

			// Return the prepared statement placeholder
			return '?';
		}).join(',') + ')';
	});


	// Construct a db update
	let sql = `INSERT ${exec} INTO ${table}
				(${fields.join(',')})
				VALUES
				${data.join(',')}`;

	return this.sql(sql, prepared);
};


// Delete a record
// @table string
// @query object
// @opts object
// return Promise
Dare.prototype.del = function del(table, query, opts) {

	opts = opts || {};

	// Set default limit
	limit(opts);

	// Clone object before formatting
	query = clone(query);

	// Prepare post
	let a = prepare(query);

	// Construct a db update
	return this.sql(

		`DELETE FROM ${table}
		WHERE
		${serialize(query, '=', 'AND')}
		${serialize(opts, ' ', ' ')}`,
	a)
	.then(mustAffectRows);
};


function clone(obj) {
	var r = {};
	for (var x in obj) {
		r[x] = obj[x];
	}
	return r;
}

function error(err) {

	var message = SQL_ERROR_DICTIONARY[err.code] || 'request failed';
	return {
		status: err.status || SQL_ERROR_STATUSCODES[err.code] || 500,
		code: err.code,
		error: message,
		message: message
	};
}

function prepare(obj) {

	let a = [];
	let setPending = _val => {
		a.push(_val);
		return '?';
	};

	for (let x in obj) {

		let val = obj[x];

		if (Array.isArray(val)) {
			// Loop through values
			obj[x] = val.map(setPending);
		}
		else {
			// Add to the array of items
			a.push(obj[x]);

			// Replace with the question
			obj[x] = '?';
		}
	}

	return a;
}

function serialize(obj, separator, delimiter) {
	let r = [];
	for (let x in obj) {
		let val = obj[x];
		if (Array.isArray(val) && separator === '=') {
			r.push(`${x} IN (${val})`);
		}
		else {
			r.push(`${x} ${separator} ${val}`);
		}
	}
	return r.join(` ${delimiter} `);
}

function limit(opts) {
	if (opts.limit === undefined) {
		opts.limit = 1;
	}
	else if (!opts.limit) {
		delete opts.limit;
	}
}

function mustAffectRows(result) {
	if (result.affectedRows === 0) {
		throw error({code: 'NOT_FOUND'});
	}
	return result;
}
