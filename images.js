var useLocalHost = false;
var baseURL = useLocalHost ? "http://localhost:8080/newsviews" : "http://spatialization.cs.umn.edu/comparifact" // "http://104.236.255.214:8080/newsviews";

function loadImages() {
    $('#image-load-button').addClass('loading disabled').prop("disabled", true);
    showArticleLoading();
    
    allMaps = []
    
    downloadImage($('#article-text').text(), function(result) {
        $('#image-load-button').removeClass('loading disabled').prop("disabled", false);
        showArticleLoaded();
        
        loadTableData(result);
    }, function(error) {
        $('#image-load-button').removeClass('loading disabled').prop("disabled", false);
        showArticleLoaded();
        
        alert("Unable to load images at this time. Make sure you are connected to the internet and try again in a few minutes.")
    }, "wikify");
}

function downloadImage(text, success, error, method) {
    var lang = useLocalHost ? 'simple' : 'en';
    
    if (method == undefined) {
        method = 'all';
    }
    
    var url = "/images?lang=" + lang + "&method=" + method + "&text=" + encodeURI(text);
    
    asyncReqst({
        url: baseURL + url,
        async: true,
        type: 'POST',
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

function buildHTMLForArticle(article, contentEditable) {
    var title = article.title;
    var imageURL = article.imageURL;
    contentEditable = contentEditable == undefined ? false : contentEditable;
    
    var result = '';
    if (imageURL.length > 0) {
        result += '<div class="example-image" style=\'background-image: url("' + imageURL + '")\'></div>';
        result += '<div class="example-text-overlay"></div>';
    } else {
        result += '<div class="example-no-image"></div>';
    }
    
    if (contentEditable) {
        result += '<div class="example-text" data-placeholder="Article title..." contenteditable="true">' + title + '</div>';
    } else {
        result += '<div class="example-text">' + title + '</div>';
    }
    
    return result;
}

function parseJSONData(x) {
    if (typeof x === 'string') {
        return JSON.parse(x);
    }
    return x;
}

function stringifyJSONData(x) {
    if (typeof x === 'string') {
        return x;
    }
    return JSON.stringify(x);
}

// Load all the content for the images list
function itemHTML(html, caption, imageData) {
    var isRefMap = false;
    if ("refMap" in parseJSONData(imageData)) {
        isRefMap = true;
    }
    var styleProperty = (isRefMap ? 'style="padding-bottom: 68%;"' : '' );

    return '' +
    '<div class="ui card image-card">' + 
        '<div class="image" ' + styleProperty + '>' + 
            html +
        '</div>' + 
        '<div class="content">' + 
            '<div class="description">' + 
                caption;
            '</div>' + 
        '</div>' +
        '<div class="imageData" type="text" style="display: none;">' + JSON.stringify(imageData) + '</div>' +
    '</div>';
}

function imageData(elm) {
    elm = $(elm);
    var index = elm.parent().children().index(elm);

    var data = elm.find('.imageData').text();
    return {
        index: index,
        image: data
    }
}

function loadTableData(data) {
    var refMapCount = 0;
    $('#image-select').children().remove();

    var loggingImageData = [];

    for (var i = 0; i < data.length; i++) {
        var imageData = data[i].images[0];
        var caption = imageData.caption;

        var imageStorageData = {};

        var html = "";
        if ("refMap" in imageData) {
            var refMapData = JSON.parse(imageData.refMap);
            var swlat = refMapData["sw-lat"]; 
            var swlng = refMapData["sw-lng"]; 
            var nelat = refMapData["ne-lat"]; 
            var nelng = refMapData["ne-lng"]; 
            var extent = [[swlat, swlng], [nelat, nelng]];

            html += '<div class="map" id="map' + refMapCount + '"></div>';

            // function generateMap(name, annotations, mapStyle, center, zoom)
            html += '<script>generateMap("map' + refMapCount + '", ' + JSON.stringify(refMapData.annotations) + ' , ' + JSON.stringify(refMapData.styles) + ',' + JSON.stringify(extent) + ');</scr' + 'ipt>';
            refMapCount++;

            imageStorageData = {
                id: imageData.id,
                refMap: imageData.refMap
            };
        } else if ("url" in imageData) {
            var image = imageData.url;
            html +='<img class="display-image" src="Placeholder.svg" data-src="' + image + '" onclick="window.open(\'' + image + '\', \'_blank\').focus();">';

            imageStorageData = {
                id: imageData.id,
                url: imageData.url
            };
        } else {
            var image = "data:image/png;base64, " + imageData.data;
            html += '<img class="display-image" src="' + image + '">';

            imageStorageData = {
                id: imageData.id,
                data: imageData.data
            };
        }

        $('#image-select').append(itemHTML(html, caption, imageStorageData));
        //loggingImageData.push(imageData($('#image-select').children().last()));
    }
   $('#image-select').find("img").unveil();
}
