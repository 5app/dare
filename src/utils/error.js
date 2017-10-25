'use strict';

const SQL_ERROR_DICTIONARY = {
	ER_DUP_ENTRY: 'Duplicate entry',
	ER_NO_DEFAULT_FOR_FIELD: 'Missing field',
	NOT_FOUND: 'Could not find any results matching the query',
	INVALID_REQUEST: 'Invalid request',
	INVALID_IMPLEMENTATION: 'Invalid implementation'
};

const SQL_ERROR_STATUSCODES = {
	INVALID_START: 0,
	INVALID_LIMIT: 0,
	INVALID_REFERENCE: 0,
	INVALID_IMPLEMENTATION: 0,
	ER_DUP_ENTRY: 409,
	ER_NO_DEFAULT_FOR_FIELD: 400,
	NOT_FOUND: 404
};

class DareError extends Error {
	constructor(code, message) {
		super();
		this.code = code;
		this.status = SQL_ERROR_STATUSCODES[code] || 500;
		this.message = message || SQL_ERROR_DICTIONARY[code] || SQL_ERROR_DICTIONARY.INVALID_REQUEST;
	}
}

module.exports = DareError;

for (const x in SQL_ERROR_STATUSCODES) {
	DareError[x] = x;
}
