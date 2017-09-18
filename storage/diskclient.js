var util = require('util');
var StorageProvider = require('./storageprovider');

function DiskClient(){
    this.folder = null;
    this.credentials = null;
    this.parameters = {  }; //defaults


    //TODO: assign temp folder
    // this.folder = '/tmp/' + GUID

}

DiskClient.prototype = new StorageProvider();
DiskClient.prototype.constructor = DiskClient;

DiskClient.prototype.exists = function(key, callback) {
}

DiskClient.prototype.get = function(key, callback) {
}

DiskClient.prototype.save = function(data, options, callback) {
}


module.exports = DiskClient;

