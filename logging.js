// May want to use Truk ID if we can get it
var userID = Math.floor(Math.random() * (100000000)).toString();

function logQuery(type, data) {
    var sendData = {
        "userId": userID,
        "type": type,
        "data": data,
        "time": new Date().toString()
    };
            
    $.ajax({
        url: baseURL + '/logging',
        async: true,
        type: 'POST',
        data: JSON.stringify(sendData),
        dataType: 'text',
        contentType: 'text/plain',
        error: (function(type){ 
            return function(jqXHR, status, error) {
              // Not much use in trying to inform the user
              console.error('ERROR: ' + error  + '(Status ' + status + ') - Unable to log query ' + type);
            };
        })(type)
    });
}
