const SQLHandler = require('../database/SQLHandler');

class Model {

	constructor(data = {}) {
		for (const column of Object.keys(this.constructor.model)) {
			const converter = this.constructor.model[column].converter;
			if (converter && converter.in)
				data[column] = converter.in(data[column]);

			this[column] = data[column];
		}
	}

	static buildQuery() {
		const columnNames = Object.keys(this.model);

		const primaryKeys = [];

		const columns = columnNames.map(columnName => {
			const column = this.model[columnName];
			const parameters = [];

			if (column.primaryKey || column.type === 'SNOWFLAKE')
				primaryKeys.push(columnName);

			if (column.notNull) parameters.push('NOT NULL');
			if (column.default !== undefined) parameters.push(`DEFAULT ${column.default}`);
			if (column.unique) parameters.push('UNIQUE');

			return `${columnName} ${column.type}${parameters.length ? ` ${parameters.join(' ')}` : ''}`;
		});

		return `CREATE TABLE ${this.table} (${columns.join(', ')}${primaryKeys.length ? `, PRIMARY KEY(${primaryKeys.join(', ')})` : ''})`;
	}

	/**
	 * Returns a JSON friendly version of the model
	 * @param {string[]} filter Model properties to exclude
	 */
	toAPIResponse(filter = []) {
		const response = {};

		for (const column of Object.keys(this.constructor.model)) {
			if (this.constructor.model[column].hide || filter.includes(column)) continue;

			response[column] = this[column];

			const converter = this.constructor.model[column].converter;
			if (converter && converter.out)
				response[column] = converter.out(response[column]);
		}

		return response;
	}

	async create() {
		const data = {};

		for (const [key, value] of Object.entries(this)) {
			if (value === undefined) continue;
			data[key] = value;
		}

		const result = await SQLHandler.query(`INSERT INTO ${this.constructor.table}(${Object.keys(data).join(', ')}) VALUES (${[...Array(Object.keys(data).length).keys()].map(index => `$${index + 1}`).join(', ')}) RETURNING *`, Object.values(data));
		return new this.constructor(result[0]);
	}

	async update(payload) {
		const data = {};
		const payloadKeys = Object.keys(payload);
		const primaryKeys = [];

		for (const key of Object.keys(this)) {
			const column = this.constructor.model[key];

			if (column.primaryKey || column.type === 'SNOWFLAKE')
				primaryKeys.push(key);

			if (!payloadKeys.includes(key)) continue;

			const converter = column.converter;
			if (converter && converter.in)
				payload[key] = converter.in(payload[key]);

			data[key] = payload[key];
		}

		const dataKeys = Object.keys(data);
		const where = [];
		const set = [];

		for (let i = 0; i < primaryKeys.length; i++)
			where.push(`${primaryKeys[i]} = $${i + 1}`);

		for (let i = 0; i < dataKeys.length; i++)
			set.push(`${dataKeys[i]} = $${i + primaryKeys.length + 1}`);

		const result = await SQLHandler.query(`UPDATE ${this.constructor.table} SET ${set.join(', ')} WHERE ${where.join(' AND ')} RETURNING *`, [...primaryKeys.map(key => this[key]), ...Object.values(data)]);
		return new this.constructor(result[0]);
	}

	async delete() {
		const primaryKeys = [];

		for (const key of Object.keys(this)) {
			const column = this.constructor.model[key];

			if (column.primaryKey || column.type === 'SNOWFLAKE')
				primaryKeys.push(key);
		}

		const where = [];

		for (let i = 0; i < primaryKeys.length; i++)
			where.push(`${primaryKeys[i]} = $${i + 1}`);

		const result = await SQLHandler.query(`DELETE FROM ${this.constructor.table} WHERE ${where.join(' AND ')} RETURNING *`, [...primaryKeys.map(key => this[key])]);
		return new this.constructor(result[0]);
	}

	/**
	 * Returns a single Model matching the filter
	 * @param {Object} filter The filter to apply
	 * @returns {Model|null} The model matching the filter
	 */
	static async find(filter) {
		const modelKeys = Object.keys(this.model);
		for (const key of Object.keys(filter))
			if (!modelKeys.includes(key)) throw new Error(`Invalid key reference: ${key}`);

		const results = await this.filter(filter, SQLHandler);
		if (!results.length) return null;
		return results[0];
	}

	/**
	 * Returns zero or more Models matching the filter
	 * @param {object} filter The filter to apply
	 * @returns {ModelList} A list of models matching the filter
	 */
	static async filter(filter) {
		const filters = Object.keys(filter);
		for (let i = 0; i < filters.length; i++) {
			const isArray = Array.isArray(filter[filters[i]]);
			if (isArray && !filter[filters[i]].length) return new ModelList(this, []);

			filters[i] = `${filters[i]} ${isArray ? `= ANY($${i + 1}::${this.model[filters[i]].type}[])` : `= $${i + 1}`}`;
		}

		const result = await SQLHandler.query(`SELECT * FROM ${this.table}${filters.length ? ` WHERE ${filters.join(' AND ')}` : ''}`, Object.values(filter));
		return new ModelList(this, result);
	}

	/**
	 * @returns {Error} Invalid Model Error
	 */
	static get invalid() {
		return new InvalidModelError(this.name);
	}

}

class ModelList extends Array {

	/**
	 * Returns an array of models
	 * @extends Array
	 * @param {class} ModelType Type of the model
	 * @param {object[]} modelData Array of model data
	 */
	constructor(ModelType, modelData) {
		// noinspection JSCheckFunctionSignatures
		super(...modelData.map(modelData => new ModelType(modelData)));
	}

	/**
	 * Returns a JSON friendly version of the model list
	 * @param {string[]} filter Model properties to exclude
	 */
	toAPIResponse(filter = []) {
		const models = [];
		for (const model of this)
			models.push(model.toAPIResponse(filter));

		return models;
	}

	map(callback) {
		const models = [];
		for (const model of this)
			models.push(callback(model));

		return models;
	}

}

class InvalidModelError extends Error {
	constructor(modelName) {
		super();

		const modelNameUpper = modelName.replace(/[a-z][A-Z]/g, match => match.split('').join('_')).toUpperCase();
		this.message = `INVALID_${modelNameUpper}`;
	}
}

module.exports = Model;