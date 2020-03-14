const http = require('http');
const url = require('url');
const ControllerContext = require('./ControllerContext');
const Router = require('./Router');

const SizeLimit = 8 * 1000 ** 2;

class HTTPHandler {

	constructor({ port } = {}) {
		this.server = new http.Server(this.handleRequest.bind(this));
		this.router = new Router();
		this.router.loadRoutes();

		this.server.listen(port);
	}

	async handleRequest(request, response) {
		const context = new ControllerContext(request, response);

		const { pathname, query } = url.parse(request.url, true);

		const route = this.router.routes.find(({ regex }) => regex.test(pathname));
		if (!route) {
			context.status = 404;
			return context.respond(new Error('Not Found'));
		}

		const { controller, names, route: routeName } = route;
		const parameters = { query, route: {}, controller: { name: routeName } };

		const pathVars = pathname.match(route.regex) || [];
		for (let i = 0; i < names.length; i++) {
			const key = names[i];
			const value = pathVars[i + 1];
			if (!value) break;

			parameters.route[key] = value;
		}

		if (['POST', 'PUT'].includes(request.method)) {
			if (!request.headers['content-length']) {
				context.status = 411;
				return context.respond(new Error('Length Required'));
			} else if (request.headers['content-length'] > SizeLimit) {
				context.status = 413;
				return context.respond(new Error('Payload Too Large'));
			}

			try {
				parameters.body = this.parseBody(request);
			} catch (err) {
				return context.respond(err);
			}
		}

		let method = 'notAllowed';
		if (http.METHODS.includes(request.method)) method = request.method.toLowerCase();
		if (!controller[method]) method = 'notAllowed';

		context.parameters = parameters;

		controller[method].call(context);
	}

	parseBody(request) {
		const [mime] = (request.headers['content-type'] || '').toLowerCase().split(';');
		return mime === 'application/json' ? JSON.parse(request.body) : Buffer.from(request.body === undefined ? '' : request.body);
	}

}

module.exports = HTTPHandler;