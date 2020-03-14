const fs = require('fs');
const path = require('path');

class ConfigManager {

	constructor(configDir = './configs') {
		const absPath = path.resolve(configDir);
		for (const file of fs.readdirSync(absPath)) {
			const [property] = file.split('.');
			const filePath = path.resolve(configDir, file);

			this[property] = require(filePath);
		}
	}

}

module.exports = ConfigManager;