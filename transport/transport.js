(function(module){
    'use strict';
    function Transport(params) {
        this.params = params;
        this.foo = {};
    }

    /*eslint no-unused-vars: ["error", { "args": "none" }]*/
    Transport.prototype.call = function(params) {

    };

    Transport.prototype.disconnect = function() {

    };
    module.exports = Transport;
}(module));