(function(module) {
    'use strict';

    const Transport       = require('./transport.js'),
        TransportRegistry = require('./transportRegistry.js'),
        NodeSsh           = require('node-ssh');

    function SshTransport(params) {
        Transport.call(this, params);
        this.connected = false;
        this.sshClient = new NodeSsh();
    }

    SshTransport.prototype = Object.create(Transport.prototype);

    SshTransport.prototype.call = function(params) {
        return new Promise((function(resolve, reject){
            if(!this.connected) {
                this.connect(this.execSShCommand.bind(this, params, resolve, reject));
            } else {
                this.execSShCommand(params, resolve, reject);
            }
        }).bind(this));
    };

    SshTransport.prototype.promise = function(params) {
        return new Promise((function(resolve, reject) {
            if(!this.connected) {
                this.connect(this.execSShCommand.bind(this, params, resolve, reject));
            } else {
                this.execSShCommand(params, resolve, reject);
            }
        }).bind(this));
    };

    SshTransport.prototype.connect = function(connectCb) {
        this.onConnected.bind(this, connectCb);
        this.sshClient.connect({
            host: this.params.host,
            port: this.params.port || 22,
            username: this.params.username,
            privateKey : this.params.privateKey
        }).then(this.onConnected.bind(this, connectCb));
    };

    SshTransport.prototype.execSShCommand = function(params, resolve, reject) {
        this.sshClient.execCommand(params.cmd, {}).then((function(result){
            if(result.stderr) {
                reject(result.stderr);
            } else {
                resolve(result.stdout);
            }
        }).bind(this));
    };

    SshTransport.prototype.onConnected = function(connectCb) {
        this.connected = true;
        if(connectCb) {
            connectCb();
        }
    };

    SshTransport.prototype.disconnect = function() {
        this.sshClient.connection.end();
        this.connected = false;
    };

    TransportRegistry.registerTransport('ssh', SshTransport);
    module.exports = SshTransport;
}(module));