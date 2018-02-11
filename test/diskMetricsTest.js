const assert = require('assert'),
    DiskMetrics = require('../metrics/diskMetrics.js'),
    dfOuput = 
'Filesystem     Type  Inodes IUsed  IFree IUse% 1K-blocks   Used   Avail Use% File Mounted on\n'+
'/dev/xvda1     ext4 1024000 57497 966503    6%   8065444 866144 7182916  11% -    /';
var metrics = null;
describe('DiskMetrics', function() {
    describe('#parseDfOutput()', function() {
        it('should return JSON from raw DF input', function(){
            const collector = new DiskMetrics({});
            metrics = collector.parseDfResponse(dfOuput);
            console.log(metrics);
            assert.equal(metrics.length, 1);
        });

        it('should identify correct filesystem source', function() {
            const metric = metrics[0];
            assert.equal(metric['source'], '/dev/xvda1');
        });

        it('should detect empty metric values', function() {
            const metric = metrics[0];
            assert.equal(metric['file'], null);
        });

        it('should parse correct mount point', function() {
            const metric = metrics[0];
            assert.equal(metric['target'], '/');
        });

        it('should parse correct inodes used', function() {
            const metric = metrics[0];
            assert.equal(metric['iused'], '57497');
        });

        it('should parse correct filesystem', function() {
            const metric = metrics[0];
            assert.equal(metric['fstype'], 'ext4');
        });
    });
});