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

function ConfigProvider(){

	this.reportsLocation = "./reports";
	this.templatesLocation = "./reports/templates";
	this.datasourcesLocation = "./reports/datasources";
	
}

ConfigProvider.prototype.loadReport = function(reportId) { };

ConfigProvider.prototype.loadTemplate = function(reportId) { };

ConfigProvider.prototype.loadDataSource = function(reportId) { };

ConfigProvider.prototype.list = function() { };

ConfigProvider.prototype.save = function(report) { };

ConfigProvider.prototype.delete = function(reportId) { };


module.exports = ConfigProvider;