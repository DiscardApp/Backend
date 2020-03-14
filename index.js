const ConfigManager = require('./utils/configs/ConfigManager');
const HTTPHandler = require('./utils/http/HTTPHandler');

class DiscardApp {

	constructor() {
		this.configManager = new ConfigManager();
		this.httpHandler = new HTTPHandler(this.configManager.http);
	}

}

module.exports = new DiscardApp();