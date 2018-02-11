(function(module){
    'use strict';

    const TransportRegistry = {
        transports        : {},

        registerTransport : function(transportType, transportImpl) {
            this.transports[transportType] = transportImpl;
        },

        getTransport      : function(transportType) {
            return this.transports[transportType];
        }
    };

    module.exports = TransportRegistry;
}(module));