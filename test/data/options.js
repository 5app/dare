const created_time = {
	type: 'datetime'
};

module.exports = {
	schema: {
		// Users table
		users: {
			/*
			 * Field alias
			 * The DB schema defines `email` however our business requires that we can alias it as emailAddress
			 */
			emailAddress: 'email',

			/*
			 * Field reference
			 * The users.country_id references the country.id column, this is used for making joins
			 */
			country_id: ['country.id'],

			/*
			 * JSON data type
			 */
			meta: {
				type: 'json'
			},

			/**
			 * Url generated
			 * @param {Array} fields - Array of current fields
			 * @returns {string|Function} Can return a function or a field definition.
			 */
			url(fields) {

				// This is a generated function
				fields.push('id');

				return ({id}) => `/user/${id}`;

			},

			/*
			 * Date Type
			 */
			created_time
		},

		// Users have multiple emails
		users_email: {

			/*
			 * User_id defines a field which references the users table
			 */
			user_id: {
				references: ['users.id']
			},

			/*
			 * Date Type
			 */
			created_time
		},

		country: {
			/*
			 * Date Type
			 */
			created_time
		},

		comments: {
			author_id: {
				references: 'users.id'
			},
			/*
			 * Date Type
			 */
			created_time
		},

		activityEvents: {
			session_id: {
				references: 'activitySession.id'
			},
			ref_id: ['apps.id'],

			/*
			 * Date Type
			 */
			created_time
		},

		apps: {
			/*
			 * Date Type
			 */
			created_time
		},

		assetDomains: {
			asset_id: ['apps.id'],

			/*
			 * Date Type
			 */
			created_time
		}

	},

	table_alias: {
		'author': 'users',
		'events': 'activityEvents',
		'asset': 'apps'
	}
};
