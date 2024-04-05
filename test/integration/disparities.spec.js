import Dare from '../../src/index.js';
import Debug from 'debug';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import db from './helpers/db.js';
import {options} from './helpers/api.js';
const debug = Debug('sql');

// Connect to db

describe(`Disparities`, () => {
	let dare;

	beforeEach(() => {
		// Initiate
		dare = new Dare(options);

		// Set a test instance
		// eslint-disable-next-line arrow-body-style
		dare.execute = query => {
			// DEBUG
			debug(mysql.format(query.sql, query.values));

			return db.query(query);
		};
	});

	it('MySQL 8 fails to correctly count the items in this scenario', async () => {
		// Add an additional column to the pivot table
		await dare.sql(`

			CREATE TABLE \`members\` (
				\`id\` int NOT NULL AUTO_INCREMENT,
				\`name\` VARCHAR(20) NOT NULL,
				PRIMARY KEY (\`id\`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8;

			CREATE TABLE \`content\` (
				\`id\` int NOT NULL AUTO_INCREMENT,
				\`name\` VARCHAR(20) NOT NULL,
				PRIMARY KEY (\`id\`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8;
			
			CREATE TABLE \`domains\` (
				\`id\` smallint unsigned NOT NULL AUTO_INCREMENT,
				\`name\` VARCHAR(100) DEFAULT NULL,
				PRIMARY KEY (\`id\`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8;

			CREATE TABLE \`userContent\` (
				\`id\` int NOT NULL AUTO_INCREMENT,
				\`content_id\` int NOT NULL,
				\`user_id\` int NOT NULL,
				\`domain_id\` smallint unsigned NOT NULL,
				\`status\` enum('notstarted','opened','completed') NOT NULL DEFAULT 'notstarted',
				PRIMARY KEY (\`id\`),
				UNIQUE KEY \`content_user_domain_id\` (\`content_id\`,\`user_id\`,\`domain_id\`),
				KEY \`userContent_user\` (\`user_id\`),
				KEY \`fk_userContent_domain_id\` (\`domain_id\`),
				CONSTRAINT \`fk_userContent_domain_id\` FOREIGN KEY (\`domain_id\`) REFERENCES \`domains\` (\`id\`),
				CONSTRAINT \`userContent_content\` FOREIGN KEY (\`content_id\`) REFERENCES \`content\` (\`id\`) ON DELETE CASCADE,
				CONSTRAINT \`userContent_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`members\` (\`id\`) ON DELETE CASCADE
			  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
			  
			  -- ---------------------------------
			  -- INSERT
			  -- ---------------------------------
			  
			  INSERT INTO domains (id, \`name\`) VALUES (1, 'Test');
			  
			  INSERT INTO content (id, \`name\`) VALUES (1, 'A'), (2, 'B'), (3, 'C');
			  
			  INSERT INTO members (\`id\`,\`name\`)
			  VALUES
				  (11, 'devuser11@example.com'),
				  (12, 'devuser12@example.com');
			  
			  INSERT INTO userContent (\`domain_id\`,\`content_id\`,\`user_id\`,\`status\`)
			  VALUES
				  (1, 3, 11, 'completed'),
				  (1, 3, 12, 'completed'),
				  (1, 2, 12, 'completed');

		`);

		const status = 'completed';
		const domain_id = 1;

		dare.options.models.userContent = {
			schema: {
				content_id: ['content.id'],
			},
		};

		// Construct a query which counts these
		const resp = await dare.get({
			table: 'content',
			fields: ['id', {count: 'COUNT(DISTINCT userContent.user_id)'}],
			join: {
				userContent: {
					status,
					domain_id,
				},
			},
			limit: 3,
		});

		assert.deepStrictEqual(resp, [
			{id: 1, count: 0},
			{id: 2, count: 1},
			{id: 3, count: 2},
		]);
	});
});
