define(['jquery', 'app/util', 'figue', 'app/selectors', 'app/bib'], function ($, util, figue, selectors, bib) {

    var clusteringCount = 0;


    return {
        nClusters: 5,

        createClustering: function () {

            var clusterKeywords = $('#keywords_checkbox').is(':checked');
            var clusterAuthor = $('#author_checkbox').is(':checked');

            if (!clusterKeywords && !clusterAuthor) {
                alert('Please select at least one of the clustering criteria checkboxes.');
                return;
            }

            this.nClusters = Math.min(Object.keys(bib.filteredEntries).length, this.nClusters);

            var clusteringName = String.fromCharCode(65 + clusteringCount);

            if (clusteringCount == 0) {
                bib.clusters = {};
                bib.clusterAssignment = {};
                bib.clusteringEntityTerms = {};
            }

            var allTerms = {};
            var docTerms = {};
            $.each(bib.filteredEntries, function (id, entry) {
                docTerms[id] = [];
                var terms = [];
                if (clusterAuthor && bib.parsedEntries[id].author) {
                    terms = terms.concat(bib.parsedEntries[id].author);
                }
                if (clusterKeywords && bib.parsedEntries[id].keywords) {
                    terms = terms.concat(bib.parsedEntries[id].keywords)
                }
                //if (terms.length > 0) {
                //var splitTerms = entry.keywords.split(/(,\s)+/)

                $.each(terms, function (i, term) {
                    //if (term.indexOf(',') < 0) {
                    //term = term.replace(/\\/g, '').toLowerCase().trim();
                    var category = term.substr(0, term.indexOf(':'));
                    if (!category || !bib.tagCategories[category] || !bib.tagCategories[category]['excludeForSimilarity']) {
                        docTerms[id].push(term);
                        allTerms[term] = true;
                    }
                    //}
                });
                //}
            });
            bib.clusteringEntityTerms[clusteringName] = docTerms;

            var labels = [];
            var vectors = [];
            var i = 0;
            $.each(docTerms, function (id, terms) {
                labels[i] = id;
                vectors[i] = [];
                var j = 0;
                for (var term in allTerms) {
                    vectors[i][j] = terms.indexOf(term) >= 0 ? 1 : 0;
                    j++;
                }
                i++;
            });

            var clusters = window.figue.kmeans(this.nClusters, vectors);

            bib.clusters[clusteringName] = {};
            $.each(clusters.centroids, function (i, centroid) {
                var cluster = {};
                var maxTerms = [];
                while (maxTerms.length < centroid.length / 20) {
                    var max = 0;
                    var currentMaxTerms = [];
                    $.each(centroid, function (j, value) {
                        if (maxTerms.indexOf(j) < 0) {
                            if (value > max) {
                                max = value;
                                currentMaxTerms = [];
                            }
                            if (value >= max) {
                                currentMaxTerms.push(j);
                            }
                        }
                    });
                    $.merge(maxTerms, currentMaxTerms);
                }
                var terms = [];
                $.each(maxTerms, function (i, j) {
                    terms.push(Object.keys(allTerms)[j] + ' (' + centroid[j].toFixed(2) + ')');
                });
                cluster.terms = terms;
                bib.clusters[clusteringName][i + 1] = cluster;
            });

            $.each(clusters.assignments, function (i, clusterID) {
                var id = labels[i];
                if (!bib.clusterAssignment[id]) {
                    bib.clusterAssignment[id] = [];
                }
                bib.clusterAssignment[id].push(clusteringName + '.' + (clusterID + 1));
            });


            clusteringCount++;
        },


        updateClusters: function () {

            if (!bib.clusterAssignment) {
                return
            }

            var clusterSelectorSimilarities = {};
            var clusterSizes = {};
            var clusterTermFrequencies = {};
            var termFrequencies = {};
            var clusterTotalTermFrequency = {};
            $.each(bib.filteredEntries, function (id, field) {
                if (bib.clusterAssignment[id]) {
                    $.each(bib.clusterAssignment[id], function (j, clusterName) {
                        var clusteringName = clusterName.substring(0, 1);
                        if (!clusterSizes[clusterName]) {
                            clusterSizes[clusterName] = 0;
                        }
                        clusterSizes[clusterName]++;
                        if (!clusterSelectorSimilarities[clusterName]) {
                            clusterSelectorSimilarities[clusterName] = [];
                        }
                        $.each(selectors.getSelectors(), function (i, selector) {
                            if (selector && !selector['lock']) {
                                if (!clusterSelectorSimilarities[clusterName][i]) {
                                    clusterSelectorSimilarities[clusterName][i] = 0.0;
                                }
                                clusterSelectorSimilarities[clusterName][i] += bib.entrySelectorSimilarities[id][i];
                            }
                        });
                        $.each(bib.clusteringEntityTerms[clusteringName][id], function (i, term) {
                            if (!clusterTermFrequencies[clusterName]) {
                                clusterTermFrequencies[clusterName] = {};
                            }
                            if (!clusterTermFrequencies[clusterName][term]) {
                                clusterTermFrequencies[clusterName][term] = 0;
                            }
                            clusterTermFrequencies[clusterName][term]++;
                            if (!termFrequencies[term]) {
                                termFrequencies[term] = 0;
                            }
                            termFrequencies[term]++;
                            if (!clusterTotalTermFrequency[clusterName]) {
                                clusterTotalTermFrequency[clusterName] = 0;
                            }
                            clusterTotalTermFrequency[clusterName]++;
                        });
                    });
                }
            });
            $.each(clusterSizes, function (clusterName, size) {
                $.each(selectors.getSelectors(), function (i, selector) {
                    if (selector && !selector['lock']) {
                        clusterSelectorSimilarities[clusterName][i] /= size;
                    }
                });
            });

            var clusteringsDiv = $('#clusterings');
            clusteringsDiv.empty();
            if (bib.clusters) {
                $.each(bib.clusters, function (clusteringName, clustering) {
                    var clusteringDiv = $('<div>', {
                        class: 'clustering'
                    }).appendTo(clusteringsDiv);
                    var clusteringLabel = $('<span class="label">Clustering ' + clusteringName + ':</h3>').appendTo(clusteringDiv);
                    var closeButton = $('<div>', {
                        class: 'button tooltip small',
                        title: 'discard clustering'
                    }).appendTo(clusteringLabel);
                    $('<span>', {
                        class: 'symbol',
                        text: 'X'
                    }).appendTo(closeButton);
                    closeButton.tooltipster({
                        theme: 'tooltipster-survis'
                    });
                    closeButton.click(function () {
                        delete bib.clusters[clusteringName];
                        window.update();
                    });

                    var termDocumentFrequency = {};
                    $.each(clustering, function (clusterId, cluster) {
                        var clusterName = clusteringName + '.' + clusterId;
                        if (clusterTermFrequencies[clusterName]) {
                            $.each(clusterTermFrequencies[clusterName], function (term, frequency) {
                                if (!termDocumentFrequency[term]) {
                                    termDocumentFrequency[term] = 0;
                                }
                                termDocumentFrequency[term]++;
                            });
                        }
                    });

                    $.each(clustering, function (clusterId, cluster) {

                        var clusterName = clusteringName + '.' + clusterId;
                        if (!clusterSizes[clusterName]) {
                            return;
                        }

                        var tfidf = [];
                        var i = 0;
                        $.each(clusterTermFrequencies[clusterName], function (term, frequency) {
                            var tf = frequency / clusterTotalTermFrequency[clusterName];
                            var idf = Math.log(Object.keys(clustering).length / termDocumentFrequency[term]);
                            tfidf[i] = {
                                name: term,
                                value: tf * idf
                            };
                            i++;
                        });
                        tfidf.sort(function (a, b) {
                            return b.value - a.value;
                        });

                        var clusterDiv = $('<div>', {
                            class: 'tooltip tag authorized ' + util.getFrequencyClass(clusterSizes[clusterName])
                        }).appendTo(clusteringDiv);
                        var sparklineDiv = $('<div>', {
                            class: 'vis sparkline'
                        }).appendTo(clusterDiv);
                        selectors.vis(sparklineDiv, clusterSelectorSimilarities[clusterName]);
                        $('<span>', {
                            class: 'text',
                            text: clusterName
                        }).appendTo(clusterDiv);
                        $('<span>', {
                            class: 'tag_frequency',
                            text: clusterSizes[clusterName]
                        }).appendTo(clusterDiv);
                        var termsDiv = $('<div>', {
                            class: 'terms'
                        }).appendTo(clusterDiv);
                        for (i = 0; i < Math.min(3, tfidf.length); i++) {
                            $('<div>', {
                                class: 'term',
                                html: util.latexToHtml(tfidf[i].name)
                            }).appendTo(termsDiv);
                        }
                        clusterDiv.click(function (event) {
                            window.toggleSelector('cluster', clusterName, event);
                        });

                        var tooltipDiv = $('<div>');
                        $('<h3><span class="label">cluster: </span>' + clusterName + '</h3>').appendTo(tooltipDiv);
                        $('<div><span class="label"># publications: </span>' + clusterSizes[clusterName] + '</div>').appendTo(tooltipDiv);
                        var termDetailsDiv = $('<div><span class="label">related terms:</span></div>', {
                            class: 'terms'
                        }).appendTo(tooltipDiv);
                        for (i = 0; i < Math.min(10, tfidf.length); i++) {
                            $('<div>', {
                                class: 'term',
                                html: util.latexToHtml(tfidf[i].name)//+'('+tfidf[i].value.toFixed(3)+')'
                            }).appendTo(termDetailsDiv);
                        }
                        var totalSimilarity = selectors.computeTotalSimilarity(clusterSelectorSimilarities[clusterName]);
                        if (selectors.getNActiveSelectors() > 0) {
                            $('<div><span class="label">selector agreement: </span>' + totalSimilarity.toFixed(2) + '</div>').appendTo(tooltipDiv);
                            if (totalSimilarity > 0) {
                                var visDiv = $('<div>', {
                                    class: 'vis'
                                }).appendTo(tooltipDiv);
                                selectors.vis(visDiv, clusterSelectorSimilarities[clusterName]);
                            }
                        }
                        clusterDiv.tooltipster({
                            content: $(tooltipDiv),
                            theme: 'tooltipster-survis'
                        });
                    });
                });
            }
        }
    }

})
;



