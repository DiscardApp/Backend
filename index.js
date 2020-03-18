const cluster = require('cluster');
const os = require('os');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const postgres = require('postgres');
const ConfigManager = require('./utils/config/ConfigManager');
const HTTPHandler = require('./utils/http/HTTPHandler');

class DiscardApp {

	constructor() {
		BigInt.prototype.toJSON = function () { return this.toString(); };

		this.configManager = new ConfigManager();

		if (cluster.isMaster)
			this.masterSetup();
		else
			this.workerSetup();
	}

	async masterSetup() {
		this.postgres = postgres(this.configManager.database);

		if (process.argv.includes('--prepare'))
			await this.prepare();

		console.log(`[Master.${process.pid}] Starting`);

		for (let i = 0; i < os.cpus().length; i++) {
			const worker = cluster.fork();
			worker.on('exit', () => {
				console.log(`[Worker.${worker.process.pid}] Worker died, restarting`);
				cluster.fork();
			});

			worker.on('message', message => this.handleWorkerMessage(worker, message));
		}
	}

	async prepare() {
		console.log(`[Master.${process.pid}] Preparing`);
		const connectionOptions = Object.assign(
			{},
			this.configManager.database,
			{ database: 'postgres' }
		);

		const postgresConn = postgres(connectionOptions);

		const createQuery = `CREATE DATABASE ${this.configManager.database.database} WITH owner = ${this.configManager.database.username}`;
		try {
			await postgresConn.unsafe(createQuery);
		} catch (err) {
			if (err.routine === 'createdb') {
				const rlInterface = readline.createInterface({ input: process.stdin, output: process.stdout });
				const result = await new Promise(resolve => rlInterface.question(`[Master.${process.pid}] Database ${this.configManager.database.database} already exists! Do you want to overwrite the existing database (y/N)? `, resolve));
				rlInterface.close();
				if (!['y', 'yes', '+'].includes(result.toLowerCase().trim())) return;

				await postgresConn.unsafe(`DROP DATABASE ${this.configManager.database.database}`);
				await postgresConn.unsafe(createQuery);
			} else throw err;
		}

		const queries = {
			CREATE_SNOWFLAKE: `CREATE SEQUENCE snowflake_generator_sequence;
			CREATE OR REPLACE FUNCTION generate_snowflake(OUT result BIGINT) AS $$
			DECLARE
				epoch bigint := 1577836800000;
				cur_millis bigint;
				seq_id bigint;
			BEGIN
				SELECT FLOOR(EXTRACT(EPOCH FROM now()) * 1000) INTO cur_millis;
				SELECT nextval('snowflake_generator_sequence') % 65536 INTO seq_id;
				result := (cur_millis - epoch) << 16;
				result := result | (seq_id);
			END;
			$$ LANGUAGE PLPGSQL;
			CREATE DOMAIN snowflake BIGINT DEFAULT generate_snowflake() NOT NULL`
		};

		const scanDirectoryRecursively = (directory) => {
			for (const modelFile of fs.readdirSync(directory)) {
				const modulePath = path.resolve(directory, modelFile);
				if (fs.lstatSync(modulePath).isDirectory()) {
					scanDirectoryRecursively(modulePath);
					continue;
				}

				const model = require(modulePath);
				if (!model.table) continue;
				queries[`CREATE_${model.table.toUpperCase()}_MODEL`] = model.buildQuery();
			}
		};

		scanDirectoryRecursively('./models');

		for (const queryName of Object.keys(queries)) {
			console.log(`[Master.${process.pid}] Preparing: Running routine for ${queryName}`);
			await this.postgres.unsafe(queries[queryName]);
		}
	}

	/**
	 * Handles a worker IPC message
	 * @param {cluster.Worker} worker 
	 * @param {object} message The message received
	 * @param {string} message.type Type of this message
	 * @param {number} message.nonce Unique ID for this message
	 */
	async handleWorkerMessage(worker, message) {
		const { type, nonce } = message;
		const result = { type, nonce, error: false };

		switch (type) {
			case 'sql': {
				const { query, parameters } = message;
				let data;

				try {
					data = await this.postgres.unsafe(query, parameters);
				} catch (err) {
					result.error = true;
					data = Object.assign({}, err, { message: err.message });
				}

				result.data = data;
				break;
			}
		}

		worker.send(result);
	}

	workerSetup() {
		console.log(`[Worker.${process.pid}] Starting`);
		this.httpHandler = new HTTPHandler(this.configManager.http);
	}
}

module.exports = new DiscardApp();