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

/*
 * Agent that will poll an SQS queue for messages and hand off for processing.
 * 
 */
var util = require('util');
var SqsClient = require('../common/sqsclient');

function PollingAgent(){	
	this.stopped = false;
}

PollingAgent.prototype = new SqsClient();
PollingAgent.prototype.constructor = PollingAgent;


PollingAgent.prototype.stop = function() {
	this.stopped = true;
	util.log('PollingAgent -> stopped');
}

PollingAgent.prototype.start = function(callback) {	
	this.stopped = false;
	this.listen(callback);
	util.log('PollingAgent -> started, listening for message @ ' + this.queueName);
}

PollingAgent.prototype.listen = function(callback) {
	var self = this;

	if (!this.stopped) {

		if (self.credentials == null || self.sqs == null)
			throw new Error('You must supply credentials first!')				
		
		sqs_callback = function(err,response) {
			util.log('PollingAgent -> message received');
			
			if (err) {
				util.log('ERROR -> ' + err);						
				return callback(err);
			} else if (response) {
				console.log(response);
				
				if (response.Messages) {

					var msg = response.Messages[0];
					
					util.log('PollingAgent -> deleting message: ' + msg.MessageId);
					
					self.deleteMessage(msg.ReceiptHandle, function(e){
						
						if (e) {
						
							util.log('ERROR -> ' + e);
							callback(e);ß
						}
					});
					
					callback(null, JSON.parse(msg.Body));
				}
				
			}
			
			self.listen(callback);
			
		};
		
		self.receiveMessage(sqs_callback);
	
	}
};

module.exports = PollingAgent;

