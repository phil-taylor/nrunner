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

function Server() {

}

Server.prototype.start = function() {
	
	var express = require('express');
	var routes = require('./routes');
	var reportsRoute = require('./routes/reports');
	var http = require('http');
	var path = require('path');
	var config = require('config');

	var app = express();

	// all environments
	app.set('port', process.env.PORT || 3000);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));

	app.use(function(err, req, res, next){
	  console.error(err.stack);
	  res.send(500, 'Something broke!');
	});

	// development only
	if ('development' == app.get('env')) {
	  app.use(express.errorHandler());
	}

	app.get('/runner/:report', routes.runner);
	app.post('/runner/:report', routes.runnerAdvanced);
	app.post('/runner', routes.runnerAdvanced);
	app.get('/viewer/:token', routes.viewer);
	app.get('/embed/:token', routes.embed);
	app.get('/reports', reportsRoute.index);


	console.log('************************************************************');
	console.log('* NRunner Server - Started                                 *');
	console.log('* ---------------------------------------------------------*');
	console.log('* AWS Region     : ' + config.AWSCredentials.region );
	console.log('* AWS Account Id : ' + config.AWSCredentials.accountId );
	console.log('* Task Queue     : ' + config.Worker.taskQueue );
	console.log('* Task Location    : ' + config.Worker.taskLocation );
	console.log('* Report Location  : ' + config.Worker.reportLocation );
	console.log('* Url Expiration : ' + config.Worker.expiration );
	console.log('************************************************************');


	http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});

};

module.exports = new Server();


