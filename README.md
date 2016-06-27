# Database and REST (dare)

Dare is an API for building SQL, it can be used within an application, or be bound to HTTP Request endpoint to expose a RESTful API.

# Install

```bash
npm i dare --save
```

Then in script, create a `db.js` connection file that configures dare and returns an instance to be used throughout your application.

```javascript
let dare = new require('dare');

// Define a module for connecting
dare.execute = (sql, callback) => {
	// Connect to DB, and execute the `sql`,
	// Execute `callback(errorResponse, successResponse)`;
};

// Return the db instance
module.exports = dare;
```

Now in your application code, require that configured file and use it... *lavishly*


```javascript
let db = require('./db.js');

// e.g.
// SELECT id, name FROM users WHERE id = 1 LIMIT 1;
db.get('users', ['id', 'name'], {id: 1});

// For a full set of methods that dare exposes see below
```


# API

## db.get(table[, fields][, filter][, options])

The `db.get` method is used to build and execute a `SELECT ...` SQL statement.

| property | Type              | Description
|----------|-------------------|----------------
| table    | string            | Name of the table to access
| fields   | Array strings     | Fields Array
| filter   | Hash (key=>Value) | Query Object
| options  | Hash (key=>Value) | Additional Options

e.g.

```javascript
db.get('table', ['name'], {id: 1});
// SELECT name FROM table WHERE id = 1 LIMIT 1;
```

## db.get(Request Object)

Alternatively a Request Object can be used instead.

e.g.

```javascript
db.get({
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

Alternatively define this in Additional Options. `db.get(...[, options])`

## Fields Array

The fields array is defined in `db.get(...[,fields]...)` only and says what fields from the matching resultset to return.

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

### Filter Values

Filter values also carry the condition, =, IN, NOT, etc...

| Value                     | Type           | e.g. SQL
|---------------------------|----------------|----------------
| 1                         | number         | `id = 1`
| 'Andrew'                  | string         | `name = 'Andrew'`
| [1, 'a']                  | Array values   | `tag IN (1, 'a')`
| '2016-03-04T16:08:32Z..'  | Greater than   | `date > '2016-03-04T16:08:32Z'`
| '2016-03-04..2016-03-05'  | Between        | `BETWEEN '2016-03-04' AND '2016-03-05'`
| 'And%'	                | Pattern        | `name LIKE 'And%'`

