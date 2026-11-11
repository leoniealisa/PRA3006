# PRA3006

## practising the code for HTML files: 

```
<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>

<h1>My First Heading</h1>
<p>My first paragraph.</p>

</body>
</html>
```
[Example web page](https://leoniealisa.github.io/PRA3006/)

## preliminary research question: 
Which brain diseases share the same genes according to wikidata?

## Notes on how to go on about this project
- formulate the rigth SPARQL query that gives me all the defined brain diseases in wikidata (my chosen SPARQL endpoint)
- when I have this I will look at the prevalence so I can have a subset of the 50 most common brain diseases that I will focus on
- then I will perform analysis to answer my research question on JavaScript
- having the results I will work on visualising them and subsequently adding that to my website.

## SPARQL query (for diseases in wikidata that are connected to neurology)

SELECT ?diseaseLabel (COUNT(DISTINCT ?gene) AS ?genes) WHERE {
  ?specialty rdfs:label "neurology"@en .
  ?disease wdt:P1995 ?specialty .
  { ?gene wdt:P2293 ?disease } UNION { ?disease wdt:P2293 ?gene }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?disease ?diseaseLabel
ORDER BY DESC(?genes)
LIMIT 1000
