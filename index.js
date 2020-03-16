const cluster = require('cluster');
const os = require('os');
const postgres = require('postgres');
const ConfigManager = require('./utils/config/ConfigManager');
const HTTPHandler = require('./utils/http/HTTPHandler');

class DiscardApp {

	constructor() {
		this.configManager = new ConfigManager();

		if (cluster.isMaster)
			this.masterSetup();
		else
			this.workerSetup();
	}

	masterSetup() {
		console.log(`[Master.${process.pid}] Starting`);

		this.postgres = postgres(this.configManager.database);

		for (let i = 0; i < os.cpus().length; i++) {
			const worker = cluster.fork();
			worker.on('exit', () => {
				console.log(`[Worker.${worker.process.pid}] Worker died, restarting`);
				cluster.fork();
			});

			worker.on('message', message => this.handleWorkerMessage(worker, message));
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
					data = err;
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