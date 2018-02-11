/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
const http    = require('http'),
    net       = require('net'),
    Aws       = require('aws-sdk'),
    metrics   = new Aws.CloudWatch(),
    s3        = new Aws.S3(),
    namespace = 'Checkr';
          
exports.handler = (event, context, callback) => {
    'use strict';
          
    function main(args) {
        s3.getObject({Bucket: args.Bucket, Key: args.Key}, (err, data) => {
            if (err) {
                console.log(err);
                callback(null, 'Failed fetching configuration');
                return;
            }
            try{
                const config = JSON.parse(data.Body.toString('utf-8'));
                console.log(config);
                for (var index in config.targets) {
                    setTimeout(check, 0, config.targets[index]);
                }
                callback(null, 'Check(s) scheduled');
            } catch(e) {
                console.log(e);
            }
        });
    }
    
    function check(target) {
        switch (target.check) {
        case 'http':
            httpCheck(target);
            break;
            
        default:
            tcpCheck(target);
            break;
        }
    }
    
    function tcpCheck(target) {
        const client = new net.Socket();
        
        client.setTimeout(target.timeout);
        
        client.on('timeout', () => {
            client.destroy();
            var message = `Unable to connect service ${target.service} on ${target.host}:${target.port}`;
            console.log(message);
            putMetric(target.service, 'Downtime', 1);
            callback(null, message);
        });
        
        client.on('connect', () => {
            var message = `Service ${target.service} on ${target.host}:${target.port} is up`;
            client.destroy();
            console.log(message);
            putMetric(target.service, 'Uptime', 1);
            callback(null, message);
        });
        
        client.on('error', (e) => {
            var message = 'TCP Error';
            switch (e.code) {
            case 'ECONNREFUSED': {
                message = `Unable to connect service ${target.service} on ${target.host}:${target.port}`;
                putMetric(target.service, 'Downtime', 1);
            }
                break;
                    
            case 'ECONNRESET': {
                message = `Unable to reach service ${target.service} on ${target.host}:${target.port}`;
                putMetric(target.service, 'Downtime', 1);
            }
                break;
                    
            default:
                message = `Failed to ping service ${target.service} on ${target.host}:${target.port}, error ${e.code}`;
                break;
            }
            
            console.log(message);
            callback(null, message);
        });
        
        client.connect(target.port, target.host, () => {
            client.destroy();
        });
    }
    
    function httpCheck(target) {
        const options = {
                host: target.host,
                port: target.port,
                path: target.path
            },
            request = http.request(options, (res) => {
                if (200 === res.statusCode) {
                    try{
                        putMetric(target.service, 'Uptime',1);
                    } catch(e) {
                        console.log(e);
                    }
                } else {
                    callback(null, `Host Responded with status code ${res.statusCode}`);
                }
            });
    
        // Timeout aftet target.timeout milliseconds
        request.on('socket', (socket) => {
            socket.setTimeout(target.timeout);
            socket.on('timeout', () => {
                request.abort();
            });
        });
        
        // Exception handler for http request
        request.on('error', (e) => {
            if (e.code === 'ECONNRESET') {
                var message = `Unable to connect service ${target.service} on ${target.host}:${target.port}`;
                console.log(message);
                putMetric(target.service, 'Downtime', 1);
                callback(null, message);
            } else {
                console.log(e);
            }
            callback(null, 'HTTP Request Error');
        });
        
        request.end();
    }
    
    function createMetric (service, metricName, datum) {
        return  {
            MetricData: [ 
                {
                    MetricName: metricName, 
                    Dimensions: [
                        {
                            Name: 'Service',
                            Value: service
                        },
                    ],
                    StorageResolution: 1,
                    Timestamp: new Date(),
                    Unit: 'Count',
                    Value: datum
                },
            ],
            Namespace: namespace 
        };
    }

    function putMetric (service, metricName, datum)  {
        const metric = createMetric(service, metricName, datum);
        try {
            metrics.putMetricData(metric, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data);
                }
                callback(null, 'Metric Populated');
            });
        } catch(e) {
            console.log(e);
        }
    }
    
    main(process.env);
};