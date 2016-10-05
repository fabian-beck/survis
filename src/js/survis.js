var warnings = (function () {

    return {

        expectedFields: {
            inproceedings: ['author', 'booktitle', 'pages', 'publisher', 'title', 'year'],
            article: ['author', 'journal', 'number', 'pages', 'title', 'volume', 'year'],
            techreport: ['author', 'institution', 'title', 'year'],
            incollection: ['author', 'booktitle', 'pages', 'publisher', 'title', 'year'],
            book: ['author', 'publisher', 'title', 'year'],
            inbook: ['author', 'booktitle', 'pages', 'publisher', 'title', 'year'],
            proceedings: ['editor', 'publisher', 'title', 'year'],
            phdthesis: ['author', 'school', 'title', 'year'],
            mastersthesis: ['author', 'school', 'title', 'year'],
            bachelorsthesis: ['author', 'school', 'title', 'year'],
            electronic: ['author', 'title', 'url', 'year'],
            misc: ['author', 'howpublished', 'title', 'year']
        },

        computeAllWarnings: function (entries) {
            var that = this;
            var warnings = {};
            $.each(entries, function (id, entry) {
                warnings[id] = that.computeWarnings(entry);
            });
            return warnings;
        },

        computeWarnings: function (entry) {
            var warningsList = [];
            if (editable) {
                warningsList = warningsList.concat(warnings.computeMissingFieldWarning(entry));
                warningsList = warningsList.concat(warnings.computeTitleCapitalizationWarning(entry));
                warningsList = warningsList.concat(warnings.computeProtectedIdentifierCapitalizationWarning(entry));
                $.each(entry, function (field, value) {
                    computeEmptyFieldWarning(warningsList, field, value);
                    computeFirstNameUnknown(warningsList, field, value);
                    computeWholeFieldCapitalizationProtected(warningsList, field, value);
                });
            }
            return warningsList;
        },

        computeMissingFieldWarning: function (entry) {
            var warningsList = [];
            if (entry) {
                var expected = warnings.expectedFields[entry['type']];
                if (expected) {
                    $.each(expected, function (i, field) {
                        if (!entry[field] && entry[field] != '') {
                            warningsList.push({
                                type: 'missing field "' + field + '"',
                                fix: {
                                    description: 'add field', 'function': function () {
                                        entry[field] = '';
                                        return entry;
                                    }
                                }
                            });
                        }
                    });
                }
            }
            return warningsList;
        },

        computeTitleCapitalizationWarning: function (entry) {
            if (!entry) {
                return [];
            }
            var warningsList = [];
            $.each(['booktitle', 'journal'], function (i, field) {
                if (entry[field]) {
                    var value = entry[field];
                    var capitalizationCorrect = true;
                    var correctedValue = '';
                    $.each(value.split(' '), function (i, word) {
                        var capitalizedWord = word;
                        if (!word.match(/\d.*/)) {
                            if ((word.length >= 5 || i == 0) && word.toLowerCase() == word) {
                                capitalizationCorrect = false;
                                capitalizedWord = word.charAt(0).toUpperCase() + word.substring(1);
                            }
                        }
                        correctedValue += (correctedValue ? ' ' : '') + capitalizedWord;
                    });
                    if (!capitalizationCorrect) {
                        warningsList.push({
                            type: 'capitalization in field "' + field + '"',
                            fix: {
                                description: 'capitalize longer words', 'function': function () {
                                    entry[field] = correctedValue;
                                    return entry;
                                }
                            }
                        });
                    }
                }
            });
            return warningsList;
        },

        computeProtectedIdentifierCapitalizationWarning: function (entry) {
            if (!entry) {
                return [];
            }
            var warningsList = [];
            $.each(['title'], function (i, field) {
                if (entry[field]) {
                    var value = entry[field];
                    var capitalizationCorrect = true;
                    var correctedValue = value;
                    if (value.indexOf('{') < 0) {
                        $.each(value.split(/[\s,:\-()\/]+/), function (i, word) {
                            if (!word.startsWith('{')) {
                                var subword = word.substring(1);
                                if (subword.length > 0 && subword.toLowerCase() != subword) {
                                    capitalizationCorrect = false;
                                    var re = new RegExp('\{?'+word+'\}?','g');
                                    correctedValue = correctedValue.replace(re, '{'+word+'}');
                                }
                            }
                        });
                        if (!capitalizationCorrect) {
                            // warningsList.push('non-protected capitalization of identifier in field "' + field + '"');
                            warningsList.push({
                                type: 'non-protected capitalization of identifier in field "' + field + '"',
                                fix: {
                                    description: 'protect identifiers', 'function': function () {
                                        entry[field] = correctedValue;
                                        return entry;
                                    }
                                }
                            });
                        }
                    }
                }
            });
            return warningsList;
        }

    };

    function computeEmptyFieldWarning(warningsList, field, value) {
        if (!value) {
            warningsList.push('empty field "' + field + '"');
        }
    }

    function computeFirstNameUnknown(warningsList, field, value) {
        if (field === 'author' || field === 'editor') {
            var firstNameKnown = true;
            $.each(value.split(' and '), function (i, name) {
                var parsedName = name.trim().split(',');
                if (parsedName.length > 1) {
                    var firstName = parsedName[1].trim().split(' ')[0].trim();
                    if (firstName.indexOf('.') > 0 || firstName.length < 2) {
                        firstNameKnown = false;
                    }
                } else {
                    firstNameKnown = false;
                }
            });
            if (!firstNameKnown) {
                warningsList.push('unknown or abbreviated first name in field "' + field + '"');
            }
        }
    }

    function computeWholeFieldCapitalizationProtected(warningsList, field, value) {
        if (value.indexOf('{') == 0 && value.lastIndexOf('}') == value.length - 1 && value.length > 10) {
            warningsList.push('whole field "' + field + '" with protected capitalization');
        }
    }


})
();