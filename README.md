# Bookbub book genre test

Author: Nandu Pokhrel
Requires: Node 10.16.3


## Description
The application takes two arguments a json file with an array of books objects which contains title and description, csv with genre, keyword, points at least. Results are displayed to standard out.  Genre score is calculated based on the total number of keywords. It shows up in the description multiplied by the average point value of all the unique keywords for that genre. 


## Execution

Run an npm install, and then run the index file as specified below

### Node
1) npm install
2) node index.js -b <path to books file> -k <path to genre keyword csv>


## Remaining Tasks
Error granular error handling to display more content with the displayed error. 
Compress loops to improve efficiency 
Revist data structures to improve the efficiency 
Revist regex to make sure it isn't matching excluded substring. 
Validation on imputed file with existence of path 
Validation on contents to make sure that they are of the correct structure.
The loading files in the memory do not scale, need to refactor to steam or read the parts. We presume that the data could not be offloaded to more efficient storage which supports paginated queries.