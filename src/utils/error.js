'use strict';

const SQL_ERROR_DICTIONARY = {
	ER_DUP_ENTRY: 'Duplicate entry',
	ER_NO_DEFAULT_FOR_FIELD: 'Missing field',
	NOT_FOUND: 'Could not find any results matching the query'
};

const SQL_ERROR_STATUSCODES = {
	INVALID_START: 0,
	INVALID_LIMIT: 0,
	INVALID_REFERENCE: 0,
	ER_DUP_ENTRY: 409,
	ER_NO_DEFAULT_FOR_FIELD: 400,
	NOT_FOUND: 404
};

module.exports = function error(err) {
	const message = SQL_ERROR_DICTIONARY[err.code] || 'request failed';
	return {
		status: err.status || SQL_ERROR_STATUSCODES[err.code] || 500,
		code: err.code,
		message
	};
};

for (const x in SQL_ERROR_STATUSCODES) {
	module.exports[x] = {
		status: SQL_ERROR_STATUSCODES[x] || 500,
		code: x,
		message: SQL_ERROR_DICTIONARY[x]
	};
}
