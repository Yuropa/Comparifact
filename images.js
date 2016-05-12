var useLocalHost = false;
var baseURL = useLocalHost ? "http://localhost:8080/newsviews" : "http://104.236.255.214:8080/newsviews";
var runningInPlugin = false;

window.onload = function() {
    var query = window.location.search;
    if (query == '?plugin') {
        runningInPlugin = true;
    }
    
    if (runningInPlugin) {
        $('#content').children().hide();
        loadText();
    }
}

function loadText() {
    $('ui segment').remove();
    $('#submitButton').addClass('loading');
    
    var url;
    if (runningInPlugin) {
        url = window.href;
    } else {
        url = $('#url-field').val();
    }
    
    downloadText(url, function(title, text) {
        $('#submitButton').removeClass('loading');
        $('#text-content').text(text);
        generateImages();
    });
}

function downloadText(url, callback) {
    var uri = createURI(url);
    
    asyncReqst({
        url: baseURL + '/extract',
        async: true,
        type: 'POST',
        data: JSON.stringify({url : url}),
        dataType: 'text',
        contentType: 'text/plain',
        success: function(result) {
            result = JSON.parse(result);
            
            var title = result.title;
            var text = result.content;
            
            if (uri.host == 'www.cnn.com') {
                // Remove everything up until the (CNN) part of the text
                text = text.substr(text.indexOf('('));
            }
            
            callback(result.title, result.content);
        }
    });
    
    /*
    var uri = createURI(url);
    var iframe = document.createElement('iframe');
    iframe.onload = function() {
        d = iframe.contentWindow.document;

        var article = new Readability(uri, d).parse();
        var text = $(article.content).text();
        var title = article.title;
        
        if (uri.host == 'www.cnn.com') {
            // Remove everything up until the (CNN) part of the text
            text = text.substr(text.indexOf('('));
        }
        
        callback(title, text);

        document.body.removeChild(iframe);

        $('#submitButton').removeClass('loading');
    }
    iframe.src = url;
    iframe.style.display = 'none';

    document.body.appendChild(iframe);
    */
}

function createURI(url) {
    var parser = document.createElement('a');
    parser.href = url;
    
    var uri = {
        spec: parser.href,
        host: parser.host,
        prepath: parser.location + "//" + parser.host,
        scheme: parser.protocol.substr(0, parser.protocol.indexOf(":")),
        pathBase: parser.protocol + "//" + parser.host + parser.pathname.substr(0, parser.pathname.lastIndexOf("/") + 1)
    };
    
    return uri;
}

function generateImages() {
    $('#generateButton').addClass('loading');
    $('.ui.segment.attached').remove();
    
    allMaps = []
    
    downloadImage($('#text-content').text(), function(result) {
        $('#generateButton').removeClass('loading');
        
        var refMapCount = 0;
        for (var i = 0; i < result.length; i++) {
            var article = result[i];
            var html = '<div class="ui top attached segment" style="background: rgb(249, 250, 251); padding: 0px;"><div class="ui" style="padding: .92857143em .71428571em; font-weight: 700; font-size: 1em; display: inline-block;">';
            html += article.title;
            html += '</div></div>';

            for (var j = 0; j < article.images.length; j++) {
                if ("refMap" in article.images[j]) {
                    if (j == article.images.length - 1) {
                        html += '<div class="ui bottom attached segment" style="width: 100%; padding: 0; padding-bottom: 75%;">';
                    } else {
                        html += '<div class="ui attached segment" style="width: 100%; padding: 0; padding-bottom: 75%;">';
                    }
                    
                    var refMapData = JSON.parse(article.images[j].refMap);
                    var swlat = refMapData["sw-lat"]; 
                    var swlng = refMapData["sw-lng"]; 
                    var nelat = refMapData["ne-lat"]; 
                    var nelng = refMapData["ne-lng"]; 
                    var extent = [[swlat, swlng], [nelat, nelng]];
                    
                    html += '<div class="map" id="map' + refMapCount + '"></div>';
                    
                    // function generateMap(name, annotations, mapStyle, center, zoom)
                    html += '<script>generateMap("map' + refMapCount + '", ' + JSON.stringify(refMapData.annotations) + ' , ' + JSON.stringify(refMapData.styles) + ',' + JSON.stringify(extent) + ');</script>';
                    refMapCount++;
                } else if ("url" in article.images[j]) {
                    if (j == article.images.length - 1) {
                        html += '<div class="ui bottom attached segment">';
                    } else {
                        html += '<div class="ui attached segment">';
                    }
                    
                    var image = article.images[j].url;
                    html += '<img style="max-width: 75%; max-height: 75%;" src="' + image + '">';
                } else {
                    if (j == article.images.length - 1) {
                        html += '<div class="ui bottom attached segment">';
                    } else {
                        html += '<div class="ui attached segment">';
                    }
                    
                    var image = "data:image/png;base64, " + article.images[j].data;
                    html += '<img style="max-width: 75%; max-height: 75%;" src="' + image + '">';
                }
                
                html += '<p>' + article.images[j].caption + '</p>';

                html += '</div>';
            }

            $('#content').append(html);
        }
    }, function() {
        $('#generateButton').removeClass('loading');
    }, $('.ui.dropdown').dropdown('get value'));
}

function downloadImage(text, success, error, method) {
    var lang = useLocalHost ? 'simple' : 'en';
    
    if (method == undefined) {
        method = 'wikify';
    }
    
    var url = "images?lang=" + lang + "&method=" + method + "&text=" + encodeURI(text);
    
    asyncReqst({
        url: baseURL + "/wikibrain",
        async: true,
        type: 'POST',
        data: JSON.stringify({query : url}),
        dataType: 'text',
        contentType: 'text/plain',
        success: function(result) {
            result = JSON.parse(result).articles;

            if (success)
                success(result);
        },
        error: function(e) {
            if (error)
                error(e);
        }
    });
}
