import Dare, {type QueryOptions} from './index.ts';
import makeMethodsEnumerable from './utils/make_methods_enumerable.ts';
import semverCompare from 'semver-compare';

/**
 * MySQL57Dare
 * Extends Dare with MySQL 5.7-specific overrides (including 5.6 compatibility)
 */
class MySQL57Dare extends Dare {
	/**
	 * Sets up a new instance of MySQL57Dare
	 * @param options - Initial options defining the instance
	 */
	constructor(options: QueryOptions = {}) {
		super({
			...options,
			engine: options.engine,
		});
	}

	/**
	 * Sql_json_array - MySQL < 5.7 uses CONCAT_WS workaround
	 */
	sql_json_array(expressions: Array<string>): string {
		if (semverCompare(this.engine.split(':').at(1), '5.7') < 0) {
			const wrapped = expressions.map(
				expr =>
					`'"', REPLACE(REPLACE(${expr}, '\\\\', '\\\\\\\\'), '"', '\\\\"'), '"'`
			);
			return `CONCAT_WS('', '[', ${wrapped.join(", ',', ")}, ']')`;
		}
		return `JSON_ARRAY(${expressions.join(',')})`;
	}

	/**
	 * SQL Array Agg - MySQL 5.7 uses IF instead of CASE WHEN
	 */
	sql_json_arrayagg({
		sql_alias,
		expression,
	}: {
		sql_alias: string;
		expression: string;
	}): string {
		const rowid = this.rowid;

		if (semverCompare(this.engine.split(':').at(1), '5.7.21') <= 0) {
			return `CONCAT('[', GROUP_CONCAT(IF(${sql_alias}.${rowid} IS NOT NULL, ${expression}, NULL)), ']')`;
		}

		let condition = `CASE WHEN (${sql_alias}.${rowid} IS NOT NULL) THEN (${expression}) ELSE NULL END`;

		if (this.engine.startsWith('mysql:5.7')) {
			// Overwrite condition for MySQL 5.7
			condition = `IF(${sql_alias}.${rowid} IS NOT NULL, ${expression}, NULL)`;
		}

		return `JSON_ARRAYAGG(${condition})`;
	}

	/**
	 * MySQL 5.7 does not support CTE LIMIT filtering, so override to disable
	 */
	applyCTELimitFiltering(): boolean {
		return false;
	}

	/**
	 * JSON quote values
	 */
	jsonFormatValue(value: any, operator?: 'LIKE' | '=' | 'IN'): any {
		if (Array.isArray(value)) {
			// In MySQL 5.7, we need to quote array values for IN
			return value.map(value => this.jsonFormatValue(value, operator));
		}
		if (
			typeof value === 'string' &&
			(operator === 'LIKE' || operator === 'IN')
		) {
			return `"${value}"`;
		}
		return value;
	}
}

// Restore the enumerable behaviour of the former prototype assignments
makeMethodsEnumerable(MySQL57Dare);

/**
 * Default engine for MySQL 5.7
 */
MySQL57Dare.prototype.engine = 'mysql:5.7';

export default MySQL57Dare;
