const references = (function() {

    var minSimilarity = 0.8;
    var minReferenceLength = 20;
    var fields = ['author', 'title', 'booktitle', 'publisher', 'pages', 'year', 'doi', 'location', 'address', 'editors', 'series', 'journal', 'institution', 'volume', 'number'];

    var tokenEntryCache = {};

    return {

        readReferences: function () {
            var referenceLists = bib.referenceLists;
            console.log(referenceLists);
            $.each(referenceLists, function (id, references) {
                $.each(references, function (i, reference) {
                    if (reference.length > minReferenceLength) {
                        var tokenizedReferences = tokenizeSearchString(reference);
                        var max = 0;
                        var maxId = '';
                        var candidateCount = 0;
                        $.each(bib.entries, function (id2, entry) {
                            if (id2 != id) {
                                var similarity = computeSearchSimilarity(id2, entry, tokenizedReferences);
                                if (similarity > minSimilarity) {
                                    candidateCount++;
                                }
                                if (similarity > max) {
                                    max = similarity;
                                    maxId = id2;
                                }
                            }
                        });
                        if (max > minSimilarity && candidateCount == 1) {
                            if (!bib.entries[id].references) {
                                bib.entries[id].references = '';
                            }
                            if (bib.entries[id].references.split(' ').indexOf(maxId) == -1) {
                                bib.entries[id].references += ' ' + maxId;
                                bib.entries[id].references = bib.entries[id].references.trim();
                                console.log(id + ': ' + maxId + ' ' + max + ' ' + reference);
                            }
                        }
                    }
                });
            });
        },

        updateReferences: function () {
            if (!citations) {
                return;
            }
            bib.references = {};
            $.each(bib.entries, function (id, entry) {
                var referencesOutgoing = parseReferences(entry['references']);
                referencesOutgoing = (referencesOutgoing ? referencesOutgoing.filter(onlyUnique) : null);
                if (!bib.references[id]) {
                    bib.references[id] = {};
                }
                bib.references[id].referencesOutgoing = referencesOutgoing;
                if (referencesOutgoing) {
                    $.each(referencesOutgoing, function (i, id2) {
                        if (!bib.references[id2]) {
                            bib.references[id2] = {};
                        }
                        if (!bib.references[id2].referencesIncoming) {
                            bib.references[id2].referencesIncoming = [];
                        }
                        bib.references[id2].referencesIncoming.push(id);
                    });
                }
            });
            bib.filteredReferences = {};
            $.each(bib.filteredEntries, function (id, entry) {
                bib.filteredReferences[id] = {};
                if (bib.references[id].referencesOutgoing) {
                    bib.filteredReferences[id].referencesOutgoing = [];
                    $.each(bib.references[id].referencesOutgoing, function (i, id2) {
                        var passedFilter = Object.keys(bib.filteredEntries).indexOf(id2) >= 0;
                        if (passedFilter) {
                            bib.filteredReferences[id].referencesOutgoing.push(id2);
                        }
                    });
                }
                if (bib.references[id].referencesIncoming) {
                    bib.filteredReferences[id].referencesIncoming = [];
                    $.each(bib.references[id].referencesIncoming, function (i, id2) {
                        var passedFilter = Object.keys(bib.filteredEntries).indexOf(id2) >= 0;
                        if (passedFilter) {
                            bib.filteredReferences[id].referencesIncoming.push(id2);
                        }
                    });
                }
            });
        }
    };


    function computeSearchSimilarity(id, entry, tokens) {
        if (!tokenEntryCache[id]) {
            tokenEntryCache[id] = {};
        }
        var matchCount = 0;
        $.each(tokens, function (i, token) {
            var containedInValues = false;
            if (tokenEntryCache[id][token] != undefined) {
                containedInValues = tokenEntryCache[id][token];
            } else {
                $.each(fields, function (j, field) {
                    if (entry[field]) {
                        if (entry[field].toLowerCase().indexOf(token) >= 0) {
                            containedInValues = true;
                        }
                    }
                });
                containedInValues = id.toLowerCase().indexOf(token) >= 0 || containedInValues;
                tokenEntryCache[id][token] = containedInValues;
            }
            matchCount += containedInValues ? 1 : 0;
        });
        return matchCount / tokens.length;
    }

    function tokenizeSearchString(text) {
        text = text.toLowerCase();
        var re = /\W+/;
        var words = text.split(re);
        words = $.grep(words, function (word) {
            return word.length > 1 && !($.inArray(word, bib.stopwords) >= 0);
        });
        return words;
    }

    function parseReferences(refString) {
        if (!refString) {
            return null;
        }
        return refString.split(' ');
    }

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

})();