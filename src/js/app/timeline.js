define(['jquery', 'd3', 'jquery.tooltipster', 'app/bib', 'app/selectors'], function ($, d3, tooltipster, bib, selectors) {

    var d3data;
    var d3referenceCount;
    var d3references;
    var dataSelector;

    var height = 100;

    var computeYearRange = true;


    var maxFrequency = 0;
    var maxReferenceCount = 0;
    var maxBlocks = 0;
    var maxIncomingCount = 0;
    var minIncomingCount = 1000;

    var drawSize = 11;

    var references = {};

    var selectorColors = ['#1a8e6a', '#f9ba02', '#6762a2', '#eb298d', '#7cc522', '#ec6502'];

    var niceIntervals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    var maxYearIntervals = 10;
    var maxFrequencyIntervals = 5;

    var minYear = 3000;
    var maxYear = 0;

    return {

        updateTimeline: function (skipDataUpdate) {
            var displayHeight = height;

            var timelineDiv = $('#timeline');
            timelineDiv.empty();

            $('<div>', {
                class: 'label',
                text: 'publications per year'
            }).appendTo(timelineDiv);

            if (!skipDataUpdate) {
                dataSelector = computeData();
            }
            drawTimeline(displayHeight, timelineDiv, dataSelector);
            initCitationControls(timelineDiv);
        }

    };

    function computeData() {
        var data = {};
        var dataSelector = {};
        var referenceCount = {};
        references = {};
        computeYearlyData(data, referenceCount, dataSelector);
        for (var year = minYear; year <= maxYear; year++) {
            if (!data[year]) {
                data[year] = 0;
            } else {
                if (computeYearRange) {
                    maxFrequency = Math.max(data[year], maxFrequency);
                    maxReferenceCount = Math.max(referenceCount[year], maxReferenceCount);
                }
            }
        }
        computeYearRange = false;
        d3data = d3.entries(data);
        d3data = d3data.sort(function (a, b) {
            return d3.ascending(a.key, b.key);
        });

        if (citations) {
            computeCitationData(referenceCount);
        }

        return dataSelector;
    }

    function computeSelectedReferencesColors(referenceYears) {
// find color for selected references
        $.each(selectors.getSelectors(), function (i, selector) {
            if (selector && !selector['lock'] && selector['text'] &&
                Object.keys(bib.filteredEntries).indexOf(selector['text']) >= 0) {
                var id = selector['text'];
                if (selector['type'] == 'citations_incoming') {
                    if (!references[id]["counted"]) {
                        // only count again, if we have not counted it yet
                        referenceYears[references[id]["year"]] =
                            (referenceYears[references[id]["year"]] ?
                            referenceYears[references[id]["year"]] + 1 : 1);
                        references[id]["counted"] = true;
                    }

                    references[id]["color"] = selectorColors[i];
                    references[id]["selected"] = true;


                    if (references[id]["referencesIncoming"]) {
                        references[id]["referencesIncoming"].forEach(function (id2) {
                            if (!references[id2]["counted"]) {
                                // only count again, if we have not counted it yet
                                referenceYears[references[id2]["year"]] =
                                    (referenceYears[references[id2]["year"]] ?
                                    referenceYears[references[id2]["year"]] + 1 : 1);
                                references[id2]["counted"] = true;
                            }
                            references[id2]["colorOutgoing"].push(d3.rgb(selectorColors[i]));
                        });
                    }

                } else if (selector['type'] == 'citations_outgoing') {
                    if (!references[id]["counted"]) {
                        // only count again, if we have not counted it yet
                        referenceYears[references[id]["year"]] =
                            (referenceYears[references[id]["year"]] ?
                            referenceYears[references[id]["year"]] + 1 : 1);
                        references[id]["counted"] = true;
                    }

                    references[id]["color"] = selectorColors[i];
                    references[id]["selected"] = true;


                    if (references[id]["referencesOutgoing"]) {
                        references[id]["referencesOutgoing"].forEach(function (id2) {
                            if (!references[id2]["counted"]) {
                                // only count again, if we have not counted it yet
                                referenceYears[references[id2]["year"]] =
                                    (referenceYears[references[id2]["year"]] ?
                                    referenceYears[references[id2]["year"]] + 1 : 1);
                                references[id2]["counted"] = true;
                            }
                            references[id2]["colorIncoming"].push(d3.rgb(selectorColors[i]));
                        });
                    }

                }
            }
        });

        $.each(references, function (id, value) {
            references[id]["hidden"] = references[id]["belowMinCitations"] &&
                (references[id]["colorOutgoing"].length == 0) &&
                (references[id]["colorIncoming"].length == 0) && !references[id]["selected"];
        });
    }

    function computeReferenceFrequencyColors(referenceYears) {
        $.each(references, function (id, value) {
            value["color"] = d3.rgb("white");
            if (value["referencesIncoming"] && value["referencesIncomingCount"]
                && value["referencesIncomingCount"] >= citations.minCitationCount) {
                var refVal = 255 * Math.pow(1.0 - (references[id]["referencesIncomingCount"] - 1) / (maxIncomingCount - 1), 0.9);
                refVal = Math.max(refVal, 1);
                references[id]["color"] = d3.rgb(refVal, refVal, refVal);
                referenceYears[value["year"]] =
                    (referenceYears[references[id]["year"]] ? referenceYears[references[id]["year"]] + 1 : 1);
                references[id]["counted"] = true;
            }
            value["colorIncoming"] = [];
            value["colorOutgoing"] = [];
            value["selected"] = false;
        });
    }

    function computeMaxBlocks(referenceYears) {
        maxBlocks = 0;

        for (var year = minYear; year <= maxYear; year++) {
            if (!referenceYears[year]) {
                referenceYears[year] = 0;
            } else {
                maxBlocks = Math.max(referenceYears[year], maxBlocks);
            }
            // console.log("found maximum of" + maxBlocks);
        }
    }

    function computeCitationData(referenceCount) {
// set color of all reference blocks

        var referenceYears = {};
        computeReferenceFrequencyColors(referenceYears);
        computeSelectedReferencesColors(referenceYears);
        computeMaxBlocks(referenceYears);

        d3referenceCount = d3.entries(referenceCount);
        d3referenceCount = d3referenceCount.sort(function (a, b) {
            return d3.ascending(a.key, b.key);
        });

        var filteredReferences = {};
        $.each(bib.filteredEntries, function (id, entry) {
            if (!references[id]['hidden']) {
                filteredReferences[id] = references[id];
            }
        });
        d3references = d3.entries(filteredReferences);

        d3references = d3references.sort(function (a, b) {
            var av = a.value["referencesIncomingCount"];
            var bv = b.value["referencesIncomingCount"];
            if (av == bv) {
                av = a.value["referencesOutgoingCount"];
                bv = b.value["referencesOutgoingCount"];
            }
            if (av == bv) {
                if (a.key > b.key) {
                    av = 1.0;
                    bv = 0.0;
                } else {
                    av = 0.0;
                    bv = 1.0;
                }
            }
            return d3.descending(av, bv);
        });
    }

    function computeYearlyData(data, referenceCount, dataSelector) {
        $.each(bib.filteredEntries, function (id, entry) {
            var passedFilter = bib.filteredEntries[id] ? true : false;
            var year = parseFloat(entry['year']);
            if (!year) {
                return;
            }
            if (isNaN(year)) {
                return;
            }
            if (computeYearRange) {
                minYear = Math.min(year, minYear);
                maxYear = Math.max(year, maxYear);
            }

            if (passedFilter) {
                if (year in data) {
                    data[year] += 1;
                } else {
                    data[year] = 1;
                }
            }

            if (citations) {
                var referencesOutgoing = bib.filteredReferences[id].referencesOutgoing;
                var referencesIncoming = bib.filteredReferences[id].referencesIncoming;
                if (passedFilter) {
                    if (year in referenceCount) {
                        referenceCount[year] += (referencesIncoming ? referencesIncoming.length : 0);
                        referenceCount[year] += ((!referencesIncoming && referencesOutgoing) ? 1 : 0);
                    } else {
                        referenceCount[year] = (referencesIncoming ? referencesIncoming.length : 0);
                        referenceCount[year] += ((!referencesIncoming && referencesOutgoing) ? 1 : 0);
                    }
                }
                references[id] = {};
                references[id]["year"] = year;
                references[id]["referencesIncoming"] = referencesIncoming;
                references[id]["referencesIncomingCount"]
                    = (passedFilter && referencesIncoming ? referencesIncoming.length : 0);
                maxIncomingCount = Math.max(maxIncomingCount, references[id]["referencesIncomingCount"]);
                minIncomingCount = Math.min(minIncomingCount, references[id]["referencesIncomingCount"]);
                references[id]["referencesOutgoing"] = referencesOutgoing;
                references[id]["referencesOutgoingCount"]
                    = (passedFilter && referencesOutgoing ? referencesOutgoing.length : 0);
                references[id]["belowMinCitations"] = references[id]["referencesIncomingCount"] < citations.minCitationCount;
            }
            if (passedFilter) {
                $.each(selectors.getSelectors(), function (i, selector) {
                    if (selector) {
                        if (!dataSelector[i]) {
                            dataSelector[i] = {};
                        }
                        if (!dataSelector[i][year]) {
                            dataSelector[i][year] = 0;
                        }
                        var sim = bib.entrySelectorSimilarities[id][i];
                        if (sim) {
                            dataSelector[i][year] += sim;
                        }
                    }
                });
            }
        });

        // prevent bogus years from creating really awful errors
        var someFutureYear = ( new Date().getFullYear() ) + 2;
        var somePastYear = 1950;
        if (maxYear > someFutureYear) maxYear = someFutureYear;
        if (minYear < somePastYear) minYear = somePastYear;
    }

    function toggleCitationSelector(id) {
        toggleSelector('search', id, d3.event);
    }

    function drawTimeline(displayHeight, timelineDiv, dataSelector) {
        if (citations) {
            displayHeight = height + (drawSize * maxBlocks);
            // console.log("full height " + displayHeight);
            displayHeight = Math.max(displayHeight, 150);
        }

        var chart = d3.select('#timeline').append('svg')
            .attr('class', 'chart')
            .style('border', '1px solid black')
            .attr('height', displayHeight + 'px');
        var width = timelineDiv.width() - 3;
        chart.attr('width', width + 'px');
        var barWidth = width / (maxYear - minYear + 1);
        var publicationHeight = height / (maxFrequency + 1);
        var referenceHeight = (drawSize * maxFrequency) / (maxFrequency + 1);

        drawBackground(barWidth, chart, displayHeight, publicationHeight, width);
        drawFrequencyBars(chart, barWidth, publicationHeight);
        drawSelectorFrequencyBars(barWidth, dataSelector, chart, publicationHeight);
        if (citations) {
            drawCitations(chart, barWidth, referenceHeight);
        }

        generateTooltips(timelineDiv, barWidth);
    }

    function drawBackground(barWidth, chart, displayHeight, publicationHeight, width) {
        var yearIntervalIndex = 0;
        while (yearIntervalIndex < niceIntervals.length - 1 && (maxYear - minYear) / niceIntervals[yearIntervalIndex] > maxYearIntervals) {
            yearIntervalIndex++;
        }
        var yearIntervalLength = niceIntervals[yearIntervalIndex];
        for (var intervalYear = minYear - minYear % yearIntervalLength; intervalYear <= maxYear; intervalYear += yearIntervalLength) {
            var x = (intervalYear - minYear) * barWidth;
            var even = intervalYear % (2 * yearIntervalLength) == 0 ? 'Even' : 'Uneven';
            chart.append('rect').attr('class', 'period' + even)
                .attr('shape-rendering', 'crispEdges')
                .attr('x', x)
                .attr('y', -1)
                .attr('width', yearIntervalLength * barWidth)
                .attr('height', displayHeight + 2)
                .style('fill', even == 'Even' ? '#FFFFFF' : '#CCCCCC');
            chart.append('text').attr('class', 'period' + even)
                .attr('x', x + 1)
                .attr('y', height / 5).text(intervalYear)
                .style('font-size', '14pt')
                .style('fill', even != 'Even' ? '#FFFFFF' : '#CCCCCC');
        }
        var frequencyIntervalIndex = 0;
        while (frequencyIntervalIndex < niceIntervals.length - 1 && maxFrequency / niceIntervals[frequencyIntervalIndex] > maxFrequencyIntervals) {
            frequencyIntervalIndex++;
        }
        var frequencyIntervalLength = niceIntervals[frequencyIntervalIndex];
        for (var i = frequencyIntervalLength; i <= maxFrequency; i += frequencyIntervalLength) {
            var y = height - publicationHeight * i;
            chart.append('line')
                .attr('x1', 0)
                .attr('y1', y)
                .attr('x2', width)
                .attr('y2', y)
                .style('stroke', 'black')
                .attr('shape-rendering', 'crispEdges')
                .attr('stroke-opacity', 0.15)
                .style('stroke-width', '1px');
            chart.append('text')
                .attr('x', 0)
                .attr('y', y + 12)
                .style('font-size', '12pt')
                .text(i);
        }
        return {x: x, y: y};
    }

    function drawFrequencyBars(chart, barWidth, publicationHeight) {
        chart.selectAll('svg').data(d3data).enter().append('rect')
            .attr('class', 'bar total tooltip')
            .style('fill', '#EEEEEE')
            .style('stroke', 'black')
            .attr('shape-rendering', 'crispEdges')
            .attr('x', function (d) {
                return (d.key - minYear) * barWidth;
            })
            .attr('y', function (d) {

                return height - publicationHeight * d.value;

            })
            .attr('width', barWidth)
            .attr('height', function (d) {
                return publicationHeight * d.value + 1;
            })
            .attr('title', function (d) {
                return d.key + ': ' + d.value + ' publications';
            })
            .on('click', function (d) {
                toggleSelector('year', d.key, d3.event);
            });
    }

    function drawSelectorFrequencyBars(barWidth, dataSelector, chart, publicationHeight) {
        var j = 0;
        var nActiveSelectors = selectors.getNActiveSelectors();
        var barWidthSelector = (barWidth - 1) / nActiveSelectors;
        $.each(selectors.getSelectors(), function (i, selector) {
                if (selector && !selector['lock']) {
                    var d3dataSelector = d3.entries(dataSelector[i]);
                    d3dataSelector = d3dataSelector.sort(function (a, b) {
                        return d3.ascending(a.key, b.key);
                    });
                    chart.selectAll('svg').data(d3dataSelector).enter().append('rect')
                        .attr('class', 'bar fill')
                        .attr('shape-rendering', 'crispEdges')
                        .style('fill', selectorColors[i])
                        .attr('x', function (d) {
                            return 0.5 + (d.key - minYear) * barWidth + j * barWidthSelector;
                        })
                        .attr('y', function (d) {
                            return height - publicationHeight * d.value + 0.5;
                        })
                        .attr('width', barWidthSelector)
                        .attr('height', function (d) {
                            return publicationHeight * d.value;
                        })
                        .on('click', function (d) {
                            toggleSelector('year', d.key, d3.event);
                        });
                    j++;
                }
            }
        );
    }

    function drawCitations(chart, barWidth, referenceHeight) {
        // draw bars, save position of center of references
        var currentHeight = {};
        var linkPoints = {};
        chart.selectAll('svg').data(d3references).enter().append('rect')
            .attr('class', function (d) {
                return 'citation tooltip' +
                    (d.value["belowMinCitations"] ? ' tmp' : '')
            })
            .attr('shape-rendering', 'crispEdges')
            .style('stroke', function (d) {
                return d.value["belowMinCitations"] ? '#AAAAAA' : 'black';
            })
            .style('fill', function (d) {
                return (d.value["color"] ? d.value["color"] : '#FFFFFF');
            })
            .attr('x', function (d) {
                var pos = (d.value["year"] - minYear) * barWidth;
                d.value["linkX"] = pos;
                return pos;
            })
            .attr('y', function (d) {
                if (!(d.value["year"] in currentHeight)) {
                    currentHeight[d.value["year"]] = 0;
                }
                var drawStart = (height + 1 + currentHeight[d.value["year"]]);
                d.value["linkY"] = drawStart;
                currentHeight[d.value["year"]] += referenceHeight;
                return drawStart;
            })
            .attr('width', barWidth)
            .attr('height', referenceHeight)
            .on('click', function (d) {
                toggleCitationSelector(d.key);
            })
            .attr("title", function (d) {
                return d.key + ' (cited by ' + d.value["referencesIncomingCount"] + ')';
            });
        chart.selectAll('.citation').sort(function (a, b) {
            return a.value['belowMinCitations'] ? -1 : 1;
        });


        // draw links as bars
        // find color for selected references
        $.each(references, function (id, value) {

            function drawSelectedOutgoingCitations() {
                var y = value["linkY"] + 0.5;
                var x = value["linkX"] + 0.5;
                var w = 1.0 / 3.0 * (barWidth - 1.0);
                var h = (referenceHeight - 1.0) / value["colorOutgoing"].length;
                value["colorOutgoing"].forEach(function (color) {
                    chart.append('rect')
                        .style('fill', color)
                        .attr('shape-rendering', 'crispEdges')
                        .attr('y', y)
                        .attr('x', x)
                        .attr('height', h)
                        .attr('width', w)
                        .on('click', function (d) {
                            toggleCitationSelector(id);
                        })
                        .append("svg:title")
                        .text(function (d) {
                            return id + ' (cited by ' + value["referencesIncomingCount"] + ')';
                        });
                    y += h;
                });
            }

            function drawSelectedIncomingCitations() {
                var y = value["linkY"] + 0.5;
                var x = value["linkX"] + 2.0 / 3.0 * barWidth - 0.5;
                var w = 1.0 / 3.0 * barWidth;
                var h = (referenceHeight - 1.0) / value["colorIncoming"].length;
                // console.log("Incoming " + id + " " + x + " " + y + " " + h + " "
                //             + value["colorIncoming"].length);
                value["colorIncoming"].forEach(function (color) {
                    chart.append('rect')
                        .attr('shape-rendering', 'crispEdges')
                        .style('fill', color)
                        .attr('y', y)
                        .attr('x', x)
                        .attr('height', h)
                        .attr('width', w)
                        .on('click', function (d) {
                            toggleCitationSelector(id);
                        })
                        .append("svg:title")
                        .text(function (d) {
                            return id + ' (cited by ' + value["referencesIncomingCount"] + ')';
                        });
                    y += h;
                });
            }

            if (value["colorOutgoing"] && value["colorOutgoing"].length > 0) {
                drawSelectedOutgoingCitations();
            }
            if (value["colorIncoming"] && value["colorIncoming"].length > 0) {
                drawSelectedIncomingCitations();
            }


        });
    }

    function generateTooltips(timelineDiv, barWidth) {
        timelineDiv.find('.tooltip').tooltipster({
            theme: 'tooltipster-survis',
            offsetX: (barWidth / 2) + 'px',
            offsetY: '-3px'
        });
    }

    function initCitationControls(timelineDiv) {
        if (citations) {
            $('<div>', {
                class: 'label',
                text: '#citations per publication'
            }).appendTo(timelineDiv);
            var citationsColorsDiv = $('<div>', {
                id: 'citation_colors'
            }).appendTo(timelineDiv);
            $('<div>', {
                class: 'label',
                text: '1'
            }).appendTo(citationsColorsDiv);
            $('<div>', {
                class: 'color_scale'
            }).appendTo(citationsColorsDiv);
            $('<div>', {
                class: 'label',
                text: maxIncomingCount
            }).appendTo(citationsColorsDiv);
            var citationOccurrenceDiv = $('<div>', {
                class: 'cit_occurrence',
                text: 'min #citations ',
                title: 'choose the minimum number of citations (publications with fewer citations will not be displayed in the above citation representation)'
            }).appendTo(timelineDiv);
            citationOccurrenceDiv.tooltipster({
                theme: 'tooltipster-survis'
            });
            var buttonDec = $('<div>', {
                class: 'button dec small',
                text: '-'
            }).appendTo(citationOccurrenceDiv);
            buttonDec.click(function (event) {
                if (citations.minCitationCount > 1) {
                    citations.minCitationCount--;
                    window.updateTimeline();
                }
            });
            if (citations.minCitationCount < 1) {
                citations.minCitationCount = 1
            }
            $('<span>', {
                text: citations.minCitationCount
            }).appendTo(citationOccurrenceDiv);
            var buttonInc = $('<div>', {
                class: 'button inc small',
                text: '+'
            }).appendTo(citationOccurrenceDiv);
            buttonInc.click(function (event) {
                citations.minCitationCount++;
                window.updateTimeline();
            });
        }
    }
});
