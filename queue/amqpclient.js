// TODO: write unit tests for AMQP processing using RabbitMQ
var Promise = require('bluebird');
var QueueProvider = require('./queueprovider');
var amqp = require('amqplib/callback_api');

function AmqpClient() {}

AmqpClient.prototype = new QueueProvider();
AmqpClient.prototype.constructor = AmqpClient;

AmqpClient.prototype.publish = function(message) {

    //TODO: resolve queue url using queueName and config
     return amqp.connect('amqp://localhost').then(function(conn) {
        return conn.createChannel().then(function(ch) {
            return Promise.all([
                ch.assertQueue(this.queue, {durable: false}),
                ch.sendToQueue(this.queue, message)
                ]);
        });
    });

}

AmqpClient.prototype.consume = function(callback) {

    //TODO: resolve queue url using queueName and config
    return amqp.connect('amqp://localhost').then(function(conn) {
        return conn.createChannel().then(function(ch) {
            return Promise.all([
                ch.assertQueue(this.queue, {durable: false}),
                ch.consume(this.queue, callback)
            ]).toCallback(callback);
        });
    });

}

module.exports = AmqpClient;