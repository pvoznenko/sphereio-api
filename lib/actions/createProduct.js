var sphere = require('../sphere.js');
var messages = require('../messages.js');
var helper = require('../helpers.js');
var attributeManager = require('../attributeManager.js');
var metaModel = require('../metaModel.js');

exports.getMetaModel = getMetaModel;
exports.process = processAction;
exports.getProductTypeSelectModel = helper.getProductTypeSelectModel;

function getMetaModel (cfg, callback) {
    metaModel.getMetaModel(cfg, 'createProduct.json', callback);
}

function processAction(msg, cfg) {
    var self = this;

    var client = sphere.createClient(cfg);

    sphere.getProductTypeAttributes(client, cfg.productType)
        .then(saveProduct)
        .then(handleResult)
        .catch(hanldeError)
        .done(end);

    function saveProduct(productTypeAttributes){
        helper.amountsToCentAmounts(msg); // convert 'amount' to 'centAmount'
        var product = attributeManager.readProduct(cfg, msg, productTypeAttributes);
        return client.products.save(product);
    }

    function handleResult(data) {
        helper.centAmountsToAmounts(data.body); // convert 'centAmount' to 'amount'
        self.emit('data', messages.newMessageWithBody(data.body));
    }

    function hanldeError(err) {
        self.emit('error', err);
    }

    function end() {
        self.emit('end');
    }
}