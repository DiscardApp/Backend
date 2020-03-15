class ControllerContext {

	constructor(request, response) {
		this.request = request;
		this.response = response;

		this.timestamp = Date.now();
	}

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

		console.log(`${this.request.method} ${this.parameters.controller.name} from ${this.request.socket.remoteAddress} finished in ${Date.now() - this.timestamp}ms`);
	}

	error(data) {
		this.status = 500;
		this.respond(data);
	}

	notAllowed() {
		this.status = 405;
		this.respond(new Error('Method Not Allowed'));
	}

}

module.exports = ControllerContext;