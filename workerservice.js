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

var config = require('config');
var Worker = require('./worker/worker');
var service = new Worker();
var running = true;
var AWS = require('aws-sdk');

if (config.AWSCredentials) {
	console.log('AWS configuration detected...');
	console.log(JSON.stringify(config.AWSCredentials));
} else
{
	console.log("Please provide AWS configuration!");
	process.exit();
}

process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

var expiration = config.Worker.expiration || 60;


/*
	TODO: NEW CONFIG

	{
		queue: {
			credentials: {}
			provider: 'sqs',
			tasks: ''
		},

		storage:{
			 credentials: {}
			 provider: 's3',
			 tasks: '',
			 reports: '',
			 expiration: 60
		}
	}

*/

service
  .AWSCredentials(config.AWSCredentials)
  .taskQueue(config.Worker.taskQueue)
  .taskLocation(config.Worker.taskLocation)
  .reportLocation(config.Worker.reportLocation)
  .setExpiration(expiration);

module.exports = service;