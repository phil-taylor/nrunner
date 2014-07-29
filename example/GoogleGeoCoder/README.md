# NRunner Example
-------------

An example NRunner installation with a sample report.

## Prerequisites
* PhantomJS

## Installation and Startup
* Manually create Amazon SQS queue for the tasks.
* Manually create Amazon S3 bucket for task status.
* Manually create Amazon S3 bucket for reporting output.
	+ You must add a default CORS policy to the bucket
* Setup your configuration in /config/runtime.json

## Start Server
```javascript
node server.js
```

## Start Worker Service
```javascript
node worker.js
```

## Running the sample report
* HTML output with default address
	+ http://localhost:3000/runner/example
* HTML output with a 
	+ http://localhost:3000/runner/example?address=111 SW 9th Ave, Portland, OR 97204
* PDF output
	+ http://localhost:3000/runner/example?output=pdf