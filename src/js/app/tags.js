/**
 * Creates and updates all tag clouds
 */
define(['jquery', 'app/util', 'app/selectors', 'app/bib'], function ($, util, selectors, bib) {

    var tagIDCache = {};

    return {

        /**
         * Updates all tag clouds
         */
        updateTagClouds: function () {
            var tags = this;
            bib.keywordFrequencies = {};
            $('#tag_clouds').find('.tags-container').empty();
            $.each(tagCloudOptions, function () {
                updateTagCloud(this);
            });
        }

    };

    function updateTagCloud(options) {
        parseEntries(options);
        var tagCloudID = 'tag_cloud_' + options.field;
        var tagCloudDiv = $('#' + tagCloudID);
        if (tagCloudDiv.length == 0) {
            tagCloudDiv = initTagCloudDiv(options);
        }
        var containerDiv = tagCloudDiv.find('.tags-container');
        var tagFrequency = {};
        var tagFrequencySelector = {};
        $.each(bib.filteredEntries, function (id, field) {
            var parsedTags = bib.parsedEntries[id][options.field];
            $.each(parsedTags, function (j, tag) {
                var tagID = getTagID(tag, options.field);
                if (tagFrequency[tagID]) {
                    tagFrequency[tagID] += 1;
                } else {
                    tagFrequency[tagID] = 1;
                }
            });
        });
        $.each(bib.filteredEntries, function (id, field) {
            var parsedTags = bib.parsedEntries[id][options.field];
            $.each(parsedTags, function (j, tag) {
                var tagID = getTagID(tag, options.field);
                if (!tagFrequencySelector[tagID]) {
                    tagFrequencySelector[tagID] = [];
                }
                $.each(selectors.getSelectors(), function (i, selector) {
                    if (selector && !selector['lock']) {
                        if (!tagFrequencySelector[tagID][i]) {
                            tagFrequencySelector[tagID][i] = 0;
                        }
                        tagFrequencySelector[tagID][i] += bib.entrySelectorSimilarities[id][i] / tagFrequency[tagID];
                    }
                });
            });
        });
        var usedCategoryTags = [];
        if (options.field === 'keywords') {
            $.each(bib.tagCategories, function (categoryName, category) {
                var tagDivsCategory = [];
                $.each(tagFrequency, function (tagID, frequency) {
                    var tag = getTag(tagID, options.field);
                    if (tag.lastIndexOf((categoryName + ":"), 0) == 0) {
                        if (tag.indexOf('?') < 0) {
                            bib.keywordFrequencies[tag] = frequency;
                        }
                        var tagDiv = createTag(tag, options, frequency, tagFrequencySelector);
                        if (tagDiv) {
                            tagDivsCategory.push(tagDiv);
                        }
                        usedCategoryTags.push(tagID);
                    }
                });
                appendTagDivs(categoryName, category['description'], tagDivsCategory, containerDiv);
            });
        }
        var tagDivs = [];
        $.each(tagFrequency, function (tagID, frequency) {
            var tag = getTag(tagID, options.field);
            if (usedCategoryTags.indexOf(tagID) < 0) {
                if (options.field === 'keywords') {
                    bib.keywordFrequencies[tagID] = frequency;
                }
                var tagDiv = createTag(tag, options, frequency, tagFrequencySelector);
                if (tagDiv) {
                    tagDivs.push(tagDiv);
                }
            }
        });
        appendTagDivs(options.field === 'keywords' ? 'other' : '', 'unclassified tags', tagDivs, containerDiv);
        filterTags(tagCloudDiv);
    }

    function parseEntries(options) {
        if (!bib.parsedEntries) {
            bib.parsedEntries = {};
        }
        $.each(bib.entries, function (id, entry) {
            if (!bib.parsedEntries[id]) {
                bib.parsedEntries[id] = {};
            }
            bib.parsedEntries[id][options.field] = util.parseField(entry[options.field], options.field, bib.tagCategories);
        });
    }

    function createTag(tag, options, frequency, tagFrequencySelector) {
        var tagID = getTagID(tag, options.field);
        if (frequency < options.minTagFrequency) {
            return;
        }
        var frequencyClass = util.getFrequencyClass(frequency);
        var tagDiv = $('<div>', {
            class: 'tag ' + frequencyClass,
            value: frequency
        });
        $('<span>', {
            class: 'text',
            html: util.latexToHtml(tag.substring(tag.indexOf(":") + 1))
        }).appendTo(tagDiv);
        var sparklineDiv = $('<div>', {
            class: 'vis sparkline'
        }).prependTo(tagDiv);
        selectors.vis(sparklineDiv, tagFrequencySelector[tagID]);
        var activeTags = selectors.getActiveTags(options.field);
        if (activeTags[tagID]) {
            tagDiv.addClass("active");
            if (activeTags[tagID] === 'inverted') {
                tagDiv.addClass('inverted');
            }
        }
        $("<span>", {
            class: "tag_frequency",
            text: frequency
        }).appendTo(tagDiv);
        tagDiv.click(function (event) {
            window.toggleSelector(options.field, getTagID(tag, options.field), event);
        });
        if (bib.authorizedTags[tag] || options.field != 'keywords') {
            tagDiv.addClass('authorized');
        }
        tagDiv.mouseover(function () {
            if (!tagDiv.hasClass('tooltipstered')) {
                var tooltipDiv = $('<div>');
                $('<h3><span class="label">' + options.field + ': </span>' + util.latexToHtml(tag) + '</h3>').appendTo(tooltipDiv);
                $('<div><span class="label"># publications: </span>' + frequency + '</div>').appendTo(tooltipDiv);
                if (bib.authorizedTags[tag] || options.field != 'keywords') {
                    if (bib.authorizedTags[tag]) {
                        $('<div><span class="label">description: </span>' + bib.authorizedTags[tag]['description'] + '</div>').appendTo(tooltipDiv);
                    }
                }
                var totalSimilarity = selectors.computeTotalSimilarity(tagFrequencySelector[tag]);
                if (selectors.getNActiveSelectors() > 0) {
                    $('<div><span class="label">selector agreement: </span>' + totalSimilarity.toFixed(2) + '</div>').appendTo(tooltipDiv);
                    if (totalSimilarity > 0) {
                        var visDiv = $('<div>', {
                            class: 'vis'
                        }).appendTo(tooltipDiv);
                        selectors.vis(visDiv, tagFrequencySelector[tag]);
                    }
                }
                tagDiv.tooltipster({
                    content: $(tooltipDiv),
                    theme: 'tooltipster-survis'
                });
                tagDiv.tooltipster('show');
            }
        });
        return tagDiv;
    }

    function appendTagDivs(name, title, tagDivs, element) {
        tagDivs = tagDivs.sort(function (a, b) {
            var nA = parseInt(a.attr('value'));
            var nB = parseInt(b.attr('value'));
            if (nA < nB)
                return 1;
            else if (nA > nB)
                return -1;
            return 0;
        });
        var categoryDiv = $('<div>', {
            class: 'tag_category'
        }).appendTo(element);
        if (name) {
            var labelDiv = $('<span>', {
                class: 'label tooltip',
                title: title,
                text: name + ": "
            }).appendTo(categoryDiv);
            labelDiv.tooltipster({
                theme: 'tooltipster-survis'
            });
        }
        $.each(tagDivs, function (i, tag) {
            tag.appendTo(categoryDiv);
        });
    }

    function initTagCloudDiv(options) {
        var id = 'tag_cloud_' + options.field;
        var tagCloudDiv = $(id);
        if (tagCloudDiv.length == 0) {
            tagCloudDiv = $('<div>', {
                class: 'tag_cloud',
                id: id
            });
            $('#tag_clouds').append(tagCloudDiv);
        }
        tagCloudDiv.empty();
        var tagOccurrenceDiv = $('<div>', {
            class: 'tag_occurrence toggle-container',
            text: 'min'
        }).appendTo(tagCloudDiv);
        var frequencySpan = $('<span>', {
            text: Math.max(1, options.minTagFrequency)
        });
        var buttonDec = $('<div>', {
            class: 'button dec small',
            text: '-'
        }).appendTo(tagOccurrenceDiv);
        buttonDec.click(function (event) {
            if (options.minTagFrequency > 1) {
                options.minTagFrequency--;
                frequencySpan.text(options.minTagFrequency);
                window.updateTags();
            }
        });
        if (options.minTagFrequency < 1) {
            options.minTagFrequency = 1
        }
        frequencySpan.appendTo(tagOccurrenceDiv);
        var buttonInc = $('<div>', {
            class: 'button inc small',
            text: '+'
        }).appendTo(tagOccurrenceDiv);
        buttonInc.click(function (event) {
            options.minTagFrequency++;
            frequencySpan.text(options.minTagFrequency);
            window.updateTags();
        });

        var tagCloudFilterForm = $('<form>', {
            class: 'tag_cloud_filter toggle-container'
        }).appendTo(tagCloudDiv);
        var tagCloudFilterInput = $('<input type="search" placeholder="filter ..."/>').appendTo(tagCloudFilterForm);

        tagCloudFilterInput.on('input', function () {
            filterTags(tagCloudDiv);
        });
        tagCloudFilterForm.submit(function () {
            return false;
        });

        var h2Div = $('<h2><span class="symbol">/</span>' + options.title + '</h2>').appendTo(tagCloudDiv);
        h2Div.click(function () {
            util.toggleControl(h2Div);
        });

        tagCloudDiv.append($('<div>', {
            class: 'tags-container toggle-container'
        }));

        return tagCloudDiv;
    }

    function filterTags(tagCloudDiv) {
        var filterText = tagCloudDiv.find('.tag_cloud_filter input').val().toLowerCase();
        tagCloudDiv.find('.tag').each(function (i, tagDiv) {
            tagDiv = $(tagDiv);
            var textSpan = $(tagDiv).find('.text');
            if ($(textSpan).text().toLowerCase().indexOf(filterText) == -1) {
                tagDiv.hide();
            } else {
                tagDiv.show();
            }
        })
    }

    /**
     * Transforms a tag into an ID
     */
    function getTagID(tag, field) {
        if (field === 'keywords') {
            return tag;
        }
        var tagID = util.simplifyTag(tag);
        tagIDCache[tagID] = tag;
        return tagID;
    }

    /**
     * Looks up the tag for a tag ID
     */
    function getTag(tagID, field) {
        if (field === 'keywords') {
            return tagID;
        }
        return tagIDCache[tagID];
    }

})
;



