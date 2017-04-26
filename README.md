# Database and REST (dare)

Dare is an API for generating SQL, it can be used internally to build and execute SQL. As well as lathered with request handlers for layering per table rules and security to expose a REST interface.

# Install

```bash
npm i dare --save
```

# Setup

This is a simple setup to get started with (later on we'll talk about some more options)

```javascript
// Require the module
const dare = new require('dare');

// Define a module for connecting
dare.execute = (sql, callback) => {
	// Connect to DB, and execute the `sql`,
	// Execute `callback(errorResponse, successResponse)`;
};

```

Use the `dare.get` method for creating SELECT statements

```javascript

dare.get('users', ['name'], {id: 1}).then((resp) => {
	console.log(`Hi ${resp.name}');
});

// SELECT id, name FROM users WHERE id = 1 LIMIT 1;

```

Has your appetite been whetted? Are you SQueaL'ing for more?

# API

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

## dare.get(Request Object)

Alternatively a Request Object can be used instead.

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

## Relational Tables

Tell *dare* about the Schema Definition, and Relational fields so it can make SQL JOIN's.

Define a property `schema` in Database Options i.e `dare.init(name, Database Options)` and create a representation of your database joins.


```javascript
	...
	schema : {
		'users': {
			// table columns
			country_id: 'country.id'
		},
		'user_emails': {
			user_id: 'users.id'
		}
		'country': {

		}
	}
	...
```

Alternatively define this in Additional Options. `dare.get(...[, options])`

## Fields Array

The fields array is defined in `dare.get(...[,fields]...)` only and says what fields from the matching resultset to return.

### Items (strings)

In its simplest form it is an Array of Strings, e.g. `['id', 'name', 'created_date']`. This creates a very simple query.

```sql
SELECT id, name, created_date FROM ....
```

The array items can also be Objects.

### Aliased Items (objects)

Object entries whose value are strings, may define SQL functions. E.g. 

```javascript
	[
	  'name',
	  {
	  	'_date': 'DATE(created_date)'
	  }
	]

	// sql: SELECT name, DATE(created_date) AS _date ...
```

### Joined Items (objects)

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


## Filter

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

### Filter Syntax

The type of value affects the choice of SQL Condition syntax to use. For instance an array will create an `IN (...)` condition, the presence of `%` will create a `LIKE` condition. If the property name is prefixed with a hyhen it will negate the filter. See examples below...


|Prop     | Value                     | Type           | e.g. SQL
|---------|---------------------------|----------------|----------------
| id      | 1                         | number         | `id = 1`
| name    | 'Andrew'                  | string         | `name = 'Andrew'`
| name    | 'And%'                    | Pattern        | `name LIKE 'And%'`
| -name   | 'And%'                    | Pattern        | `name NOT LIKE 'And%'`
| tag     | [1, 'a']                  | Array values   | `tag IN (1, 'a')`
| -tag    | [1, 'a']                  | Array values   | `tag NOT IN (1, 'a')`
| date    | '2016-03-04T16:08:32Z..'  | Greater than   | `date > '2016-03-04T16:08:32Z'`
| date    | '2016-03-04..2016-03-05'  | Between        | `date BETWEEN '2016-03-04' AND '2016-03-05'`


