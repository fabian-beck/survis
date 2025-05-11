const page = (function () {

    return {
        init: function () {
            loadAllCSS();
            initTitle();
            initBody();
            initHeader();
            initControl();
            initResult();
            initFooter();
            addActions();
            page.generateTooltips($('body'));
        },
        update: function (scrollToTop) {
            $('.tooltipstered').tooltipster('hide');
            selectors.updateSelectors();
            references.updateReferences();
            stats.updateStats();
            tags.updateTagClouds();
            clustering.updateClusters();
            entryLayout.updateEntryList();
            setTimeout(
                function() 
                {
                  // workaround: delayed loading waiting for the grid layout to be computed (to determine the correct width of the svg)
                  timeline.updateTimeline();
                }, 500);
            if (scrollToTop) {
                $('#result_body').scrollTop(0);
            }
        },
        updateShowAll: function () {
            bib.nVisibleEntries = 999999999;
            page.update(false);
        },
        updateShowMore: function () {
            bib.nVisibleEntries += 20;
            page.update(false);
        },
        updateShowPart: function () {
            bib.nVisibleEntries = 20;
            page.update(true);
        },
        updateTags: function () {
            tags.updateTagClouds();
        },
        updateTimeline: function () {
            timeline.updateTimeline();
        },
        updateTimelineLayout: function () {
            timeline.updateTimeline(true);
        },
        notify: function (message, type) {
            const notificationDiv = $(`<div ${type ? `class="${type}"` : ''}>${message}</div>`).appendTo($('#notifications'));
            notificationDiv.fadeIn('fast').delay(5000).fadeOut('fast');
        },
        generateTooltips: function (div) {
            div.find('.tooltip').tooltipster({
                theme: 'tooltipster-survis'
            });
        }
    };

    function initBody() {
        var container = ($('<div>', { id: 'page-container' })).appendTo($('body'));
        $('<div>', { id: 'header' }).appendTo(container);
        $('<div>', { id: 'control' }).appendTo(container);
        $('<div>', { id: 'result' }).appendTo(container);
        $('<div>', { id: 'footer' }).appendTo(container);
        $('<div>', { id: 'notifications'}).appendTo($('body'));
    }

    function loadAllCSS() {
        var cssList = [
            "codemirror/codemirror.css",
            "tooltipster/tooltipster.css",
            "tooltipster/tooltipster-survis.css",
            "style.css",
            "selector.css",
            "sparkline.css",
            "timeline.css",
            "entries.css"
        ];

        $.each(cssList, function (i, css) {
            loadCSS(stylesDir + css);
        });
        if (customStyle) {
            loadCSS(customStyle);
        }

        function loadCSS(href) {
            $('head').append($('<link>', {
                rel: 'stylesheet',
                type: 'text/css',
                href: href
            }));
        }

    }

    function initTitle() {
        document.title = title;
    }

    function initHeader() {
        var headerDiv = $('#header');
        var titleDiv = $('<div>', {
            id: 'title'
        });
        if (!electron) {
            titleDiv.append($('<h1>', {
                text: title
            }));
            if (paper) {
                var paperDiv = $('<div id="paper">' + paper.html + '</div>');
                if (paper.id) {
                    var showPaperButton = $('<div>', {
                        class: 'button',
                        text: 'select'
                    });
                    showPaperButton.click(function (event) {
                        selectors.toggleSelector('search', paper.id, event);
                        if (showPaperButton.text() == 'select') {
                            showPaperButton.text('deselect');
                        } else {
                            showPaperButton.text('select');
                        }
                    });
                    paperDiv.append(showPaperButton)
                }
                titleDiv.append(paperDiv);
            }
        } else {
            headerDiv.addClass('electron');
        }
        titleDiv.append($(`<a href="https://github.com/fabian-beck/survis"><img title="SurVis ${window.surVisVersion}" src="${stylesDir}img/survis_small.png"/></a>`));
        headerDiv.append(titleDiv);
        $('<form id="search"> <input type="search" placeholder="search ..."/> <div class="button" id="search_button">search </div> </form>').appendTo(headerDiv);
        headerDiv.append($('<div id="selectors_container"><div class="label">Selectors</div><div id="selectors"></div><div id="clear_selectors" class="button tooltip" title="clear selectors [esc]">clear</div><div style="clear: both;"></div></div>'));
    }

    function initControl() {
        var controlDiv = $('#control');
        var timelineContainerDiv = $('<div>', {
            id: 'timeline-container'
        }).appendTo(controlDiv);
        var timelineHeading = $('<h2><span class="symbol">/</span>Timeline</h2>').appendTo(timelineContainerDiv);
        timelineHeading.click(function () {
            uiUtil.toggleControl(timelineHeading);
            page.updateTimeline();
        });
        $('<div>', {
            id: 'timeline',
            class: 'toggle-container'
        }).appendTo(timelineContainerDiv);
        $('<div>', {
            id: 'tag_clouds'
        }).appendTo(controlDiv);
        var clustersDiv = $('<div>', {
            id: 'clusters',
            class: 'tag_cloud'
        }).appendTo(controlDiv);
        var clusterHeading = $('<h2><span class="symbol">/</span>Clusters</h2>').appendTo(clustersDiv);
        clusterHeading.click(function () {
            uiUtil.toggleControl(clusterHeading);
            page.updateTimeline();
        });
        $('<div>', {
            id: 'clusterings',
            class: 'toggle-container'
        }).appendTo(clustersDiv);
        var clusteringControls = $('<div>', {
            id: 'clustering_controls',
            class: 'toggle-container'
        }).appendTo(clustersDiv);
        $('<span>', {
            class: 'label',
            text: 'new clustering:'
        }).appendTo(clusteringControls);
        var nClusterDiv = $('<div>', {
            class: 'n_clusters',
            text: 'number of clusters'
        }).appendTo(clusteringControls);
        var nClusterSpan = $('<span>', {
            text: Math.max(1, clustering.nClusters)
        });
        var buttonDec = $('<div>', {
            class: 'button dec small',
            text: '-'
        }).appendTo(nClusterDiv);
        buttonDec.click(function (event) {
            if (clustering.nClusters > 1) {
                clustering.nClusters--;
                nClusterSpan.text(clustering.nClusters);
            }
        });
        if (clustering.nClusters < 1) {
            clustering.nClusters = 1
        }
        nClusterSpan.appendTo(nClusterDiv);
        var buttonInc = $('<div>', {
            class: 'button inc small',
            text: '+'
        }).appendTo(nClusterDiv);
        buttonInc.click(function (event) {
            clustering.nClusters++;
            nClusterSpan.text(clustering.nClusters);
        });
        var checkboxDiv = $('<div>', {
            class: 'clustering_criteria'
        }).appendTo(clusteringControls);
        $('<input>', {
            id: 'keywords_checkbox',
            type: 'checkbox',
            checked: ''
        }).appendTo(checkboxDiv);
        $('<span>', {
            text: 'keywords'
        }).appendTo(checkboxDiv);
        $('<input>', {
            id: 'author_checkbox',
            type: 'checkbox'
        }).appendTo(checkboxDiv);
        $('<span>', {
            text: 'authors'
        }).appendTo(checkboxDiv);
        var createClusteringButton = $('<div>', {
            id: 'create_clustering',
            class: 'button tooltip',
            title: 'create a new clustering to automatically group publications',
            text: 'create clustering'
        }).appendTo(clusteringControls);
        createClusteringButton.click(function () {
            clustering.createClustering();
            page.update();
        });
    }

    function initResult() {
        var resultHeaderDiv = $('<div>', {
            id: 'result_header'
        }).appendTo('#result');
        $('<div>', {
            id: 'stats'
        }).appendTo(resultHeaderDiv);
        $('<div>', {
            id: 'sorting_description',
            text: 'sorted by selector agreement and publication key'
        }).appendTo(resultHeaderDiv);
        $('<div>', {
            id: 'result_body',
            class: 'ui-layout-content'
        }).appendTo('#result');
    }

    function initFooter() {
        var footer = $('#footer');
        var menuDiv = ($('<div id="menu">'));
        if (!electron) {
            menuDiv.append($('<div id="export_bibtex" class="button tooltip" title="download selected publications as a BibTeX file"><span class="symbol">B</span>download BibTeX</div>'));
        }
        if (editable) {
            if (electron) {
                menuDiv.append($('<div id="save_file" class="button tooltip" title="save changes in current file [ctrl + s]"><span class="symbol">D</span>save</div>'));
                menuDiv.append($('<div id="export_bibtex" class="button tooltip" title="export in new file (restricted to filtered entries)"><span class="symbol">B</span>export</div>'));
            } else {
                menuDiv.append($('<div id="save" class="button tooltip" title="save literature collection to the local storage of your browser"><span class="symbol">D</span>save to local storage</div>'));
                menuDiv.append($('<a href="index.html?loadFromLocalStorage=true"><div id="load_local" class="button tooltip" title="load literature collection from the local storage of your browser"><span class="symbol">R</span>load from local storage</div></a>'));
                menuDiv.append($('<a href="index.html"><div id="load_default" class="button tooltip" title="load the original literature collection from the server"><span class="symbol">R</span>load default</div></a>'))
            }
            menuDiv.append($('<div id="add_entry" class="button tooltip" title="add a new publication to collection"><span class="symbol">+</span>add entries</div>'));
            menuDiv.append($('<div id="rename_keyword" class="button tooltip" title="rename a keyword for all entries"><span class="symbol">V</span>rename keyword</div>'));
        }
        if (extraPages) {
            var extraPagesDiv = ($('<div id="extra_pages_list">')).appendTo(footer);
            $.each(extraPages, function (pageName, pageSrc) {
                var extraPageDiv = $('<div>', {
                    class: 'button',
                    text: pageName
                }).appendTo(extraPagesDiv);
                extraPageDiv.click(function () {
                    openExtraPage(pageName, pageSrc);
                });
            });
        }
        footer.append(menuDiv);
    }

    function addActions() {
        $(document).keyup(function (e) {
            // esc
            if (e.keyCode == 27) {
                selectors.resetSelectors();
            }
        });

        //http://stackoverflow.com/questions/93695/best-cross-browser-method-to-capture-ctrls-with-jquery
        $(document).keydown(function (e) {
            if ((e.which == '115' || e.which == '83') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (electron) {
                    bib.saveBibToFile();
                } else {
                    bib.saveBibToLocalStorage();
                }
                return false;
            }
            return true;
        });

        $('#clear_selectors').click(function () {
            selectors.resetSelectors();
        });

        $('#search').submit(function () {
            submitSearch();
            return false;
        });

        $('#search_button').click(function () {
            submitSearch();
        });

        $('#export_bibtex').click(function () {
            bib.downloadBibtex();
        });

        $('#add_entry').click(function () {
            bib.addEntries();
        });

        $('#save').click(function () {
            bib.saveBibToLocalStorage();
        });

        $('#rename_keyword').click(function () {
            bib.renameKeyword();
        });

        $('#save_file').click(function () {
            bib.saveBibToFile();
        });
    }

    function submitSearch() {
        var searchInput = $('#search').find('input');
        var searchString = searchInput.val();
        if (searchString) {
            selectors.toggleSelector('search', searchString);
            searchInput.val('');
        }
    };

    /*function applyLayout() {
        var layout = $('body').layout({
            applyDefaultStyles: true,
            north: {
                closable: false
            },
            south: {
                closable: false,
                resizable: false
            },
            west: {
                onresize: function () {
                    if (page.updateTimelineLayout) {
                        page.updateTimelineLayout();
                    }
                }
            }
        });
        layout.allowOverflow('north');
        layout.sizePane('west', $(window).width() * 0.44);

        layout.sizePane('south', 42);

        page.adaptHeaderSize = function () {
            var height = $('#selectors_container').height() + (electron ? 20 : 70);
            layout.sizePane('north', height);
        }
    }*/

    function openExtraPage(pageName, pageSrc) {
        $('#extra_page').remove();
        var extraPage = $('<div>', {
            id: 'extra_page'
        }).appendTo($('body'));
        extraPage.attr('title', pageName);
        extraPage.append($('<iframe width="800" height="600">').attr('src', pageSrc)).dialog({
            minWidth: 832,
            modal: true
        });
    }

})();