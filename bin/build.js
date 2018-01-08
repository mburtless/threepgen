const fs = require('fs-extra');
const path = require('path');
const srcPath = './src';
const dstPath = './dst';

function emptyDir(dirPath){
  console.log('removing files from', dirPath);
  try{
    //check if dir even exists
    if(fs.existsSync(dirPath)) {
      //if it exists blow away contents
      fs.readdirSync(dirPath).forEach( (file, index) => {
        //fs.removeSync(path.join(dirPath, file));
        console.log('removing ', path.join(dirPath, file));
      });
    }
  }
}

//blow away current dst contents


//read everything necessary in source

//copy static assets over

//itterate through content to generate pages
