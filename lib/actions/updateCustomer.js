var sphere = require('../sphere.js');
var messages = require("../messages.js");

exports.process = function(msg, cfg) {
    var self = this;

    var client = sphere.createServiceClient("customers", cfg);

    client.byId(msg.body.id).fetch().then(updateCustomer).catch(errorHandler);

    function updateCustomer(data) {
        var customer = data.body;
        var actions = {
            version: customer.version,
            actions: [{
                action: 'setExternalId',
                externalId: msg.body.external_id
            }]
        };
        client.byId(customer.id)
            .update(actions)
            .then(handleResult)
            .catch(errorHandler);
    }

    function handleResult(data) {
        self.emit('data', messages.newMessageWithBody(data.body));
        self.emit('end');
    }

    function errorHandler(err) {
        if (err.body.statusCode === 409) {
            self.emit('rebound');
        } else {
            self.emit('error', err);
        }
        self.emit('end');
    }
};