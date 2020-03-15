const fs = require('fs');
const path = require('path');

let instance;

class ConfigManager {

	/**
	 * Loads all configurations files from the given directory
	 * Configurations will be available via `<instance>[configName]`
	 * @param {string} configDir The directory to read
	 */
	constructor(configDir = './configs') {
		const absPath = path.resolve(configDir);
		for (const file of fs.readdirSync(absPath)) {
			const [property] = file.split('.');
			const filePath = path.resolve(configDir, file);

			this[property] = require(filePath);
		}

		instance = this;
	}

	static getInstance() {
		return instance;
	}

}

module.exports = ConfigManager;