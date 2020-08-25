const network = (function () {

    return {
        hidden: true,
        minKeywordFrequency: null,
        minEdgeWeight: 0.7,
        edgeStrength: 1.0,
        update: function () {
            $('#network_vis').empty();
            if (this.hidden) return;
            const width = $('#timeline').width() - 3;
            const height = width * 0.75;
            var chart = d3.select('#network_vis')
                .append('svg')
                .attr('class', 'chart')
                .style('border', '1px solid black')
                .attr('height', height + 'px')
                .attr('width', width + 'px')
                .append('svg:g');
            d3.select('#network_vis').call(d3.zoom().on("zoom", function () {
                chart.attr("transform", d3.event.transform)
            }));
            graph = computeGraph();
            layout(graph, chart, width, height);
        }
    }

    function computeGraph() {
        const nEntries = Object.keys(bib.filteredEntries).length;
        const nodes = Object.keys(bib.keywordFrequencies)
            .filter(keyword => bib.keywordFrequencies[keyword] >= network.minKeywordFrequency)
            .map(keyword => { return { 'id': keyword, 'frequency': bib.keywordFrequencies[keyword] }; });
        const links = [];
        const keywordCoOccurrence = {};
        Object.keys(bib.filteredEntries).forEach(entry => {
            const keywords = bib.parsedEntries[entry].keywords;
            keywords.forEach(keywordA => {
                if (!keywordCoOccurrence[keywordA]) keywordCoOccurrence[keywordA] = {};
                keywords.forEach(keywordB => {
                    if (!keywordCoOccurrence[keywordA][keywordB]) keywordCoOccurrence[keywordA][keywordB] = 0;
                    keywordCoOccurrence[keywordA][keywordB] += 1;
                });
            });
        });
        nodes.forEach(nodeA => {
            nodes.forEach(nodeB => {
                if (nodeA.id != nodeB.id) {
                    const weight = keywordCoOccurrence[nodeA.id][nodeB.id] / bib.keywordFrequencies[nodeA.id];
                    if (weight > network.minEdgeWeight) {
                        links.push({
                            'source': nodeA.id,
                            'target': nodeB.id,
                            'weight': weight,
                        });
                    }
                }
            });
        });
        links.forEach(linkA => {
            linkA.importance = Math.min(bib.keywordFrequencies[linkA.source], bib.keywordFrequencies[linkA.target])
                / Math.max(bib.keywordFrequencies[linkA.source], bib.keywordFrequencies[linkA.target]);
        });
        nodes.forEach(node => {
            let neighborhoodNodeSizes = 0;
            links.forEach(link => {
                if (link.source === node.id) {
                    neighborhoodNodeSizes += bib.keywordFrequencies[link.target];
                }
            });
            node.relativeImportance = Math.pow(bib.keywordFrequencies[node.id] / nEntries, 0.5)
                * Math.pow(bib.keywordFrequencies[node.id] / Math.max(bib.keywordFrequencies[node.id], neighborhoodNodeSizes), 0.5);
        });
        return { links, nodes };
    }

    function layout(graph, chart, width, height) {
        const defaultNodeColor = '#999';
        const highlightedNodeColor = 'black';
        const highlightedNodeColor2 = '#666';
        const nLabels = 15;
        const minLabelsRatio = 0.2;

        network.simulation = d3.forceSimulation()
            .force('link', d3.forceLink()
                .id(d => d.id)
                .strength(link => network.edgeStrength * (0.9 * link.importance * link.weight + 0.1)))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('x', d3.forceX(width / 2))
            .force('y', d3.forceY(height / 2))

        const link = chart.append('g')
            .attr('fill', 'none')
            .selectAll('path')
            .data(graph.links)
            .join('path')
            .attr('class', 'link')
            .attr('stroke', 'black')
            .attr('stroke-opacity', d => Math.pow(d.importance, 0.9))
            .attr('stroke-width', d => network.edgeStrength + 2 * Math.pow(d.weight, 5))
            .attr('stroke-dasharray', d => d.weight > 0.99999 ? '4 1' : '');

        const node = chart.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(graph.nodes)
            .enter()
            .append('g')
            .attr('class', 'node-container')
            .attr('visibility', 'visible');

        node.append('circle')
            .attr('class', 'node')
            .attr('r', d => 3 + Math.sqrt(d.frequency) * 0.2)
            .attr('fill', defaultNodeColor)
            .attr('cursor', 'pointer')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended))
            .on('click', d => selectors.toggleSelector('keywords', d.id))
            .on('mouseover', d => {
                const highlightedNodeContainer = chart.selectAll('.node-container')
                    .filter(d2 => d2.id === d.id)
                    .classed('highlighted', true);
                highlightedNodeContainer
                    .selectAll('.node')
                    .attr('fill', highlightedNodeColor);
                highlightedNodeContainer
                    .selectAll('text')
                    .attr('font-weight', 'bold');
                const includeSelectedNode = [];
                const adjacentToSelectedNode = [];
                chart.selectAll('.link')
                    .filter(d2 => {
                        if (d2.source.id != d.id && d2.target.id != d.id) return true;
                        if (d2.source.id === d.id) {
                            includeSelectedNode.push(d2.target.id);
                            adjacentToSelectedNode.push(d2.target.id)
                        } else {
                            adjacentToSelectedNode.push(d2.source.id)
                        }
                        return false;
                    })
                    .attr('visibility', 'hidden');
                chart.selectAll('.node')
                    .filter(d2 => includeSelectedNode.indexOf(d2.id) >= 0)
                    .attr('fill', highlightedNodeColor2);
                chart.selectAll('.node-container')
                    .filter(d2 => adjacentToSelectedNode.indexOf(d2.id) < 0 && d2.id != d.id)
                    .attr('visibility', 'hidden');
                updateLabelVisibility();
            })
            .on('mouseout', () => {
                chart.selectAll('.node-container')
                    .attr('visibility', 'visible')
                    .classed('highlighted', false);
                chart.selectAll('.node')
                    .attr('fill', defaultNodeColor);
                chart.selectAll('.node-container text')
                    .attr('font-weight', 'normal');
                chart.selectAll('.link')
                    .attr('visibility', 'visible');
                updateLabelVisibility();
            });

        node.append('text')
            .text(d => d.id)
            .attr('pointer-events', 'none')
            .attr('x', d => 6 + Math.sqrt(d.frequency) * 0.2)
            .attr('y', d => 3 + Math.sqrt(d.frequency) * 0.2);

        network.simulation
            .nodes(graph.nodes)
            .on('tick', ticked);

        network.simulation.force('link')
            .links(graph.links);

        updateLabelVisibility();

        function ticked() {
            link.attr('d', linkArc);
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        }

        function dragstarted(d) {
            if (!d3.event.active) network.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) network.simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        function linkArc(d) {
            const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
            return `
              M${d.source.x},${d.source.y}
              A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
            `;
        }

        function updateLabelVisibility() {
            let relativeImportanceOfVisible = [];
            chart.selectAll('.node-container[visibility = "visible"]').each(d => relativeImportanceOfVisible.push(d.relativeImportance));
            relativeImportanceOfVisible = relativeImportanceOfVisible.sort((a, b) => b - a);
            const nLabelsAdapted = Math.floor(nLabels * (minLabelsRatio + (1 - minLabelsRatio) * relativeImportanceOfVisible.length / graph.nodes.length));
            const relativeImportanceLabelingThreshold = relativeImportanceOfVisible.length > nLabelsAdapted ? relativeImportanceOfVisible[nLabelsAdapted] : 0.0;
            node.selectAll('text')
                .attr('visibility', d => d.relativeImportance > relativeImportanceLabelingThreshold ? 'inherit' : 'hidden');
            node.filter(d => d.relativeImportance > relativeImportanceLabelingThreshold)
                .raise();
            chart.selectAll('.node-container.highlighted')
                .raise()
                .selectAll('text')
                .attr('visibility', 'visible');
        }
    }

})();