const selectors = (function() {

    var tokenSearchSimilarityCache = {};

    var typeSymbols = {
        search: 's',
        keywords: 'J',
        year: '}',
        author: 'f',
        entity: 'K',
        warning: '!',
        series: 'w',
        cluster: 'W',
        citations_incoming: 'o',
        citations_outgoing: 'o'
    };

    return {

        selectors: {},

        nSelectors: 6,

        updateSelectors: function () {
            $('.selector').remove();
            var selectors = this;
            var clearButton = $('#clear_selectors');
            for (var i = 0; i < this.nSelectors; i++) {
                var selectorDiv = $('<div></div>', {
                    class: 'selector selector' + i,
                    id: 'selector' + i
                }).insertBefore(clearButton);
                var selector = selectors.getSelectors()[i];
                if (selector) {
                    var invertedClass = (selector['inverted'] ? ' inverted' : '');
                    selectorDiv.addClass(invertedClass);
                    var lockedClass = (selector['lock'] ? ' locked' : '');
                    selectorDiv.addClass(lockedClass);
                    var text = '';
                    text = latexUtil.latexToHtml(selector['text']);
                    if (selector.type == 'citations_incoming') {
                        text = 'citing ' + text;
                    } else if (selector.type == 'citations_outgoing') {
                        text = 'cited by ' + text;
                    }
                    $('<span>', {
                        class: 'selector_type symbol',
                        text: typeSymbols[selector['type']]
                    }).appendTo(selectorDiv);
                    var contentDiv = $('<div>', {
                        class: 'selector_content'
                    }).appendTo(selectorDiv);
                    $('<div>', {
                        class: 'text',
                        html: text
                    }).appendTo(contentDiv);
                    $('<div>', {
                        class: 'tooltip invert' + invertedClass,
                        title: 'invert: identify non-matched entries'
                    }).appendTo(contentDiv);
                    $('<div>', {
                        class: 'tooltip lock' + lockedClass,
                        title: 'lock: apply as a filter to restrict the collection to matched entries'
                    }).appendTo(contentDiv);
                    $('<div>', {
                        class: 'tooltip remove',
                        title: 'remove: discard the selector'
                    }).appendTo(contentDiv);
                } else {
                    $('<div>', {
                        class: 'selector_type'
                    }).appendTo(selectorDiv);
                }
            }
            $('.selector .invert').click(function () {
                var i = parseInt($(this).parent().parent().attr('id').substring(8));
                selectors.getSelectors()[i]['inverted'] = !selectors.getSelectors()[i]['inverted'];
                $(this).toggleClass('inverted');
                page.updateShowPart();
            });
            $('.selector .lock').click(function () {
                var i = parseInt($(this).parent().parent().attr('id').substring(8));
                selectors.getSelectors()[i]['lock'] = !selectors.getSelectors()[i]['lock'];
                $(this).toggleClass('locked');
                page.updateShowPart();
            });
            $('.selector .remove').click(function (event) {
                var i = parseInt($(this).parent().parent().attr('id').substring(8));
                selectors.getSelectors()[i] = null;
                page.updateShowPart();
            });
            this.computeEntrySelectorSimilarities();
            this.applyFilter();
            page.generateTooltips($('#selectors_container').find('.selector'));
        },

        readQueryFromUrl: function () {
            var query = browserUtil.getUrlParameter('q');
            if (query) {
                toggleSelector('search', query);
            }
        },

        getNActiveSelectors: function () {
            var count = 0;
            for (var i = 0; i < this.nSelectors; i++) {
                if (this.selectors[i] && !this.selectors[i]['lock']) {
                    count++;
                }
            }
            return count;
        },

        getSelectors: function () {
            return this.selectors;
        },

        getSelectorsOfType: function (type) {
            var filteredSelectors = [];
            for (var i = 0; i < this.nSelectors; i++) {
                if (this.selectors[i] && this.selectors[i]['type'] == type) {
                    filteredSelectors.push(this.selectors[i]);
                }
            }
            return filteredSelectors;
        },

        getTotalSimilarity: function (bib, id) {
            var similaritySum = 0.0;
            var count = 0.0;
            $.each(this.selectors, function (i, selector) {
                if (selector && !selector['lock']) {
                    similaritySum += bib.entrySelectorSimilarities[id][i];
                    count++;
                }
            });
            if (count > 0) {
                return similaritySum / count;
            }
            return 0;
        },

        resetSelectors: function () {
            selectors.selectors = {};
            page.updateShowPart();
        },

        toggleSelector: function (type, text, event) {
            if (!typeSymbols[type]) {
                type = 'search';
            }
            for (var i = 0; i < this.nSelectors; i++) {
                if (this.selectors[i] && this.selectors[i]['type'] == type && this.selectors[i]['text'] == text) {
                    this.selectors[i] = null;
                    page.updateShowPart();
                    return;
                }
            }
            var selector = this.nextFreeSelector();
            if (!selector) {
                page.notify('The maximum number of selectors that can be active at the same time is ' + this.nSelectors + '. Please close at least one selector before activating another.', 'error');
                return;
            }
            selector['type'] = type;
            selector['text'] = text;
            selector['inverted'] = false;
            selector['lock'] = event && event.ctrlKey;
            selector['count'] = 0;
            page.updateShowPart();
        },

        nextFreeSelector: function () {
            for (var i = 0; i < this.nSelectors; i++) {
                if (!this.selectors[i]) {
                    this.selectors[i] = {};
                    return this.selectors[i];
                }
            }
            return null;
        },

        computeEntrySelectorSimilarities: function () {
            var selectors = this;
            bib.entrySelectorSimilarities = {};
            $.each(bib.entries, function (id, entry) {
                bib.entrySelectorSimilarities[id] = {};
                $.each(selectors.getSelectors(), function (i, selector) {
                    if (selector) {
                        var text = selector['text'] === '?' ? '' : selector['text'];
                        var similarity = 0;
                        if (selector['type'] == 'search') {
                            if (!selector['tokenized_text']) {
                                selector['tokenized_text'] = tokenizeSearchString(text);
                            }
                            similarity = computeSearchSimilarity(id, entry, selector['tokenized_text']);
                        } else if (selector['type'] == 'keywords') {
                            similarity = computeTagSimilarity(bib, id, text);
                        } else if (selector['type'] == 'year') {
                            similarity = computeYearSimilarity(entry, text);
                        } else if (selector['type'] == 'author') {
                            similarity = computeAuthorSimilarity(id, text);
                        } else if (selector['type'] == 'entity') {
                            if (!selector['tokenized_text']) {
                                var searchEntry = bib.entries[text];
                                var searchText = searchEntry['title'];
                                searchText += searchEntry['abstract'] ? searchEntry['abstract'] : '';
                                searchText += searchEntry['keywords'] ? searchEntry['keywords'] : '';
                                searchText += searchEntry['authors'] ? searchEntry['authors'] : '';
                                selector['tokenized_text'] = tokenizeSearchString(searchText);
                            }
                            similarity = computeSearchSimilarity(id, entry, selector['tokenized_text']);
                        } else if (selector['type'] == 'warning') {
                            similarity = computeWarningSimilarity(entry, id, text)
                        } else if (selector['type'] == 'series') {
                            similarity = computeSeriesSimilarity(entry, text);
                        } else if (selector['type'] == 'cluster') {
                            similarity = computeClusterSimilarity(bib, id, text);
                        } else if (selector['type'] == 'citations_incoming') {
                            similarity = computeCitationIncomingSimilarity(entry, id, selector['text']);
                        } else if (selector['type'] == 'citations_outgoing') {
                            similarity = computeCitationOutgoingSimilarity(entry, id, selector['text']);
                        }
                        if (selector['inverted']) {
                            similarity = 1 - similarity;
                        }
                        bib.entrySelectorSimilarities[id][i] = similarity;
                    }
                });
            });
            bib.sortedIDs = Object.keys(bib.entries).sort(function (a, b) {
                var lowerA = a.toLowerCase();
                var lowerB = b.toLowerCase();
                var similarityA = selectors.getTotalSimilarity(bib, a);
                var similarityB = selectors.getTotalSimilarity(bib, b);
                if (similarityA > similarityB)
                    return -1;
                if (similarityA < similarityB)
                    return 1;
                if (lowerA < lowerB)
                    return -1;
                if (lowerA > lowerB)
                    return 1;
                return 0;
            });
        },

        applyFilter: function () {
            var selectors = this;
            bib.filteredEntries = {};
            $.each(bib.sortedIDs, function (i, id) {
                if (!selectors.filteredOut(id)) {
                    bib.filteredEntries[id] = bib.entries[id];
                }
            });
            bib.nEntries = Object.keys(bib.filteredEntries).length;
        },

        filteredOut: function (id) {
            var filteredOut = false;
            $.each(this.getSelectors(), function (i, selector) {
                if (selector) {
                    if (selector['lock'] && bib.entrySelectorSimilarities[id][i] <= 0) {
                        filteredOut = true;
                    }
                }
            });
            return filteredOut;
        },

        vis: function (elem, similarities) {
            var selectors = this;
            var sparkline = elem.hasClass('sparkline');
            var count = 0;
            if (!similarities) {
                return;
            }
            var container = $('<div>', {
                class: 'container'
            });
            var height = sparkline ? 14 : 140;
            $.each(similarities, function (i, similarity) {
                if (selectors.getSelectors()[i] && !selectors.getSelectors()[i]['lock']) {
                    var selectorDiv = $('<div>', {
                        class: 'selector'
                    }).appendTo(container);
                    var labelText = selectors.getSelectors()[i].text;
                    if (labelText.length > 20) {
                        labelText = labelText.substring(0, 15) + '...';
                    }
                    if (!sparkline) {
                        $('<div>', {
                            class: 'label',
                            text: labelText
                        }).appendTo(selectorDiv);
                        var iconDiv = $('<div>', {
                            class: 'selector_icon selector' + i
                        }).appendTo(selectorDiv);
                        $('<div>', {
                            class: 'symbol',
                            text: typeSymbols[selectors.getSelectors()[i].type]
                        }).appendTo(iconDiv);
                        $('<div>', {
                            class: 'value',
                            text: similarity.toFixed(2)
                        }).appendTo(selectorDiv)
                    }
                    var barDiv = $('<div>', {
                        class: 'bar selector' + i
                    }).appendTo(selectorDiv);
                    if (similarity > 0) {
                        barDiv.css('height', Math.round(height * similarity + 0.49) + 'px');
                        count++;
                    }
                }

            });
            if (count >= 1) {
                container.appendTo(elem);
                if (!sparkline) {
                    elem.height(195);
                }
            }
        },

        computeTotalSimilarity: function (similarities) {
            if (!similarities) {
                return 0.0;
            }
            var totalSimilarity = 0.0;
            var count = 0;
            $.each(this.getSelectors(), function (i, selector) {
                if (selector && !selector['lock']) {
                    totalSimilarity += similarities[i];
                    count++;
                }
            });
            if (count == 0) {
                return 0.0;
            }
            totalSimilarity = totalSimilarity / count;
            return totalSimilarity;
        },

        getActiveTags: function (field) {
            var activeTags = {};
            $.each(this.getSelectorsOfType(field), function (i, selector) {
                activeTags[selector['text']] = selector['inverted'] ? 'inverted' : 'normal';
            });
            return activeTags;
        }

    };


    function tokenizeSearchString(text) {
        text = text.toLowerCase();
        var re = /(\W|_)+/;
        var words = text.split(re);
        words = $.grep(words, function (word) {
            return word.length > 1 && !($.inArray(word, bib.stopwords) >= 0);
        });
        return words;
    }

    function computeSearchSimilarity(id, entry, tokens) {
        if (!tokenSearchSimilarityCache[id]) {
            tokenSearchSimilarityCache[id] = {};
        }
        var matchCount = 0;
        $.each(tokens, function (i, token) {
            var containedInValues = false;
            var wordStartsWithToken = false;
            var matchInImportantFields = false;
            if (tokenSearchSimilarityCache[id][token] != undefined) {
                matchCount += tokenSearchSimilarityCache[id][token];
            } else {
                var similarity = 0;
                if (id.toLowerCase().indexOf(token) >= 0) {
                    similarity = 1;
                } else {
                    $.each(entry, function (key, value) {
                        if (key != 'references' && key != 'referencedby') {
                            var index = value.toLowerCase().indexOf(token);
                            if (index >= 0) {
                                containedInValues = true;
                                if (key == 'title' || key == 'author' || key == 'keywords') {
                                    matchInImportantFields = true;
                                }
                                if (index == 0 || value[index - 1].match(/\W/i)) {
                                    wordStartsWithToken = true;
                                }
                            }
                        }
                    });
                    var matchFactor = matchInImportantFields ? 2 : 1;
                    similarity = containedInValues ? 0.25 * matchFactor : 0;
                    similarity += wordStartsWithToken ? 0.25 * matchFactor : 0;
                }
                matchCount += similarity;
                tokenSearchSimilarityCache[id][token] = similarity;
            }
        });
        return matchCount / tokens.length;
    }

    function computeTagSimilarity(bib, id, text) {
        if (!bib.parsedEntries[id]) {
            return 0.0;
        }
        var tags = bib.parsedEntries[id]['keywords'];
        if (tags.indexOf(text) >= 0) {
            return 1.0;
        }
        return 0.0;
    }

    function computeYearSimilarity(entry, text) {
        if (entry["year"] == text) {
            return 1.0;
        }
        return 0.0;
    }

    function computeAuthorSimilarity(id, text) {
        if (!bib.entries[id]['author']) {
            return 0.0;
        }
        text = tagUtil.simplifyTag(text);
        var similarity = 0.0;
        $.each(bib.parsedEntries[id]['author'], function (i, author) {
            if (text === tagUtil.simplifyTag(author)) {
                similarity = 1.0;
                return;
            }
        });
        return similarity;
    }

    function computeClusterSimilarity(bib, id, text) {
        var clusters = bib.clusterAssignment[id];
        if ($.inArray(text, clusters) > -1) {
            return 1.0;
        }
        return 0.0;
    }


    function computeCitationIncomingSimilarity(entry, id, text) {
        if (bib.references[id] &&
            bib.references[id].referencesOutgoing &&
            bib.references[id].referencesOutgoing.indexOf(text) >= 0) {
            return 1.0;
        }
        return 0.0;
    }

    function computeCitationOutgoingSimilarity(entry, id, text) {
        if (bib.references[id] &&
            bib.references[id].referencesIncoming &&
            bib.references[id].referencesIncoming.indexOf(text) >= 0) {
            return 1.0;
        }
        return 0.0;
    }

    function computeWarningSimilarity(entry, id, text) {
        var warnings = bib.warnings[id] ? bib.warnings[id] : [];
        if (!warnings) {
            return 0.0;
        }
        var similarity = 0.0;
        if (text) {
            $.each(warnings, function () {
                var warningText = this;
                if (warningText['type']) {
                    warningText = warningText['type'];
                }
                if (latexUtil.latexToHtml(warningText) === latexUtil.latexToHtml(text)) {
                    similarity = 1.0;
                }
            })
        } else {
            similarity = 1.0 - 1.0 / warnings.length;
        }
        return similarity;
    }

    function computeSeriesSimilarity(entry, text) {
        var series = entry["series"] ? entry["series"] : '';
        if (tagUtil.simplifyTag(series) === tagUtil.simplifyTag(text)) {
            return 1.0;
        }
        return 0.0;
    }

})();