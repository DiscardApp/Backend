const http = require('http'); // eslint-disable-line no-unused-vars

class ControllerContext {

	/**
	 * @typedef {object} RequestParameters
	 * @property {Object.<string, string>} query Query parameters
	 * @property {Object.<string, string>} route Route parameters
	 * @property {object|Buffer} [body] Request body
	 * @property {object} controller Controller info
	 * @property {string} controller.route Controller path
	 * @property {string} controller.name Controller name
	 */

	/**
	 * Provides utility functions for HTTP Controllers
	 * @param {http.IncomingMessage} request Incoming request
	 * @param {http.ServerResponse} response Outgoing response
	 */
	constructor(request, response) {
		this.request = request;
		this.response = response;
		this.timestamp = Date.now();

		/**
		 * @type {RequestParameters}
		 */
		this.parameters;
	}

	/**
	 * Replies to the HTTP request
	 * @param {*} [data] Data to send
	 * @param {number} [status=200] Status code to send
	 * @returns {void}
	 */
	respond(data, status) {
		let body;

		if (data instanceof Error)
			return this.respond(data.message, status || 400);
		else if (typeof data === 'object') {
			try {
				body = JSON.stringify(data);
				this.response.setHeader('Content-Type', 'application/json');
			} catch (err) {
				return this.error(err);
			}
		} else {
			this.response.setHeader('Content-Type', 'text/plain');
			body = ([null, undefined].some(type => data === type) ? '' : data).toString();
		}

		this.response.writeHead(status || 200);
		this.response.end(body);

		console.log(`${this.request.method} ${this.parameters ? this.parameters.controller.route : this.request.url} from ${this.request.socket.remoteAddress} finished with code ${status || 200} in ${Date.now() - this.timestamp}ms`);
	}

	get postWithID() {
		return 'Cannot POST to a specific ID';
	}

	get putWithoutID() {
		return 'Cannot PUT without a specific ID';
	}

	get patchWithoutID() {
		return 'Cannot PATCH without a specific ID';
	}

	get deleteWithoutID() {
		return 'Cannot PATCH without a specific ID';
	}

	/**
 	 * Replies with a 400 Bad Request
 	 * @param {*} [data] Message to send
 	 */
	badRequest(data = 'Bad Request') {
		return this.respond(data, 400);
	}

	/**
 	 * Replies with a 404 Not Found
 	 * @param {*} [data] Message to send
 	 */
	notFound(data = 'Not Found') {
		return this.respond(data, 404);
	}

	/**
	 * Replies with a 405 Method Not Allowed
	 * @param {*} [data] Message to send
	 */
	notAllowed(data = 'Method Not Allowed') {
		return this.respond(data, 405);
	}

	/**
 	 * Replies with a 500 Internal Server Error
 	 * @param {*} [data] Message to send
 	 */
	error(data) {
		console.error(data);
		return this.respond('Internal Server Error', 500);
	}

}

module.exports = ControllerContext;