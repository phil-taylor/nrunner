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

var ConfigProvider = require('./configprovider');
var fs = require('fs');
var path = require('path');

function LocalProvider() {

}

LocalProvider.prototype = new ConfigProvider();
LocalProvider.prototype.constructor = LocalProvider;

LocalProvider.prototype.loadReport = function(reportId) { 
	var data = fs.readFileSync(this.reportsLocation + '/' + reportId + '.json');

	return JSON.parse(data, function (key, value) {
        if (value && (typeof value === 'string') && value.indexOf("function") === 0) {
            var jsFunc = new Function('return ' + value)();
            return jsFunc;
        }
    });
};

LocalProvider.prototype.loadTemplate = function(reportId) { 
	var html = fs.readFileSync(this.templatesLocation + '/' + reportId + '.tmpl');
	return html;
};

LocalProvider.prototype.loadDataSource = function(reportId) { 
	var data = fs.readFileSync(this.datasourcesLocation + '/' + reportId + '.json');
	return JSON.parse(data);
};

LocalProvider.prototype.list = function() { 
	var folder = this.reportsLocation;
	var files = fs.readdirSync(folder);

	var reports = 
		files.map(function (file) {
	        return path.join(folder, file);
	    }).filter(function (file) {
	        return fs.statSync(file).isFile() && path.extname(file) == '.json';
	    }).map(function (file) {
			var data = fs.readFileSync(file);
			return JSON.parse(data);
	    });

	return reports;
};


module.exports = LocalProvider;
