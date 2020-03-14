const fs = require('fs');
const path = require('path');

class Router {

	constructor() {
		this.routes = [];
	}

	async loadRoutes(routeDir = './controllers') {
		const absPath = path.resolve(routeDir);

		for (const location of fs.readdirSync(absPath)) {
			const absLocation = path.join(absPath, location);

			const stat = await new Promise((resolve, reject) => fs.stat(absLocation, (err, stats) => err ? reject(err) : resolve(stats)));
			if (stat.isDirectory())
				this.loadRoutes(absLocation);
			else {
				const Controller = require(absLocation);
				const controller = new Controller();

				if (controller.route)
					controller.route(this);
				else throw new Error(`Controller ${location} has no path!`);
			}
		}
	}

	static pathToRegex(path) {
		const names = [];
		const replacements = [];

		path = path.replace(/({(\w+?)}|(\*))/g, (match, all, name) => {
			names.push(name);
			replacements.push(all === '*' ? '(.*?)' : '([^/]+?)');
			return `{${replacements.length - 1}}`;
		});

		path = path.replace(/\/{([^/]*?)}$/g, (match, index) => {
			replacements[index | 0] = `(?:/${replacements[index | 0]})?`;
			return `{${index | 0}}`;
		});

		const final = path.replace(/{(.*?)}/g, (match, index) => {
			return replacements[index | 0];
		});

		return {
			regex: new RegExp(`^${final}/?$`),
			names
		};
	}

	register(route, controller) {
		if (!controller)
			throw new Error(`Tried to register route ${route} with no controller`);

		const { names, regex } = Router.pathToRegex(route);

		this.routes.push({
			controller,
			route,
			regex,
			names
		});
	}

}

module.exports = Router;