describe('Sphere.io queryCustomers.js', function () {
    var nock = require('nock');
    var allCustomers = require('../data/all_customers.json.js');
    var modifiedCustomers = require('../data/modified_customers.json.js');

    nock('https://auth.sphere.io')
        .filteringRequestBody(/.*/, '*')
        .post('/oauth/token', "*")
        .times(2)
        .reply(200, {
            "access_token": "i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA",
            "token_type": "Bearer",
            "expires_in": 172800,
            "scope": "manage_project:test_project"
        });

    nock('https://api.sphere.io')
        .get('/test_project/customers')
        .reply(200, allCustomers)
        .get('/test_project/customers?where=lastModifiedAt%20%3E%20%222014-08-21T00%3A00%3A00.000Z%22')
        .reply(200, modifiedCustomers);

    var next = function () {};
    var queryCustomers = require('../../lib/triggers/queryCustomers.js');
    var helpers = require('../../lib/helpers.js');

    describe('process', function () {
        var msg;
        var self;
        var cfg;

        beforeEach(function () {
            msg = {};
            self = jasmine.createSpyObj('self', ['emit']);
            cfg = {
                client: 'test_client',
                clientSecret: 'so_secret',
                project: 'test_project'
            };
        });

        it('should emit new message if first query was successful', function () {
            spyOn(helpers, 'updateSnapshotWithLastModified').andReturn();

            queryCustomers.process.call(self, msg, cfg, next, {});

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                expect(self.emit).toHaveBeenCalled();
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.count).toEqual(20);
            });
        });

        it('should emit new message if second query was successful (with snapshop `lastModifiedAt` param)', function () {
            spyOn(helpers, 'updateSnapshotWithLastModified').andReturn();
            var snapshot = {
                "lastModifiedAt": "2014-08-21T00:00:00.000Z"
            };
            queryCustomers.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                expect(self.emit).toHaveBeenCalled();
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.results.length).toEqual(3);
            });
        });
    });
});