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

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
});

function renderPage(pageName, pageData) {
  const pageContent = frontMatter(fs.readFileSync(path.join(pageData.dir, pageName), 'utf8'))
  const attribs = pageContent.attributes
  //console.log('Ext is ' + pageData.ext);
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
      console.log('Post detected!');
      var postArr = { 1: Object.assign({}, attribs) };
      postArr[1].body = body;
      console.log('PostArr looks like this ' + postArr[1].description);
      ejs.renderFile(path.join(srcPath, `${postLayout}`), {body: body, config: config.site, posts: postArr}, (err, str) => {
          if(err){
            console.log('Error rendering ' + pageName + ": " + err);
          }
          body = str;
      });
      //console.log('Rendered post body is :' + body);
  }
  return [ attribs, body ];
}

function renderPosts(posts) {
  var postUl = [];
  /*var attribs = {
    title: postName,
    description: postDescription
  };*/
  ejs.renderFile(path.join(srcPath, `${postLayout}`), {body: "", config: config.site, posts: posts}, (err, str) => {
      if(err){
        console.log('Error rendering ' + page + ": " + err);
      }
      postUl = str;
  });

  return postUl;
}

//blow away current dst contents
try{
  fs.emptyDirSync(dstPath);
} catch(err) {
  console.log('Error emptying ' + dstPath + ': ' + err);
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

var timelinePosts = {};
var finalTimeline = [];
//itterate through each file we read in pages and render content
Object.keys(pages).forEach( (page) => {
  [attributes, body] = renderPage(page, pages[page]);

  //If the page was a post, save the title and desc to an arr for generating timeline
  if(attributes.type == "post"){
    timelinePosts[page] = {}
    timelinePosts[page].description = attributes.description;
    timelinePosts[page].title = attributes.description;
  }

  console.log('Rendering ' + page);
  ejs.renderFile(path.join(srcPath, `${mainLayout}`), {body: body, config: config.site, attributes: attributes}, (err, str) => {
      if(err){
        console.log('Error rendering ' + page + ": " + err);
      }
      var filename = page.substr(0, page.indexOf('.')) + '.html';
      fs.writeFile(path.join(dstPath, filename), str);
  });
});

//Send arr of all posts to renderPosts for rendering of final UL
finalTimeline = renderPosts(timelinePosts);
//console.log('Final timeline looks like ' + finalTimeline);
ejs.renderFile(path.join(srcPath, `${mainLayout}`), {body: finalTimeline, config: config.site, attributes: ""}, (err, str) => {
    if(err){
      console.log('Error rendering ' + page + ": " + err);
    }
    var filename = 'blog.html';
    fs.writeFile(path.join(dstPath, filename), str);
});
//itterate through each post in timelinePosts to generate final timeline pages
/*Object.keys(timelinePosts).forEach( (post) => {
  console.log('Adding ' + timelinePosts[post] + ' to the timeline');
  var postLi = renderPost(post, timelinePosts[post]);
  finalTimeline.push(postLi);
});*/
