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

var LocalProvider = require('../config/localprovider');
var NReports = require('nreports');

function ReportRunner() {

	this.provider = new LocalProvider();
	this.engine = new NReports.ReportEngine();
	this.engine.setRuntime(new NReports.HandlebarsRuntime());	
}

/**
 * [execute This method will execute a report and provide the results]
 * @param  {[type]} task a description of the reporting task.
 * @return {[type]}      [description]
 */
ReportRunner.prototype.execute = function(task, callback) {
	
	/*
		     id: xyzav-adkkljadjakjd-adnadkn
		 report: "sampleReport123",
   *   	 output: "html",
   *   	expires: 1,   		
   *   	runmode: "inline",
   *   	parameters: [
   *   		{ name : "param1", value: "value1" },
   *   		{ name : "param2", value: "value2" }
   *   	],
	 */
	

	if (task.output == "pdf" && this.engine.pipelines.length == 0)
		this.engine.addPipeline(new NReports.PdfPipeline());
	else if (task.output != "pdf" && this.engine.pipelines.length > 0)
		this.engine.pipelines.length = 0;
	
	 var report = new NReports.Report(this.provider.loadReport(task.report));

	 var template = this.provider.loadTemplate(task.report);

	 if (task.data) {
	 	report.setDatasource(new NReports.LiveJsonDatasource(task.parameters, task.data));
	 } else if (!report.datasource) {
	 	report.setDatasource(this.provider.loadDatasource(task.report));
	 }

	 if(task.progressUpdateUrl) {
	 	report.setProgressUpdateUrl(task.progressUpdateUrl);
	 } else if (report.progressUpdateUrl) {
	 	task.progressUpdateUrl = report.progressUpdateUrl;
	 }

	 report.setTemplate(template.toString());	 
	 
	 console.log('ReportRunner - setting parameters...');

	 for(var i = 0; i < task.parameters.length; i++) {
	 	
	 	var param = task.parameters[i];

	 	console.log(typeof param);
	 	console.log(param);

	 	if (typeof param == 'string' )
	 		param = JSON.parse(param);

	 	report.setParameter(param.name, param.value);
	 }

	 this.engine.render(report, function(err, output){

		if (err) {
			callback(err);
		} else {
			callback(null, output);
		}

	});
};

module.exports = ReportRunner;