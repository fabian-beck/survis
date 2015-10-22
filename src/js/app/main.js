define(function (require) {
    
    window.surVisVersion = '0.1.0';

    var $ = require('jquery');

    var bib = require('app/bib');
    var selectors = require('app/selectors');
    var stats = require('app/stats');
    var timeline = require('app/timeline');
    var tags = require('app/tags');
    var cluster = require('app/cluster');
    var entryLayout = require('app/entry_layout');

    var references = require('app/references');
    
    //Import citations from reference list (warning: experimental feature)
    //bib.referenceLists = require('data/generated/reference_lists').referenceLists;
    //references.readReferences();


    window.update = function (scrollToTop) {
        $('.tooltipstered').tooltipster('hide');
        selectors.updateSelectors();
        references.updateReferences();
        stats.updateStats();
        tags.updateTagClouds();
        cluster.updateClusters();
        entryLayout.updateEntryList();
        timeline.updateTimeline();
        if (scrollToTop) {
            $('#result_body').scrollTop(0);
        }
        window.adaptHeaderSize();
    };

    window.updateShowAll = function () {
        bib.nVisibleEntries = 999999999;
        window.update(false);
    };

    window.updateShowMore = function () {
        bib.nVisibleEntries += 20;
        window.update(false);
    };

    window.updateShowPart = function () {
        bib.nVisibleEntries = 20;
        window.update(true);
    };

    window.updateTags = function () {
        tags.updateTagClouds();
    };

    window.updateTimeline = function () {
        timeline.updateTimeline();
    };

    window.updateTimelineLayout = function () {
        timeline.updateTimeline(true);
    };

    window.toggleSelector = function (type, text, event) {
        selectors.toggleSelector(type, text, event)
    };

    window.resetSelectors = function () {
        selectors.selectors = {};
        window.updateShowPart();
    };

    window.submitSearch = function () {
        var searchInput = $('#search').find('input');
        var searchString = searchInput.val();
        if (searchString) {
            window.toggleSelector('search', searchString);
            searchInput.val('');
        }
    };

    $(window).resize(function () {
        if (window.adaptHeaderSize) {
            window.adaptHeaderSize();
        }
    });

    $(document).ready(function () {
        require('app/init_page').init();
        window.update(true);
        selectors.readQueryFromUrl();
    });

});
