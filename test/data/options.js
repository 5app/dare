const created_time = {
	type: 'datetime'
};

export default {
	models: {
		// Users table
		users: {

			schema: {
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

				generatedUrl(fields) {

					// This is a generated function
					fields.push('id');

					return ({id}) => `/user/${id}`;

				},

				/*
				 * Date Type
				 */
				created_time
			}

		},

		// Users have multiple emails
		users_email: {

			schema: {

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
			}
		},
		country: {

			schema: {

				/*
				 * Date Type
				 */
				created_time
			}

		},

		comments: {

			schema: {

				author_id: {
					references: 'users.id'
				},
				/*
				 * Date Type
				 */
				created_time
			}
		},

		activityEvents: {

			schema: {

				session_id: {
					references: 'activitySession.id'
				},

				ref_id: ['asset.id'],

				/*
				 * Date Type
				 */
				created_time
			}
		},

		asset: {

			table: 'apps',
			schema: {

				/*
				 * Date Type
				 */
				created_time
			}
		},

		assetDomains: {

			schema: {

				asset_id: ['asset.id'],

				/*
				 * Date Type
				 */
				created_time
			}
		}

	}

};
