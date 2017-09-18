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

var PollingAgent = require('./pollingagent');
var StorageProvider = require('../storage/storageprovider');
var ReportRunner = require('./reportrunner');
var util = require('util');
var crypto = require('crypto');

function Worker() {	
	this.stopped = false;
	this.taskQueueName = '';
	this.reportLocation = '';
	this.agent = new PollingAgent();
	this.storage = StorageProvider.load();
	this.runner = new ReportRunner();
	this.credentials = null;
	this.expiration = 60; //default

	this.executeTask = function(task){
		util.log('Worker -> execute task...');
		console.log(task);

		var self = this;

		this.updateStatus(task, 'running');

		this.runner.execute(task, function(err, output){

			var extension = (task.output == "html") ? "html" : "pdf";
			var contentType = (task.output == "html") ? "text/html" : "application/pdf";
			var filename = task.id + '.' + extension;			
			/*
			var md5 = 
				crypto
                  .createHash('md5')
                  .update(output, 'utf8')
                  .digest('base64');
			*/
		
			console.log('** CONTENT LENGTH -->' + output.length);

			self.storage.folder(self.reportLocation);

			self.storage.save(output, {
					Key: filename, 
					ContentType: contentType 
				}, function(err, status){

				if (err) {
					util.log('Error saving working task status.');
					util.error(err);
					self.updateStatus(task, 'error - ' + err.toString());
				} else {

					self.storage.getLocation(task.id + '.' + extension, function(err, url){

						if (err) {
							util.log('Error saving working task status.');
							util.error(err);
							self.updateStatus(task, 'error - ' + err.toString());
						} else {

							var state = { cached: url }
							self.updateStatus(task, 'completed', state );
						}
					});					
				}
			});

		});
	};

	this.updateStatus = function(task, status, state) {
		
		util.log('-----> Status Change: ' + task.id + ' / ' + status);

		this.storage.folder(this.taskBucketName);

		task.status = status;

		if (state) {
			for(var item in state) {
				task[item] = state[item];
			}
		}

		if(task.progressUpdateUrl) {
			this.handleRemoteUpdates(task, function(err, response_body) {
				if (err) {
					util.log('Error handling remote status updates.');
					util.error(err);
				}
			});
		}

		this.storage.save(task, { Key: task.id, ContentType: 'application/json' }, function(err, status){
			if (err) {
				util.log('Error saving working task status.');
				util.error(err);
			}
		});
	};

	this.handleRemoteUpdates = function(task, cb) {
		var url = task.progressUpdateUrl;

		var params = task;
		// var params = {
		// 	report: task.report,
		// 	output: task.output,
		// 	expires: task.expires,      
		// 	status: task.status,
		// 	parameters: task.parameters
		// 	// id: task.id,
		// 	// url: task.url,
		// 	// cached: task.cashed,   
		// 	// progressUpdateUrl: task.progressUpdateUrl,
		// 	// runmode: task.runmode,
		// 	// data: task.data
		// };

		require('request').post({
			url: url, 
			form: params
		}, function (error, response, body) {
			cb(error, body);
		});
	};

	this.createToken = function() {

	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
	        return v.toString(16);
    	});
	};    
}

Worker.prototype.taskQueue = function(queueName) {
	this.taskQueueName = queueName;	
	return this;
};

Worker.prototype.taskLocation = function(location) {
	this.taskLocation = location;
	return this;
};

Worker.prototype.reportLocation = function(location) {
	this.reportLocation = location;
	return this;
};

Worker.prototype.AWSCredentials = function(credentials) {
	this.credentials = credentials;
	return this;
};

Worker.prototype.setExpiration = function(expiration) {
			this.expiration = expiration;
			return this;
		};


Worker.prototype.start = function() {

	var self = this;

	if (!this.stopped) {

		console.log('************************************************************');
		console.log('* NRunner Worker Agent - Started                           *');
		console.log('* ---------------------------------------------------------*');
		console.log('* AWS Region     : ' + this.credentials.region );
		console.log('* AWS Account Id : ' + this.credentials.accountId );
		console.log('* Task Queue     : ' + this.taskQueueName );
		console.log('* Task Bucket    : ' + this.taskLocation );
		console.log('* Report Bucket  : ' + this.reportLocation );
		console.log('* Url Expiration : ' + this.expiration );
		console.log('************************************************************');

		this.storage.Configure(this.credentials, { signedUrlExpiration: this.expiration });

		this.agent
			.AWSCredentials(this.credentials)
			.queue(this.taskQueueName)
			.start(function(err, task){

				if (err) {
					util.log('ERROR -> processing task');
					util.error(err);
				util.error(err);
				} else {		
					util.log('Worker -> process task');
					console.log(task);
					self.updateStatus(task, 'pending');
					self.executeTask(task);				
				}

			});

	}
};

Worker.prototype.stop = function() {
	this.stopped = true;
	this.agent.stop();
};

module.exports = Worker;