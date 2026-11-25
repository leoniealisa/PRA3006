# PRA3006

Neurological diseases and their treatments are of great significance in medicine, as they unfortunately affect a large number of individuals. They encompass a wide range of manifestations, consequences, and potential treatment methods. To reduce the number of affected individuals, it is essential to examine the underlying causes. This is why this project is investigating whether some of these diseases are associated with common genes. Such research could provide insights into the root causes and potentially lead to new approaches for prevention or treatment.

## Research Question: 
Which neurological diseases share the same genes according to Wikidata?

### To open the website, please click this link:
[here](https://leoniealisa.github.io/PRA3006/) 

## Methods

To be able to answer this research question I created a SPARQL query which extracts diseases that have the health specialty «Neurology» (P1995). My original research question was 'Which brain diseases share the same genes according to Wikidata' but I had to adjust due to the information Wikidata has stored. I got 456 results but I wanted to focus on the most common ones so I ranked them by prevalence (P1193) to find the 50 most common neurological diseases. Then I added the property «genetic association» (P2293) to the query to find associated genes. I checked this link in both directions, because sometimes Wikidata stores it on the disease and sometimes on the gene. I only kept items that are actually genes (instance of «gene», P31). Of the 50 most prevalent neurological diseases on Wikidata, 32 have gene associations, so those are the diseases shown in the graph. 

I added the query to my JavaScript file (script.js), which sends it to the Wikidata SPARQL endpoint and receives the results in JSON format. Each result row is one disease-gene pair. 

To visualise the data, I transformedd these rows into two lists: one list of nodes (where every disease and every gene appears only once) and one list of links (one line per disease-gene pair). For each gene I looked whether it was linked to one or more diseases and if it was at least two diseases it counts as a shared gene.

The graph itself is a force-directed graph made with D3.js, based on D3's "Force-directed graph" example from [https://observablehq.com/@d3/force-directed-graph/2]. I adapted it to my data: the nodes are colored by type (disease, gene linked to one disease, and shared gene). Disease names are always shown, but genes are not labeled as that would lead to illegibility in areas where they are crowded. Instead, a gene's name appears when they are hovered over. 

## Discussion

The website shows diseases and genes as nodes and associations as edges. Diseases are dark blue, gnes that are associated to one disease only are presented in light blue and genes that are shared by at least two diseases are colored in red. In total, the graph contains 32 diseases and 375 genes, of which 46 are shared by at least two diseases. For example Alzheimer's disease and multiple sclerosis share the genes "RELN" and "CSMD1". 
The largest cluster belongs to Charcot-Marie-Tooth disease. However, this is partly because Wikidata lists both the general disease and several of its subtypes (such as type 1A), and the subtypes' genes are also linked to the general disease. These shared genes therefore reflect the same disease at different levels of detail, rather than different diseases sharing genes. 
Overall, the graph gives an answer to the research question based on the data Wikidata currently has, but it should be seen as an overview of what is recorded, not as a complete picture of the genetics of these diseases. 

## Limitations

As I decided on selecting via prevalence, only diseases with prevalence data on Wikidata were included so it could be that common diseases that do not have this data are missing. Also, the cut-off at 50 diseases is a choice I made and could have been another number. 18 of the 50 most prevalent diseases have no genes linked in Wikidata so they do not appear in the graph. Some diseases, as mentioned earlier, appear both in their general term and as subtypes (e.g. Charcot-Marie-Tooth disease), which inflates the number of shared genes. As Wikidata changes constantly, it is possible that, if the query is run later, the results discussed differ from this README.
