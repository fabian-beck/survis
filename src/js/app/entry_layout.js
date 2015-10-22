define(['jquery', 'jqueryui', 'codemirror', 'stex', 'app/util', 'app/selectors', 'app/bib'],
    function ($, jqueryui, CodeMirror, stex, util, selectors, bib) {

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
                                        window.toggleSelector('cluster', clusterID, event);
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
                $.each(selectors.getActiveTags(selectors), function (tag) {
                    resultBodyDiv.find('.tag[value="' + tag + '"]').addClass('active');
                });
                $.each(selectors.getSelectorsOfType('author'), function (i, selector) {
                    var authorValue = selector['text'].replace(/\\/g, '\\\\');
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
                        window.updateShowMore();
                    });
                    var showAllDiv = $('<div>', {
                        id: 'show_all_entries',
                        class: 'button',
                        text: 'show all'
                    }).appendTo(resultBodyDiv);
                    showAllDiv.click(function () {
                        window.updateShowAll();
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
                var pdfFile = dataDir + 'papers_pdf/' + id + '.pdf';
                if (typeof bib.availableImg != 'undefined' && bib.availableImg.indexOf(id) >= 0) {
                    createImgDiv(id, pdfFile).appendTo(entryDiv);
                }
                createEntryMainDiv(id).appendTo(entryDiv);
                createFooter(id, entry).appendTo(entryDiv);
                bib.entryDivs[id] = entryDiv;
                util.generateTooltips(bib.entryDivs[id]);
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
                href: 'http://scholar.google.de/scholar?hl=en&q=' + encodeURIComponent(entry['title']),
                target: '_blank',
                text: 'Google Scholar'
            }).appendTo(linksDiv);
            $('<a>', {
                href: 'https://www.google.de/search?q=' + encodeURIComponent(entry['title']),
                target: '_blank',
                text: 'Google'
            }).appendTo(linksDiv);
            if (entry['citeulike-article-id']) {
                $('<a>', {
                    href: 'http://www.citeulike.org/user/fbeck/article/' + entry['citeulike-article-id'],
                    target: '_blank',
                    text: 'CiteULike'
                }).appendTo(linksDiv);
            }
            return linksDiv;
        }

        function createEntryHeaderDiv(id, entry) {
            var entryHeaderDiv = $('<div>', {
                class: 'entry_header'
            });
            var sparklineDiv = $('<div>', {
                class: 'vis sparkline'
            }).appendTo(entryHeaderDiv);
            sparklineDiv.tooltipster({'content': $('<div>')});
            var idDiv = $('<div>', {
                class: 'id',
                text: id
            }).appendTo(entryHeaderDiv);
            idDiv.click(function () {
                util.selectElementText(this);
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
                text: util.latexToHtml(series)
            }).appendTo(entryHeaderDiv);
            seriesDiv.click(function (event) {
                window.toggleSelector('series', series, event);
            });
            var yearDiv = $('<div>', {
                class: 'year',
                text: '(' + entry['year'] + ')'
            }).appendTo(entryHeaderDiv);
            yearDiv.click(function (event) {
                window.toggleSelector('year', entry['year'], event);
            });
            return entryHeaderDiv;
        }

        function createTitleDiv(id, entry, pdfFile) {
            if (typeof bib.availablePdf != 'undefined' && bib.availablePdf.indexOf(id) >= 0 || entry['doi'] || entry['url']) {
                return $("<a>", {
                    class: "title",
                    text: util.latexToHtml(entry["title"]),
                    target: '_blank',
                    href: bib.availablePdf.indexOf(id) >= 0 ? pdfFile : (entry['doi'] ? 'http://dx.doi.org/' + entry['doi'] : entry['url'])
                });
            } else {
                return $("<div>", {
                    class: "title",
                    text: util.latexToHtml(entry["title"])
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
                        value: author
                    }).appendTo(authorsDiv);
                    authorDiv.click(function (event) {
                        window.toggleSelector('author', author, event);
                    });
                    $("<span>", {
                        class: "last_name",
                        html: util.latexToHtml(authorSplit[0])
                    }).appendTo(authorDiv);
                    $("<span>", {
                        class: "first_name",
                        html: ", " + util.latexToHtml(authorSplit[1])
                    }).appendTo(authorDiv);
                } else {
                    $.each(authorSplit, function (j, author2) {
                        authorDiv = $("<div>", {
                            class: "author",
                            value: author2
                        }).appendTo(authorsDiv);
                        authorDiv.click(function (event) {
                            window.toggleSelector('author', author2, event);
                        });
                        $("<span>", {
                            class: "name",
                            text: author2
                        }).appendTo(authorDiv);
                    });
                }
            });
            return authorsDiv;
        }

        function createAbstract(text, shorten) {
            if (text) {
                text = util.latexToHtml(text);
                var abstractDiv = $("<div>", {
                    class: 'abstract' + ( shorten ? ' collapsed' : ''),
                    text: ( shorten ? shortenText(text, maxAbstractLength) : text),
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
                        window.toggleSelector('keywords', tag, event);
                    });
                });
                return tagListSpan;
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
                            source: util.sortDictKeysByValue(bib.keywordFrequencies),
                            sortResults: false
                        });
                    }
                    addTagInput.show();
                    addTagInput.focus();
                });
                addTagForm.submit(function (event) {
                    util.stopEvent(event);
                    var tagText = addTagInput.val();
                    addTagInput.val('');
                    var prevKeywords = bib.entries[id]['keywords'] ? bib.entries[id]['keywords'] + ', ' : '';
                    bib.entries[id]['keywords'] = prevKeywords + tagText;
                    bib.parsedEntries[id]['keywords'] = util.parseField(bib.entries[id]['keywords'], 'keywords', bib.tagCategories);
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
                window.toggleSelector('entity', id, event)
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
                        window.toggleSelector('citations_outgoing', id, event)
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
                        window.toggleSelector('citations_incoming', id, event)
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
            var warnings = computeWarnings(entry);
            var bibtexEditor = null;

            var bibtexControl = $("<div>", {
                class: "bibtex_control button tooltip",
                text: 'BibTeX ',
                title: 'show/hide BibTeX code'
            }).appendTo(container);
            if (warnings.length > 0) {
                $('<span>&nbsp;(' + warnings.length + '<span class="symbol">!</span>)</span>').appendTo(bibtexControl);
                var bibtexWarningsDiv = $('<div>', {
                    class: 'bibtex_warnings'
                });
                bibtexWarningsDiv.hide();
                var bibtexWarningsLabel = $('<div>', {
                    text: 'warnings:',
                    class: 'label'
                }).appendTo(bibtexWarningsDiv);
                bibtexWarningsLabel.click(function (event) {
                    window.toggleSelector('warning', '', event);
                });
                var bibtexWarningsUL = $('<ul>').appendTo(bibtexWarningsDiv);
                $.each(warnings, function () {
                    var warningText = this;
                    var bibtexWarning = $('<li>', {
                        text: warningText
                    }).appendTo(bibtexWarningsUL);
                    bibtexWarning.click(function (event) {
                        window.toggleSelector('warning', warningText, event);
                    });
                });
            }
            container.append(bibtexWarningsDiv);
            bibtexControl.click(function () {
                if (!bibtexEditor) {
                    var bibtexText = bib.createBibtex(id, entry);
                    bibtexEditor = CodeMirror(container.get(0), {
                        value: bibtexText,
                        lineWrapping: true,
                        readOnly: !editable
                    });
                } else {
                    container.find('.CodeMirror').toggle();
                    bib.entryDivs[id] = null;
                    window.update();
                }
                bibtexEditor.focus();
                if (!editable) {
                    bibtexEditor.setSelection({line: 0, ch: 0}, {
                        line: bibtexEditor.lastLine(),
                        ch: bibtexEditor.getLine(bibtexEditor.lastLine()).length
                    });
                } else {
                    var bibtexStatusDiv = $('<div>', {
                        class: 'bibtex_status'
                    }).appendTo(container);
                    bibtexEditor.on('change', function (bibtexEditor) {
                        bibtexStatusDiv.empty();
                        try {
                            var bibtexText = bibtexEditor.getValue();
                            var bibtexEntries = bib.parse(bibtexText);
                            for (var parsedID in bibtexEntries) {
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
                                break;
                            }
                            //window.update();
                            bib.entryDivs[id].find('.entry_main').replaceWith(createEntryMainDiv(id));
                        }
                        catch (err) {
                            $('<div>', {
                                text: err,
                                class: 'error'
                            }).appendTo(bibtexStatusDiv);
                        }
                    });
                }
                if (warnings.length > 0) {
                    bibtexWarningsDiv.toggle()
                }
            });
        }

        function shortenText(s, length) {
            if (s.length > length * 1.5 && length > 3) {
                return s.substring(0, length - 3) + '...';
            }
            return s;
        }

        function computeWarnings(entry) {
            var warnings = [];
            if (!editable) {
                return warnings;
            }
            $.each(entry, function (field, value) {
                if (!value) {
                    warnings.push('empty field "' + field + '"');
                }
            });
            return warnings;
        }
    });

