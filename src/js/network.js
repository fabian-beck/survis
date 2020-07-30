const network = (function () {

    return {
        hidden: true,
        minKeywordFrequency: null,
        minEdgeWeight: 0.5,
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
        const nEntries = Object.keys(bib.entries).length;
        const nodes = Object.keys(bib.keywordFrequencies)
            .filter(keyword => bib.keywordFrequencies[keyword] >= network.minKeywordFrequency)
            .map(keyword => { return { 'id': keyword, 'frequency': bib.keywordFrequencies[keyword] }; });
        const links = [];
        nodes.forEach(nodeA => {
            nodes.forEach(nodeB => {
                if (nodeA.id != nodeB.id) {
                    let intersectionSize = 0;
                    Object.keys(bib.parsedEntries).forEach(entry => {
                        if (bib.parsedEntries[entry].keywords.indexOf(nodeA.id) >= 0 && bib.parsedEntries[entry].keywords.indexOf(nodeB.id) >= 0) {
                            intersectionSize += 1;
                        }
                    });
                    const weight = intersectionSize / bib.keywordFrequencies[nodeA.id];
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
            .attr('stroke', 'black')
            .attr('stroke-opacity', d => Math.pow(d.importance, 0.9))
            .attr('stroke-width', d => network.edgeStrength + 2 * Math.pow(d.weight, 5))
            .attr('stroke-dasharray', d => d.weight > 0.99999?'4 1':'');

        const node = chart.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(graph.nodes)
            .enter()
            .append('g');
            
            node.append('circle')
            .attr('r', d => 3 + Math.sqrt(d.frequency) * 0.2)
            .attr('fill', '#999')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        node.append('text')
            .text(d => d.relativeImportance > 0.1 ? d.id : '')
            .attr('x', d => 6 + Math.sqrt(d.frequency) * 0.2)
            .attr('y', d => 3 + Math.sqrt(d.frequency) * 0.2);

        node.append('title')
            .text(d => d.id);

        network.simulation
            .nodes(graph.nodes)
            .on('tick', ticked);

        network.simulation.force('link')
            .links(graph.links);

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
    }

})();

