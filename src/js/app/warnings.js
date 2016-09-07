define(['jquery'], function ($) {

        return {

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
                    $.each(entry, function (field, value) {
                        computeEmptyFieldWarning(warningsList, field, value);
                        computeTitleCapitalizationWarning(warningsList, field, value);
                        computeProtectedIdentifierCapitalizationWarning(warningsList, field, value);
                        computeFirstNameUnknown(warningsList, field, value);
                        computeWholeFieldCapitalizationProtected(warningsList, field, value);
                    });
                }
                return warningsList;
            }

        };

        function computeEmptyFieldWarning(warningsList, field, value) {
            if (!value) {
                warningsList.push('empty field "' + field + '"');
            }
        }

        function computeTitleCapitalizationWarning(warningsList, field, value) {
            if (field === 'booktitle' || field === 'journal') {
                var capitalizationCorrect = true;
                $.each(value.split(' '), function (i, word) {
                    if (word.length > 5 && word.toLowerCase() == word) {
                        capitalizationCorrect = false;
                    }
                });
                if (!capitalizationCorrect) {
                    warningsList.push('capitalization in field "' + field + '"');
                }
            }
        }

        function computeProtectedIdentifierCapitalizationWarning(warningsList, field, value) {
            if (field === 'title') {
                var capitalizationCorrect = true;
                if (value.indexOf('{') < 0) {
                    $.each(value.split(/[\s,:\-()]+/), function (i, word) {
                        if (!word.startsWith('{')) {
                            word = word.substring(1);
                            if (word.length > 0 && word.toLowerCase() != word) {
                                capitalizationCorrect = false;
                            }
                        }
                    });
                    if (!capitalizationCorrect) {
                        warningsList.push('non-protected capitalization of indentifier in field "' + field + '"');
                    }
                }
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
    }
);

