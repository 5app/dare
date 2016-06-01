'use strict';

let error = require('./utils/error');

module.exports = function(table, fields, filter, opts) {

	// If typeof
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
		else if (!opts) {
			opts = {};
		}

		// Set the table
		opts.table = table;
		opts.fields = fields;
		opts.filter = filter;
	}

	// Inherit the options from the instance
	opts = Object.assign({}, this.options, opts);

	return new Promise((accept, reject) => {
		buildQuery.call(this, opts, accept, reject);
	});
};

function buildQuery(opts, accept, reject) {

	// Restrict the maximum items to respond with

	let limit = opts.limit;
	let single_record = false;

	// limit
	if (limit === undefined) {
		limit = 1;
		single_record = true;
	}
	else {
		let _limit = parseInt(limit, 10);
		if (isNaN(_limit) || _limit > 100 || _limit < 1) {
			return reject({message: `Out of bounds limit value: '${limit}'`});
		}

		let start = parseInt(opts.start || 0, 10);
		if (isNaN(start) || start < 0) {
			return reject({message: `Out of bounds start value: '${start}'`});
		}

		limit = (start ? start + ' ' : '') + _limit;
	}

	// Initiate join
	opts.join = {};

	// Extend the opts object with the conditions
	if (!opts.where) {
		opts.where = {};
	}

	// Table Alias
	opts.table_alias = opts.table_alias || {};

	// Table alias handler
	// Given a table alias name, it should return the actual name of the table.
	// It\s good to redefine this and it should return falsy value if you want to restrict table access.
	// Otherwise default tables are passed through verbatim.
	let table_alias_handler = opts.table_alias_handler || ((table) => opts.table_alias[table] || table);

	// Get the root tableID
	let tableID = opts.table;
	let tableName = table_alias_handler(opts.table);

	// Reject when the table is not recognised
	if (!tableName) {
		return reject({message: `Unrecognized reference '${opts.table}'`});
	}

	// Filters
	// Filters populate the conditions and values (prepared statements)
	let conditions = [];
	let values = [];

	// Restrict the resources that are returned
	// e.g. filter= {category: asset, action: open, created_time: 2016-04-12T13:29:23Z..]
	if (opts.filter) {
		// If filter is not an object
		if (typeof opts.filter !== 'object') {
			return reject({message: `The filter '${opts.filter}' is invalid.`});
		}

		// Add the conditions
		queryFilter(opts, opts.filter, tableID);

		// Create a list of conditions
		conditions = prepareCondition(opts.where).map(condition => {
			let field = condition[0];
			let operator = condition[1];
			let value = condition[2];

			if (Array.isArray(value)) {
				values = values.concat(value);
				operator = 'IN';
				value = '(' + value.map(() => '?') + ')';
			}
			else {
				values.push(value);
				value = '?';
			}
			return `${field} ${operator} ${value}`;
		});
	}

	// Fields
	// e.g. fields = [action, category, count, {app: [name, id]}]
	if (opts.fields) {

		// Add the conditions
		opts.fields = queryFields(opts, opts.fields, tableID);
	}

	{
		// Count is a special field, find it ...
		let i = opts.fields.indexOf(tableID + '._count');

		if (i > -1) {
			// ... and replace it.
			opts.fields[i] = 'COUNT(*) as _count';
		}
	}

	// Groupby
	// If the content is grouped
	if (opts.groupby) {
		// Check inject
		checkFormat(opts.groupby);

		// Find the special _group column...
		let i = opts.fields.indexOf(tableID + '._group');

		if (i > -1) {
			// ... and replace it.
			opts.fields[i] = opts.groupby + ' as _group';
		}

		// Add the grouping
		opts.groupby = `GROUP BY ${opts.groupby}`;
	}
	else {
		opts.groupby = '';
	}

	// Orderby
	// If the content is ordered
	if (opts.orderby) {
		// Check format
		checkFormat(opts.orderby.replace(/\s*(DESC|ASC)$/, ''));

		// Add the grouping
		opts.orderby = `ORDER BY ${opts.orderby}`;
	}
	else {
		opts.orderby = '';
	}

	// Join
	let join_handler = opts.join_handler || default_join_handler;
	let join = [];

	for (let join_ref in opts.join) {
		// Get the condition
		let join_condition = join_handler(join_ref, opts.join[join_ref], opts);

		// Reject if the join has no condition
		if (!join_condition || Object.keys(join_condition).length === 0) {
			return reject({message: 'Could not understand field "' + join_ref + '"'});
		}

		// Is there an alias for this table
		let join_table = table_alias_handler(join_ref);
		if (!join_table) {
			return reject({message: `Unrecognized reference '${join_ref}'`});
		}

		join.push(`LEFT JOIN ${join_table} ${join_ref === join_table ? '' : join_ref} ON (${serialize(join_condition, '=', 'AND')})`);
	}

	// Put it all together
	let sql = `SELECT ${opts.fields.toString()}
						 FROM ${tableName} ${tableID === tableName ? '' : tableID}
								${join.join('\n')}
						 WHERE
							 ${conditions.join(' AND ')}
						 ${opts.groupby}
						 ${opts.orderby}
						 LIMIT ${limit}`;

	return this
	.sql(sql, values)
	.then(responseHandler)
	.then(resp => {

		// If limit was not defined we should return the first result only.
		if (single_record) {
			if (resp.length) {
				return resp[0];
			}
			else {
				throw error({code: 'NOT_FOUND'});
			}
		}
		return resp;
	})
	.then(accept)
	.catch(err => {
		reject(err);
		// console.log("SQLERROR:" + this.prepare(sql, values));
		throw err;
	});
}


function serialize(obj, separator, delimiter) {
	let r = [];
	for (let x in obj) {
		r.push(`${x} ${separator} ${obj[x]}`);
	}
	return r.join(` ${delimiter} `);
}

function queryFilter(opts, filter, tableID) {

	for (let key in filter) {
		// Capture errors in the key
		checkKey(key);

		let val = filter[key];
		if (typeof val === 'object' && !Array.isArray(val)) {
			// Which table is being joined
			opts.join[key] = tableID;
			queryFilter(opts, val, key);
		}
		else {
			opts.where[tableID + '.' + key] = val;
		}
	}
}

function queryFields(opts, fields, tableID, depth) {

	depth = depth || 0;
	let a = [];

	fields.forEach(field => {
		if (typeof field !== 'string') {
			for (let x in field) {
				// Which table is being joined
				if (Array.isArray(field[x])) {
					opts.join[x] = tableID;
					a = a.concat(queryFields(opts, field[x], x, depth + 1));
				}
				else {
					// Check errors in the key field
					checkKey(x);

					// Check the new value field
					checkFormat(field[x]);

					a.push(`${field[x]} AS ${x}`);
				}
			}
		}
		else {

			if (field.indexOf('.') === -1) {
				field = tableID + '.' + field;
			}

			// Check errors in the key field
			checkKey(field);

			let as = (depth ? ` AS '${field}'` : '');
			a.push(field + as);
		}
	});

	return a;
}

function prepareCondition(obj) {
	let a = [];

	let range_handler = (field, value, index) => {
		if (value !== '') {
			a.push([field, (index ? '<' : '>'), value]);
		}
	};

	for (let field in obj) {

		let value = obj[field];

		// Range
		// A range is denoted by two dots, e.g 1..10
		let range = (typeof value === 'string') && value.split('..');
		if (range.length === 2) {
			range.forEach(range_handler.bind(null, field));
		}

		// Is this an array match?
		else if (typeof value === 'string' && value.match('%')) {
			a.push([field, 'LIKE', value]);
		}

		// Add to the array of items
		else {
			a.push([field, '=', value]);
		}

	}
	return a;
}

// Response
function responseHandler(resp) {
	// Iterate over the response array and trigger formatting
	return resp.map(formatHandler);
}

// Format
function formatHandler(item) {

	// Some of the names were prefixed too ensure uniqueness, e.g., [{name: name, 'asset:name': name}]
	for (var x in item) {

		// Check the key for expansion key '.'
		let a = x.split('.');


		if (a.length > 1) {

			// Create new object
			explodeKeyValue(item, a, item[x]);

			// Delete the original key
			delete item[x];
		}
	}

	return item;
}

function explodeKeyValue(obj, a, value) {

	// Is this the end?
	if (a.length === 0) {
		return value;
	}

	// Remove the last one from the iteration
	let key = a.shift();

	if (!(key in obj)) {
		// Create a new object
		obj[key] = {};
	}

	// Update key value
	obj[key] = explodeKeyValue(obj[key], a, value);

	return obj;
}

function checkKey(x) {
	let reg = /^([a-z\_]+\.)?([a-z\_]+|\*)+$/i;

	// Capture errors in the key
	if (!x.match(reg)) {
		throw new Error(`The key '${x}' must match ${reg}`);
	}
}

function checkFormat(str) {
	let c = str;
	let m;

	// strip away the `str(`...`)`
	while ((m = c.match(/^\s*[a-z]+\((.*?)\)\s*$/i))) {
		// match
		c = m[1];
	}

	// Is this a valid field
	if (!c.match(/^(((DISTINCT)\s)?[a-z\_\.]+|\*)$/i)) {
		throw new Error(`The field definition '${str}' is invalid.`);
	}
}


// deciding on how to connect two tables depends on which one holds the connection
// The join_handler here looks columns on both tables to find one which has a reference field to the other.
function default_join_handler(join_table, root_table, options) {

	let schema = options.schema;
	let alias = options.table_alias;

	// Get the references
	let map = {};

	let a = [join_table, root_table];

	for (let i = 0, len = a.length; i < len; i++) {

		// Mark the focus table
		let alias_a = a[i];
		let ref_a = alias[alias_a] || alias_a;
		let table_a = schema[ref_a];

		// Loop through the
		if (table_a) {

			// Get the reference table
			let alias_b = a[(i + 1) % len];
			let ref_b = alias[alias_b] || alias_b;
			// let table_b = schema[ref_b];

			// Loop through the table fields
			for (let field in table_a) {
				let column = table_a[field];
				if (column && column.references && column.references.split('.')[0] === ref_b) {
					map[alias_b + '.' + column.references.split('.')[1]] = alias_a + '.' + field;
				}
			}
		}
	}

	return map;
}
