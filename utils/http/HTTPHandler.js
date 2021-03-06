const http = require('http');
const url = require('url');
const ControllerContext = require('./ControllerContext');
const Router = require('./Router');

const SizeLimit = 8 * 1000 ** 2;

class HTTPHandler {

	/**
	 * Creates a new HTTP Handler, loads all routes and listens on the given port
	 * @param {object} [config] Configuration
	 * @param {number} [config.port=80] Port to listen on
	 */
	constructor(config = {port: 80}) {
		this.server = new http.Server(this.handleRequest.bind(this));
		this.router = new Router();
		this.run(config);
	}

	/**
	 * Loads all routes and listens on the given port
	 * @param {object} config Configuration
	 * @param {number} config.port Port to listen on
	 */
	async run({port}) {
		await this.router.loadRoutes();
		this.server.listen(port);
	}

	/**
	 * Handles a HTTP request and calls the corresponding Controller
	 * @param {http.IncomingMessage} request Incoming request
	 * @param {http.ServerResponse} response Outgoing response
	 */
	async handleRequest(request, response) {
		const context = new ControllerContext(request, response);

		const {pathname, query} = url.parse(request.url, true);

		const route = this.router.routes.find(({regex}) => regex.test(pathname));
		if (!route) {
			context.status = 404;
			return context.notFound();
		}

		const {controller, names, route: routeName} = route;
		const parameters = context.parameters = {
			query,
			route: {},
			controller: {
				route: routeName,
				name: controller.constructor.name
			}
		};

		if (!http.METHODS.includes(request.method))
			return context.respond('Not Implemented', 501);

		let method = request.method.toLowerCase();
		if (request.method !== 'OPTIONS' && !controller[method])
			return context.notAllowed();

		if (['OPTIONS', 'POST', 'PUT', 'PATCH'].includes(request.method)) {
			const allowedMethods = http.METHODS.filter(method => controller[method.toLowerCase()]);

			response.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

			if (request.method === 'OPTIONS') {
				response.setHeader('Allow', ['OPTIONS', ...allowedMethods].join(', '));
				return context.respond();
			}
		}

		const pathVars = pathname.match(route.regex) || [];
		for (let i = 0; i < names.length; i++) {
			const key = names[i];
			const value = pathVars[i + 1];
			if (!value) break;

			parameters.route[key] = value;
		}

		if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
			if (!request.headers['content-length'])
				return context.respond('Length Required', 411);
			else if (request.headers['content-length'] > SizeLimit)
				return context.respond('Payload Too Large', 413);

			try {
				parameters.body = await this.parseBody(request);
			} catch (err) {
				return context.respond(err);
			}
		}

		for (const propertyName of Object.getOwnPropertyNames(Object.getPrototypeOf(controller)))
			context[propertyName] = controller[propertyName];

		try {
			await Promise.resolve(controller[method].call(context));
		} catch (err) {
			context.error(err);
		}
	}

	/**
	 * Parses the request body to either a JSON object or a Buffer
	 * @param {http.IncomingMessage} request Incoming request
	 * @returns {Promise<Object.<string, any>|Buffer>} The parsed content
	 */
	async parseBody(request) {
		const body = await new Promise((resolve, reject) => {
			const data = [];

			request.setTimeout(30000, () => {
				this.status = 408;
				reject(new Error('Request timed out'));
			});

			request.on('data', chunk => data.push(chunk));
			request.on('end', () => resolve(Buffer.concat(data)));
			request.on('error', reject);
		});

		const [mime] = (request.headers['content-type'] || '').toLowerCase().split(';');
		return mime === 'application/json' ? JSON.parse(body) : Buffer.from(body);
	}

}

module.exports = HTTPHandler;