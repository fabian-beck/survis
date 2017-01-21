define(['jquery', 'bibtex_js', 'FileSaver', 'codemirror', 'app/util', 'data/generated/bib', 'data/generated/available_pdf', 'data/generated/available_img', 'data/search_stopwords', 'data/tag_categories', 'data/authorized_tags'],
    function ($, bibtexJS, fileSaver, CodeMirror, util, generatedBib, availaiblePdf, availableImg, stopwords, tagCategories, authorizedTags) {

        var entries = readBibtex();
        if (!entries) {
            entries = generatedBib.entries;
        }

        return {
            entries: entries,
            availablePdf: availaiblePdf.availablePdf,
            availableImg: availableImg.availableImg,
            stopwords: stopwords.stopwords,
            tagCategories: tagCategories.tagCategories,
            authorizedTags: authorizedTags.authorizedTags,
            entryDivs: {},
            warnings: warnings.computeAllWarnings(entries),
            nVisibleEntries: 20,

            downloadBibtex: function () {
                var blob = new Blob([this.createAllBibtex()]);
                window.saveAs(blob, 'reference.bib');
            },

            createBibtex: function (id, entry) {
                var bibtex = '@' + entry['type'] + '{' + id;
                for (var fieldName in entry) {
                    if (fieldName == 'type' || util.isFieldForbidden(fieldName)) {
                        continue;
                    }
                    if (entry.hasOwnProperty(fieldName)) {
                        bibtex += ",\n  " + fieldName + " = {" + entry[fieldName] + "}";
                    }
                }
                if (typeof mandatoryFields != 'undefined' && mandatoryFields) {
                    for (var i in mandatoryFields[entry["type"]]) {
                        if (!entry.hasOwnProperty(mandatoryFields[entry["type"]][i])) {
                            bibtex += ",\n  " + mandatoryFields[entry["type"]][i] + " = {}";
                        }
                    }
                }
                return bibtex + "\n}";
            },

            createCitation: function (id) {
                var bib = this;
                var citation = '';
                if (bib.parsedEntries[id]['author']) {
                    $.each(bib.parsedEntries[id]['author'], function (i, author) {
                        var authorSplit = author.split(', ');
                        if (authorSplit.length == 2) {
                            author = authorSplit[0] + ', ' + authorSplit[1].replace(/[^a-z -]/gi, '').replace(/\B\w*/g, '.').replace(/([A-Z])($|([ -]))/g, '$1.$3');
                        }
                        if (i == bib.parsedEntries[id]['author'].length - 1 && i > 0) {
                            citation += 'and ';
                        }
                        citation += util.latexToHtml(author);
                        if (bib.parsedEntries[id]['author'].length > 2 || i > 0) {
                            citation += ', ';
                        } else {
                            citation += ' ';
                        }
                    });
                }
                var year = bib.entries[id]['year'];
                if (year) {
                    citation += year + '. ';
                }
                if (title = bib.entries[id]['title']) {
                    citation += util.latexToHtml(title) + '. ';
                }
                var journal = bib.entries[id]['journal'];
                var pages = bib.entries[id]['pages'];
                if (journal) {
                    citation += 'In <i>' + util.latexToHtml(journal) + '</i>';
                    var volume = bib.entries[id]['volume'];
                    if (volume) {
                        citation += ' (Vol. ' + util.latexToHtml(volume);
                        var number = bib.entries[id]['number'];
                        if (number) {
                            citation += ', No. ' + util.latexToHtml(number);
                        }
                        if (pages) {
                            citation += ', pp. ' + util.latexToHtml(pages);
                        }
                        citation += ')';
                    }
                    citation += '. ';
                }
                var booktitle = bib.entries[id]['booktitle'];
                if (booktitle) {
                    citation += 'In <i>' + util.latexToHtml(booktitle) + '</i>';
                    if (pages) {
                        citation += ' (pp. ' + util.latexToHtml(pages) + ')';
                    }
                    citation += '. ';
                }
                var doi = bib.entries[id]['doi'];
                var url = bib.entries[id]['url'];
                if (doi) {
                    citation += 'DOI: <a href="http://dx.doi.org/' + doi + '">' + doi + '</a>. ';
                } else if (url) {
                    citation += 'URL: <a href="' + url + '">' + url + '</a>. ';
                }
                return citation.trim();
            },

            createAllBibtex: function () {
                var bib = this;
                var bibtexString = '';
                $.each(bib.filteredEntries, function (id, entry) {
                    var currentBibtex = "";
                    if (bib.entryDivs[id]) {
                        bib.entryDivs[id].find(".CodeMirror-code").children().each(function () {
                            currentBibtex += $(this).text() + "\n";
                        });
                    }
                    if (!currentBibtex) {
                        currentBibtex = bib.createBibtex(id, entry);
                    }
                    bibtexString += currentBibtex;
                    bibtexString += "\n\n";
                });
                return bibtexString;
            },

            saveBibToLocalStorage: function () {
                if (editable) {
                    localStorage.bibtexString = this.createAllBibtex();
                }
            },

            addEntries: function () {
                var bib = this;
                var addEntriesDiv = $('<div>', {
                    id: 'add_entries',
                    title: 'Add entries',
                    text: 'Paste one or more BibTeX entries:'
                }).appendTo($('body'));
                var bibtexEditor = CodeMirror(addEntriesDiv.get(0), {
                    lineWrapping: true
                });
                var bibtexStatusDiv = $('<div>', {
                    class: 'bibtex_status'
                }).appendTo(addEntriesDiv);
                bibtexEditor.on('change', function (bibtexEditor) {
                    bibtexStatusDiv.empty();
                    var addButton = $('.add_entry_button');
                    var addButtonTextDiv = addButton.find('.ui-button-text');
                    try {
                        var bibtexText = bibtexEditor.getValue();
                        var bibtexEntries = bib.parse(bibtexText);
                        var nEntries = Object.keys(bibtexEntries).length;
                        if (nEntries > 0) {
                            addButtonTextDiv.text(
                                'add (' + nEntries + (nEntries > 1 ? ' entries)' : ' entry)')
                            );
                            addButton.button('enable');
                        } else {
                            addButtonTextDiv.text('add');
                            addButton.button('disable');
                        }
                    }
                    catch (err) {
                        $('<div>', {
                            text: err,
                            class: 'error'
                        }).appendTo(bibtexStatusDiv);
                        addButton.button('disable');
                    }
                });
                addEntriesDiv.dialog({
                    minWidth: 832,
                    modal: true,
                    buttons: {
                        'Add': {
                            text: 'add',
                            class: 'add_entry_button',
                            disabled: true,
                            click: function () {
                                var bibtexText = bibtexEditor.getValue();
                                addEntriesDiv.dialog('close');
                                if (bibtexText != null) {
                                    var bibtexEntries = bib.parse(bibtexText);
                                    for (var entryKey in bibtexEntries) {
                                        var bibtexEntry = bibtexEntries[entryKey];
                                        if (bib.entries[entryKey]) {
                                            alert('Entry with ID "' + entryKey + '" already exists and cannot be added to the database.');
                                        } else {
                                            bib.entries[entryKey] = {};
                                            for (var key in bibtexEntry) {
                                                var keyLower = key.toLowerCase();
                                                bib.entries[entryKey][keyLower] = bibtexEntry[key];
                                            }
                                            var mandatoryFields = ['author', 'year', 'title'];
                                            $.each(mandatoryFields, function (i, field) {
                                                if (!bib.entries[entryKey][field]) {
                                                    bib.entries[entryKey][field] = '';
                                                }
                                            });
                                            bib.warnings[entryKey] = warnings.computeWarnings(bib.entries[entryKey]);
                                        }
                                    }
                                }
                                if (Object.keys(bibtexEntries).length == 1) {
                                    window.toggleSelector('search', Object.keys(bibtexEntries)[0]);
                                }
                                update();
                            }
                        },
                        cancel: function () {
                            $(this).dialog("close");
                        }
                    }
                });
                bibtexEditor.focus();
            },

            parse: function (bibtexText) {
                var bibParser = new BibtexParser();
                bibParser.setInput(bibtexText);
                bibParser.bibtex();
                return bibParser.getEntries();
            },

            renameKeyword: function () {
                var bib = this;
                var renameQuery = prompt('Please enter the keyword that should be renamed, followed by "->" ' +
                    'and one or more comma separated new names of the keyword.',
                    'keyword_old->keyword_new, keyword_new2');
                if (renameQuery) {
                    if (renameQuery.indexOf("->") < 0) {
                        alert('Wrong format of rename query: please use "->" ' +
                            'to separate the old from the new name of the keyword');
                        return;
                    }
                    var keywords = $.map(renameQuery.split('->'), $.trim);
                    if (!keywords[0]) {
                        alert('Wrong format of rename query: please specify the keyword you want to rename.');
                        return;
                    }
                    if (!keywords[1]) {
                        alert('Wrong format of rename query: please specify the new name of the keyword.');
                        return;
                    }
                    var newKeywords = $.map(keywords[1].split(','), $.trim);
                    var renameCount = 0;
                    var deleteCount = 0;
                    $.each(bib.filteredEntries, function (id, entry) {
                        var keywordPos = $.inArray(keywords[0], bib.parsedEntries[id]['keywords']);
                        if (keywordPos >= 0) {
                            renameCount++;
                            var keywordList = [].concat(newKeywords);
                            var keywordListParsed = [].concat(newKeywords);
                            $.each(bib.parsedEntries[id]['keywords'], function (i, keyword) {
                                if (!(keyword === keywords[0]) && $.inArray(keyword, newKeywords) < 0) {
                                    keywordListParsed.push(keyword);
                                    if (keyword.indexOf('?') < 0) {
                                        keywordList.push(keyword);
                                    }
                                }
                            });
                            bib.entries[id]['keywords'] = keywordList.join(', ');
                            bib.parsedEntries[id]['keywords'] = keywordListParsed;
                        }
                    });
                    update(false);
                    alert('Renamed keywords of ' + renameCount + ' entries. ');
                }
            }
        };

        function readBibtex() {
            var bibParser = new BibtexParser();
            var loadFromLocalStorage = util.getUrlParameter('loadFromLocalStorage') === 'true';
            if (editable && loadFromLocalStorage && localStorage.bibtexString) {
                try {
                    bibParser.setInput(localStorage.bibtexString);
                    bibParser.bibtex();
                    return bibParser.getEntries();
                } catch (err) {
                    console.error(err);
                    console.log(localStorage.bibtexString);
                    alert('Could not load bibliography from local storage, loaded default instead (see console for details and locally stored bibliography): \n\n' + err.substring(0, 200));
                }
                return null;
            }
        }

    });
