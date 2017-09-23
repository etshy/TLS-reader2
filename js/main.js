$(function()
{

    $('.main.menu').visibility({
        type: 'fixed'
    });

    $("#toggle_leftbar").on('click', function()
    {
        $('#leftbar').sidebar('toggle');
    });

    $("#load_embed").on('click', function()
    {
        //<a href="http://91.121.173.74/reader/?book=[TLS]TLD76.epub" data-bibi="embed" data-bibi-style="width: 100%; height: 100%;">My Great Book Title</a><script src="http://91.121.173.74/reader/i/script/bibi.js"></script>
        $('.embed-reader').empty();

        ebookpath = '[TLS]TLD76.epub'
        $('.embed-reader').html(
            '<a href="http://91.121.173.74/reader/bib/i/?book='+ ebookpath +'" data-bibi="embed" data-bibi-style="">OUI</a><script src="http://91.121.173.74/reader/bib/i.js"></script>' );

    });

    var preloadPagesNumber = 3;
    var fileTreeJson = null;
    var selectedSerie = null;
    var selectedChap = null;
    var prevChap = null;
    var nextChap = null;
    var readerEnabled = false;
    var baseUrl = 'bookshelf/';
    var selectedChapPages = null;
    var selectedPage = null;

    /**
     * Functions
     */

    /**
     * Reset the message.
     */
    function resetMessage () {
        $("#result")
            .removeClass()
            .text("");

    }
    /**
     * show a successful message.
     * @param {String} text the text to show.
     */
    function showMessage(text) {
        resetMessage();
        $("#result")
            .addClass("ui positive message")
            .text(text);
        if($("#topbar").sidebar('is hidden')){
            $("#topbar").sidebar('show');
        }
    }
    /**
     * show an error message.
     * @param {String} text the text to show.
     */
    function showError(text) {
        resetMessage();
        $("#result")
            .addClass("ui negative message")
            .text(text);
        $("#topbar").sidebar('show');
    }
    /**
     * Update the progress bar.
     * @param {Integer} percent the current percent
     */
    function updatePercent(percent) {
        $("#progress_bar").removeClass("hidden")
            .find(".progress-bar")
            .attr("aria-valuenow", percent)
            .css({
                width : percent + "%"
            });
    }

    /**
     * Fetch the content and return the associated promise.
     * @param {String} url the url of the content to fetch.
     * @return {Promise} the promise containing the data.
     */
    function urlToPromise(url) {
        return new Promise(function(resolve, reject) {
            JSZipUtils.getBinaryContent(url, function (err, data) {
                if(err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    function downloadChapter()
    {
        var zip = new JSZip();
        var chapterURL = baseUrl+ selectedSerie + '/' + selectedChap + '/';

        $.each(selectedChapPages, function(index, value){
            var pageURL = chapterURL + value;
            var filename = value;
            zip.file(filename, urlToPromise(pageURL), {binary:true});
        });

        // when everything has been downloaded, we can trigger the dl
        zip.generateAsync({type:"blob"}, function updateCallback(metadata) {
            var msg = "progression : " + metadata.percent.toFixed(2) + " %";
            if(metadata.currentFile) {
                msg += ", current file = " + metadata.currentFile;
            }
            showMessage(msg, false);
            updatePercent(metadata.percent|0);
        })
        .then(function callback(blob) {

            // see FileSaver.js
            saveAs(blob, selectedSerie+'_'+selectedChap+".zip");

            showMessage("done !");
        }, function (e) {
            showError(e);
        });
    }


//MY FUNCTIONS

    function changeReaderSource()
    {
        $(".reader-pusher").show();
        $(".reader-container").slideDown();

        selectedChapPages = fileTreeJson[selectedSerie][selectedChap];
        if(selectedPage){
            changePageDisplay(selectedPage);
        } else {
            //On affiche la premiere page
            changePageDisplay(0);
        }

        readerEnabled = true;

        detectPrevChapter();
        detectNextChapter();
    }

    function generateChapterSelect()
    {
        var selectedChapFound = false;
        if(!$("#series_select").val())
        {
            return false;
        }
        var serie = $("#series_select").val();
        var chapterSerie = fileTreeJson[serie];
        $('#chapter_select').empty();
        $.each(chapterSerie, function (index, value) {
            if(typeof value == 'string')
            {
                //image, on a le nom de l'image
            } else {
                //dossier epub
                $option = $('<option>');
                $option.attr('value', index);
                $option.text(index);
                $('#chapter_select').append($option);

                if(selectedChap == index) {
                    selectedChapFound = true;
                }
            }
        });
        if(selectedChapFound)
        {
            $('#chapter_select').val(selectedChap)
        }
        generatePagesSelect();
    }

    function generateSeriesSelect()
    {
        if(!fileTreeJson)
        {
            return false;
        }
        $('#series_select').empty();
        $.each(fileTreeJson, function (index, value) {
            if(typeof value == 'string')
            {
                //image, on a le nom de l'image
            } else {
                //dossier de pages
                $option = $('<option>');
                $option.attr('value', index);
                $option.text(index);
                $('#series_select').append($option);
            }
        });
        generateChapterSelect();
    }

    function generatePagesSelect()
    {
        if(!$("#chapter_select").val())
        {
            return false;
        }
        var serie = $("#series_select").val();
        var chapterSerie = fileTreeJson[serie];
        var chapter = $("#chapter_select").val();
        var chapterSeriePages = fileTreeJson[serie][chapter];
        $('#page_select_div .menu').empty();
        $.each(chapterSeriePages, function (index, value) {

            if(typeof value == 'string')
            {
                //image, on a le nom de l'image
                //<div class="item" data-value="male">Male</div>
                $option = $('<div>');
                $option.addClass('item');
                $option.attr('value', index);
                $option.data('value', index);
                $option.text(index);
                $('#page_select_div .menu').append($option);
            } else {
                //array, c'est un dossier (on ne doit pas passer par la)
            }
        });
        $('#page_select').val(0);

        $('#page_select_div').dropdown();
    }

    function detectNextChapter()
    {
        nextChap = null
        var actualChap = null;
        var actualChapFound = false;
        $.each(fileTreeJson[selectedSerie], function (index, value) {

            if(typeof value == 'string')
            {
                //image, on a le nom de l'image
            } else {
                //dossier epub
                actualChap = index;
                if(actualChapFound)
                {
                    //Chap actuel trouvé au passage précédent donc on garde ce chap en tant que nextChap
                    nextChap = actualChap;
                    return false;
                }
                if(actualChap == selectedChap)
                {
                    actualChapFound = true;
                }
            }

        });

        if(nextChap) {
            $("#next_chapter").show();
        } else {
            $("#next_chapter").hide();
        }
    }


    function detectPrevChapter()
    {
        prevChap = null;
        var prevChapTemp = null;
        $.each(fileTreeJson[selectedSerie], function (index, value) {

            if(typeof value == 'string')
            {
                //image, on a le nom de l'image
            } else {
                //dossier epub

                var actualChap = index;
                var actualChapFound = false;

                if(actualChap == selectedChap)
                {
                    actualChapFound = true;
                }
                if(actualChapFound && prevChapTemp)
                {
                    //Chap actuel trouvé, on passe le selectedChap avec la valeur du passage d'avant
                    prevChap = prevChapTemp;
                    return false;
                }
                prevChapTemp = actualChap;
            }

        });
        if(prevChap) {
            $("#prev_chapter").show();
        } else {
            $("#prev_chapter").hide();
        }
    }

    function goToNextChapter()
    {
        selectedChap = nextChap;
        $("#chapter_select").val(selectedChap);
        selectedPage = 0;
        changeReaderSource();
    }
    function goToPrevChapter()
    {
        selectedChap = prevChap;
        $("#chapter_select").val(selectedChap);
        selectedPage = 0;
        changeReaderSource();
    }
    function getFileTreeJson()
    {
        $.ajax({
            url: 'fileTree.php',
            success: function (data) {
                fileTreeJson = data;
                generateSeriesSelect();
                generateFirstPage();
            }
        });
    }

    function generateFirstPage()
    {
        if(!fileTreeJson)
        {
            return false;
        }

        $.each(fileTreeJson, function (index, value) {

            $column = $('<div>');
            $column.addClass('column');

            $card = $('<div>');
            $card.addClass('ui card serie-card');
            $card.data('serie', index);

            $titre = $("<div>");
            $titre.addClass('content');
            $headerTitre = $("<div>");
            $headerTitre.addClass('header');
            $headerTitre.html(index);
            $titre.append($headerTitre);

            $image = $("<div>");
            $image.addClass('image');

            $card.append($titre);

            $chapDIV = $("<div>");
            $chapDIV.addClass('content');


            $chapList = $("<div>");
            $chapList.css({'display': 'none'})
            $chapList.addClass('chap-list');
            var chapNumber = 0;
            $.each(value, function (index2, value2) {

                if(typeof value2 == 'string')
                {
                    //image, on a le nom de l'image
                    $imageContent = $("<div>");
                    $imageContent.addClass('content');
                    $imageDiv = $("<div>");
                    $imageDiv.addClass('image');
                    $image = $("<img>");
                    $image.attr('src', baseUrl + index + '/' + value2);
                    $imageDiv.append($image);
                    $imageContent.append($imageDiv);
                    $card.append($imageContent);
                } else {

                    //dossier de pages
                    chapNumber++;
                    $linkDiv = $("<div>");
                    $linkDiv.addClass('chap-link-div');
                    $link = $("<a>");
                    $link.addClass('chap-link pointing');
                    $link.data('chap', index2);
                    $link.html('Chapitre ' + index2 + '<i class="chevron right icon"></i>');

                    $linkDiv.append($link);
                    $chapList.append($linkDiv);

                }
            });

            if(chapNumber > 0)
            {
                $voirChapDIV = $("<button>");
                $voirChapDIV.addClass("voir-chaps ui button right labeled icon fluid")
                $voirChapDIV.html( '<i class="icon plus"></i> Voir les chapitres ' );
                $chapDIV.prepend($voirChapDIV);
            }

            $chapDIV.append($chapList);
            $card.append($chapDIV);
            $column.append($card);
            $("#first_page").append($column);
        });

    }

    function toggleChapView(that)
    {
        $chapList = $(that).closest('div').children('.chap-list');
        $chapList.slideToggle(function(){
            if($chapList.is(':visible')){
                $(that).html('<i class="icon minus"></i> Masquer les chapitres')
            } else {
                $(that).html('<i class="icon plus"></i> Voir les chapitres ')
            }
        });
    }

    function goToChapterOnFirstPage(that) {
        selectedSerie = $(that).closest('.serie-card').data('serie')
        selectedChap = $(that).data('chap');
        selectedPage = 0;
        readerEnabled = true;

        $("#series_select").val(selectedSerie);
        $("#series_select").trigger('change');

        $("#first_page_content").slideUp(400, function(){
            $("#toggle_leftbar").show();
            $("#navigation_div").show();
        });
        changeReaderSource();
    }

    function goBackToFirstPage(){
        $('#leftbar').sidebar("hide");
        $("#navigation_div").hide();
        $(".reader-container").slideUp(function () {
            $(".reader-pusher").hide();
            $("#first_page_content").slideDown(function () {
            });
        });

    }

    function createImgTag(pageIndex){
        var $img = $('<img>');
        $img.attr('src', baseUrl+ selectedSerie + '/' + selectedChap + '/' + selectedChapPages[pageIndex]);
        $img.data('page', pageIndex);
        return $img;
    }

    function changePageDisplay(page){

        page = parseInt(page);

        if($('img').find("[data-page='" + page + "']").length > 0){
            //if the img tag we want to display exists
            $img = $('img').find("[data-page='" + page + "']");
            $img.removeClass().addClass('current-page');
        } else {
            //Insert current page to load it first
            var $img = createImgTag(page);
            $img.addClass('current-page');
            $("#reader_container").empty();
            $("#reader_container").append($img);
        }

        selectedPage = page;
        $("#page_select").val(selectedPage);
        $("#page_select_div").dropdown();

        //preload 2 pages forward and 2 pages backward
        for (var i=1; i <= preloadPagesNumber; i++) {
            var nextPage = page + i;
            var prevPage = page - i;
            if(nextPage >= 0 && selectedChapPages[nextPage] ){
                if($('img').find("[data-page='" + (nextPage) + "']").length > 0){
                    $img = $('img').find("[data-page='" + nextPage + "']");
                    $img.removeClass().addClass('next-page');
                } else {
                    $img = createImgTag(nextPage);
                    $img.addClass('next-page');
                    $("#reader_container").append($img);
                }
            }
            if(prevPage >= 0 && selectedChapPages[prevPage]) {
                if($('img').find("[data-page='" + (prevPage) + "']").length > 0){
                    $img = $('img').find("[data-page='" + (prevPage) + "']");
                    $img.removeClass().addClass('next-page');
                } else {
                    $img = createImgTag(prevPage);
                    $img.addClass('prev-page');
                    $("#reader_container").append($img);
                }
            }
        }

        $("html, body").animate({ scrollTop: 0 }, "quick");

        detectPrevNextPages();
    }

    function clickOnPage($this) {

        var currentPage = $this.data('page');
        var nextpage = currentPage + 1;

        if(selectedChapPages[nextpage]){
            //Prochaine page existante
            changePageDisplay(nextpage);
        } else if(nextChap){
            //pas de prochaine page, on change de chapitre s(il y en a
            goToNextChapter();
        } else {
            goBackToFirstPage();
        }

    }

    function backPage($this){
        var currentPage = $this.data('page');
        var prevpage = currentPage - 1;

        if(selectedChapPages[prevpage]){
            //précédente page existante
            changePageDisplay(prevpage);
        }
    }

    function detectPrevNextPages(){
        var currentPage = selectedPage;
        if(currentPage == 0){
            //1st page, hide prev_page
            $("#prev_page").hide();
        } else {
            $("#prev_page").show();
        }
        if(selectedChapPages[currentPage+1]){
            //next page exists
            $("#next_page").show();
        } else {
            $("#next_page").hide();
        }
    }


    /**
     * End Function
     */

    getFileTreeJson();

    var Promise = window.Promise;
    if (!Promise) {
        Promise = JSZip.external.Promise;
    }

    if(!JSZip.support.blob) {
        //showError("This demo works only with a recent browser !");
        //return;
        $("#download_chapter").remove();
    }

    /**
     * Events
     */
    $("#series_select").on('change', function (event) {

        generateChapterSelect();
        selectedSerie = $(this).val();
        selectedChap = $("#chapter_select").val();
    });
    $("#chapter_select").on('change', function (event) {
        selectedChap = $(this).val();
        selectedPage = 0;
        generatePagesSelect();
    });

    $('form .button').on('click', function (event) {
        event.preventDefault();

        selectedSerie = $("#series_select").val();
        selectedChap = $("#chapter_select").val();
        if($("#page_select").val()){
            selectedPage = $("#page_select").val();
        }

        changeReaderSource();

        $("#toggle_leftbar").trigger('click');
        $("#first_page_content").slideUp();
    });

    $("#next_chapter").on("click", function (event) {
        goToNextChapter();
    });
    $("#prev_chapter").on("click", function (event) {
        goToPrevChapter();
    });
    $("#first_page").on("click", ".chap-link", function(event){
        event.preventDefault();
        goToChapterOnFirstPage(this);
    });
    $("#first_page").on("click", ".voir-chaps", function(event){
        event.preventDefault();
        toggleChapView(this);
    });
    $("#back_first_page").on("click", function (event) {
        event.preventDefault();
        goBackToFirstPage();
    });

    $("#reader_container").on('click', 'img', function(event){
        clickOnPage($(this));
    });
    $("#next_page").on('click', function(event){
        event.preventDefault();

        clickOnPage($("#reader_container").find('img.current-page'));
    });
    $("#prev_page").on('click', function(event){
        event.preventDefault();
        backPage($("#reader_container").find('img.current-page'));
    });

    $("#download_chapter").on('click', function(event) {
        event.preventDefault();
        downloadChapter();
    });

    $("#page_select").on('change', function(event){
        event.preventDefault();
        selectedPage = $(this).val();
        console.log(selectedPage)
        changeReaderSource();
        $("#toggle_leftbar").trigger('click');
        $("#first_page_content").slideUp();
    })

});
