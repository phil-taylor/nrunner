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
 * S3Client can be used to upload/download documents using S3 storage.
 */
var AWS = require('aws-sdk');
var util = require('util');

function S3Client(){	
	this.s3 = null;	
	this.defaults = { ACL: 'private' };
	this.credentials = null;
	this.urlExpiration = 60; //default
}

S3Client.prototype.AWSCredentials = function(credentials) {
			this.credentials = credentials;

			AWS.config.update({ 
				"accessKeyId": credentials.key, 
				"secretAccessKey": credentials.secret, 
				"region": credentials.region });

			this.s3 = new AWS.S3({apiVersion: '2006-03-01'});

			return this;
		};
		
S3Client.prototype.bucket = function(bucketName) {
			this.bucketName = bucketName;
			return this;
		};

S3Client.prototype.defaults = function(s3Parameters) {
			this.defaults = s3Parameters;
			return this;
		};

S3Client.prototype.signedUrlExpiration = function(expiration) {
			this.urlExpiration = expiration;
			return this;
		};


S3Client.prototype.get = function(key, callback) {
			var params = {Bucket: this.bucketName, Key: key};
			this.s3.getObject(params, function(err,data){
				if (err) {
					callback(err);
				} else {
					callback(null, (typeof data.ContentType === 'application/json') ? JSON.parse(data.Body) : data.Body);
				}
			});			
		};

S3Client.prototype.save = function(data, options, callback) {
			var params = this.defaults;

			if (options && typeof options == 'function') {
				callback = options;
				options = null;
			}

			if (options) {
				for(var item in options) {
					params[item] = options[item];
				}
			}


			params.Bucket = this.bucketName;
			params.Body = Buffer.isBuffer(data) ? data : (typeof data === 'object') ? JSON.stringify(data) : data;

			this.s3.putObject(params, callback);			
		};

S3Client.prototype.getSignedUrl = function(key, bucketName, callback) {
			
			if (typeof bucketName == 'function') {
				callback = bucketName;
				bucketName = null;
			}
			
			var bucket = bucketName || this.bucketName;			
			var params = {Bucket: bucket, Key: key, Expires: this.urlExpiration };

			console.log('S3Clinet: getSignedUrl');
			console.log('*** PARAMS ***');
			console.log(params);

			this.s3.getSignedUrl('getObject', params, callback);
		};

module.exports = S3Client;

