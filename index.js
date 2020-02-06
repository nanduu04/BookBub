'use strict';

const program = require('commander');
const util = require('util');
const lodash = require('lodash');
const fs = require('fs');

let booksFile;
let keywordsFile;

program.version('1.0.0').option('-b, --booksPath [path]', 'books file path')
.option('-k, --keywordsPath [path]', 'keywords file path')
.parse(process.argv);


const readKeywords = function readKeywords() {
  return new Promise((resolve, reject) => {
    fs.readFile(keywordsFile, 'utf8', (err, genreKeyVals) => {
      if(err) {
        console.log(`ERROR: Failure loading keyword weights ${util.inspect(err, false, null)}`);
        reject(err);
      } else {
        genreKeyVals = genreKeyVals.split(/\r?\n/);
        genreKeyVals = genreKeyVals.map((str) => {
          return str.split(', ');
        });
        let genreKeywords = {};
        genreKeyVals.forEach((arr, i) => {
          if (i > 0) {
            if(lodash.isUndefined(genreKeywords[arr[1]])) {
              genreKeywords[arr[1]] = {};
              genreKeywords[arr[1]].genreWeights = [];
            }
            genreKeywords[arr[1]].genreWeights.push([arr[0], arr[2]]);
          }
        });
        resolve(genreKeywords);
      }
    });
  });
};

const loadBooks = function loadBooks(sortType = 'asc') {
  return new Promise((resolve, reject) => {
    sortType = sortType.toLowerCase();
    if (sortType !== 'desc' || sortType !== 'asc') {sortType = 'asc'; }

    fs.readFile(booksFile, (err, json) => {
      if(err) {
        console.log(`ERROR: Failure reading the books database ${util.inspect(err, false, null)}`);
        reject(err);
      } else {
        let books = JSON.parse(json);
        books = lodash.sortBy(books, ['title'], sortType);
        resolve(books);
      }
    });
  });
};


const setPaths = function setPaths(_booksFile, _keywordsFile) {
  booksFile = _booksFile;
  keywordsFile = _keywordsFile;
}



const calculateGenres = function calculateGenres(books, genreWeights) {
  
  let keywords = Object.keys(genreWeights);
  let keywordRegex = getKeywordRegex(keywords);
  let bookGenres = [];

  books.forEach((book) => {
    let allMatches = book.description.match(keywordRegex);
    let matchedWords = [];
    let genre = {
      book: book,
      genres: []
    };
    if (allMatches !== null) {
      allMatches.forEach((match) => {
        matchedWords.push(match);
      });
      genre.genres = calculateGenreScore(matchedWords, genreWeights);
    }
    bookGenres.push(genre);
  });
  return bookGenres;
};

const getKeywordRegex = function getKeywordRegex(keyWords) {
  let regexes = [];
  keyWords.forEach((keyword) => {
    regexes.push(`(${keyword})`); 
  });
  return new RegExp(regexes.join('|'), 'gim');
};

const outputResults = function outputResults(bookGenres) {
  console.log('\n');
  bookGenres.forEach((book, idx) => {
    if (idx) {
      console.log('\n');
    }
    console.log(book.book.title);
    book.genres.forEach((genre, idx) => {
      console.log(`${genre[0]}, ${genre[1]}`);
    });
  })
  console.log('\n');

};



const calculateGenreScore = function calculateGenreScore(matchedKeywords, genreKeywords) {
  
  let uniqueWords = new Set(matchedKeywords);
  let genres = {};
  uniqueWords = [...uniqueWords];

  //Perhaps these for loops can be reduced
  uniqueWords.forEach((uniqueWord) => {
    let genrePairs = genreKeywords[uniqueWord].genreWeights;
    genrePairs.forEach((genrePair) => {
      let genre = genrePair[0];
      let pointVal = genrePair[1];
      if(genres.hasOwnProperty(genre) === false) {
        genres[genre] = {};
        genres[genre].points = [];
      }
      genres[genre].points.push(pointVal);
    });
  });

  matchedKeywords.forEach((matchedKeyword) => {
    let genrePairs = genreKeywords[matchedKeyword].genreWeights;
    genrePairs.forEach((genrePair) => {
      let genre = genrePair[0];
      if(lodash.isUndefined(genres[genre].matchCount)) {
        genres[genre].matchCount = 0;
      }
      genres[genre].matchCount = genres[genre].matchCount + 1;
    });
  });

  let genreScores = [];
  for(let genre in genres) {
    let genreTotal = genres[genre].points.reduce((j, i) => parseInt(j) + parseInt(i));
    let genreAvg = genreTotal / genres[genre].points.length;
    let finalScore = genres[genre].matchCount * genreAvg;
    genreScores.push([genre, finalScore]);
  }
  return genreScores;
};

const main = function main() {
  let genreWeights;
  let allPromises = [];
  let books;
  setPaths(program.booksPath, program.keywordsPath);

  allPromises.push(loadBooks().then((_books) => {
    books = _books;
  }).catch((error) => {
    console.log(`ERROR: An error has occured in loadBooks() -> ${util.inspect(error, false, null)}`);
  }));

  allPromises.push(readKeywords().then((_genreKeyVals) => {
    genreWeights = _genreKeyVals;
  }).catch((error) => {
    console.log(`ERROR: An error has occured in readKeywords() -> ${util.inspect(error, false, null)}`);
  }));
  Promise.all(allPromises).then(() => {
    let bookGenres = calculateGenres(books, genreWeights);
    outputResults(bookGenres);
    return 0;
  }).catch((error) => {
    console.log(`ERROR: Could not get all the required data -> ${util.inspect(error, false, null)}`);
    return 1;
  });
};


main();