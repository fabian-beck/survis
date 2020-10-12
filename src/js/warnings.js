const warnings = (function () {

    const fieldCrossRefMap = {
        doi: function (result) { return result.DOI },
        journal: function (result) { return result['container-title'][0] },
        pages: function (result) { return result.page },
        title: function (result) { return result.title[0] }
    }

    return {

        expectedFields: {
            inproceedings: ['author', 'booktitle', 'pages', 'publisher', 'title', 'year', 'doi'],
            article: ['author', 'journal', 'number', 'pages', 'title', 'volume', 'year', 'doi'],
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
                    computeFirstNameUnknown(warningsList, field, value);
                    computeWholeFieldCapitalizationProtected(warningsList, field, value);
                });
            }
            return warningsList;
        },

        computeMissingFieldWarning: function (entry) {
            function condenseTitle(title) {
                return title.toLowerCase().replace(/\W+/g, '');
            }
            var warningsList = [];
            if (entry) {
                var expected = warnings.expectedFields[entry['type']];
                if (expected) {
                    $.each(expected, function (i, field) {
                        if (!entry[field] || entry[field].trim() === '') {
                            warningsList.push({
                                type: `missing or empty field '${field}'`,
                                fix: {
                                    description: 'try to load from CrossRef', 'function': function (onFix) {
                                        page.notify('Loading data from CrossRef...');
                                        const searchString = (entry.doi ? `/${entry.doi}` : `?query=${entry.title.replace(/\W+/g, '+')}`);
                                        fetch(`https://api.crossref.org/works${searchString}`).then(response => {
                                            return response.json()
                                        }).then(data => {
                                            if (!data.message) {
                                                throw 'No return message';
                                            }
                                            const result = (entry.doi ? data.message : data.message.items[0]);
                                            if (!entry.doi && condenseTitle(entry.title) != condenseTitle(result.title[0])) {
                                                throw `Titles do not match: "${entry.title}" and "${result.title[0]}"`;
                                            }
                                            page.notify(`Paper found on CrossRef titled '${result.title}'`);
                                            let value = (fieldCrossRefMap[field] ? fieldCrossRefMap[field](result) : result[field]);
                                            if (!value) {
                                                page.notify(`However, field '${field}' not available in the CrossRef record.`, 'error')
                                            } else {
                                                if (field === 'pages') {
                                                    value = value.replace('-', '--');
                                                }
                                                entry[field] = value;
                                                page.notify(`Updated field '${field}' with value '${value}'.`)
                                                onFix(entry);
                                            }
                                        }).catch(error => {
                                            console.error(error);
                                            page.notify(`Could not find a publication with this ${(entry.doi ? 'DOI' : 'title')} on CrossRef.`, 'error');
                                        });
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
                                description: 'capitalize longer words', 'function': function (onFix) {
                                    entry[field] = correctedValue;
                                    onFix(entry);
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
                                    var re = new RegExp('\{?' + word + '\}?', 'g');
                                    correctedValue = correctedValue.replace(re, '{' + word + '}');
                                }
                            }
                        });
                        if (!capitalizationCorrect) {
                            warningsList.push({
                                type: 'non-protected capitalization of identifier in field "' + field + '"',
                                fix: {
                                    description: 'protect identifiers', 'function': function (onFix) {
                                        entry[field] = correctedValue;
                                        onFix(entry);
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
        if (value.indexOf('{') === 0 && value.lastIndexOf('}') === value.length - 1 && value.length > 10 && (value.split("{").length - 1 === 1)) {
            warningsList.push('whole field "' + field + '" with protected capitalization');
        }
    }

})();