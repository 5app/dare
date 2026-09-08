import SQL, {Sql, raw, join, empty, bulk} from 'sql-template-tag';

import buildQuery, {generateSQLSelect} from './get.ts';

import DareError from './utils/error.ts';

import toArray from './utils/toArray.ts';

import validateBody from './utils/validate_body.ts';

import getFieldAttributes from './utils/field_attributes.ts';

import extend from './utils/extend.ts';

import makeMethodsEnumerable from './utils/make_methods_enumerable.ts';

import clone from 'tricks/object/clone.js';

import format_request from './format_request.ts';

import response_handler, {responseRowHandler} from './response_handler.ts';

export type Engine =
	| `${'mysql' | 'postgres' | 'mariadb'}:${number}.${number}${string}`
	| `${'mysql' | 'postgres' | 'mariadb' | 'sqlite'}:${number}`;

export type ModalHandlerExtraProps = Pick<
	InternalProps,
	'alias' | 'parent' | 'name' | 'skip'
>;

export type GetModelHandler = (
	options?: GetRequestOptions & ModalHandlerExtraProps,
	dareInstance?: Dare
) => void | Promise<void>;

export type PostModelHandler = (
	options?: PostRequestOptions & ModalHandlerExtraProps,
	dareInstance?: Dare
) => void | Promise<void>;

export type PatchModelHandler = (
	options?: PatchRequestOptions & ModalHandlerExtraProps,
	dareInstance?: Dare
) => void | Promise<void>;

export type DeleteModelHandler = (
	options?: DeleteRequestOptions & ModalHandlerExtraProps,
	dareInstance?: Dare
) => void | Promise<void>;

export type Alias = string;
export type Reference = `${string}.${string}`;
export type DefaultValue = string | number | boolean | null;

export type Handler = Function;
export type Authorised = boolean;

export interface FieldAttributeProps {
	/**
	 * The type of the field
	 */
	type?: 'json' | 'number' | 'boolean' | 'string' | 'datetime' | 'date';

	/**
	 * Alias for the field
	 */
	alias?: Alias;

	/**
	 * References to other models fields
	 */
	references?: Reference[];

	/**
	 * Default value for the field
	 */
	defaultValue?: DefaultValue | DefaultValue[];

	/**
	 * Whether this field is readable
	 * @default true
	 */
	readable?: boolean;

	/**
	 * Whether this field is writeable
	 * @default true
	 */
	writeable?: boolean;

	/**
	 * Whether this field is required
	 * @default false
	 */
	required?: boolean;

	/**
	 * Handler to generate the field value
	 */
	handler?: Handler;

	/**
	 * String defining a SQL function to wrap the value in when setting it
	 */
	setFunction?: (arg: {sql_field: string; field: string; value: any}) => any;

	/**
	 * The get definition of this field
	 */
	get?: FieldAttributes;

	/**
	 * The post definition of this field
	 */
	post?: FieldAttributes;

	/**
	 * The patch definition of this field
	 */
	patch?: FieldAttributes;

	/**
	 * The del definition of this field
	 */
	del?: FieldAttributes;
}

export type FieldAttributes = Record<string, any> & FieldAttributeProps;

export type FieldAttributesWithShorthand =
	| FieldAttributes
	| Handler
	| Reference[]
	| Alias
	| (Authorised & false)
	| null;

export type Schema = Record<string, FieldAttributesWithShorthand>;

export interface Model {
	/**
	 * Model Schema
	 */
	schema?: Schema;

	/**
	 * Alias for the table
	 */
	table?: string;

	/**
	 * Shortcut map
	 */
	shortcut_map?: Record<string, string>;

	/**
	 * Get handler
	 */
	get?: GetModelHandler;

	/**
	 * Post handler
	 */
	post?: PostModelHandler;

	/**
	 * Patch handler
	 */
	patch?: PatchModelHandler;

	/**
	 * Delete handler
	 */
	del?: DeleteModelHandler;
}

export type RequestFields = Array<
	| string
	| number
	| boolean
	| Record<string, string | number | boolean | RequestFields>
>;

export type ValidateInputFunction = (
	fieldAttributes: Record<string, any>,
	field: string,
	value?: any
) => void;

export interface RequestOptions {
	/**
	 * Name of the table to query
	 */
	table?: string;

	/**
	 * Fields array to return
	 */
	fields?: RequestFields;

	/**
	 * Filter Object to query
	 */
	filter?: Record<string, any>;

	/**
	 * Place filters on the joining tables
	 */
	join?: Record<string, any>;

	/**
	 * Body containing new data
	 */
	body?: Record<string, any> | Array<Record<string, any>>;

	/**
	 * Query attached to a post request to create INSERT...SELECT operations
	 */
	query?: RequestOptions;

	/**
	 * Number of items to return
	 */
	limit?: number;

	/**
	 * Number of items to skip
	 */
	start?: number;

	/**
	 * Array of fields to order by
	 */
	orderby?: string | string[];

	/**
	 * Field to group by
	 */
	groupby?: string | string[];

	/**
	 * 'ignore' to prevent throwing Duplicate key errors
	 */
	duplicate_keys?: string | string[];

	/**
	 * An array of fields to update on presence of duplicate key constraints
	 */
	duplicate_keys_update?: string[];

	/**
	 * If not undefined will be returned in case of a single entry not found
	 */
	notfound?: any;

	/**
	 * Models with schema defintitions
	 */
	models?: Record<string, Model>;

	/**
	 * Validate input
	 */
	validateInput?: ValidateInputFunction;

	/**
	 * Infer intermediate models
	 */
	infer_intermediate_models?: boolean;

	/**
	 * Override default Function to handle each row
	 */
	rowHandler?: (row: Record<string, any>) => any;

	/**
	 * Override default Function to interpret the field key
	 */
	getFieldKey?: (field: string, schema: Schema) => string | void;

	/**
	 * Allowable conditional operators in value
	 */
	conditional_operators_in_value?: string;

	/**
	 * Arbitary data to carry through to the model/response handlers
	 */
	state?: any;

	/**
	 * DB Engine to use
	 */
	engine?: Engine;

	/**
	 * Aka INSERT IGNORE INTO...
	 */
	ignore?: boolean;
}

export interface InternalProps {
	/**
	 * Method to use
	 */
	method?: 'post' | 'get' | 'patch' | 'del';

	/**
	 * Model Name derived
	 */
	name?: string;

	/**
	 * Return a single item
	 */
	single?: boolean;

	/**
	 * Skip the request
	 */
	skip?: boolean;

	/**
	 * Alias for the table
	 */
	alias?: string;

	/**
	 * Count all rows
	 */
	countRows?: boolean;

	/**
	 * SQL Table
	 */
	sql_table?: string;

	/**
	 * SQL Alias
	 */
	sql_alias?: string;

	/**
	 * SQL Join
	 */
	sql_joins?: Sql[];

	/**
	 * Defines the parent request
	 */
	parent?: QueryOptions;

	/**
	 * Force the table joins to use a subquery.
	 */
	forceSubquery?: boolean;

	/**
	 * SQL Where conditions
	 */
	sql_where_conditions?: Sql[];

	/*
	 * -- properties of the format_request function
	 */

	/**
	 * Has filter, used to determine whether a node and it's descendents can be defined as a subquery
	 */
	has_filter?: boolean;

	/**
	 * Has fields, used to determine whether the subqueries are required
	 */
	has_fields?: boolean;

	/**
	 * An alternative path to these fields when intermediate models are used
	 */
	field_alias_path?: string;

	/**
	 * Join is required
	 */
	required_join?: boolean;

	/**
	 * Whether this node is connected via a negation operator
	 */
	negate?: boolean;

	/**
	 * Identify a node as a subquery, used to place fields into a subquery, or a filter into a subquery (i.e. when negated)
	 */
	is_subquery?: boolean;

	/**
	 * 1:n join
	 */
	many?: boolean;

	/**
	 * Join conditions between nodes
	 */
	join_conditions?: Record<string, any>;

	/**
	 * Table to join
	 */
	sql_join_condition?: Sql;

	/**
	 * Usually this is derived when processing the node, however when there is an intermediate node, we can pre-define the joins
	 */
	joins?: Array<QueryOptions>;

	/**
	 * Descendent nodes, post-processed
	 */
	_joins?: Array<QueryOptions>;

	/**
	 * Marks the root node of a query
	 */
	root?: boolean;
}

export type QueryOptions = RequestOptions & InternalProps;

/**
 * Dare.get Request Options
 */
export type GetRequestOptions = Omit<
	RequestOptions,
	'body' | 'query' | 'duplicate_keys' | 'duplicate_keys_update'
>;

/**
 * Dare.patch Request Options
 */
export type PatchRequestOptions = Omit<
	RequestOptions,
	'fields' | 'groupby' | 'query'
>;

/**
 * Dare.post Request Options
 */
export type PostRequestOptions = Omit<
	RequestOptions,
	'filter' | 'start' | 'limit' | 'groupby' | 'orderby'
>;

/**
 * Dare.del Request Options
 */
export type DeleteRequestOptions = Omit<RequestOptions, 'body' | 'query'>;

/*
 * Export Dare Error object
 */
export {DareError};

/**
 * Dare
 * Sets up a new instance of Dare
 */
export default class Dare {
	// Export the DareError object
	static DareError = DareError;

	/**
	 * Engine, database engine
	 */
	declare engine: Engine;

	// SQL keyword for LIKE operations
	declare sql_keyword_like: string;

	/**
	 * JSON EXTRACT prefix
	 */
	declare sql_json_extract_prefix: string;

	/**
	 * JSON EXTRACT operator
	 */
	declare sql_json_extract_operator: string;

	/**
	 * Defaul SQL wildcard character for fulltext searches
	 */
	declare sql_fulltext_wildcard: string;

	// Rowid, name of primary key field used in grouping operation: MySQL uses _rowid
	declare rowid: string;

	/**
	 * Default value to use in INSERT statements when a column value is missing
	 * MySQL/MariaDB support the DEFAULT keyword, SQLite does not
	 */
	declare sql_default_value: Sql | null;

	// Set the Max Limit for SELECT statements
	declare MAX_LIMIT: number | null;

	// Capture the generated field functions to run after the request
	declare generated_fields: any[];

	// Default options
	declare options: QueryOptions;

	/**
	 * Apply limit on DML operations - MySQL supports this, Postgres doesn't
	 */
	declare applyLimitOnDML: boolean;

	/**
	 * Whether the engine requires subquery joins to prevent joining onto
	 * The table being modified in patch / delete requests
	 */
	declare applySubqueryOnDML: boolean;

	/**
	 * Apply aliases to UPDATE statements - Postgres doesn't support this
	 */
	declare applyAliasesOnUpdate: boolean;

	/**
	 * Apply table alias on UPDATE statement - SQLite doesn't support UPDATE tbl alias SET ...
	 */
	declare applyTableAliasOnUpdate: boolean;

	/**
	 * SQL insert suffix - Additional SQL to append to insert statements, e.g., RETURNING clause for Postgres
	 */
	declare sql_insert_suffix: string | undefined;

	declare unique_alias_index: number;

	declare format_request: (options: QueryOptions) => Promise<QueryOptions>;

	declare response_handler: (resp: any[]) => any[];

	/**
	 * Custom row handler, for handling each record in the response
	 */
	declare response_row_handler?: (item: any, index?: number) => any;

	/**
	 * Define a resultset
	 */
	declare resultset: Array<object> | undefined;

	/**
	 * Sets up a new instance of Dare
	 * @param options - Initial options defining the instance
	 */
	constructor({engine, ...options}: QueryOptions = {}) {
		// Overwrite default properties
		this.options = extend(clone(this.options), options);

		if (engine) {
			this.engine = engine;
		}
	}

	/**
	 * Set default execution handler
	 * @param requestQuery - Request object
	 * @returns Response
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async execute(requestQuery: {sql: string; values?: any[]}): Promise<any> {
		throw new DareError(
			DareError.INVALID_SETUP,
			'Define dare.execute to continue'
		);
	}

	/**
	 * Sql_json_array - Generates JSON_ARRAY expression for a list of field expressions
	 * @param expressions - Array of field expressions
	 * @returns SQL expression
	 */
	sql_json_array(expressions: Array<string>): string {
		return `JSON_ARRAY(${expressions.join(',')})`;
	}

	/**
	 * Sql_json_arrayagg - Generates JSON_ARRAYAGG expression for grouping
	 * @param params - Params
	 * @param params.sql_alias - SQL Alias
	 * @param params.expression - Inner expression
	 * @returns SQL expression
	 */
	sql_json_arrayagg({
		sql_alias,
		expression,
	}: {
		sql_alias: string;
		expression: string;
	}): string {
		const condition = `CASE WHEN (${sql_alias}.${this.rowid} IS NOT NULL) THEN (${expression}) ELSE NULL END`;
		return `JSON_ARRAYAGG(${condition})`;
	}

	/**
	 * JSON quote values
	 * @param value - Value to quote
	 * @param operator - Operator
	 * @returns Quoted value
	 */
	jsonFormatValue(value: any, operator: 'LIKE' | '=' | 'IN' = '='): any {
		if (operator === 'LIKE' && typeof value === 'string') {
			return `"${value}"`;
		}
		return value;
	}

	// Set default table_alias handler
	table_alias_handler(name: string): string {
		return name.replace(/^-/, '').split('$')[0];
	}

	identifierWrapper(field: string): string {
		return [`\``, field, `\``].join('');
	}

	get_unique_alias(): string {
		const i = this.unique_alias_index;
		const num_characters_in_alphabet = 26;
		const str = String.fromCharCode(97 + (i % num_characters_in_alphabet));
		this.unique_alias_index += 1;
		if (i < num_characters_in_alphabet) {
			return str;
		}

		if (i > num_characters_in_alphabet * num_characters_in_alphabet) {
			throw new DareError(
				DareError.INVALID_REQUEST,
				'Unique Alias Index has exceeded maximum'
			);
		}

		const prefix = String.fromCharCode(
			96 + Math.floor(i / num_characters_in_alphabet)
		);

		return this.identifierWrapper(`${prefix}${str}`);
	}

	/**
	 * GetFieldKey
	 * @param field - Field
	 * @param schema - Model Schema
	 * @returns Field Key
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getFieldKey(field: string, schema: Schema): string | void {
		// Do nothing, default is to set it to same as field
	}

	/**
	 * FulltextSearch
	 * @param sql_field_array - Array of SQL fields to apply the fulltext search to
	 * @param value - Fulltext search string
	 * @param NOT - Whether to negate the fulltext search
	 * @param context - Additional context (sql_alias, sql_table)
	 * @returns SQL condition for the fulltext search
	 */
	fulltextSearch(
		sql_field_array: Sql[],
		value: string,
		NOT?: Sql,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		context?: {sql_alias?: string; sql_table?: string}
	): Sql {
		return SQL`${NOT}MATCH(${join(sql_field_array, ', ')}) AGAINST(${this.fulltextParser(value)} IN BOOLEAN MODE)`;
	}

	/**
	 * FulltextSignParser
	 * @param sign - Sign character to parse
	 * @param index - Index of the term in the fulltext search string, used to determine whether to apply default AND operator
	 * @returns Parsed sign character
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	fulltextSignParser(sign: string, index?: number): string {
		return sign;
	}

	/**
	 * Fulltext Parser
	 * This will format a string to make it compliant with MySQL Fulltext search
	 * Such as wrapping special characters in quotes where they appear in the middle of words
	 * Removing any trailing '*' characters which succeed a quoted string
	 * e.g. `+test@example.com*` becomes `+"test@example.com"`
	 * @param input - Input string
	 * @returns Formatted string
	 */
	fulltextParser(input: string): string {
		const sql_fulltext_wildcard = this.sql_fulltext_wildcard;

		function safequote(text: string) {
			let suffix = '';

			if (text.endsWith('*')) {
				suffix = '*';
				text = text.slice(0, -1);
			}

			if (text.match(/['@-]/)) {
				return `"${text}"`;
			}

			if (suffix === '*') {
				return `${text}${sql_fulltext_wildcard}`;
			}

			return text + suffix;
		}

		if (typeof input !== 'string' || input === '') {
			throw new DareError(
				DareError.INVALID_REQUEST,
				'Fulltext input must be a string'
			);
		}

		// Replace any special characters with quotes
		const resp = input.matchAll(
			/\s*(?<sign>[&+<>~-]?)(?:\((?<subexpression>[^()]*)\)|(?<quoted>".*?")|(?<unquoted>[^\s()]+))(?<suffix>\*)?/g
		);

		const output = [...resp]
			.filter(({groups: {subexpression, quoted, unquoted}}) =>
				quoted
					? quoted.length > 2
					: subexpression || unquoted.replace(/^[*+-]+/, '')
			)
			.map(
				(
					{
						groups: {
							sign,
							subexpression,
							quoted,
							unquoted,
							suffix = '',
						},
					},
					index
				) => {
					sign = this.fulltextSignParser(sign, index);

					if (subexpression) {
						return `${sign}(${this.fulltextParser(subexpression)})`;
					} else if (quoted) {
						return `${sign}${quoted}`;
					} else {
						return `${sign}${safequote(unquoted + suffix)}`;
					}
				}
			);

		return output.join(' ');
	}

	/**
	 * Dare.after
	 * Defines where the instance goes looking to apply post execution handlers and potentially mutate the response
	 * @param resp - Response object
	 * @returns response data formatted or not
	 */
	after(resp: any): any {
		// Define the after handler
		const handler = `after${this.options.method.replace(/^[a-z]/, m =>
			m.toUpperCase()
		)}`;
		const table = this.options.name;

		// Trigger after handlers following a request
		if (handler in this.options && table in this.options[handler]) {
			// Trigger handler
			return this.options[handler][table].call(this, resp) || resp;
		}

		return resp;
	}

	/**
	 * Determine whether to use CTE LIMIT Filtering
	 * @param options - Query options
	 * @returns Whether to use CTE LIMIT Filtering
	 */
	applyCTELimitFiltering(options: QueryOptions): boolean {
		// Cancel if limit is beyond a certain threshold
		if (options.limit > 10_000) {
			return false;
		}

		return true;
	}

	/**
	 * Use
	 * Creates a new instance of Dare and merges new options with the base options
	 * @param options - set of instance options
	 * @returns Instance of Dare
	 */
	use({engine, ...options}: QueryOptions = {}): this {
		const inst = Object.create(this);

		// Create a new options, merging inheritted and new
		inst.options = extend(clone(this.options), options);

		// Define the Row handler to format the results
		if (options.rowHandler) {
			inst.response_row_handler = options.rowHandler;
		}
		if (options.getFieldKey) {
			inst.getFieldKey = options.getFieldKey;
		}
		if (engine) {
			inst.engine = engine;
		}

		// Set the generate_fields array
		inst.generated_fields = [];

		// Set SQL level states
		inst.unique_alias_index = 0;
		return inst;
	}

	/**
	 * Add a row to the resultset
	 * @param row - Row record to add to the rows resultset
	 */
	addRow(row: object): void {
		// Format the SQL Row
		const item = responseRowHandler.call(this, row);

		// If this is not undefined...
		if (item !== undefined) {
			this.resultset ??= [];
			this.resultset.push(item);
		}
	}

	/**
	 * Dare.sql
	 * Prepares and processes SQL statements
	 *
	 * @param sql - SQL string containing the query
	 * @param values - List of prepared statement values
	 * @returns Returns response object or array of values
	 */
	async sql(
		sql: string | Sql | {sql: string; values?: any[]},
		values?: any[]
	): Promise<any> {
		let req;

		if (typeof sql === 'object') {
			req = sql;
		} else {
			req = {sql, values};
		}

		const resp = await this.execute(req);
		return resp || this.resultset;
	}

	/**
	 * Dare.get
	 * Triggers a DB SELECT request to rerieve records from the database.
	 *
	 * @param table - Name of the table to query
	 * @param fields - Fields array to return
	 * @param filter - Filter Object to query
	 * @param options - An Options object containing all other request options
	 * @returns Results
	 */
	async get(
		table: string | GetRequestOptions,
		fields?: RequestFields,
		filter?: Record<string, any>,
		options: Omit<GetRequestOptions, 'table' | 'fields' | 'filter'> = {}
	): Promise<any> {
		const opts: QueryOptions =
			typeof table === 'object'
				? // Clone
					{...table}
				: // Clone and extend
					{...options, table, filter, fields};

		const existanceCheck = opts.fields === undefined;

		// Ensure fields is provided
		if (existanceCheck) {
			opts.fields = [{recordExists: true}];
		} else if (typeof opts.fields !== 'object' || opts.fields === null) {
			// Fields must be defined
			throw new DareError(DareError.INVALID_REQUEST);
		}

		// Define method
		opts.method = 'get';

		// Set default notfound handler
		setDefaultNotFoundHandler(opts);

		const dareInstance = this.use(opts);

		const req = await dareInstance.format_request(dareInstance.options);

		// Build the query
		const query = buildQuery(req, dareInstance);

		// Where the query has_sub_queries=true property, we should generate a CTE query
		if (
			query.has_sub_queries &&
			(!opts.groupby || toArray(opts.groupby).join('') === 'id') &&
			this.applyCTELimitFiltering(req)
		) {
			// Create a new formatted query, with just the fields
			opts.fields = ['id'];
			const cteInstance = this.use(opts);
			const cteRequest = await cteInstance.format_request(
				cteInstance.options
			);
			const cteQuery = buildQuery(cteRequest, cteInstance);
			const sql_query = generateSQLSelect(cteQuery);
			query.sql_joins.unshift(
				SQL`JOIN cte ON (cte.id = ${raw(query.sql_alias)}.${raw(dareInstance.rowid)})`
			);
			query.sql_cte = SQL`cte AS (${sql_query})`;

			// Disable repeating the start (offset)
			query.start = undefined;
		}

		// If the query is empty, return an empty array
		const sql_query = generateSQLSelect(query);

		// Execute the query
		const sql_response = await dareInstance.sql(sql_query);

		if (sql_response === undefined) {
			return;
		}

		// Format the response
		let resp = await dareInstance.response_handler(sql_response);

		// If limit was not defined we should return the first result only.
		if (dareInstance.options.single) {
			if (resp.length) {
				resp = resp[0];
			} else if (typeof dareInstance.options.notfound === 'function') {
				dareInstance.options.notfound();
			} else {
				resp = dareInstance.options.notfound;
			}
		}

		return dareInstance.after(resp);
	}

	/**
	 * Dare.getCount
	 * Returns the total number of results which match the conditions
	 *
	 * @param table - Name of the table to query
	 * @param filter - Filter Object to query
	 * @param options - An Options object containing all other request options
	 * @returns Number of matched items
	 */
	async getCount(
		table: string | GetRequestOptions,
		filter?: Record<string, any>,
		options: Omit<GetRequestOptions, 'table' | 'filter'> = {}
	): Promise<number> {
		const opts: QueryOptions =
			typeof table === 'object'
				? // Clone
					{...table}
				: // Clone and extend
					{...options, table, filter};

		// Define method
		opts.method = 'get';

		// Flag Count all rows
		opts.countRows = true;

		// Remove the fields...
		opts.fields = [];

		// Remove any orderby
		opts.orderby = undefined;

		// Remove the limit and start
		opts.limit = undefined;
		opts.start = undefined;

		const dareInstance = this.use(opts);

		const req = await dareInstance.format_request(dareInstance.options);

		const query = buildQuery(req, dareInstance);
		const sql_query = generateSQLSelect(query);

		// Execute the query
		const [resp] = await dareInstance.sql(sql_query);

		/*
		 * Return the count
		 * postgres: returns a string, which needs to be cast to a number
		 */
		return Number(resp.count);
	}

	/**
	 * Dare.patch
	 * Updates records matching the conditions
	 *
	 * @param table - Name of the table to query
	 * @param filter - Filter Object to query
	 * @param body - Body containing new data
	 * @param options - An Options object containing all other request options
	 * @returns Affected Rows statement
	 */
	async patch(
		table: string | PatchRequestOptions,
		filter?: Record<string, any>,
		body?: Record<string, any>,
		options: Omit<PatchRequestOptions, 'table' | 'body' | 'filter'> = {}
	): Promise<any> {
		const opts: QueryOptions =
			typeof table === 'object'
				? // Clone
					{...table}
				: // Clone and extend
					{...options, table, filter, body};

		// Define method
		opts.method = 'patch';

		// Set default notfound handler
		setDefaultNotFoundHandler(opts);

		const dareInstance = this.use(opts);

		// Prevent joining onto the table being modified
		opts.forceSubquery = dareInstance.applySubqueryOnDML;

		const req = await dareInstance.format_request(opts);

		// Skip this operation?
		if (req.skip) {
			return dareInstance.after(req.skip);
		}

		// Validate Body
		validateBody(req.body);

		// Options
		const {models, validateInput} = dareInstance.options;

		// Get the model structure
		const {schema: tableSchema} = models?.[req.name] || {};

		// Prepare post
		const sql_set = prepareSQLSet({
			body: req.body,
			sql_alias: dareInstance.applyAliasesOnUpdate ? req.sql_alias : null,
			tableSchema,
			validateInput,
			dareInstance,
		});

		// If ignore duplicate keys is stated as ignore
		let exec = '';
		if (
			req.duplicate_keys &&
			req.duplicate_keys.toString().toLowerCase() === 'ignore'
		) {
			exec = 'IGNORE ';
		}

		// Construct a db update
		const sql = SQL`
		UPDATE ${raw(exec)}${raw(req.sql_table)} ${dareInstance.applyAliasesOnUpdate ? raw(req.sql_alias) : empty}
		${req.sql_joins.length ? join(req.sql_joins, '\n') : empty}
		SET ${sql_set}
		WHERE
			${join(req.sql_where_conditions, ' AND ')}
		${dareInstance.applyLimitOnDML && !req.sql_joins.length ? SQL`LIMIT ${req.limit}` : empty}
	`;

		let resp = await this.sql(sql);

		resp = mustAffectRows(resp, opts.notfound);

		return dareInstance.after(resp);
	}

	/**
	 * Dare.post
	 * Insert new data into database
	 *
	 * @param table - Name of the table to query
	 * @param body - Body containing new data
	 * @param options - An Options object containing all other request options
	 * @returns Affected Rows statement
	 */
	async post(
		table: string | PostRequestOptions,
		body?: Record<string, any> | Array<Record<string, any>>,
		options: Omit<PostRequestOptions, 'table' | 'body'> = {}
	): Promise<any> {
		const opts: QueryOptions =
			typeof table === 'object'
				? // Clone
					{...table}
				: // Clone and extend
					{...options, table, body};

		// Post
		opts.method = 'post';

		const dareInstance = this.use(opts);

		// Table
		const req = await dareInstance.format_request(opts);

		// Skip this operation?
		if (req.skip) {
			return dareInstance.after(req.skip);
		}

		// Capture fields...
		const fields: string[] = [];

		/**
		 * INSERT... SELECT placeholder
		 */
		let sql_query: Sql = empty;

		if (req.query) {
			/*
			 * Validate all fields are simple ones
			 * Test: are there nested fields
			 */
			const invalidQueryFields = req.query.fields
				.flatMap(field =>
					typeof field === 'string' ? field : Object.values(field)
				)
				.some(value => value !== null && typeof value === 'object');

			// Throw an error if the fields are missing, perhaps indented
			if (invalidQueryFields) {
				throw new DareError(
					DareError.INVALID_REQUEST,
					'Nested fields forbidden in post-query'
				);
			}

			const getInstance = this.use(req.query);

			getInstance.options.method = 'get';

			const getRequest = await getInstance.format_request(
				getInstance.options
			);

			// Throw an error if there are any generated fields
			if (getInstance.generated_fields.length) {
				throw new DareError(
					DareError.INVALID_REQUEST,
					'Generated fields forbidden in post-query'
				);
			}

			// Assign the query
			const query = buildQuery(getRequest, getInstance);
			sql_query = generateSQLSelect(query);

			fields.push(...walkRequestGetField(getRequest));
		} else {
			// Validate Body
			validateBody(req.body);
		}

		// Set table
		let post = req.body || [];

		// Clone object before formatting
		if (!Array.isArray(post)) {
			post = [post];
		}

		// If ignore duplicate keys is stated as ignore
		const sql_exec = req.ignore ? raw('IGNORE') : empty;

		// Instance options
		const {models, validateInput} = dareInstance.options;

		// Get the schema
		const {schema: modelSchema = {}} = models?.[req.name] || {};

		const data = post
			.map(item => {
				const _data = [];
				const currFields = [];

				/*
				 * Iterate through the properties
				 * Format, validate and insert
				 */
				for (const prop in item) {
					// Format key and values...
					const {field, value} = formatInputValue({
						tableSchema: modelSchema,
						field: prop,
						value: item[prop],
						validateInput,
						dareInstance,
					});

					// Store the original field names
					currFields.push(field);

					// Get the index in the field list
					let i = fields.indexOf(field);

					if (i === -1) {
						i = fields.length;

						fields.push(field);
					}

					// Insert the value at that position
					_data[i] = value;
				}

				/*
				 * Let's catch the omitted properties
				 * --> Loop through the modelSchema
				 */
				Object.keys(modelSchema).forEach(field => {
					// For each property which was not covered by the input
					if (field !== 'default' && !currFields.includes(field)) {
						// Get a formatted object of field attributes
						const fieldAttributes = getFieldAttributes(
							field,
							modelSchema,
							dareInstance
						);

						/*
						 * CurrFields stores the alias
						 * So let's check the alias is not already defined
						 */
						if (currFields.includes(fieldAttributes.alias)) {
							return;
						}

						// Validate with an undefined value
						validateInput?.(fieldAttributes, field);

						// Default values?
						if (fieldAttributes.defaultValue) {
							// Get the index in the field list
							let i = fields.indexOf(field);

							if (i === -1) {
								i = fields.length;

								fields.push(field);
							}

							// Insert the defaultValue at that position
							_data[i] = fieldAttributes.defaultValue;
						}
					}
				});

				return _data;
			})
			.map(_data => {
				// Create prepared values
				const a = fields.map((_, index) => {
					// If any of the values are missing, set them as DEFAULT
					if (_data[index] === undefined) {
						return dareInstance.sql_default_value;
					}

					// Return the prepared statement placeholder
					return _data[index];
				});

				return a;
			});

		// Options
		let sql_on_duplicate_keys_update = empty;
		if (req.duplicate_keys_update) {
			sql_on_duplicate_keys_update = raw(
				dareInstance.onDuplicateKeysUpdate({
					keys: req.duplicate_keys_update.map(field =>
						unAliasFields(modelSchema, field, dareInstance)
					),
					existing: fields,
					duplicate_keys: Array.isArray(req.duplicate_keys)
						? req.duplicate_keys.map(field =>
								unAliasFields(modelSchema, field, dareInstance)
							)
						: undefined,
				})
			);
		} else if (req.duplicate_keys?.toString()?.toLowerCase() === 'ignore') {
			sql_on_duplicate_keys_update = raw(
				dareInstance.onDuplicateKeysUpdate({
					sql_table: req.sql_table,
				})
			);
		}

		// Additional suffix for Postgres to return the inserted record, as Postgres does not support LAST_INSERT_ID() function
		const sql_postgres_returning = dareInstance.sql_insert_suffix
			? raw(dareInstance.sql_insert_suffix)
			: empty;

		// Construct a db update
		const sql = SQL`INSERT ${sql_exec} INTO ${raw(req.sql_table)}
			(${raw(fields.map(dareInstance.identifierWrapper.bind(dareInstance)).join(','))})
			${data.length ? SQL`VALUES ${bulk(data)}` : empty}
			${sql_query}
			${sql_on_duplicate_keys_update}
			${sql_postgres_returning}`;

		const resp = await dareInstance.sql(sql);

		return dareInstance.after(resp);
	}

	/**
	 * Dare.del
	 * Delete a record matching condition
	 *
	 * @param table - Name of the table to query
	 * @param filter - Filter Object to query
	 * @param options - An Options object containing all other request options
	 * @returns Affected Rows statement
	 */
	async del(
		table: string | DeleteRequestOptions,
		filter?: Record<string, any>,
		options: Omit<DeleteRequestOptions, 'table' | 'filter'> = {}
	): Promise<any> {
		const opts: QueryOptions =
			typeof table === 'object'
				? // Clone
					{...table}
				: // Clone and extend
					{...options, table, filter};

		// Delete
		opts.method = 'del';

		// Set default notfound handler
		setDefaultNotFoundHandler(opts);

		const dareInstance = this.use(opts);

		// Prevent joining onto the table being modified
		opts.forceSubquery = dareInstance.applySubqueryOnDML;

		const req = await dareInstance.format_request(opts);

		// Skip this operation?
		if (req.skip) {
			return dareInstance.after(req.skip);
		}

		// Construct a db update
		const sql = SQL`DELETE ${
			req.sql_joins.length ? raw(req.sql_table) : empty
		} FROM ${raw(req.sql_table)}
					${req.sql_joins.length ? join(req.sql_joins, '\n') : empty}
					WHERE
					${join(req.sql_where_conditions, ' AND ')}
					${dareInstance.applyLimitOnDML && !req.sql_joins.length ? SQL`LIMIT ${req.limit}` : empty}`;

		let resp = await this.sql(sql);

		resp = mustAffectRows(resp, opts.notfound);

		return dareInstance.after(resp);
	}

	/**
	 * On Duplicate Keys Update
	 * @param obj - Object
	 * @param obj.keys - Array of field keys which are duplicated
	 * @param obj.existing - Array of existing field keys in the database, used to validate the keys provided in `keys` parameter
	 * @param obj.sql_table - SQL table name, used for MySQL aliasing in 8.0.20+
	 * @param obj.duplicate_keys - Array of keys to check for duplicates
	 * @returns SQL snippet for ON DUPLICATE KEY UPDATE
	 */
	onDuplicateKeysUpdate({
		keys = [],
		sql_table = '',
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		existing = [],
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		duplicate_keys = [],
	}: {
		keys?: Array<string>;
		sql_table?: string;
		existing?: Array<string>;
		duplicate_keys?: Array<string>;
	}): string {
		let s = keys
			.map(
				name =>
					`${this.identifierWrapper(name)}=VALUES(${this.identifierWrapper(name)})`
			)
			.join(',');

		if (!keys.length) {
			s = `${sql_table}._rowid`;
			s = `${s}=${s}`;
		}

		return `ON DUPLICATE KEY UPDATE ${s}`;
	}
}

/*
 * ES class methods are non-enumerable by default,
 * restore the enumerable behaviour of the former prototype assignments
 */
makeMethodsEnumerable(Dare);

/**
 * Engine, database engine
 */
Dare.prototype.engine = 'mysql:8.0.40';

// SQL keyword for LIKE operations
Dare.prototype.sql_keyword_like = 'LIKE';

// JSON EXTRACT prefix
Dare.prototype.sql_json_extract_prefix = '$';

// JSON EXTRACT operator
Dare.prototype.sql_json_extract_operator = '->';

// Defaul SQL wildcard character for fulltext searches
Dare.prototype.sql_fulltext_wildcard = '*';

// Rowid, name of primary key field used in grouping operation: MySQL uses _rowid
Dare.prototype.rowid = '_rowid';

/*
 * Default value to use in INSERT statements when a column value is missing
 * MySQL/MariaDB support the DEFAULT keyword, SQLite does not
 */
Dare.prototype.sql_default_value = raw('DEFAULT');

// Set the Max Limit for SELECT statements
Dare.prototype.MAX_LIMIT = null;

// Capture the generated field functions to run after the request
Dare.prototype.generated_fields = [];

// Default options
Dare.prototype.options = {
	// Infer intermediate tables when two models are not directly linked
	infer_intermediate_models: true,

	// Allow conditional operators in value
	conditional_operators_in_value: '%!~',
};

// Apply limit on DML operations - MySQL supports this, Postgres doesn't
Dare.prototype.applyLimitOnDML = true;

/*
 * Whether the engine requires subquery joins to prevent joining onto
 * The table being modified in patch / delete requests
 */
Dare.prototype.applySubqueryOnDML = false;

// Apply aliases to UPDATE statements - Postgres doesn't support this
Dare.prototype.applyAliasesOnUpdate = true;

// Apply table alias on UPDATE statement - SQLite doesn't support UPDATE tbl alias SET ...
Dare.prototype.applyTableAliasOnUpdate = true;

// SQL insert suffix - Additional SQL to append to insert statements, e.g., RETURNING clause for Postgres
Dare.prototype.sql_insert_suffix = undefined;

Dare.prototype.unique_alias_index = 0;

Dare.prototype.format_request = format_request;

Dare.prototype.response_handler = response_handler;

// Define a resultset
Dare.prototype.resultset = undefined;

/**
 * Prepared SQL Set
 * Prepare a SET assignments used in Patch
 * @param obj - Object
 * @param obj.body - body to format
 * @param obj.sql_alias - SQL Alias for update table
 * @param obj.tableSchema - Schema for the current table
 * @param obj.validateInput - Validate input function
 * @param obj.dareInstance - Dare Instance
 * @returns Object containing the SQL assignments and values
 */
function prepareSQLSet({
	body,
	sql_alias,
	tableSchema = {},
	validateInput,
	dareInstance,
}: {
	body: Record<string, any>;
	sql_alias: string | null;
	tableSchema?: Schema;
	validateInput?: ValidateInputFunction;
	dareInstance: Dare;
}): Sql {
	const assignments = [];

	for (const label in body) {
		/*
		 * Get the real field in the db,
		 * And formatted value...
		 */
		const {sql_field, value} = formatInputValue({
			sql_alias,
			tableSchema,
			field: label,
			value: body[label],
			validateInput,
			dareInstance,
		});

		// Replace value with a question using any mapped fieldName
		assignments.push(SQL`${raw(sql_field)} = ${value}`);
	}

	return join(assignments, ', ');
}

function mustAffectRows(result: any, notfound: any): any {
	if (result.affectedRows === 0) {
		if (typeof notfound === 'function') {
			return notfound();
		}
		return notfound;
	}
	return result;
}

/**
 * Format Input Value
 * For a given field definition, return the db key (alias) and format the input it required
 * @param obj - Object
 * @param obj.tableSchema - An object containing the table schema
 * @param obj.sql_alias - SQL Alias for the table
 * @param obj.field - field identifier
 * @param obj.value - Given value
 * @param obj.validateInput - Custom validation function
 * @param obj.dareInstance - Dare Instance
 * @throws Will throw an error if the field is not writable
 * @returns A singular value which can be inserted
 */
function formatInputValue({
	tableSchema = {},
	sql_alias = null,
	field,
	value,
	validateInput,
	dareInstance,
}: {
	tableSchema?: Schema;
	sql_alias?: string | null;
	field: string;
	value: any;
	validateInput?: ValidateInputFunction;
	dareInstance: Dare;
}): {field: string; sql_field: string; value: any} {
	/*
	 * Get the field attributes
	 * If the field is not found, use `default` field otherwise return an empty object
	 */
	let fieldAttributes = getFieldAttributes(
		field,
		tableSchema,
		dareInstance,
		true
	);

	if (Object.keys(fieldAttributes).length === 0) {
		// Set this to null for validateInput
		fieldAttributes = null;
	}

	const {alias, writeable, type, setFunction} = fieldAttributes || {};

	// Execute custom field validation
	validateInput?.(fieldAttributes, field, value);

	// Rudimentary validation of content
	if (writeable === false) {
		throw new DareError(
			DareError.INVALID_REFERENCE,
			`Field '${field}' is not writeable`
		);
	}

	// Stringify object
	if (type === 'json') {
		// Value must be an object
		if (typeof value !== 'object') {
			throw new DareError(
				DareError.INVALID_VALUE,
				`Field '${field}' must be an object: ${JSON.stringify(
					value
				)} provided`
			);
		}

		// Stringify
		if (value !== null) {
			value = JSON.stringify(value);
		}
	}

	/*
	 * Type=date
	 * Sadly, Date objects via prepared statements are converted to full length datetimeoffset i.e. `YYYY-MM-DDT23:59:59.000Z`
	 * - MySQL (that we know of) throws errors when expecting just `YYYY-MM-DD`
	 */
	if (type === 'date' && value instanceof Date) {
		// ISO date, extract the date part
		value = value.toISOString().split('T').at(0);
	}

	// Check this is not an object
	if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
		throw new DareError(
			DareError.INVALID_VALUE,
			`Field '${field}' does not accept objects as values: '${JSON.stringify(
				value
			)}'`
		);
	}

	if (alias) {
		if (/[^\w$.]/.test(alias)) {
			throw new DareError(
				DareError.INVALID_REQUEST,
				`Field '${field}' is an alias for a derived value '${field}', cannot mutate`
			);
		}

		field = alias;
	}

	// Format the field
	const sql_field =
		(sql_alias ? `${sql_alias}.` : '') +
		dareInstance.identifierWrapper(field);

	/*
	 * Format the set value
	 */
	if (setFunction) {
		// If the insertWrapper is defined, use it to format the value
		value = setFunction({value, field, sql_field});
	}

	return {field, sql_field, value};
}

/**
 * Return un-aliased field names
 *
 * @param tableSchema - An object containing the table schema
 * @param field - field identifier
 * @param dareInstance - Dare Instance
 * @returns Unaliased field name
 */
function unAliasFields(
	tableSchema: Schema,
	field: string,
	dareInstance: Dare
): string {
	const {alias} = getFieldAttributes(field, tableSchema, dareInstance);
	return alias || field;
}

/**
 * SetDefaultNotFoundHandler
 * As the name suggests
 * @param opts - query options
 * @returns query options
 */
function setDefaultNotFoundHandler(opts: QueryOptions): QueryOptions {
	if (!('notfound' in opts)) {
		// Default handler is called when there are no results on a request for a single item
		opts.notfound = () => {
			throw new DareError(DareError.NOT_FOUND);
		};
	}

	return opts;
}

/**
 * Because Dare does not maintain field orders within the select, or the Get function maintaining the list of fields
 * We've resorted to acquiring the new list order where the SELECT fields... is used within an INSERT statement
 * @param request - Object returned from format_request function
 * @returns an array of field names
 */
function walkRequestGetField(request: QueryOptions): Array<string> {
	const fields: string[] = [];

	// Get the field names of the current request...
	if (Array.isArray(request.fields)) {
		fields.push(
			...request.fields.flatMap(field =>
				typeof field === 'string' ? field : Object.keys(field)
			)
		);
	}

	// Iterate through the nested table joins and retrieve their fields
	if (Array.isArray(request._joins)) {
		fields.push(...request._joins.flatMap(walkRequestGetField));
	}

	return fields;
}
