const http = require('http'); // eslint-disable-line no-unused-vars

class ControllerContext {

	/**
	 * @typedef {object} RequestParameters
	 * @property {object} query Query parameters
	 * @property {object} route Route parameters
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

		/**
		 * @type {number?}
		 */
		this.status = undefined;
		this.timestamp = Date.now();

		/**
		 * @type {RequestParameters}
		 */
		this.parameters;
	}

	/**
	 * Replies to the HTTP request
	 * @param {*} data Data to send
	 */
	respond(data) {
		let body;

		if (data instanceof Error) {
			this.status = this.status || 400;
			this.response.setHeader('Content-Type', 'text/plain');
			body = data.message || 'Bad Request';
		} else if (typeof data === 'object') {
			try {
				body = JSON.stringify(data);
				this.response.setHeader('Content-Type', 'application/json');
			} catch (err) {
				return this.error(err);
			}
		} else {
			this.response.setHeader('Content-Type', 'text/plain');
			body = (data === undefined ? '' : data).toString();
		}

		this.response.writeHead(this.status || 200);
		this.response.end(body);

		console.log(`${this.request.method} ${this.parameters ? this.parameters.controller.name : 'NotFound'} from ${this.request.socket.remoteAddress} finished with code ${this.status || 200} in ${Date.now() - this.timestamp}ms`);
	}

	/**
	 * Replies with a 500 Internal Server Error
	 * @param {*} [data] Message to send
	 */
	error(data = 'Internal Server Error') {
		this.status = 500;
		this.respond(data);
	}

	/**
	 * Replies with a 405 Method Not Allowed
	 * @param {*} [data] Message to send
	 */
	notAllowed(data = 'Method Not Allowed') {
		this.status = 405;
		this.respond(data);
	}

}

module.exports = ControllerContext;