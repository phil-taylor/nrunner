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
var SqsClient = require('../common/sqsclient');
var S3Client = require('../common/s3client');

if (config.AWSCredentials) {
  console.log('AWS configuration detected...');
  console.log(JSON.stringify(config.AWSCredentials));
} else
{
  console.log("Please provide AWS configuration!");
  process.exit();
}

var sqsClient = 
  new SqsClient()
      .AWSCredentials(config.AWSCredentials)
      .queue(config.Worker.taskQueue);

var urlExpiration = config.Worker.urlExpiration || 60;

var s3Client = 
  new S3Client()
      .AWSCredentials(config.AWSCredentials)
      .signedUrlExpiration(urlExpiration);


//var baseStatusUrl = 'https://s3-us-west-2.amazonaws.com/'.concat(config.Worker.taskBucket, '/');
//var baseReportUrl = 'https://s3-us-west-2.amazonaws.com/'.concat(config.Worker.reportBucket, '/');

function getStatusUrl(key, callback) {
  s3Client.getSignedUrl(key, config.Worker.taskBucket, callback);
}

function getReportUrl(key, callback) {
  s3Client.getSignedUrl(key, config.Worker.reportBucket, callback);
}

function queueTask(task, callback) {

  var ext = (task.output == 'html') ? 'html' : 'pdf';
  var key = task.id + '.' + ext;

  getReportUrl(key, function(err, url){
    if (err) {
      callback(err);
    } else {
      task.cached = url;
      sqsClient.sendMessage(task, function(err, response) {
        if (err) {
          callback(err);
        } else {
          callback(null, task);
        }
      });      
    }    
  });
  
}


function createToken() {

    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

/*
 * Report runner
 *
 * http://server/runner?report=report_id&param1=value1&param2=value2&expires=days&runmode=(inline|background)
 *
 * The report runner will load the report engine and pass in the parameters defined.
 *
 * Query String Parameters:
 *   report - the unique id/name of the report to execute
 *   output - the desired report output mode (html|pdf), defaults to html
 *   expires - the amount of time the report should be available in the viewer and stored in reporting cache, defaults to 1 day
 *   runmode - the behavior of the report runner, defaults to inline
 *   	inline mode - the report will be executed and pushed into reporting cache, the user will be immediatly 
 *   				  redirected to the report viewier will the generated report instance token.
 *   	background mode - the report will be executed as a background task, the user will immedatly receive a
 *   					  JSON response containing the original request details, a report instance token,
 *   					  the url to view the report and a url to the cached report directly.
 *   					  [Sample Response]
 *   					  {
 *   					  	report: sampleReport123,
 *   					  	output: html,
 *   					  	expires: 1,
 *   					  	id: jlahdsdkas78a7dsdhajshd2
 *   					  	url: http://localhost/viewier?report=jlahdsdkas78a7dsdhajshd2
 *   					  	cached: https://nrunner.s3.amazonaws.com/reports/cache/2014-03/jlahdsdkas78a7dsdhajshd2.html
 *   					  	parameters: [
 *   					  		{ name : "param1", value: "value1"},
 *   					  		{ name : "param2", value: "value2"}
 *   					  	]
 *   					  }   				
 */
exports.runner = function(req, res){

  console.log('***Query String***');
  console.log(req.query);    
  
  
  var report = req.params.report;
  var query = req.query;
  var token = query.id || createToken();
  var runMode = query.runmode || 'inline';
  var output = query.output || 'html';
  var expires = query.expires || 1;
  var otherParams = [];

  delete query.id;
  delete query.runmode;
  delete query.output;
  delete query.expires;

  for(var item in query) {
    otherParams.push({ name: item, value: query[item] });
  }
  
  var task = {
  	id: token,
  	report: report,
  	output: output,
  	expires: expires,
  	parameters: otherParams
  }; 

  task.url = req.protocol + '://' + req.host + '/viewer/' + token;

  queueTask(task, function(err, queuedTask){
    if (err) {
      console.log('*** ERROR ***');
      console.error(err);
      res.send(500);
    } else {
      if (runMode == 'background') {
        res.send(200, queuedTask);    
      } else {
        res.redirect('/viewer/' + token); 
      }       
    }
  });
 
};

/*
 * Report runner advanced works the same as the standard runner only you pass the parameters in the body of a post
 * and can supply your datasource data inline.
 *
 * http://server/runner?report=report_id&param1=value1&param2=value2&expires=days&runmode=(inline|background)
 *
 * The report runner will load the report engine and pass in the parameters defined.
 *
 * Post Body:
 *   report - the unique id/name of the report to execute
 *   output - the desired report output mode (html|pdf), defaults to html
 *   expires - the amount of time the report should be available in the viewer and stored in reporting cache, defaults to 1 day
 *   runmode - the behavior of the report runner, defaults to inline
 *   	inline mode - the report will be executed and pushed into reporting cache, the user will be immediatly 
 *   				  redirected to the report viewier will the generated report instance token.
 *   	background mode - the report will be executed as a background task, the user will immedatly receive a
 *   					  JSON response containing the original request details, a report instance token,
 *   					  the url to view the report and a url to the cached report directly.
 *   					  [Sample Response]
 *   					  {
 *   					  	report: "sampleReport123",
 *   					  	output: "html",
 *   					  	expires: 1,
 *   					  	token: "jlahdsdkas78a7dsdhajshd2"
 *   					  	url: "http://localhost/viewier?report=jlahdsdkas78a7dsdhajshd2"
 *   					  	cached: "https://nrunner.s3.amazonaws.com/reports/cache/2014-03/jlahdsdkas78a7dsdhajshd2.html"
 *   					  	parameters: [
 *   					  		{ name : "param1", value: "value1"},
 *   					  		{ name : "param2", value: "value2"}
 *   					  	]
 *   					  }
 *   parameters - the report execution parameters, this can be empty if passing a datasource 
 *                and your report doesn't use parameters in te display. Otherwise they should
 *                be passed in the same format as the sample resoonse above.
 *
 * Sample Post Body:
 *   {
 *   	report: "sampleReport123",
 *   	output: "html",
 *   	expires: 1,   		
 *   	runmode: "inline",
 *   	parameters: [
 *   		{ name : "param1", value: "value1"},
 *   		{ name : "param2", value: "value2"}
 *   	],
 *   	data: {} // JSON object  	
 *   }
 */
exports.runnerAdvanced = function(req, res){
  
  console.log('***Body String***');
  console.log(req.body);    
  
  
  var options = req.body;
  var report = req.params.report || options.report;  
  var token = options.id || createToken();
  var runMode = options.runmode || 'inline';
  var output = options.output || 'html';
  var expires = options.expires || 1;
  
  var task = {
    id: token,
    report: report,
    output: output,
    expires: expires,
    parameters: options.parameters,
    data: options.data
  }; 

  task.url = req.protocol + '://' + req.host + '/viewer/' + token;

  queueTask(task, function(err, queuedTask){
    if (err) {
      console.log('*** ERROR ***');
      console.error(err);
      res.send(500);
    } else {
      if (runMode == 'background') {
        res.send(200, queuedTask);    
      } else {
        res.redirect('/viewer/' + token); 
      }       
    }
  });

};


/*
 * Report viewer
 *
 * http://server/viewer/token
 * 
 */
exports.viewer = function(req, res){
  
  //var statusUrl = baseStatusUrl + req.params.token;
  
  getStatusUrl(req.params.token, function(err, url){
    if (err) {
      console.log('*** ERROR ***');
      console.error(err);
      res.send(500);
    } else {
      res.render('viewer', { title: 'Viewer', statusUrl: url });
    } 
  })
  

};