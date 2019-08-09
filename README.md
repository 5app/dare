# Database and REST (dare)

[![Greenkeeper badge](https://badges.greenkeeper.io/5app/dare.svg)](https://greenkeeper.io/)
[![Coverage Status](https://coveralls.io/repos/github/5app/dare/badge.svg)](https://coveralls.io/github/5app/dare)
[![CircleCI](https://circleci.com/gh/5app/dare.svg?style=shield)](https://circleci.com/gh/5app/dare)
[![NPM Version](https://img.shields.io/npm/v/dare.svg)](https://www.npmjs.com/package/dare)
[![Known Vulnerabilities](https://snyk.io/test/github/5app/dare/badge.svg)](https://snyk.io/test/github/5app/dare)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)



Dare is a lovely API for generating SQL out of structured JS Object. It can be used to query and modify your flavour of SQL database inside your node app. Or if you dare, give it it's own restful interface and have it construct and execute all the scrumptuous queries the client throws at it. Now the security conscious amongst you may fret but dont fear, your own rules can be applied via "handlers" by table and method, just the thing for maintaining data integrity and developing REST interfaces.

# Example usage...

This is a simple setup to get started with, it'll make a basic SELECT query.

```javascript
// Require the module
const Dare = require('dare');
const sqlConn = require('./someSqlConnection');

// Initiate it
const dare = new Dare();

// Define a module for connecting
dare.execute = async (sql) => {
	// Connect to DB, and execute the `sql`,
	// resolve with a successResponse or throw an errorResponse
	return sqlConn.execute(sql);
};

// Make a request
dare.get('users', ['name'], {id: 1}).then((resp) => {

	// This would have run...
	// SELECT id, name FROM users WHERE id = 1 LIMIT 1;
	// And returned a single record as the response...

	console.log(`Hi ${resp.name}');
});

```


# Setup


## Install

```bash
npm i dare --save
```


## dare = new Dare(options)

Create an instance of Dare with some options

```javascript
const Dare = require('dare');

const options = {
	schema
};

const dare = new Dare(options);
```

## Options

The `options Object` is a set of properties to apply at the point of calling any methods. Initially it's used to define default properties. However every method creates its own instance inheritting its parent options as well as defining it's own. See `dare.use(options)` for more.

The `options` themselves are a set of properties used to interpret and manipulate the request.


## Schema `schema`

The schema is used to define the structure of your SQL database. You can refer to it as `options.schema`. It's each property in the schema pertains to a database table. And defines the fields within the table.

e.g.

```javascript
{
	users: {Field Definitions, ...},
	country: {Field Definitions, ...}
}
```

### Relationships

In the example below the fields `users.country_id` defines a relationship with `country.id` which is used to construct SQL JOIN Conditions.


```javascript
	...
	schema : {
		users: {
			// table columns
			country_id: 'country.id'
		},
		country: {...}
	}
	...
```

### Field Definition

Fields dont need to be explicitly defined in the `options.schema.*tbl*`. Fields which are defined can give hints as to how to handle them.

#### field reference

Fields can reference other table fields, this is used to construct relationships [as we've seen earlier](#relationships).


#### field type

Defining the `type` introduces additional features.

*currently this is limited to datetime*

E.g. in the example the type is defined as 'datetime', a conditional filter short hand for `created_time: 2017` would be expanded too `created_time BETWEEN '2017-01-01T00:00:00' AND '2017-12-31T23:59:59`

```javascript
    ...
	schema : {
		users: {
			created_time: {
				type: 'datetime'
			}
		},
    ...
```

#### field handler

When the value is a function, the function will be invoked when interpretting the request as part of a field value. The response of this function can either be a static value or it can be an additional function which is optionally run on all items in the response, to return a generated field.

E.g.

This will manipulate the request and response to create the property `avatar_url` on the fly.

```javascript
    ...
	schema: {
		users: {
			avatar_url(fields) {

				fields.push('id'); // require additional field from users table.

				return (item) => `/images/avatars/${item.id}`;
			}
		},
    ...
```

#### field alias

To alias a field, so that you can use a name different to the db column name, assign it a string name of the field in the current table. e.g. `emailAddress: 'email'`


```javascript
    ...
	schema: {
		users: {
			emailAddress: 'email'
		},
    ...
```

For example this will allow us to use the alias `emailAddress` in our api (see below), but the SQL generated will refer to it with it's true field name "`email`".

```javascript
dare.get('users', ['emailAddress'], {emailAddress: 'andrew@%'});
// SELECT email AS emailAddress FROM users WHERE email LIKE 'andrew@%'
```



# Methods

## dare.get(table[, fields][, filter][, options])

The `dare.get` method is used to build and execute a `SELECT ...` SQL statement.

| property | Type              | Description
|----------|-------------------|----------------
| table    | string            | Name of the table to access
| fields   | Array strings     | Fields Array
| filter   | Hash (key=>Value) | Query Object
| options  | Hash (key=>Value) | Additional Options

e.g.

```javascript
dare.get('table', ['name'], {id: 1});
// SELECT name FROM table WHERE id = 1 LIMIT 1;
```

## dare.get(options Object)

Alternatively a options Object can be used instead.

e.g.

```javascript
dare.get({
	table: 'users',
	fields: ['name'],
	filter: {
		id: 1
	}
});
```

### Fields Array `fields`

The fields array is defined in `dare.get(...[,fields]...)` only and says what fields from the matching resultset to return.

#### Items (strings)

In its simplest form it is an Array of Strings, e.g. `['id', 'name', 'created_date']`. This creates a very simple query.

```sql
SELECT id, name, created_date FROM ....
```

The array items can also be Objects.

#### Aliased Items and Formatting (objects)

It's sometimes appropriate to alias a field definition, if it's to be renamed, or when using SQL Functions and operators to manipulate the response. E.g. Below we're using the DATE functin to format the date, and we're aliasing it so it will be returned with prop key `_date`.

```javascript
	[
	  'name',
	  {
	  	'_date': 'DATE(created_date)'
	  }
	]

	// sql: SELECT name, DATE(created_date) AS _date ...
```

Here are some common operations

Field Defition | Description
--|--
`FORMAT(field, 2, 'de_DE')` | Rounding to 2 decimal places and convert to a string with German formatting.
`CONCAT(ROUND(field * 100), '%')` | Multiplying a number by 100. Rounding to 2 decimal places and appending a '%' to the end to convert a decimal value to a percentage.

Please note some functions and operations are not available.

#### Nesting Fields

Objects entries which have Objects as value. In this case they shall attempt to get data from accross multiple tables.

```javascript

	[
		'name',
		'country': {
			'name'
		}
	]

	// sql: SELECT [users.]name, county.name
```

The SQL this creates renames the fields and then recreates the structured format that was requested. So with the above request: a typical response would have the following structure...

```javascript
	{
		name: 'Andrew',
		country: {
			name: 'UK'
		}
	}
```

- At the moment this only supports *n:1* mapping.
- The relationship between the tables must be defined in the scheme.


### Filter `filter`

The Filter Object is a Fields=>Value object literal, defining the SQL condition to attach to a statement.

e.g.

```javascript

	{
		id: 1,
		is_hidden: 0
	}


	// ... WHERE id = 1 AND is_hidden = 0 ...
```

The filter object can contain nested objects (Similar too the Fields Object). Nested objects define conditions on Relational tables.


```javascript
	{
		country: {
			name: 'UK'
		}
	}
```

Creates the following SQL JOIN Condition

```sql
	... WHERE country.name = 'UK' ...
```

#### Filter Syntax

The type of value affects the choice of SQL Condition syntax to use. For example an array will create an `IN (...)` condition, the presence of `%` will create a `LIKE` condition. If the property name is prefixed with a hyhen it will negate the filter. See examples below...


| Key     | Value                     | Type           | = SQL Condition
|---------|---------------------------|----------------|----------------
| id      | 1                         | number         | `id = 1`
| name    | 'Andrew'                  | string         | `name = 'Andrew'`
| name    | 'And%'                    | Pattern        | `name LIKE 'And%'`
| -name   | 'And%'                    | Pattern        | `name NOT LIKE 'And%'`
| tag     | [1, 'a']                  | Array values   | `tag IN (1, 'a')`
| -tag    | [1, 'a']                  | Array values   | `tag NOT IN (1, 'a')`
| -status | ['deleted', null]         | Array values   | `(status NOT IN ('deleted') AND status IS NOT NULL)` Mixed type including `null`
| date    | '2016-03-04T16:08:32Z..'  | Greater than   | `date > '2016-03-04T16:08:32Z'`
| date    | '2016-03-04..2016-03-05'  | Between        | `date BETWEEN '2016-03-04' AND '2016-03-05'`
| -date   | '2016-03-04..'            | !Greater than  | `(NOT date > '2016-03-04T00:00:00' OR date IS NULL)`
| flag    | null                      | null           | `flag IS NULL`
| -flag   | null                      | null           | `flag IS NOT NULL`


### Group by `groupby`

`groupby` accepts the same format as a single `field` expression. It can be a single value or an array of multiple expressions. I.e.

```js
groupby: [
	'type',
	'YEAR_MONTH(created_date)'
]
```

Generates
```sql
	GROUP BY type, YEAR_MONTH(created_date)
```

### Order By `orderby`

`orderby` accepts the same format as a single `field` expression. It can be a single value or an array of multiple expressions. I.e.

```js
orderby: [
	'type',
	'YEAR_MONTH(created_date)'
]
```

Generates
```sql
	ORDER BY type, YEAR_MONTH(created_date)
```

### Join

The Join Object is a Fields=>Value object literal. It accepts similar syntax to the Filter Object, and defines those conditions on the SQL JOIN Condition.

e.g.

```javascript

	join: {
		county: {
			is_hidden: 0
		}
	}

	// ... LEFT JOIN county b ON (b.id = a.country_id AND b.is_hidden = 0)
```

The JOIN object is useful when restricting results in the join table without affecting the results returned in the primary table.

To facilitate scenarios where the optional JOIN tables records are dependent on another relationship we can define this also in the JOIN Object, by passing though an special prop `_required: true` (key=>value)

The following statement includes all results from the main table, but does not append the country data unless it is within the continent of 'Europe'

```javascript

	join: {
		county: {
			continent: {
				_required: true,
				name: 'Europe'
			}
		}
	}

	// ...
	// LEFT JOIN county b ON (b.id = a.country_id)
	// LEFT JOIN continent c ON (c.id = b.continent_id)
	// WHERE (c.id = b.continent_id OR b.continent_id IS NULL)
	// ...
```

## dare.post(table, body[, options])

The `dare.post` method is used to build and execute an `INSERT ...` SQL statement.

| property | Type              | Description
|----------|-------------------|----------------
| table    | string            | Name of the table to insert into
| body     | Object            | Post Object or Array of Post Objects
| options  | Hash (key=>Value) | Additional Options

e.g.

```javascript
dare.post('user', {name: 'Andrew', profession: 'Mad scientist'});
// INSERT INTO table (name, profession) VALUES('Andrew', 'Mad scientist')
```

## dare.post(options Object)

Alternatively a options Object can be used instead.

e.g.

```javascript
dare.post({
	table: 'user',
	body: {
		name: 'Andrew',
		profession: 'Mad scientist'
	}
});

```

## dare.post(options Object) with multiple values

The body can be an Array of objects.

e.g.

```javascript
dare.post({
	table: 'user',
	body: [{
		name: 'Andrew',
		profession: 'Mad scientist'
	}, {
		name: 'Peppa'
	}]
});
```

This generates `INSERT INTO user (name, profession) VALUES ('Andrew', 'Mad Scientist'), ('Peppa', DEFAULT)`. Note where the key's differ between items in the Array the `DEFAULT` value is inserted instead. 

### Post options (additional)

| Prop          | Type             | Description
|---------------|------------------|----------------
| duplicate_keys | 'ignore'         | Inserts SQL 'IGNORE' option
| duplicate_keys_update | Array(field1, field2, ...) | Appends `ON DUPLICATE KEYS UPDATE field1=VALUES(field1)`




# Additional Options

## Table Alias

Table can have alias's this is useful when the context changes.

E.g. Define 'author' as an alternative for 'users'

```javascript
	table_alias: {
		author: 'users'
	}
```

Example implementation...

```javascript
dare.get({
	table: comments,
	fields: {
		id,
		text,
		author: {
			id,
			name
		}
	}
});
```

## Multiple joins/filters on the same table

In order to both: show all relationship on the join table AND filter the main results by the joined table. One can either create separate table aliases (as described above) using one for the field name, and one for the filter. Or alternatively append an arbitary label, a `$` sign followed by an string. E.g.

E.g. Include all the tags associated with users AND only show users whom include the tag "Andrew"


```javascript
dare.get({
	table: 'users',
	fields: ['name', {'tags': ['name']}],
	filter: {
		tags$a: {
			name: 'Andrew'
		}
	}
});
```

This will get all users who contain atleast the tags 'Andrew', as well as returning all the other tags.


## Table Conditions

	options.table_conditions[table] => reference

This will create a required join to include another table as a dependency.

```javascript
	table_conditions: {
		users: 'country'
	}
```

## Method Table Handlers

	options[method][table] = handler Function

Essentially enables methods to intercept requests to particular tables for given methods and apply business rules.

E.g. prevent a user from being deleted if they dont match the same as the passed through `req` object.

```
	del: {
		users(options) {
			if (options.filter.id !== options.req.session.user_id) {
				throw "You can't delete this user"
			}
		}
	}
```

## After Handlers

	options.after*Method*[table] = handler(resp)

This handler is executed after the request and is useful for logging or manipulating the response. If this returns undefined statically or via a Promise then the original response is not altered. Anything else will alter the response.

E.g. log an update to the users table

```javascript
afterPatch: {
	users(resp) {
		// Get the original request filter...
		const ref_id = this.options.filter.id;

		// Post to changelog...
		date.post('changelog', {
			message: 'User updated',
			type: 'users',
			ref_id
		});
		// do not return anything...
	}
}
```

### Catch in the *before* handler and overwrite *after* method

Of course there are scenarios where you want to capture a previous existing value. For that you might like to define the after handler before the patch operation is complete.

E.g. here is an example using the before handlers to capture the original value of a field and redefine define the after handler on this instance....

```javascript
...
patch: {
	async users(options) {

		/**
		 * Check that the data to be modified
		 * By using the options to construct a SELECT request first
		 */

		// Clonse the options
		const opts = {
			...options,
			fields: ['id', 'name']
		};

		// Execute a dare.get with the cloned options
		const {id: ref_id, name: previous_name} = await dare.get(opts);

		// Set the after handler
		this.after = () => {
			dare.post('changelog', {
				message: 'User updated',
				type: 'users',
				ref_id,
				previous_name
			})
		};
	}
}
...
```

### Handling dates and date ranges

The library supports a number of user friendly ways of passing in dates and date ranges by constructing the formal timestamp implied in the data passed to Dare.

E.g. here is a list of supported syntaxes and the resulting timestamp.

```
2018-01-01..2018-01-02,
2018-01-01..02,
2018-1-1..2

=== 2018-01-01T00:00:00..2018-01-02T23:59:59

etc...
```


### Changing the default MAX_LIMIT

By default the maximum value for a `limit` option is set by `dare.MAX_LIMIT`, you can override this in an instance of Dare.

```js
const Dare = require('dare');

// Initiate it
const dare = new Dare();

dare.MAX_LIMIT = 1000000;

```

### Retrieving the number of results in a SELECT with LIMIT

Setting an additional option `count` will mark the query to be counted.


```js

// Get some data using the `count: true` attribute
const users = await dare.get({
	table: 'users',
	fields: ['name'],
	limit: 10,
	count: true
});

// Call `dare.count()` to retrive the number of results the previous query would have obtained had it not been limited.
const count = await dare.count();
```

Behind the scenes this uses `SQL_CALC_FOUND_ROWS` and `FOUND_ROWS()`

