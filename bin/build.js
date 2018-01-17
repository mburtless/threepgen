const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const marked = require('marked');
const frontMatter = require('front-matter');
const config = require('../siteconfig');

const srcPath = config.site['srcPath'];
const dstPath = config.site['dstPath'];
const srcStaticPath = srcPath + "/static";
const dstStaticPath = dstPath + "/static";
const srcPagesPath = srcPath + "/pages";
const mainLayout = 'layout.ejs';
const postLayout = 'postlayout.ejs'

const postChrome = {
  primary: 'glyphicon-pencil',
  success: 'glyphicon-ok',
  warning: 'glyphicon-warning-sign',
  danger: 'glyphicon-fire',
  info: 'glyphicon-info-sign'
};

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
});

function sortPostsByDate(posts) {
  posts.sort( (a,b) => {
    var dateA = new Date(a.date).getTime();
    var dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });
}

function renderPage(pageName, pageData) {
  const pageContent = frontMatter(fs.readFileSync(path.join(pageData.dir, pageName), 'utf8'))
  var attribs = pageContent.attributes

  switch(pageData.ext) {
    case '.md':
      var body = marked(pageContent.body);
      //console.log('Rendered body is :' + body);
      break;
    case '.ejs':
      var body = ejs.render(pageContent.body, {});
      break;
    default:
      var body = marked(pageContent.body);
      break;
    }

    //If type is post, send rendered body to the postlayout and override body to return with new content
    if(attribs.type == "post"){
      //Make an array with one member to hold our post
      attribs.body = body;
      var postArr = new Array();
      postArr.push(attribs);


      ejs.renderFile(path.join(srcPath, `${postLayout}`), {body: body, config: config.site, posts: postArr}, (err, str) => {
          if(err){
            console.log('Error rendering ' + pageName + ": " + err);
          }
          body = str;
      });
  }
  return [ attribs, body ];
}

function renderPosts(posts) {
  //var postUl = [];
  var sortedPosts = sortPostsByDate(posts);
  ejs.renderFile(path.join(srcPath, `${postLayout}`), {body: "", config: config.site, posts: posts}, (err, str) => {
      if(err){
        console.log('Error rendering posts: ' + err);
      }
      postUl = str;
  });

  return postUl;
}

var args = {};
if (process.argv.length > 2) {
  Object.keys(process.argv).forEach( (arg) => {
    args[process.argv[arg]] = 'True';
  });
}

//If clean flag, blow away current dst contents
if(args['clean']){
  console.log('Emptying destination ' + dstPath + '\n------------\n');
  try{
    fs.emptyDirSync(dstPath);
  } catch(err) {
    console.log('Error emptying ' + dstPath + ': ' + err);
  }
}

//read all files in pages and save attributes to an array
var pages = {};
fs.readdirSync(srcPagesPath).forEach( (page) => {
  pages[page] = path.parse(path.join(srcPagesPath, page));
});


//copy static assets to dst
try{
  fs.copy(srcStaticPath, dstStaticPath);
} catch(err) {
  console.log('Error copying assets to ' + dstStaticPath + ": " + err);
}

var timelinePosts = new Array();

//itterate through each file we read in pages and render content
console.log('Rendering ' + Object.keys(pages).length + ' pages.\n------------\n');
Object.keys(pages).forEach( (page) => {
  [attributes, body] = renderPage(page, pages[page]);
  var filename = page.substr(0, page.indexOf('.')) + '.html';

  //If the page was a post, save the title and desc to an arr for generating timeline
  if(attributes.type == "post"){
    /*timelinePosts[page] = {}
    timelinePosts[page].description = attributes.description;
    timelinePosts[page].title = attributes.description;
    timelinePosts[page].url = './' + filename;
    timelinePosts[page].date = attributes.date;*/
    var SomeVar = SomeVar || 'Default Value';
    timelinePosts.push({description: attributes.description,
      title: attributes.title,
      url: './' + filename,
      date: attributes.date
    });
  }

  //console.log('Rendering ' + page);
  ejs.renderFile(path.join(srcPath, `${mainLayout}`), {body: body, config: config.site, attributes: attributes}, (err, str) => {
      if(err){
        console.log('Error rendering ' + page + ": " + err);
      }
      fs.writeFile(path.join(dstPath, filename), str);
  });
});

//If we have posts, sort and send to renderPosts for rendering of final UL
if(timelinePosts.length > 0){
  console.log('Rendering timeline for ' + timelinePosts.length + ' blog posts.\n------------\n');
  var finalTimeline = renderPosts(timelinePosts);
}
else {
  var finalTimeline = "No posts were found!"
}

ejs.renderFile(path.join(srcPath, `${mainLayout}`), {body: finalTimeline, config: config.site, attributes: ""}, (err, str) => {
    if(err){
      console.log('Error rendering ' + page + ": " + err);
    }
    var filename = 'blog.html';
    fs.writeFile(path.join(dstPath, filename), str);
});
