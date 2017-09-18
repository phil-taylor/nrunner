/**
 * QueueProvider - message queuing client interface for publishing and consuming messages.
 * @constructor
 */
function QueueProvider() {
	this.provider = null;
	this.credentials = null;
	this.queueName = null;
	this.queueUrl = null;
	this.parameters = {  }; //defaults
}

QueueProvider.prototype.load = function(config) {

	switch(config.queue.provider) {
		case 'amqp' : {
			return require('./ampqclient');
		}
		case 'sqs' : {
			return require('./sqsclient');
		}
	}

	return null;
}

QueueProvider.prototype.queue = function(queueName) {
	var self = this;

	this.queueName = queueName;

	return this;
};

QueueProvider.prototype.queueParameters = function(parameters) {
	this.parameters = parameters;
	return this;
}

QueueProvider.prototype.Configure = function(credentials) {
	this.credentials = credentials;

	//TODO: decide if we open a connection and setup the provider here
	return this;
};

QueueProvider.prototype.publish = function(message, callback) {
}

QueueProvider.prototype.consume = function(callback) {
}

module.exports = QueueProvider;