/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
(function(module){
    'use strict';
    
    const SshTransport = require('../transport/sshTransport.js');

    function DiskMetricsCollector(host) { 
        this.transport = new SshTransport(host);
    }
    
    DiskMetricsCollector.df_output_options = ['source','fstype','itotal',
        'iused','iavail','ipcent',
        'size','used','avail',
        'pcent','file','target'];

    DiskMetricsCollector.df_cmd = 'df --output=' + DiskMetricsCollector.df_output_options.join() + ' --exclude-type=tmpfs --exclude-type=devtmpfs';
    
    DiskMetricsCollector.prototype.parseDfResponse = function (dfResponse) {
        const splitResponse =  dfResponse.split('\n');
        if(splitResponse.length < 2) {
            console.error('Invalid df response ', splitResponse);
            return [];
        }

        const diskMetricsOptions = DiskMetricsCollector.df_output_options,
            metrics = [];
        
        splitResponse.slice(1, splitResponse.length).forEach(element => {
            var metricItems = [];
            element.split(' ').map( item => item.trim()).forEach(rawItem => {
                if(rawItem.length === 0)
                    return;
                metricItems.push(rawItem);
            });
            var metric = {};
            for(var i=0; i<diskMetricsOptions.length; i++) {
                metric[diskMetricsOptions[i]] = metricItems[i] === '-' ? null : metricItems[i];
            }
            metrics.push(metric);
        });
          
        return metrics;
    };
    
    DiskMetricsCollector.prototype.publishToCloudwatch = function () { };
 
    DiskMetricsCollector.prototype.collect = function(params) {
        this.transport.call(params).then((function(result){
            const diskMetrics = this.parseDfResponse(result);
            console.log(diskMetrics);
            this.transport.disconnect();
        }).bind(this));
    };
    
    module.exports = DiskMetricsCollector;
}(module));