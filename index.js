const cluster = require('cluster');
const os = require('os');
const ConfigManager = require('./utils/configs/ConfigManager');
const HTTPHandler = require('./utils/http/HTTPHandler');

class DiscardApp {

	constructor() {
		if (cluster.isMaster)
			this.masterSetup();
		else
			this.workerSetup();
	}

	masterSetup() {
		console.log(`[Master.${process.pid}] Starting`);

		for (let i = 0; i <= os.cpus().length; i++) {
			const worker = cluster.fork();
			worker.on('exit', () => {
				console.log(`[Worker.${worker.process.pid}] Worker died, restarting`);
				cluster.fork();
			});
		}
	}

	workerSetup() {
		console.log(`[Worker.${process.pid}] Starting`);
		this.configManager = new ConfigManager();
		this.httpHandler = new HTTPHandler(this.configManager.http);
	}
}

module.exports = new DiscardApp();