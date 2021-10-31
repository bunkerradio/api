const path = require('path');
const Lyrics = require(path.join(__dirname, "./inc/lyrics"));
const lyrics = new Lyrics();

lyrics.search("Ed Sheeran");