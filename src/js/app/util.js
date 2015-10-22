define(['jquery', 'jquery.tooltipster'], function ($, tooltipster) {

        var forbiddenFields = []; //['referencedby', 'titlesafe', 'references'];

        return {

            latexToHtml: function (latex) {
                if (!latex) {
                    return '';
                }
                latex = latex.replace(/{|}/g, '');
                var encoding = {
                    "'": "acute",
                    "`": "grave",
                    "^": "circ",
                    "\"": "uml",
                    "s": "zlig",
                    '~': 'tilde',
                    'c': 'cedil',
                    'l': '&#x0142;',
                    'L': '&#x0141;',
                    'o': '&#xF8;',
                    'O': '&#xD8;',
                    'v': '_&#x030C;',
                    'k': '_&#x328;',
                    '=': '_&#x0304;',
                    'b': '_&#x0331;',
                    '.': '_&#x0307',
                    'd': '_&#x0323',
                    'r': '_&#x1E01',
                    'u': '_&#x0306',
                    'H': '_&#x030B;'
                };
                var html = "";
                for (var i = 0; i < latex.length; i++) {
                    var c = latex[i];
                    if (c == "\\") {
                        if (i + 1 < latex.length && latex[i + 1] == '&') {
                            c = '&';
                            i++;
                        } else if (i + 1 < latex.length && latex[i + 1] == '_') {
                            c = '_';
                            i++;
                        } else if (i + 2 < latex.length && encoding[latex[i + 1]]) {
                            if (encoding[latex[i + 1]].indexOf('&') == -1) {
                                c = "&" + latex[i + 2] + encoding[latex[i + 1]] + ";";
                                i += 2;
                            } else if (encoding[latex[i + 1]].indexOf('_') >= 0) {
                                c = encoding[latex[i + 1]].replace('_', latex[i + 2]);
                                i += 2;
                            } else {
                                c = encoding[latex[i + 1]];
                                i += 1;
                            }
                        }
                    }
                    html += c;
                }
                return html;
            },

            isFieldForbidden: function (fieldName) {
                if (typeof forbiddenFields === 'undefined' || !forbiddenFields) {
                    return false;
                }
                for (var i in forbiddenFields) {
                    if (fieldName.indexOf(forbiddenFields[i]) == 0) {
                        return true;
                    }
                }
                return false;
            },

            toggleControl: function (h2Div) {
                h2Div.parent().children('.toggle-container').toggle();
                var symbol = h2Div.find('span.symbol');
                symbol.text(symbol.text() == '/' ? '>' : '/');
            },

            generateTooltips: function (div) {
                div.find('.tooltip').tooltipster({
                    theme: 'tooltipster-survis'
                });
            },

            getFrequencyClass: function (frequency) {
                var frequencyClass = 'freq1';
                if (frequency >= 2) {
                    frequencyClass = 'freq2';
                }
                if (frequency >= 3) {
                    frequencyClass = 'freq3';
                }
                if (frequency >= 5) {
                    frequencyClass = 'freq5';
                }
                if (frequency >= 10) {
                    frequencyClass = 'freq10';
                }
                if (frequency >= 20) {
                    frequencyClass = 'freq20';
                }
                if (frequency >= 35) {
                    frequencyClass = 'freq35';
                }
                if (frequency >= 50) {
                    frequencyClass = 'freq50';
                }
                if (frequency >= 80) {
                    frequencyClass = 'freq80';
                }
                if (frequency >= 120) {
                    frequencyClass = 'freq120';
                }
                return frequencyClass;
            },

// http://stackoverflow.com/questions/985272/jquery-selecting-text-in-an-element-akin-to-highlighting-with-your-mouse
            selectElementText: function (el, win) {
                win = win || window;
                var doc = win.document, sel, range;
                if (win.getSelection && doc.createRange) {
                    sel = win.getSelection();
                    range = doc.createRange();
                    range.selectNodeContents(el);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else if (doc.body.createTextRange) {
                    range = doc.body.createTextRange();
                    range.moveToElementText(el);
                    range.select();
                }
            },

//http://stackoverflow.com/questions/2118560/jquery-form-submission-stopping-page-refresh-only-works-in-newest-browsers
            stopEvent: function (event) {
                event.preventDefault();
                event.stopPropagation();
            },

            parseField: function (fieldString, field, tagCategories) {
                function tagSort(a, b) {
                    var categoryA = a.substring(0, a.indexOf(':')).toLowerCase();
                    var categoryB = b.substring(0, b.indexOf(':')).toLowerCase();
                    if (categoryA && categoryB) {
                        if (categoryA != categoryB) {
                            var indexA = Object.keys(tagCategories).indexOf(categoryA);
                            var indexB = Object.keys(tagCategories).indexOf(categoryB);
                            return ((indexA < indexB) ? -1 : ((indexA > indexB) ? 1 : 0));
                        }
                    } else if (categoryA) {
                        return -1;
                    } else if (categoryB) {
                        return 1;
                    }
                    var aName = a.toLowerCase();
                    var bName = b.toLowerCase();
                    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
                }

                if (!fieldString) {
                    fieldString = '?';
                }
                switch (field) {
                    case 'keywords':
                        var tags = [];
                        $.each(fieldString.split(','), function (i, tag) {
                            tag = $.trim(tag.split("\\").join("")).toLowerCase();
                            if ($.inArray(tag, tags) == -1) {
                                tags.push(tag);
                            }
                        });
                        $.each(tagCategories, function (categoryName) {
                            if (fieldString.indexOf(categoryName + ":") == -1) {
                                tags.push(categoryName + ":?");
                            }
                        });
                        tags.sort(tagSort);
                        return tags;
                    case 'author':
                        return fieldString.split(' and ');
                    default :
                        return [fieldString];
                }
            },

            // http://stackoverflow.com/questions/19491336/get-url-parameter-jquery
            getUrlParameter: function (sParam) {
                var sPageURL = window.location.search.substring(1);
                var sURLVariables = sPageURL.split('&');
                for (var i = 0; i < sURLVariables.length; i++) {
                    var sParameterName = sURLVariables[i].split('=');
                    if (sParameterName[0] == sParam) {
                        return sParameterName[1];
                    }
                }
            },

            // based on: http://stackoverflow.com/questions/456646/jquery-print-r-display-equivalent
            objectToString: function (o) {
                return JSON.stringify(o, null, '\t').replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;');
            },

            // based on: http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
            sortDictKeysByValue: function (dict) {
                keys = Object.keys(dict).sort(function (a, b) {
                    return dict[b] - dict[a]
                });
                return keys;
            }
        }
    }
)
;