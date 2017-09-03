exports.handler = (event, context, callback) => {
    'use strict';
    
    const http      = require('http'),
          Aws       = require('aws-sdk'),
          metrics   = new Aws.CloudWatch(),
          s3        = new Aws.S3(),
          namespace = 'Checkr';
          
    function main(args) {
        s3.getObject({Bucket: args['Bucket'], Key: args['Key']}, (err, data) => {
            if (err) {
                console.log(err);
                callback(null, 'Failed fetching configuration');
                return;
            }
            try{
                const config = JSON.parse(data.Body.toString('utf-8'));
                console.log(config);
                for (var index in config.targets) {
                    //check(config.targets[index]);
                    setTimeout(check, 0, config.targets[index]);
                }
                callback(null, 'Check(s) scheduled');
            } catch(e) {
                console.log(e);
            }
        });
    }
    
    function check(target) {
        const options = {
          host: target.host,
          port: target.port,
          path: target.path
        },
        request = http.request(options, (res) => {
            if (200 === res.statusCode) {
                try{
                    putMetric(options.host, 'Uptime',1);
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
              console.log('Unable to reach target host');
              putMetric(options.host, 'Downtime', 1);
              callback(null, 'Unable to reach target host');
            } else {
             console.log(e);
            }
            callback(null, 'HTTP Request Error');
        });
        
        request.end();
    }
    
  function createMetric (hostName, metricName, datum) {
     return  {
        MetricData: [ 
            {
              MetricName: metricName, 
              Dimensions: [
                {
                  Name: 'Host', 
                  Value: hostName
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

  function putMetric (hostName, metricName, datum)  {
    const metric = createMetric(hostName, metricName, datum);
    try {
        const putRequest = metrics.putMetricData(metric, (err, data) => {
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
