const stats = (function () {
    return {

        updateStats: function () {
            var statsDiv = $('#stats');
            if (statsDiv.children().length > 0) {
                statsDiv.empty();
                statsDiv.tooltipster('destroy');
            }

            var s = bib.nEntries + " publications";
            if (bib.nEntries != Object.keys(bib.entries).length) {
                s = bib.nEntries + ' of ' + Object.keys(bib.entries).length + ' publications';
            } else if (bib.nEntries == 0) {
                s = "no publications";
            } else if (bib.nEntries == 1) {
                s = "1 publication";
            }
            var similarities = [];
            for (var i = 0; i < selectors.nSelectors; i++) {
                similarities.push(0)
            }
            $.each(bib.filteredEntries, function (id) {
                $.each(bib.entrySelectorSimilarities[id], function (i, similarity) {
                    similarities[i] += similarity;
                });
            });
            $.each(similarities, function (i, similarity) {
                if (similarity) {
                    similarities[i] = similarity / bib.nEntries;
                }
            });
            var sparklineDiv = $("<div>", {
                class: "vis sparkline"
            }).appendTo(statsDiv);
            selectors.vis(sparklineDiv, similarities);
            statsDiv.append($('<span>', {
                text: s
            }));

            var tooltipDiv = $('<div>');
            $('<h3><span class="label">literature collection: </span>' + s + '</h3>').appendTo(tooltipDiv);
            var totalSimilarity = selectors.computeTotalSimilarity(similarities);
            if (selectors.getNActiveSelectors() > 0) {
                $('<div><span class="label">selector agreement: </span>' + totalSimilarity.toFixed(2) + '</div>').appendTo(tooltipDiv);
                if (totalSimilarity > 0) {
                    var visDiv = $('<div>', {
                        class: 'vis'
                    }).appendTo(tooltipDiv);
                    selectors.vis(visDiv, similarities);
                }
            }
            statsDiv.tooltipster({
                content: tooltipDiv,
                theme: 'tooltipster-survis'
            });
        }
    }
})();