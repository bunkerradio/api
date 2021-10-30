import fs from 'fs';
fs.readdir("./cache/data", (err, files) => {
    if (err) throw err;
  
    files.forEach((file) => {
        fs.unlink("./cache/data/"+file, err => {
            if (err) throw err;
        });
    })
});

fs.readdir("./cache/art", (err, files) => {
    if (err) throw err;
  
    files.forEach((file) => {
        fs.unlink("./cache/art/"+file, err => {
            if (err) throw err;
        });
    })
});