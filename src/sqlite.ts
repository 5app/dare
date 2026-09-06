import SQL, {Sql, raw} from 'sql-template-tag';
import Dare, {type QueryOptions} from './index.ts';

/**
 * SQLiteDare
 * Extends Dare with SQLite-specific overrides
 */
class SQLiteDare extends Dare {
	/**
	 * Sets up a new instance of SQLiteDare
	 * @param options - Initial options defining the instance
	 */
	constructor(options: QueryOptions = {}) {
		super({
			...options,
			engine: options.engine || 'sqlite:3',
		});
	}

	/**
	 * Sql_json_array - SQLite JSON_ARRAY
	 */
	sql_json_array(expressions: Array<string>): string {
		return `JSON_ARRAY(${expressions.join(',')})`;
	}

	/**
	 * SQL Array Agg - SQLite uses JSON_GROUP_ARRAY
	 */
	sql_json_arrayagg({
		sql_alias,
		expression,
	}: {
		sql_alias: string;
		expression: string;
	}): string {
		const condition = `CASE WHEN (${sql_alias}.${this.rowid} IS NOT NULL) THEN (${expression}) ELSE NULL END`;
		return `JSON_GROUP_ARRAY(${condition})`;
	}

	/**
	 * SQLite does not support CTE LIMIT filtering
	 */
	applyCTELimitFiltering(): boolean {
		return false;
	}

	/**
	 * IdentifierWrapper - SQLite uses double quotes for identifiers
	 */
	identifierWrapper(field: string): string {
		return ['"', field, '"'].join('');
	}

	/**
	 * On Duplicate Keys Update - SQLite uses ON CONFLICT with DO UPDATE/DO NOTHING
	 */
	onDuplicateKeysUpdate({
		keys = [],
		existing = [],
		duplicate_keys,
	}: {
		keys?: Array<string>;
		sql_table?: string;
		existing?: Array<string>;
		duplicate_keys?: Array<string>;
	}): string {
		if (!keys.length) {
			return `ON CONFLICT DO NOTHING`;
		}

		let conflictKeys;

		if (Array.isArray(duplicate_keys) && duplicate_keys.length) {
			conflictKeys = duplicate_keys;
		} else {
			conflictKeys = existing.filter(item => !keys.includes(item));

			if (!conflictKeys.length) {
				conflictKeys.push(this.rowid);
			}
		}

		return `
			ON CONFLICT (${conflictKeys.map(key => this.identifierWrapper(key)).join(',')})
				DO UPDATE
					SET ${keys.map(name => `${this.identifierWrapper(name)}=EXCLUDED.${this.identifierWrapper(name)}`).join(',')}
		`;
	}

	/**
	 * FulltextSearch - SQLite implementation using FTS5
	 * Requires a virtual FTS5 table named {table}_fts with matching columns
	 */
	fulltextSearch(
		sql_field_array: Sql[],
		value: string,
		NOT?: Sql,
		{sql_alias, sql_table}: {sql_alias?: string; sql_table?: string} = {}
	): Sql {
		const fts_table = `${sql_table}_fts`;
		const parsed = this.fulltextParser(value);
		return SQL`${NOT}${raw(sql_alias)}.id IN (SELECT rowid FROM ${raw(fts_table)} WHERE ${raw(fts_table)} MATCH ${parsed})`;
	}

	/**
	 * FulltextSignParser - SQLite FTS5 does not use +/< />/~ prefixes
	 */
	fulltextSignParser(
		sign: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		index?: number
	): string {
		// Strip MySQL boolean mode operators; FTS5 uses implicit AND
		return sign.replace(/[+<>~]/g, '');
	}

	/**
	 * Pass through value verbatim for JSON formatting
	 */
	jsonFormatValue(value: any): any {
		if (Array.isArray(value)) {
			return value.map(item => this.jsonFormatValue(item));
		}
		return value;
	}
}

/**
 * Default engine for SQLite
 */
SQLiteDare.prototype.engine = 'sqlite:3';

/**
 * SQLite uses `id` as the rowid (alias for rowid)
 */
SQLiteDare.prototype.rowid = 'id';

/**
 * SQLite uses LIKE (case-insensitive for ASCII by default)
 */
SQLiteDare.prototype.sql_keyword_like = 'LIKE';

/**
 * SQLite JSON EXTRACT prefix
 */
SQLiteDare.prototype.sql_json_extract_prefix = '$';

/**
 * SQLite JSON EXTRACT operator
 */
SQLiteDare.prototype.sql_json_extract_operator = '->>';

/**
 * Apply limit on DML - SQLite supports LIMIT on DELETE but not in all contexts
 */
SQLiteDare.prototype.applyLimitOnDML = false;

/**
 * SQLite does not allow joining onto the table being modified in patch / delete requests
 * To work around this, we need to use subquery joins
 */
SQLiteDare.prototype.applySubqueryOnDML = true;

/**
 * Apply aliases to UPDATE statements - SQLite doesn't support this
 */
SQLiteDare.prototype.applyAliasesOnUpdate = false;

/**
 * SQL insert suffix - SQLite uses RETURNING clause
 */
SQLiteDare.prototype.sql_insert_suffix = ` RETURNING id`;

/**
 * SQLite does not support DEFAULT keyword in VALUES, use NULL instead
 */
SQLiteDare.prototype.sql_default_value = null;

export default SQLiteDare;
