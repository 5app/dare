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

Dare.prototype.pre_handler = function(method, table, options) {

	let handlers = this.options[method] || {};
	let handler;

	if (table in handlers) {
		handler = handlers[table];
	}
	else if ('default' in handlers) {
		handler = handlers['default'];
	}

	if (handler) {
		return handler(options);
	}

};


Dare.prototype.join_handler = require('./join_handler');


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

	// Augment
	return Promise.resolve()
	.then(() => this.pre_handler('patch', table, opts))
	.then(() => {
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
	});
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

	return Promise.resolve()
	.then(() => this.pre_handler('post', table, opts))
	.then(() => {

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
	});
};


// Delete a record
// @table string
// @query object
// @opts object
// return Promise
Dare.prototype.del = function del(table, query, opts) {

	if (typeof table === 'object') {
		opts = table;
		table = opts.table;
		query = opts.filter;
	}
	else {
		opts = opts || {};
		opts.table = table;
		opts.filter = query;
	}

	// Set default limit
	limit(opts);

	// Table
	table = this.table_alias_handler(opts.table);

	return Promise.resolve()
	.then(() => this.pre_handler('del', table, opts))
	.then(() => {

		// Clone object before formatting
		query = clone(opts.filter);

		// Prepare post
		let a = prepare(query);

		// Construct a db update
		return this.sql(

			`DELETE FROM ${table}
			WHERE
			${serialize(query, '=', 'AND')}
			LIMIT ${opts.limit}`,
		a)
		.then(mustAffectRows);
	});
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
