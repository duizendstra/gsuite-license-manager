/*global require, console, Promise*/
var google = require('googleapis');
var retry = require('retry');

function gsuiteLicenseManager(mainSpecs) {
    "use strict";
    var auth;
    var service = google.licensing('v1');

    function insert(specs) {
        return new Promise(function (resolve, reject) {
            var productId = specs.productId;
            var skuId = specs.skuId;
            var userId = specs.userId;
            var request = {
                auth: auth,
                productId: productId,
                skuId: skuId,
                userId: userId
            };

            if (specs.fields) {
                request.fields = specs.fields;
            }

            var operation = retry.operation({
                retries: 5,
                factor: 3,
                minTimeout: 1 * 1000,
                maxTimeout: 60 * 1000,
                randomize: true
            });

            operation.attempt(function () {
                service.licenseAssignments.insert(request, function (err, response) {
                    if (operation.retry(err)) {
                        console.log("Warning, error %s occured, retry %d", err.code, operation.attempts());
                        return;
                    }
                    if (err) {
                        reject(operation.mainError());
                        return;
                    }
                    resolve(response);
                });
            });
        });
    }

    auth = mainSpecs.auth;
    return {
        insert: insert
    };
}

module.exports = gsuiteLicenseManager;