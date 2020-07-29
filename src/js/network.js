const network = (function () {

    return {
        update: function () {
            $('#network').empty();
            const width = $('#timeline').width() - 3;
            const height = width;
            var chart = d3.select('#network').append('svg')
                .attr('class', 'chart')
                .style('border', '1px solid black')
                .attr('height', height + 'px');
            chart.attr('width', width + 'px');
            graph = computeGraph();
            layout(graph, chart, width, height);
        }
    }

    function layout(graph, chart, width, height) {
        network.simulation = d3.forceSimulation()
            .force('link', d3.forceLink()
                .id(d => d.id)
                .strength(link => link.strength))
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(width / 2, height / 2));

        const link = chart.append('g')
            .attr('fill', 'none')
            .attr('stroke-width', 1.5)
            .selectAll('path')
            .data(graph.links)
            .join('path')
            .attr('stroke', 'black')
            .attr('stroke-opacity', d => Math.pow(
                Math.min(bib.keywordFrequencies[d.source], bib.keywordFrequencies[d.target])
                / Math.max(bib.keywordFrequencies[d.source], bib.keywordFrequencies[d.target]), 0.9)
            )
            .attr('stroke-width', d => 0.5 + 2 * Math.pow(d.weight, 5));

        const node = chart.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(graph.nodes)
            .enter().append('g')

        node.append('circle')
            .attr('r', d => 3 + Math.sqrt(d.frequency) * 0.2)
            .attr('fill', '#999')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        node.append('text')
            .text(d => d.relativeImportance > 0.05 ? d.id : '')
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

    function computeGraph() {
        const nEntries = Object.keys(bib.entries).length;
        const nodes = Object.keys(bib.keywordFrequencies)
            .filter(keyword => bib.keywordFrequencies[keyword] > 5)
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
                    if (weight > 0.4) {
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
            linkA.degree = links.filter(linkB =>
                linkA.source === linkB.source || linkA.target === linkB.target
                || linkA.source === linkB.target || linkA.target === linkB.source
            ).length;
            linkA.strength =  Math.pow((Math.pow(linkA.weight, 0.2)) / Math.pow(linkA.degree, 0.5), 0.7)
        });
        console.log(links)
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

})();

