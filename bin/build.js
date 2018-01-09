const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const marked = require('marked');
const config = require('../siteconfig');

const srcPath = config.site['srcPath'];
const dstPath = config.site['dstPath'];
const srcStaticPath = srcPath + "/static";
const dstStaticPath = dstPath + "/static";
const srcPagesPath = srcPath + "/pages";

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
});

//blow away current dst contents
try{
  fs.emptyDirSync(dstPath);
} catch(err) {
  console.log('Error emptying ' + dstPath + ': ' + err);
}
//read all pages and save contect to an arr
var pages = {};
fs.readdirSync(srcPagesPath).forEach( (page) => {
  pages[page] = fs.readFileSync(path.join(srcPagesPath, page), 'utf8');
});

var layout = fs.readFileSync(path.join(srcPath, 'layout.ejs'), 'utf8');

//copy static assets over
try{
  fs.copy(srcStaticPath, dstStaticPath);
} catch(err) {
  console.log('Error copying assets to ' + dstStaticPath + ": " + err);
}

//itterate through content to generate pages
Object.keys(pages).forEach( (page) => {
  console.log('Reading ' + page);
  var srcPagePath = srcPagesPath + "/" + page;
  const fileData = path.parse(srcPagePath);

  // RENDER
  var body = {}
  switch(fileData.ext) {
    case '.md':
      body = marked(pages[page]);
      break;
    case '.ejs':
      body = ejs.render(pages[page], {});
      break;
    default:
  }
  /*buffer = ejs.renderFile(srcPagePath, {config:config}, (err, str) => {
      console.log(str);
  });*/
  //renderedPage = ejs.render(layout, {body: body, srcPath: srcPath});
  renderedPage = ejs.renderFile(path.join(srcPath, 'layout.ejs'), {body: body, config: config.site}, (err, str) => {
      if(err){
        console.log('Error rendering ' + page + ": " + err);
      }
      var filename = page.substr(0, page.indexOf('.')) + '.html';
      fs.writeFile(path.join(dstPath, filename), str);
  });
});
