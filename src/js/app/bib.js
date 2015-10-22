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
            nVisibleEntries: 20,

            downloadBibtex: function () {
                var blob = new Blob([this.createAllBibtex()]);
                window.saveAs(blob, 'reference.bib');
            },

            createBibtex: function (id, field) {
                var bibtex = "@" + field["type"] + "{" + id;
                for (var fieldName in field) {
                    if (fieldName == "type" || util.isFieldForbidden(fieldName)) {
                        continue;
                    }
                    if (field.hasOwnProperty(fieldName)) {
                        bibtex += ",\n  " + fieldName + " = {" + field[fieldName] + "}";
                    }
                }
                if (typeof mandatoryFields != 'undefined' && mandatoryFields) {
                    for (var i in mandatoryFields[field["type"]]) {
                        if (!field.hasOwnProperty(mandatoryFields[field["type"]][i])) {
                            bibtex += ",\n  " + mandatoryFields[field["type"]][i] + " = {}";
                        }
                    }
                }
                return bibtex + "\n}";
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
                $('<span>', {
                    text: 'BibTeX parsing result:',
                    class: 'label'
                }).appendTo(addEntriesDiv);
                var bibtexStatusDiv = $('<div>', {
                    class: 'bibtex_status'
                }).appendTo(addEntriesDiv);
                bibtexEditor.on('change', function (bibtexEditor) {
                    bibtexStatusDiv.empty();
                    try {
                        var bibtexText = bibtexEditor.getValue();
                        var bibtexEntries = bib.parse(bibtexText);
                        $('<div>', {
                            html: Object.keys(bibtexEntries).length === 0 ? 'No entries' : util.objectToString(bibtexEntries),
                            class: 'info'
                        }).appendTo(bibtexStatusDiv);
                    }
                    catch (err) {
                        $('<div>', {
                            text: err,
                            class: 'error'
                        }).appendTo(bibtexStatusDiv);
                    }
                });
                addEntriesDiv.dialog({
                    minWidth: 832,
                    modal: true,
                    buttons: {
                        "Add": function () {
                            var bibtexText = bibtexEditor.getValue();
                            addEntriesDiv.dialog('close');
                            if (bibtexText != null) {
                                var bibtexEntries = bib.parse(bibtexText);
                                for (var entryKey in bibtexEntries) {
                                    var bibtexEntry = bibtexEntries[entryKey];
                                    if (bib.entries[entryKey]) {
                                        alert('Entry with ID "' + entryKey + '" already exists and cannot be added to the database.');
                                        continue;
                                    }
                                    window.toggleSelector('search', entryKey);
                                    bib.entries[entryKey] = {};
                                    for (var key in bibtexEntry) {
                                        var keyLower = key.toLowerCase();
                                        bib.entries[entryKey][keyLower] = bibtexEntry[key];
                                    }
                                    var mandatoryFields = ['author', 'year', 'title', 'abstract', 'doi', 'series'];
                                    $.each(mandatoryFields, function (i, field) {
                                        if (!bib.entries[entryKey][field]) {
                                            bib.entries[entryKey][field] = '';
                                        }
                                    });
                                }
                            }
                            update();
                        },
                        Cancel: function () {
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
                    alert('Could not load bibliography from local storage, loaded default instead: \n' + err.substring(0, 200));
                }
                return null;
            }
        }

    });
