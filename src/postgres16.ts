import SQL, {Sql, join} from 'sql-template-tag';
import Dare, {type QueryOptions} from './index.ts';

/**
 * PostgresDare
 * Extends Dare with Postgres-specific overrides
 */
class PostgresDare extends Dare {
	/**
	 * Sets up a new instance of PostgresDare
	 * @param options - Initial options defining the instance
	 */
	constructor(options: QueryOptions = {}) {
		super({
			...options,
			engine: options.engine || 'postgres:16',
		});
	}

	/**
	 * Sql_json_array - Postgres JSON_ARRAY defaults to ABSENT ON NULL, so add NULL ON NULL
	 */
	sql_json_array(expressions: Array<string>): string {
		return `JSON_ARRAY(${expressions.join(',')} NULL ON NULL)`;
	}

	/**
	 * IdentifierWrapper - Postgres uses double quotes for identifiers
	 */
	identifierWrapper(field: string): string {
		return ['"', field, '"'].join('');
	}

	/**
	 * On Duplicate Keys Update - Postgres uses ON CONFLICT with DO UPDATE/DO NOTHING
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
	 * FulltextSearch - Postgres implementation using tsvector/tsquery
	 */
	fulltextSearch(sql_field_array: Sql[], value: string, NOT?: Sql): Sql {
		const field =
			sql_field_array.length === 1
				? sql_field_array.at(0)
				: SQL`TO_TSVECTOR(${join(sql_field_array, " || ' ' || ")})`;
		return SQL`${NOT}${field} @@ to_tsquery('english', ${this.fulltextParser(value)})`;
	}

	/**
	 * FulltextSignParser - Postgres implementation using tsquery syntax
	 */
	fulltextSignParser(sign: string, index?: number): string {
		// Remove MySQL style prefix
		sign = sign.replace(/[+<>~]*/, '');

		// Include the AND operator for all terms except the first, as Postgres requires explicit operators
		if (!sign.includes('&') && index > 0) {
			sign = `& ${sign}`;
		}

		return sign;
	}

	/**
	 * Pass through value verbatim for JSON formatting, as Postgres handles this natively
	 */
	jsonFormatValue(value: any): any {
		if (Array.isArray(value)) {
			return value.map(item => this.jsonFormatValue(item));
		}
		return String(value);
	}
}

/**
 * Default engine for Postgres
 */
PostgresDare.prototype.engine = 'postgres:16';

/**
 * Postgres uses ILIKE for case-insensitive LIKE
 */
PostgresDare.prototype.sql_keyword_like = 'ILIKE';

/**
 * Postgres JSON EXTRACT prefix
 */
PostgresDare.prototype.sql_json_extract_prefix = '';

/**
 * Postgres JSON EXTRACT operator
 */
PostgresDare.prototype.sql_json_extract_operator = '->>';

/**
 * Postgres uses `id` as the rowid
 */
PostgresDare.prototype.rowid = 'id';

/**
 * Postgres fulltext search wildcard character - uses :* for prefix matching
 */
PostgresDare.prototype.sql_fulltext_wildcard = ':*';

/**
 * Apply limit on DML
 * Postgres does not allow joining onto the table being modified in patch / delete requests
 * To work around this, we need to use subquery joins for all joins in these requests
 */
PostgresDare.prototype.applySubqueryOnDML = true;

/**
 * Apply limit on DML operations - Postgres doesn't support this
 */
PostgresDare.prototype.applyLimitOnDML = false;

/**
 * Apply aliases to UPDATE statements - Postgres doesn't support this
 */
PostgresDare.prototype.applyAliasesOnUpdate = false;

/**
 * SQL insert suffix - for RETURNING clause for Postgres
 */
PostgresDare.prototype.sql_insert_suffix = ` RETURNING id`;

export default PostgresDare;
