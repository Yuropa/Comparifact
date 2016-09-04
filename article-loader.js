function getPath() {
    var location = window.location;
    return location.protocol + '//' + location.host + location.pathname;
}

function search(url) {
    if (url == undefined) {
        url = $('#search').val();
    }
    
    window.location.href = getPath() + "?url=" + encodeURI(url);
}

$(window).ready(function() {
    $("#search").keyup(function(event) {
        if(event.keyCode == 13) {
            search();
        }
    });
    
    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
    }
    
    var url = getQueryVariable('url');
    if (url == undefined) {
        showLandingPage();
    } else {
        url = decodeURI(url);
        showArticlePage(url);
    }
});

function showLandingPage() {
    $('#landing-page').css('display', 'initial');
    $('#article-page').css('display', 'none');
    loadLandingPageArticles();
}

function showArticlePage(url) {
    $('#landing-page').css('display', 'none');
    $('#article-page').css('display', 'initial');
    
    $('#article-page').find('.document-header').children().remove();
    // $('#article-text').append('<div class="ui active dimmer"><div class="ui indeterminate text loader">Loading Article</div></div>');
    
    $('#article-page').find('.document-header').append('<div class="landing-link" onclick="window.location.href = getPath();">WikiViz</div>');
    
    
    asyncReqst({
        url: baseURL + '/extract',
        async: true,
        type: 'GET',
        data: {url : url},
        success: function(result) {
            $('#article-page').find('.document-header').append(buildHTMLForArticle(result, true));
            // $('#article-text').find('.ui.active.dimmer').remove();
            $('#article-text').text(result.content.split('\n').join('\n\n'));    

            if (url && url.length > 0) {
                // Disable editing the 
                $('#article-text').prop('contenteditable', 'false');
                $('.document-header .example-text').prop('contenteditable', 'false');
                
                // Search for visualizations
                loadImages();
            } else {
                showArticleNoText();
            }

        }, error: function() {
            // $('#article-text').find('.ui.active.dimmer').remove();
            $('#article-page').find('.document-header').append('<div class="example-no-image"></div><div class="example-text" data-placeholder="Article title..." contenteditable="true"></div>');

            alert("Unable to download text from article \"" + url + "\". Please manually enter the text into the fields");
        }
    });   
}

function loadLandingPageArticles() {
    asyncReqst({
        url: baseURL + '/featured',
        async: true,
        type: 'GET',
        success: function(result) {
            result = JSON.parse(result.data);
            
            $('#landing-page').find('.examples-header').remove();
            $('#landing-page').find('.examples').remove();
            
        
            for (var i = 0; i < result.length; i++) {
                var section = result[i];
                var title = section.title;
                var articles = section.articles;
                $('#landing-page').append('<div class="examples-header">' + title + '</div>');
        
                var examplesHTML = '<div class="examples">';
                
                for (var j = 0; j < articles.length; j++) {
                    examplesHTML += '<div class="exmaple-container"><div class="example" ';
                    examplesHTML += 'onclick="window.location.href=\'' + getPath() + '?url=' + encodeURI(articles[j].url) + '\'" ';
                    examplesHTML += '>';
                    examplesHTML += buildHTMLForArticle(articles[j], false);
                    examplesHTML += '</div></div>';
                }
        
                examplesHTML += '</div>';
                $('#landing-page').append(examplesHTML);
            }
        }
    });
}
