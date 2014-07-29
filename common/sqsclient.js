/*
 *   This file is part of NRunner. A free framework for hosting and running reports built for the NReports framework.
 *   Copyright (C) 2014  Phil Taylor
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */ 

var AWS = require('aws-sdk');
var util = require('util');


function SqsClient(){
	this.sqs = null;
	this.credentials = null;
	this.queueName = null;
	this.queueUrl = null;
	this.parameters = { MaxNumberOfMessages: 1, VisibilityTimeout: 30, WaitTimeSeconds: 20 }; //defaults
}

SqsClient.prototype.AWSCredentials = function(credentials) {
			this.credentials = credentials;

			AWS.config.update({ 
				"accessKeyId": credentials.key, 
				"secretAccessKey": credentials.secret, 
				"region": credentials.region
			});

			this.sqs = new AWS.SQS({apiVersion: '2012-11-05'});			
			
			return this;
		};
		
SqsClient.prototype.queue = function(queueName) {
			var self = this;

			this.queueName = queueName;

			return this;
		};

SqsClient.prototype.queueParameters = function(parameters) {
	this.parameters = parameters;
	return this;
}

SqsClient.prototype.resolveQueueUrl = function(callback){
	var self = this;

	if (self.queueUrl == null) {

		if (self.queueName == null) {
			callback(new Error('Please specify a queue name.'));
		} else {
			util.log('SqsClient -> resolving AWS queue url for [' + self.queueName + ']');

			self.sqs.getQueueUrl({ QueueName: self.queueName, QueueOwnerAWSAccountId: self.credentials.accountId }, 
				function(err, response){
					if (err) {
						callback(err);
					} else {		  	
						util.log('-------------> ' + response.QueueUrl);					
						self.queueUrl = response.QueueUrl;
						callback(null, self.queueUrl);
					}

				});
		}

	} else {
		callback(null, self.queueUrl);
	}
}

SqsClient.prototype.sendMessage = function(message, callback){
	var self = this;
	self.resolveQueueUrl(function(err, url){
		if (err) {
			callback(err);
		} else {
			var data = (typeof message === 'object') ? JSON.stringify(message) : message;
			self.sqs.sendMessage({ QueueUrl: url, MessageBody: data }, callback);		
		}
	});
}



SqsClient.prototype.receiveMessage = function(callback){

	var self = this;
	self.resolveQueueUrl(function(err, url){
		if (err) {
			callback(err);
		} else {

			var options = self.parameters;
			options.QueueUrl = url;

			self.sqs.receiveMessage(options, callback);
			
		}
	});

}


SqsClient.prototype.deleteMessage = function(handle, callback) {


	var self = this;
	self.resolveQueueUrl(function(err, url){
		if (err) {
			callback(err);
		} else {

			self.sqs.deleteMessage({ QueueUrl: url,  ReceiptHandle: handle }, callback);
			
		}
	});

}

module.exports = SqsClient;
