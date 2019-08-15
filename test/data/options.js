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
			country_id: 'country.id'
		},

		// Users have multiple emails
		users_email: {

			// User_id defines a field which references the users table
			user_id: {
				references: ['users.id']
			}
		},

		country: {

		},

		comments: {
			author_id: {
				references: 'users.id'
			}
		},

		activityEvents: {
			session_id: {
				references: 'activitySession.id'
			},
			ref_id: 'apps.id'
		},

		apps: {

		},

		assetDomains: {
			asset_id: 'apps.id'
		}

	},

	table_alias: {
		'author': 'users',
		'events': 'activityEvents',
		'asset': 'apps'
	}
};