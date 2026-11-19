const query = `
SELECT DISTINCT ?disease ?diseaseLabel ?gene ?geneLabel WHERE {
  {
    SELECT ?disease (MAX(?prev) AS ?maxPrev) WHERE {
      ?disease wdt:P1995 wd:Q83042 ;
               wdt:P1193 ?prev .
    }
    GROUP BY ?disease
    ORDER BY DESC(?maxPrev)
    LIMIT 50
  }
  { ?disease wdt:P2293 ?gene } UNION { ?gene wdt:P2293 ?disease }
  ?gene wdt:P31 wd:Q7187 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?diseaseLabel`;

async function main() {
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);
    const res = await fetch(url, { headers: { Accept: "application/sparql-results+json" } });
    const data = await res.json();
    console.log(data.results.bindings);

    const nodes = new Map();
    const links = [];
    
    for (const row of data.results.bindings) {
        const d = row.disease.value;
        const g = row.gene.value;
        if (!nodes.has(d)) nodes.set(d, { id: d, label: row.diseaseLabel.value, type: "disease" });
        if (!nodes.has(g)) nodes.set(g, { id: g, label: row.geneLabel.value, type: "gene", count: 0 });
        nodes.get(g).count++;
        links.push({ source: d, target: g });
    }
    const nodeArray = [...nodes.values()];

    console.log(nodeArray, links);

    const svg = d3.select("#graph");
    const width = svg.node().clientWidth, height = 700;

    const g = svg.append("g");   

    svg.call(d3.zoom()
    .scaleExtent([0.1, 5])                                   
    .on("zoom", (event) => g.attr("transform", event.transform)));

    const sim = d3.forceSimulation(nodeArray)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-60))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.05))   
        .force("y", d3.forceY(height / 2).strength(0.05)); 

    const link = g.append ("g").selectAll("line").data(links).join("line")
    .attr("stroke", "#ccc");


    const node = g.append("g").selectAll("circle").data(nodeArray).join("circle")
    .attr("r", d => d.type === "disease" ? 8 : 5)
    .attr("fill", d => d.type === "disease" ? "#282e62" : d.count >= 2? "#e1556f" : "#2bb1bd");

    node.append("title").text(d => d.label);
    
    node.call(d3.drag()
    .on("start", (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
    })
    .on("drag", (event, d) => {
        d.fx = event.x; d.fy = event.y;
    })
    .on("end", (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
    }));

    const label = g.append("g").selectAll("text")
        .data(nodeArray.filter(d => d.type === "disease"))
        .join("text")
        .text(d => d.label)
        .attr("font-size", 11)
        .attr("dx", 10)
        .attr("dy", 4);


    sim.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x).attr("y", d => d.y);
    });


}

main();

