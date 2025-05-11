const entryLayout = (function () {

    var maxAbstractLength = 300;

    return {

        updateEntryList: function () {
            var nVisibleEntries = Math.min(bib.nVisibleEntries, Object.keys(bib.entries).length);
            var resultBodyDiv = $('#result_body');
            resultBodyDiv.find('.entry').hide();
            var j = 0;
            $.each(bib.sortedIDs, function (i, id) {
                if (bib.filteredEntries[id] && (j < nVisibleEntries)) {
                    var entryDiv = createEntryDiv(id);
                    var sparklineDiv = entryDiv.find('.sparkline');
                    sparklineDiv.empty();
                    sparklineDiv.tooltipster('destroy');
                    selectors.vis(sparklineDiv, bib.entrySelectorSimilarities[id], true);
                    var tooltipDiv = $('<div>');
                    $('<h3><span class="label">publication: </span>' + id + '</h3>').appendTo(tooltipDiv);
                    var totalSimilarity = selectors.computeTotalSimilarity(bib.entrySelectorSimilarities[id]);
                    if (selectors.getNActiveSelectors() > 0) {
                        $('<div><span class="label">selector agreement: </span>' + totalSimilarity.toFixed(2) + '</div>').appendTo(tooltipDiv);
                        if (totalSimilarity > 0) {
                            var visDiv = $('<div>', {
                                class: 'vis'
                            }).appendTo(tooltipDiv);
                            selectors.vis(visDiv, bib.entrySelectorSimilarities[id]);
                        }
                    }
                    sparklineDiv.tooltipster({
                        content: tooltipDiv,
                        theme: 'tooltipster-survis'
                    });
                    var greyValue = Math.round(-selectors.getTotalSimilarity(bib, id) * 200 + 200);
                    entryDiv.css('border-color', 'rgb(' + greyValue + ',' + greyValue + ',' + greyValue + ')');

                    if (bib.clusterAssignment && bib.clusterAssignment[id]) {
                        var clustersDiv = entryDiv.find('.clusters');
                        if (clustersDiv.length == 0) {
                            clustersDiv = $('<div>', {
                                class: 'clusters'
                            }).insertBefore(entryDiv.find('.footer_container'));
                        }
                        clustersDiv.empty();
                        var nonDiscardedClusters = [];
                        $.each(bib.clusterAssignment[id], function (i, clusterID) {
                            var clusteringName = clusterID.substring(0, 1);
                            if (bib.clusters[clusteringName]) {
                                nonDiscardedClusters.push(clusterID);
                            }
                        });
                        if (nonDiscardedClusters.length > 0) {
                            $('<div>', {
                                class: 'label',
                                text: 'Cluster'
                            }).appendTo(clustersDiv);
                            $.each(nonDiscardedClusters, function (i, clusterID) {
                                var clusterDiv = $('<div>', {
                                    class: 'cluster',
                                    text: clusterID
                                }).appendTo(clustersDiv);
                                clusterDiv.click(function (event) {
                                    selectors.toggleSelector('cluster', clusterID, event);
                                });
                            })
                        }
                    }

                    var outgoingFrequencySpan = entryDiv.find('.citation_outgoing_frequency');
                    if (outgoingFrequencySpan.length > 0) {
                        outgoingFrequencySpan.text(bib.filteredReferences[id].referencesOutgoing ? bib.filteredReferences[id].referencesOutgoing.length : 0)
                    }
                    var incomingFrequencySpan = entryDiv.find('.citation_incoming_frequency');
                    if (incomingFrequencySpan.length > 0) {
                        incomingFrequencySpan.text(bib.filteredReferences[id].referencesIncoming ? bib.filteredReferences[id].referencesIncoming.length : 0)
                    }

                    entryDiv.appendTo(resultBodyDiv);
                    entryDiv.show();
                    j++;
                }
            });
            resultBodyDiv.find('.active').removeClass('active');
            $.each(selectors.getActiveTags('keywords'), function (tag) {
                resultBodyDiv.find('.tag[value="' + tag + '"]').addClass('active');
            });
            $.each(selectors.getActiveTags('author'), function (tag) {
                var authorValue = tagUtil.simplifyTag(tag);
                resultBodyDiv.find('.author[value="' + authorValue + '"]').addClass('active');
            });
            $('#show_more_entries').remove();
            $('#show_all_entries').remove();
            if (nVisibleEntries < Object.keys(bib.entries).length) {
                var showMoreDiv = $('<div>', {
                    id: 'show_more_entries',
                    class: 'button',
                    text: 'show more'
                }).appendTo(resultBodyDiv);
                showMoreDiv.click(function () {
                    page.updateShowMore();
                });
                var showAllDiv = $('<div>', {
                    id: 'show_all_entries',
                    class: 'button',
                    text: 'show all'
                }).appendTo(resultBodyDiv);
                showAllDiv.click(function () {
                    page.updateShowAll();
                });
            }
        }

    };

    function createEntryDiv(id) {
        if (!bib.entryDivs[id]) {
            var entry = bib.entries[id];
            var entryDiv = $('<div>', {
                class: 'entry type_' + entry['type'],
                id: id
            });
            var pdfFile = dataDir + 'papers_pdf/' + id + '.pd<f';
            if (typeof bib.availableImg != 'undefined' && bib.availableImg.indexOf(id) >= 0) {
                createImgDiv(id, pdfFile).appendTo(entryDiv);
            }
            createEntryMainDiv(id).appendTo(entryDiv);
            createFooter(id, entry).appendTo(entryDiv);
            bib.entryDivs[id] = entryDiv;
            page.generateTooltips(bib.entryDivs[id]);
        }
        return bib.entryDivs[id];
    }

    function createEntryMainDiv(id) {
        var entry = bib.entries[id];
        var pdfFile = dataDir + 'papers_pdf/' + id + '.pdf';
        var entryMainDiv = $('<div>', {
            class: 'entry_main'
        });
        createLinksDiv(id, entry, pdfFile).appendTo(entryMainDiv);
        createEntryHeaderDiv(id, entry).appendTo(entryMainDiv);
        createTitleDiv(id, entry, pdfFile).appendTo(entryMainDiv);
        createAuthors(entry['author']).appendTo(entryMainDiv);
        createAbstract(entry['abstract'], true).appendTo(entryMainDiv);
        createTags(id).appendTo(entryMainDiv);
        if (entry['comment']) {
            createComment(entry['comment']).appendTo(entryMainDiv);
        }
        return entryMainDiv;
    }

    function createLinksDiv(id, entry, pdfFile) {
        var linksDiv = $('<div>', {
            class: 'links'
        });
        if (typeof bib.availablePdf != 'undefined' && bib.availablePdf.indexOf(id) >= 0) {
            $('<a>', {
                href: pdfFile,
                target: '_blank',
                text: 'PDF'
            }).appendTo(linksDiv);
        }
        if (entry['video']) {
            $('<a>', {
                href: entry['video'],
                target: '_blank',
                text: 'Video'
            }).appendTo(linksDiv);
        }
        if (entry['doi']) {
            $('<a>', {
                href: 'http://dx.doi.org/' + entry['doi'],
                target: '_blank',
                text: 'DOI'
            }).appendTo(linksDiv);
        }
        if (entry['url']) {
            $('<a>', {
                href: entry['url'],
                target: '_blank',
                text: 'URL'
            }).appendTo(linksDiv);
        }
        $('<a>', {
            href: 'http://scholar.google.de/scholar?hl=en&q=' + encodeURIComponent(entry.title),
            target: '_blank',
            text: 'Google Scholar'
        }).appendTo(linksDiv);
        $('<a>', {
            href: 'https://www.google.de/search?q=' + encodeURIComponent(entry.title),
            target: '_blank',
            text: 'Google'
        }).appendTo(linksDiv);
        $('<a>', {
            href: 'https://search.crossref.org/?q=' + (entry.doi ? entry.doi : encodeURIComponent(entry.title)),
            target: '_blank',
            text: 'CrossRef'
        }).appendTo(linksDiv);
        return linksDiv;
    }

    function createEntryHeaderDiv(id, entry) {
        var entryHeaderDiv = $('<div>', {
            class: 'entry_header'
        });
        var sparklineDiv = $('<div>', {
            class: 'vis sparkline'
        }).appendTo(entryHeaderDiv);
        sparklineDiv.tooltipster({ 'content': $('<div>') });
        var idDiv = $('<div>', {
            class: 'id',
            text: id
        }).appendTo(entryHeaderDiv);
        idDiv.click(function () {
            selectElementText(this);
        });
        var series = entry['series'];
        if (!series) {
            if (entry['type'] == 'article') {
                series = entry['journal'];
            } else {
                series = '[' + entry['type'] + ']'
            }
        }
        var seriesDiv = $('<div>', {
            class: 'series',
            text: latexUtil.latexToHtml(series)
        }).appendTo(entryHeaderDiv);
        seriesDiv.click(function (event) {
            selectors.toggleSelector('series', series, event);
        });
        var yearDiv = $('<div>', {
            class: 'year',
            text: '(' + entry['year'] + ')'
        }).appendTo(entryHeaderDiv);
        yearDiv.click(function (event) {
            selectors.toggleSelector('year', entry['year'], event);
        });
        return entryHeaderDiv;
    }

    function createTitleDiv(id, entry, pdfFile) {
        if (typeof bib.availablePdf != 'undefined' && bib.availablePdf.indexOf(id) >= 0 || entry['doi'] || entry['url']) {
            return $("<a>", {
                class: "title",
                html: latexUtil.latexToHtml(entry["title"]),
                target: '_blank',
                href: bib.availablePdf.indexOf(id) >= 0 ? pdfFile : (entry['doi'] ? 'http://dx.doi.org/' + entry['doi'] : entry['url'])
            });
        } else {
            return $("<div>", {
                class: "title",
                html: latexUtil.latexToHtml(entry["title"])
            });
        }
    }

    function createAuthors(authors) {
        if (!authors) {
            return $('<div>', {
                'text': '[unknown authors]',
                'class': 'author unknown'
            });
        }
        var authorsDiv = $("<div>", {
            class: "authors"
        });
        $.each(authors.split(" and "), function (i, author) {
            var authorSplit = author.split(",");
            if (authorSplit.length == 2) {
                var authorDiv = $("<div>", {
                    class: "author",
                    value: tagUtil.simplifyTag(author)
                }).appendTo(authorsDiv);
                authorDiv.click(function (event) {
                    selectors.toggleSelector('author', tagUtil.simplifyTag(author), event);
                });
                $("<span>", {
                    class: "last_name",
                    html: latexUtil.latexToHtml(authorSplit[0])
                }).appendTo(authorDiv);
                $("<span>", {
                    class: "first_name",
                    html: ", " + latexUtil.latexToHtml(authorSplit[1])
                }).appendTo(authorDiv);
            } else {
                $.each(authorSplit, function (j, author2) {
                    authorDiv = $("<div>", {
                        class: "author",
                        value: tagUtil.simplifyTag(author2)
                    }).appendTo(authorsDiv);
                    authorDiv.click(function (event) {
                        selectors.toggleSelector('author', tagUtil.simplifyTag(author2), event);
                    });
                    $("<span>", {
                        class: "name",
                        html: latexUtil.latexToHtml(author2)
                    }).appendTo(authorDiv);
                });
            }
        });
        return authorsDiv;
    }

    function createAbstract(text, shorten) {
        if (text) {
            text = latexUtil.latexToHtml(text);
            var abstractDiv = $("<div>", {
                class: 'abstract' + (shorten ? ' collapsed' : ''),
                text: (shorten ? shortenText(text, maxAbstractLength) : text),
                value: text
            });
            if (shorten && text.length != abstractDiv.text().length) {
                $("<span>", {
                    class: 'expand',
                    text: " > "
                }).appendTo(abstractDiv);
            }
            $("<span>", {
                class: "label",
                text: "Abstract: "
            }).prependTo(abstractDiv);
            abstractDiv.click(function () {
                var value = $(this).attr('value');
                var collapsed = $(this).hasClass('collapsed');
                $(this).replaceWith(createAbstract(value, !collapsed));
            });
            return abstractDiv;
        }
        return $('');
    }

    function createTags(id) {
        function createTagList(id) {
            var tagListSpan = $("<span>", {
                class: "tag_list"
            });
            $.each(bib.parsedEntries[id]['keywords'], function (i, tag) {
                var tagDiv = $("<div>", {
                    class: "tag",
                    text: tag,
                    value: tag
                }).appendTo(tagListSpan);
                var colonIndex = tagDiv.text().indexOf(':');
                if (colonIndex >= 0 && tagListSpan.text().length - 1 > colonIndex) {
                    var tagCategory = tagDiv.text().substring(0, colonIndex + 1);
                    var tagCategorySpan = $('<span>', {
                        class: 'tag_category',
                        text: tagCategory
                    });
                    tagDiv.text(tagDiv.text().substring(colonIndex + 1));
                    tagDiv.prepend(tagCategorySpan);
                }
                tagDiv.click(function (event) {
                    selectors.toggleSelector('keywords', tag, event);
                });
            });
            return tagListSpan;
        }

        // based on: http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
        function sortDictKeysByValue(dict) {
            return Object.keys(dict).sort(function (a, b) {
                return dict[b] - dict[a]
            });
        }

        //http://stackoverflow.com/questions/2118560/jquery-form-submission-stopping-page-refresh-only-works-in-newest-browsers
        function stopEvent(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        var tagsDiv = $("<div>", {
            class: "tags"
        });
        var tagListSpan = createTagList(id);
        tagListSpan.appendTo(tagsDiv);
        if (editable) {
            var addTagForm = $('<form>', {
                text: '+',
                class: 'add_tag button tooltip',
                title: 'add tag'
            }).appendTo(tagsDiv);
            var addTagInput = null;
            addTagForm.click(function () {
                if (!addTagInput) {
                    addTagInput = $('<input>', {
                        class: 'tag_input'
                    }).appendTo(addTagForm);
                    addTagInput.autocomplete({
                        source: sortDictKeysByValue(bib.keywordFrequencies),
                        sortResults: false
                    });
                }
                addTagInput.show();
                addTagInput.focus();
            });
            addTagForm.submit(function (event) {
                stopEvent(event);
                var tagText = addTagInput.val();
                addTagInput.val('');
                var prevKeywords = bib.entries[id]['keywords'] ? bib.entries[id]['keywords'] + ', ' : '';
                bib.entries[id]['keywords'] = prevKeywords + tagText;
                bib.parsedEntries[id]['keywords'] = bibUtil.parseField(bib.entries[id]['keywords'], 'keywords', bib.tagCategories);
                $(this).parent('.tags').find('.tag_list').replaceWith(createTagList(id));
            });
        }
        return tagsDiv;
    }

    function createComment(comment) {
        var commentDiv = $("<div>", {
            class: "comment",
            text: comment
        });
        $("<span>", {
            class: "label",
            text: "Comment: "
        }).prependTo(commentDiv);
        return commentDiv;
    }

    function createFooter(id, entry) {

        var footerContainerDiv = $('<div>', {
            class: 'footer_container'
        });

        var selectSimilarDiv = $('<div>', {
            class: 'button select_similar tooltip',
            text: 'select similar',
            title: 'add a selector for retrieving similar publications based on keywords, title, abstract, and authors'
        });
        selectSimilarDiv.click(function (event) {
            selectors.toggleSelector('entity', id, event)
        });

        footerContainerDiv.append(selectSimilarDiv);

        if (citations) {
            if (bib.references[id].referencesOutgoing) {
                var selectCitationsOutgoingDiv = $('<div>', {
                    class: 'button select_citations tooltip',
                    text: 'cited by this',
                    title: 'add a selector marking publications cited by this paper'
                });
                $('<span>', {
                    class: 'citation_outgoing_frequency'
                }).appendTo(selectCitationsOutgoingDiv);
                selectCitationsOutgoingDiv.click(function (event) {
                    selectors.toggleSelector('citations_outgoing', id, event)
                });
                footerContainerDiv.append(selectCitationsOutgoingDiv);
            }
            if (bib.references[id].referencesIncoming) {
                var selectCitationsIncomingDiv = $('<div>', {
                    class: 'button select_citations tooltip',
                    text: 'citing this',
                    title: 'add a selector marking publications citing this paper'
                });
                $('<span>', {
                    class: 'citation_incoming_frequency'
                }).appendTo(selectCitationsIncomingDiv);
                selectCitationsIncomingDiv.click(function (event) {
                    selectors.toggleSelector('citations_incoming', id, event)
                });
                footerContainerDiv.append(selectCitationsIncomingDiv);
            }
        }
        createBibtexDiv(id, entry, footerContainerDiv);

        return footerContainerDiv;
    }

    function createImgDiv(id, pdfFile) {
        var entryImgDiv = $('<div>', {
            class: "entry_img"
        });
        var imgDiv;
        var img = dataDir + "papers_img/" + id + ".png";
        imgDiv = $("<img>", {
            class: "thumb",
            src: img
        });
        if (typeof bib.availablePdf != 'undefined' && bib.availablePdf.indexOf(id) >= 0) {
            imgDiv = imgDiv.appendTo($("<a>", {
                href: pdfFile,
                target: '_blank'
            }));
        }
        imgDiv.appendTo(entryImgDiv);
        return entryImgDiv;
    }

    function createBibtexDiv(id, entry, container) {
        var bibtexEditor = null;
        var bibtexControl = $("<div>", {
            class: "bibtex_control button tooltip",
            text: 'BibTeX ',
            title: 'show/hide BibTeX code'
        }).appendTo(container);
        var citationControl = $("<div>", {
            class: "citation_control button tooltip",
            text: 'Citation ',
            title: 'show/hide Citation'
        }).appendTo(container);
        if (bib.warnings[id] && bib.warnings[id].length > 0) {
            $('<span>&nbsp;(' + bib.warnings[id].length + '<span class="symbol">!</span>)</span>').appendTo(bibtexControl);
            var bibtexWarningsDiv = $('<div>', {
                class: 'bibtex_warnings'
            });
            bibtexWarningsDiv.hide();
            var bibtexWarningsLabel = $('<div>', {
                text: 'warnings:',
                class: 'label'
            }).appendTo(bibtexWarningsDiv);
            bibtexWarningsLabel.click(function (event) {
                selectors.toggleSelector('warning', '', event);
            });
            var bibtexWarningsUl = $('<ul>').appendTo(bibtexWarningsDiv);
            $.each(bib.warnings[id], function () {
                var warningText = this;
                if (warningText['type']) {
                    warningText = warningText['type'];
                }
                var bibtexWarningLi = $('<li>', {
                    text: warningText
                }).appendTo(bibtexWarningsUl);
                bibtexWarningLi.click(function (event) {
                    selectors.toggleSelector('warning', warningText, event);
                });
                if (this['fix']) {
                    var fix = this['fix'];
                    var bibtexWarningFixUl = $('<ul>').appendTo(bibtexWarningsUl);
                    var bibtexWarningFixLi = $('<li>', {
                        text: 'fix: ' + fix['description']
                    }).appendTo(bibtexWarningFixUl);
                    bibtexWarningFixLi.click(function () {
                        fix['function'](function (entry) {
                            bibtexEditor.setValue(bib.createBibtex(id, entry))
                        });
                        //bibtexEditor.setValue(bibtexText);
                    });
                }
            });
        }
        container.append(bibtexWarningsDiv);
        bibtexControl.click(function () {
            if (!bibtexEditor) {
                closeCitation(id);
                var bibtexText = bib.createBibtex(id, entry);
                bibtexEditor = CodeMirror(container.get(0), {
                    value: bibtexText,
                    lineWrapping: true,
                    readOnly: !editable
                });
            } else {
                closeBibtex(id, container);
            }
            bibtexEditor.focus();
            if (!editable) {
                bibtexEditor.setSelection({ line: 0, ch: 0 }, {
                    line: bibtexEditor.lastLine(),
                    ch: bibtexEditor.getLine(bibtexEditor.lastLine()).length
                });
            } else {
                var bibtexAddFieldForm = $('<form>', {
                    class: 'bibtex_add_field'
                }).appendTo(container);
                $('<span>', {
                    text: 'add field with value: '
                }).appendTo(bibtexAddFieldForm);
                var bibtexAddFieldTextInput = $('<input>', {
                    type: 'text'
                }).appendTo(bibtexAddFieldForm);
                bibtexAddFieldForm.submit(function (event) {
                    event.preventDefault();
                    var inputText = bibtexAddFieldTextInput.val();
                    var bibtexText = bibtexEditor.getValue();
                    var newBibtexText = addField(bibtexText, inputText)
                    bibtexEditor.setValue(newBibtexText);
                    bibtexAddFieldTextInput.val('');
                    updateEntryBasedOnBibtex(id, bibtexEditor);
                });
                $('<div>', {
                    class: 'bibtex_status'
                }).appendTo(container);
                bibtexEditor.on('change', function (bibtexEditor) {
                    updateEntryBasedOnBibtex(id, bibtexEditor);
                });
            }
            if (bib.warnings[id] && bib.warnings[id].length > 0) {
                bibtexWarningsDiv.toggle()
            }
        });
        citationControl.click(function () {
            if ($(bib.entryDivs[id]).find('.citation').length) {
                closeCitation(id);
            } else {
                if (bibtexEditor) {
                    closeBibtex(id, container);
                }
                var citation = bib.createCitation(id);
                var citationDiv = $('<div class="citation">' + citation + '</div>').appendTo(bib.entryDivs[id]);
                selectElementText(citationDiv.get(0));
            }
        });
    }

    function closeBibtex(id, container) {
        container.find('.CodeMirror').toggle();
        bib.entryDivs[id] = null;
        page.update();
    }

    function closeCitation(id) {
        $(bib.entryDivs[id]).find('.citation').remove();
    }

    function shortenText(s, length) {
        if (s.length > length * 1.5 && length > 3) {
            return s.substring(0, length - 3) + '...';
        }
        return s;
    }

    function addField(bibtexText, inputText) {
        var fieldType = '';
        inputText = inputText.trim();
        var inputTextLower = inputText.toLowerCase();
        if (inputTextLower.indexOf('10.') === 0) {
            fieldType = 'doi';
        } else if (inputTextLower.length > 200) {
            fieldType = 'abstract';
        } else if (inputTextLower.indexOf('http') === 0) {
            fieldType = 'url';
        } else if (inputTextLower.match(/\d\d\d\d-\d\d-\d\d/)) {
            fieldType = 'date';
        } else if (inputTextLower.match(/\d+ ?--? ?\d+/)) {
            fieldType = 'pages';
        } else if (inputTextLower.indexOf('proceedings of') >= 0 || inputTextLower.indexOf('international') >= 0) {
            fieldType = 'booktitle';
        } else {
            Object.keys(bib.entries).some(id => {
                if (bib.entries[id].series === inputText) {
                    fieldType = 'series';
                    return true;
                } else if (bib.entries[id].publisher === inputText) {
                    fieldType = 'publisher';
                    return true;
                }
                return false;
            })
            if (!fieldType && inputText.toUpperCase() === inputText) {
                fieldType = 'series';
            }
        }
        if (fieldType) {
            page.notify(`Automatically detected field type: "${fieldType}".`);
        } else {
            page.notify('Could not automatically detect field type. Added value with field type "unknown", please change manually.', 'error');
            fieldType = 'unknown';
        }
        var newFieldText = ',\n  ' + fieldType + ' = {' + inputText + '}';
        var posClosingBracket = bibtexText.lastIndexOf('}');
        if (bibtexText[posClosingBracket - 1] === '\n') {
            posClosingBracket--;
        }
        return [bibtexText.slice(0, posClosingBracket),
            newFieldText, bibtexText.slice(posClosingBracket)].join('');
    }

    function updateEntryBasedOnBibtex(id, bibtexEditor) {
        const bibtexStatusDiv = bib.entryDivs[id].find('.bibtex_status');
        bibtexStatusDiv.empty();
        try {
            var bibtexText = bibtexEditor.getValue();
            var bibtexEntries = bib.parse(bibtexText);
            $.each(bibtexEntries, function (parsedID) {
                var bibtexEntry = bibtexEntries[parsedID];
                if (id != parsedID) {
                    $('<div>', {
                        text: 'Changed ID of entry will only be applied after save and refresh.',
                        class: 'info'
                    }).appendTo(bibtexStatusDiv);
                }
                bib.entries[id] = {};
                for (var key in bibtexEntry) {
                    var keyLower = key.toLowerCase();
                    bib.entries[id][keyLower] = bibtexEntry[key];
                }
            });
        }
        catch (err) {
            $('<div>', {
                text: err,
                class: 'error'
            }).appendTo(bibtexStatusDiv);
        }
        bib.entryDivs[id].find('.entry_main').replaceWith(createEntryMainDiv(id));
        bib.warnings[id] = warnings.computeWarnings(bib.entries[id]);
    }

    // http://stackoverflow.com/questions/985272/jquery-selecting-text-in-an-element-akin-to-highlighting-with-your-mouse
    function selectElementText(el, win) {
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
    }
})();