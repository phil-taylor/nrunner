# NRunner
[![NPM](https://nodei.co/npm/nrunner.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/nrunner/)

A simple nodejs reporting server that leverages NReports.

## Prerequisites
* PhantomJS

## Features
* Server
	+ Report Runner
	+ Report Viewer
* Worker
	+ Background service for running reports
	+ Reports are cached to Amazon S3

## Limitations
Currently there is no GUI for creating or running reports, only GUI component is the viewer. It servers more as an API server.

## Planed features
* Cleanup the Viewer GUI
* Full runner GUI w/ parameter selection
* Execution scheduling
* Report designer

## Installation and Startup
* Manually create Amazon SQS queue for the tasks.
* Manually create Amazon S3 bucket for task status.
* Manually create Amazon S3 bucket for reporting output.
	+ You must add a default CORS policy to the bucket
* Setup your configuration in /config/runtime.json

## Start Server
```javascript
var NRunner = require('nrunner');

NRunner.Server.start();

```

## Start Worker Service
```javascript
var NRunner = require('nrunner');

NRunner.WorkerService.start();

```

## Web Server API

## Running reports - simple (GET)

* Use this method when you don't need to pass the data source data inline with the request.

	http://server/runner/report_id&param1=value1&param2=value2&expires=days&runmode=(inline|background)

	The report runner will load the report engine and pass in the parameters defined.
	 
	+ Query String Parameters
		+ report - the unique id/name of the report to execute
		+ output - the desired report output mode (html|pdf), defaults to html
		+ expires - the amount of time the report should be available in the viewer and stored in reporting cache, defaults to 1 day
		+ runmode - the behavior of the report runner, defaults to inline
			+ inline mode - the report will be executed and pushed into reporting cache, the user will be immediatly redirected to the report viewier will the generated report instance token.
			+ background mode - the report will be executed as a background task, the user will immedatly receive a JSON response containing the original request details, a report instance token, the url to view the report and a url to the cached report directly.
	   					  
				+ ####[Sample Response]
						```javascript
							  {
							  	report: sampleReport123,
							  	output: html,
							  	expires: 1,
							  	id: jlahdsdkas78a7dsdhajshd2
							  	url: http://localhost/viewier/jlahdsdkas78a7dsdhajshd2
							  	cached: https://nrunner.s3.amazonaws.com/reports/cache/2014-03/jlahdsdkas78a7dsdhajshd2.html
							  	parameters: [
							  		{ name : "param1", value: "value1"},
							  		{ name : "param2", value: "value2"}
							  	]
							  }   		
						```

### Running reports - advanced (POST)
* Use this method when you need to pass the data source data inline with the request.

	Report runner advanced works the same as the standard runner only you pass the parameters in the body of a post and can supply your datasource data inline.

		http://server/runner/report_id&param1=value1&param2=value2&expires=days&runmode=(inline|background)

		The report runner will load the report engine and pass in the parameters defined.

	+ Post Body
		+ report - the unique id/name of the report to execute
		+ output - the desired report output mode (html|pdf), defaults to html
		+ expires - the amount of time the report should be available in the viewer and stored in reporting cache, defaults to 1 day
		+ runmode - the behavior of the report runner, defaults to inline
			+ inline mode - the report will be executed and pushed into reporting cache, the user will be immediatly redirected to the report viewier will the generated report instance token.
		+ background mode - the report will be executed as a background task, the user will immedatly receive a
			+ JSON response containing the original request details, a report instance token, the url to view the report and a url to the cached report directly.
	   					  
			+ #####[Sample Response]
					  ```javascript
					  {
					  	report: "sampleReport123",
					  	output: "html",
					  	expires: 1,
					  	token: "jlahdsdkas78a7dsdhajshd2"
					  	url: "http://localhost/viewier/jlahdsdkas78a7dsdhajshd2"
					  	cached: "https://nrunner.s3.amazonaws.com/reports/cache/2014-03/jlahdsdkas78a7dsdhajshd2.html"
					  	parameters: [
					  		{ name : "param1", value: "value1"},
					  		{ name : "param2", value: "value2"}
					  	]
					  }
					  ```
		+ parameters - the report execution parameters, this can be empty if passing a datasource and your report doesn't use parameters in te display. Otherwise they should be passed in the same format as the sample resoonse above.

	+ ####[Sample Post Body]
			 ```javascript
			   {
			   	report: "sampleReport123",
			   	output: "html",
			   	expires: 1,   		
			   	runmode: "inline",
			   	parameters: [
			   		{ name : "param1", value: "value1"},
			   		{ name : "param2", value: "value2"}
			   	],
			   	data: {} // JSON object  	
			   }
			```
### Viewing reports
	+ Call the viewer url with the token received from the reporting request. This behavior happens automatically via a server side redirect when you call the runner with a runmode = "inline".

	+ http://server/viewer/token
