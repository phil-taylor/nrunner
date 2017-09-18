/**
 * StorageProvider - message queuing client interface for publishing and consuming messages.
 * @constructor
 */
function StorageProvider() {
    this.provider = null;
    this.credentials = null;
    this.parameters = {  }; //defaults
}

StorageProvider.prototype.load = function(config) {

    switch(config.storage.provider) {
        case 'disk' : {
            return require('./diskclient');
        }
        case 's3' : {
            return require('./s3Client');
        }
    }

    return null;
}

StorageProvider.prototype.folder = function(name) {
    var self = this;

    this.folder = name;

    return this;
};

StorageProvider.prototype.setParameters = function(parameters) {
    this.parameters = parameters;
    return this;
}

StorageProvider.prototype.Configure = function(credentials) {
    this.credentials = credentials;

    //TODO: decide if we open a connection and setup the provider here
    return this;
};

StorageProvider.prototype.exists = function(key, callback) {
}

StorageProvider.prototype.get = function(key, callback) {
}

StorageProvider.prototype.getLocation = function(key, callback) {
}



StorageProvider.prototype.save = function(data, options, callback) {
}


module.exports = StorageProvider;