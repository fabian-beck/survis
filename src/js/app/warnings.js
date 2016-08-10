define(['jquery'], function ($) {

    return {

        computeAllWarnings: function (entries) {
            var that = this;
            var warnings = {};
            $.each(entries, function (id, entry) {
                warnings[id] = that.computeWarnings(entry, id);
            });
            return warnings;
        },

        computeWarnings: function (entry, id) {
            var warningsList = [];
            if (editable) {
                $.each(entry, function (field, value) {
                    computeEmptyFieldWarning(warningsList, field, value);
                    computeTitleCapitalizationWarning(warningsList, field, value);
                    computeProtectedIdentifierCapitalizationWarning(warningsList, field, value);
                });
            }
            return warningsList;
        }

    }

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
            })
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
                    })
                    if (!capitalizationCorrect) {
                        warningsList.push('non-protected capitalization of indentifier in field "' + field + '"');
                    }
                }
            }
        }
    }

    )

