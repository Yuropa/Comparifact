
var _currentRequests = {};
function asyncReqst(settings) {
    var url = settings.url;
    if (url in _currentRequests) {
        var req = _currentRequests[url];
        req.abort();
        delete _currentRequests[url];
    }
    
    settings.success = function(callback) {
        return function(result) {
            delete _currentRequests[url];
            if (callback != undefined)
                callback(result);
        };
    }(settings.success);
    
    settings.error = function(callback) {
        return function(result) {
            delete _currentRequests[url];
            if (callback != undefined)
                callback(result);
        };
    }(settings.error);
    
    var request = $.ajax(settings);
    _currentRequests[url] = request;
}
