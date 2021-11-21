import fs from "fs";
import path from "path";

fs.readdir(path.join(__dirname, "../cache/data"), (err, files) => {
  if (err) throw err;
  files.forEach((file) => {
    fs.unlink(path.join(__dirname, "../cache/data/" + file), err => {
      if (err) throw err;
    });
  })
});

fs.readdir("./cache/art", (err, files) => {
  if (err) throw err;
  files.forEach((file) => {
    fs.unlink(path.join(__dirname, "../cache/art/" + file), err => {
      if (err) throw err;
    });
  })
});