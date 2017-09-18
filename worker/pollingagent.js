//TODO: refactor to integrate new QueueClient and drive actual provider using app config
//TODO: update unit tests
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
var QueueProvider = require('../queue/queueprovider');

function PollingAgent(){
	this.provider = QueueProvider.load(config);
	this.stopped = false;
}

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

		self.provider.consume(function(err, msg) {
			callback(err, msg);
			self.listen(callback);
		});

	}
};

module.exports = PollingAgent;

