// to answer my research question i need information from wikidata --> how do i get that? 
// --> by making a sparql query and collecting the results 
// how do i place a sparql query in javascript? --> build a variable that i can refer to later and define it, to let the text span several lines, we are using backticks: `

const query = `SELECT DISTINCT ?disease ?diseaseLabel ?gene ?geneLabel 
WHERE { 
  { SELECT ?disease (MAX(?prev) AS ?maxPrev)
           WHERE { ?disease wdt:P1995 wd:Q83042 ;
                            wdt:P1193 ?prev .
                  }
   GROUP BY ?disease
   ORDER BY DESC (?maxPrev)
   LIMIT 50
   }
  { ?disease wdt:P2293 ?gene } UNION { ?gene wdt:P2293 ?disease }
  ?gene wdt:P31 wd:Q7187 .
  SERVICE wikibase:label {bd:serviceParam wikibase:language "en,mul". }
  }
ORDER BY ?diseaseLabel `;

// send this query to wikidata --> how? --> glue the query to wikidata's address 
// we're using encodeURIComponent() to ensure the URL isn't misread because it can't handle some characters of the query (like "?" or spaces)
// the new variable url builds the 'envelope' with the web address and the query packed together

const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);

// actually send the 'envelope'
// sending over the internet takes time and js normally doesnt wait but just continues with the next line so we need to tell it to wait --> 'await' --> needs an async function to run
// fetch sends the request to a web address and gets its reply
// url is where to send it, {} are extra instructions {label: value}
// headers --> tell the server how you want things handled, accept --> the format i accept in return
// application/sparql-results+json --> the official name for "sparql results written as json"

async function main() {
    const response = await fetch(url, { headers: { Accept: "application/sparql-results+json" } });
    const data = await response.json();

    // look at the results of this query
    // console.log(data); 

    // console.log(data.results.bindings[200].diseaseLabel.value); tried these 2 lines to find pairs of disease and associated gene
    // console.log(data.results.bindings[200].geneLabel.value);
    // now lets do this for every row, not just one, so for each row take the disease and gene name and print them
    // now i want to collect the data, where every row is one disease-gene pair (one line), every line goes from a disease to a gene (one direction only), and all lines should be collected in one list
    // console.log(row.diseaseLabel.value, row.geneLabel.value); as sanity check to see the results printed in the live server

    // now i want every disease and every gene to become one dot, but i have to check for each new dot that it's not there yet, otherwise it could happen that one disease that appears in many rows would also have many dots
    // so only add a dot if i haven't added it yet
    // let's create a lookup table for each item where we either find an entry or nothing

    // now i want to include that some genes are linked to multiple diseases (my research question)
    // every gene starts with a count of 0
    // every time a row mentions this gene, the count goes up by 1

    const links = []; // [] --> list
    const nodes = {}; // look up table

    for (const row of data.results.bindings) {
        const disease = row.disease.value; // shortcut 
        const gene = row.gene.value; // shortcut

        links.push({ source: disease, target: gene });

        if (!nodes[disease]) {
            nodes[disease] = { id: disease, label: row.diseaseLabel.value, type: "disease" };
        }

        if (!nodes[gene]) {
            nodes[gene] = { id: gene, label: row.geneLabel.value, type: "gene", count: 0 };
        }
        nodes[gene].count++; // increase by one

    }

    // visualisation on the webpage: based on d3's "Force-directed graph" example (observablehq.com/@d3/force-directed-graph/2) 
    // first, i'll turn the lookup table into a plain list (best for d3)

    const nodeList = Object.values(nodes);                     // new: my lookup table as a list

    // colour rule, my own: matches the legend in index.html
    function nodeColour(d) {                                   // change from d3 template: replaces D3's colour scale
        if (d.type === "disease") return "#1f2a6b";
        if (d.count >= 2) return "#d6456a";
        return "#3fb0bf";
    }

    const width = 928;
    const height = 600;

    const simulation = d3.forceSimulation(nodeList)            // change from d3 template: nodes → nodeList
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.05))        // added: keeps separate clusters from drifting apart
        .force("y", d3.forceY(height / 2).strength(0.05))       // same for y 
        .on("tick", ticked);

    const svg = d3.select("#graph")                            // change from d3 template: use my svg, don't create a new one
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    // zoom and pan: based on D3's zoom examples
    const container = svg.append("g");                   // one box that holds the whole drawing

    svg.call(d3.zoom()
        .scaleExtent([0.3, 3])                           // zoom out to 30%, in to 300%
        .on("zoom", event => container.attr("transform", event.transform)));

    const link = container.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll()
        .data(links)
        .join("line");                                           // added: removed stroke-width (my links have no "value")

    const node = container.append("g")
        // .attr("stroke", "#fff") // i like it more without the white shell
        // .attr("stroke-width", 1.5)
        .selectAll()
        .data(nodeList)                                          // change from d3 template: nodes --> nodeList
        .join("circle")
        .attr("r", 5)
        .attr("fill", nodeColour);                             // change from d3 template: my colour rule

    // names: diseases always visible, gene names only on hover
    const label = container.append("g")
        .selectAll()
        .data(nodeList)                                          // now all dots get a label
        .join("text")
        .text(d => d.label)
        .attr("font-size", 12)
        .attr("dx", 7)
        .attr("dy", 3)
        .attr("opacity", d => d.type === "disease" ? 1 : 0)    // genes start invisible
        .style("pointer-events", "none");                      // names don't block the mouse


    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node
        .on("mouseover", (event, d) => {                        // added: show gene name on hover
            label.filter(l => l === d).attr("opacity", 1);     
        })
        .on("mouseout", (event, d) => {
            if (d.type !== "disease") {
                label.filter(l => l === d).attr("opacity", 0); // hide it again (genes only)
            }
        });

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    }

    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
}

main();