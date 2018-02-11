(function(module){
    'use strict';
    
    const node_ssh           = require('node-ssh'),
        ssh                  = new node_ssh(),
        DiskMetricsCollector = function(ssh) { 
            this.ssh = ssh;
        };
    
    DiskMetricsCollector.df_output_options = ['source','fstype','itotal',
        'iused','iavail','ipcent',
        'size','used','avail',
        'pcent','file','target']
        .join();

    DiskMetricsCollector.df_cmd = 'df --output=' + DiskMetricsCollector.df_output_options + ' --exclude-type=tmpfs --exclude-type=devtmpfs';
    
    DiskMetricsCollector.prototype.parseDfResponse = function () { };
    
    DiskMetricsCollector.prototype.publishToCloudwatch = function () { };

    DiskMetricsCollector.prototype.onConnected = function () {
        const onExecCompletedCB = this.onExecComplete.bind(this);
        this.ssh
            .execCommand(DiskMetricsCollector.df_cmd, {})
            .then(onExecCompletedCB);
    };

    DiskMetricsCollector.prototype.onExecComplete = function(result) {
        console.log(result.stdout);
        console.log(result.stderr);
        this.ssh.connection.end();
    };
    
    DiskMetricsCollector.prototype.collect = function(host) {
        this.ssh.connect({
            host       : host.name,
            username   : host.username,
            privateKey : host.privateKey
        }).then(this.onConnected.bind(this));
    };
    
    module.exports = DiskMetricsCollector;

    const metricsCollector = new DiskMetricsCollector(ssh);

    const host = {
        name: '52.221.219.148',
        username: 'ubuntu',
        privateKey: './n4j-singapore.pem'
    };

    metricsCollector.collect(host);
}(module));


