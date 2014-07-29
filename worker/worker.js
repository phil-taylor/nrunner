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
var S3Client = require('../common/s3client');
var ReportRunner = require('./reportrunner');
var util = require('util');
var crypto = require('crypto');

function Worker() {	
	this.stopped = false;
	this.taskQueueName = '';
	this.reportBucketName = '';
	this.agent = new PollingAgent();
	this.s3Client = new S3Client();
	this.runner = new ReportRunner();
	this.credentials = null;
	this.urlExpiration = 60; //default

	this.getBucketUrl = function(taskId, extension, callback) {

		/*
		return 'https://s3-us-west-2.amazonaws.com/'
				.concat(this.reportBucketName, 
						'/', 
						taskId, 
						'.', 
						extension);
		*/	
		var key = taskId + '.' + extension;
		
		this.s3Client.getSignedUrl(key, this.reportBucketName, callback);
	};

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

			self.s3Client.bucket(self.reportBucketName);

			self.s3Client.save(output, { 
					Key: filename, 
					ContentType: contentType 
				}, function(err, status){

				if (err) {
					util.log('Error saving working task status.');
					util.error(err);
					self.updateStatus(task, 'error - ' + err.toString());
				} else {

					self.getBucketUrl(task.id, extension, function(err, url){

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

		this.s3Client.bucket(this.taskBucketName);

		task.status = status;

		if (state) {
			for(var item in state) {
				task[item] = state[item];
			}
		}

		this.s3Client.save(task, { Key: task.id, ContentType: 'application/json' }, function(err, status){
			if (err) {
				util.log('Error saving working task status.');
				util.error(err);
			}
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

Worker.prototype.taskBucket = function(bucketName) {
	this.taskBucketName = bucketName;	
	return this;
};

Worker.prototype.reportBucket = function(bucketName) {
	this.reportBucketName = bucketName;	
	return this;
};

Worker.prototype.AWSCredentials = function(credentials) {
	this.credentials = credentials;
	return this;
};

Worker.prototype.signedUrlExpiration = function(expiration) {
			this.urlExpiration = expiration;
			return this;
		};


Worker.prototype.start = function() {

	var self = this;

	if (!this.stopped) {

		this.s3Client.AWSCredentials(this.credentials);
		this.s3Client.signedUrlExpiration(this.urlExpiration);

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