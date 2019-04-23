'use strict';

const util = require('./util/util.js');

const md = require('./markdown/markdown_renderer.js');
const scss = require('./modules/scss.js');
const FileContext = require('./file.js');
const indexGenerator = require('./modules/index_generator.js');
const categoryManager = require('./modules/category_manager.js');
const rss = require('./modules/rss.js');
const simpleMarkdownFilter = require('./modules/simpleMarkdownPostFilter.js');
const staticDirs = require('./modules/staticDir.js');
const markdownPost = require('./modules/post.js');

const server = require('./cli/server.js');
const generator = require('./cli/generate.js');

module.exports = main => {
    main.markdown = new md.MarkdownContext(main);
    main.scss = new scss.SassRenderer(main);
    main.file = new FileContext(main);
    // Plugins
    main.categoryManager = categoryManager;
    main.indexGenerator = indexGenerator;
    main.rss = rss;
    main.simpleMarkdownFilter = simpleMarkdownFilter;
    main.staticDirs = staticDirs;
    main.markdownPost = markdownPost;
    main.server = server;
    main.generator = generator;
    
    util(main);
}