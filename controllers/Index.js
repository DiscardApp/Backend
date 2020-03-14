const ControllerContext = require('../utils/http/ControllerContext');

class Index extends ControllerContext {
	route(router) {
		router.register('/{swag}', this);
	}

	get() {
		this.respond({ parameters: this.parameters, message: 'Tümer Türkmen approved' });
	}
}

module.exports = Index;