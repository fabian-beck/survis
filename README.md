# SurVis - Visual Literature Browser

![Screenshot](/doc/survis.png)

SurVis is a flexible online browser to present and analyze scientific literature. The system is made for authors of survey articles, theses, or books who want to share their references in a user-friendly way. All you need to start is a bib file and a list of keywords for your papers.

Test SurVis with a reference literature database: http://dynamicgraphs.fbeck.com

## How To Use SurVis for Your Literature Collection

Dowload the [latest SurVis release](https://github.com/fabian-beck/survis/releases/latest) or fork this repository.

To start SurVis, open 'src/index.html' in your browser.

The bibliography data is stored in 'bib/references.bib' in BibTeX format.

Supplemental data is contained in 'src/data/':
* 'tag_categories.js': list of special tag categories; they can be used as a prefix for the tags and appear, for instance, 'a:b' refers to tag 'b' in tag category 'a'
* 'authorized_tags.js': tags that are defined through a description (highlighted in SurVis, description appears as a tooltip)
* 'search_stopwords.js': a list of stopwords used to exclude terms from search queries
* 'papers_pdf' (optional): PDF files of the papers, please use the BibTeX id as a file name
* 'papers_img' (optional): PNG thumbnails for the papers, please use the BibTeX id as a file name

Please do not edit the files in 'src/data/generated/' because they are created automatically. 

After completing your changes, just run 'update_data.py' with Python 3. Reload SurVis in the browser to see the changed bibliography. The script will continue to check for updates on the bib file until you stop it.

If the edit mode is activated, BibTeX entries can be modified in the browser, but are not stored in the 'bib' directory. To make those changes persistent, use 'download BibTex' in SurVis and copy the BibTeX data to your bib file in the 'bib' directory. You can also use the features to save and load the data from local storage of the browser; be careful, however, these features are still experimental.

Further properties of SurVis, such as the title of the page, can be modified in the file 'src/properties.js'. For the publication of your literature collection, you should usually deactivate the edit mode in the properties ('editable = false;').

Enjoy SurVis and send feedback if you like.

## Learn more

We've published a paper about SurVis at VAST 2015 - please reference it if you use or want to refer to SurVis in one of your publications. 

Beck, Fabian; Koch, Sebastian; Weiskopf, Daniel: Visual Analysis and Dissemination of Scientific Literature Collections with SurVis. In: IEEE Transactions on Visualization and Computer Graphics (2016).

* DOI: http://dx.doi.org/10.1109/TVCG.2015.2467757
* Preview video: https://vimeo.com/136206061 

## List of Literature Collections Using SurVis

* Dynamic Graph Visualization - http://dynamicgraphs.fbeck.com
* Visualizing Group Structures in Graphs - http://groups-in-graphs.corinna-vehlow.com/
* Performance Visualization - http://idav.ucdavis.edu/~ki/STAR/
* Visualization for Software Reuse - http://www.cos.ufrj.br/~schots/survis_reuse/
* Sparklines - http://sparklines-literature.fbeck.com/
* Survey of Surveys - http://sos.swansea.ac.uk/
* Visual Approaches for Analyzing Scientific Literature and Patents - http://ieg.ifs.tuwien.ac.at/~federico/LiPatVis/
* Visualizing High-Dimensional Data - http://www.sci.utah.edu/~shusenl/highDimSurvey/website/
* Visualization of Cultural Heritage Collection Data - https://danubevislab.github.io/collectionvis/
* Survey of Visual Summaries - http://graphics.cs.wisc.edu/Vis/vis_summaries/
* Optimization of Parallel Computing Systems - http://www.smemeti.com/slr/
* Deep Learning Visualizations - https://snie2012.github.io/deep-learning-vis-collection/
* Visualization in Astrophysics - https://tdavislab.github.io/astrovis-survis/
* Categorical Visualisation Techniques - https://cat-vis.github.io/src/

Please contact me (fabian.beck@uni-bamberg.de) if you know other collections using SurVis.

## Contact

Fabian Beck

http://research.fbeck.com
