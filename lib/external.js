'use strict';

const util = require('./util/util.js');

const md = require('./markdown/markdown_renderer.js');
const scss = require('./scss.js');
const FileContext = require('./file.js');
const indexGenerator = require('./modules/index_generator.js');
const categoryManager = require('./modules/category_manager.js');
const rss = require('./modules/rss.js');
const staticDirs = require('./modules/staticDir.js');
const markdownPost = require('./modules/post.js');
const cname = require('./modules/cname.js');
const draft = require('./modules/draft.js');

const server = require('./cli/server.js');
const generator = require('./cli/generate.js');
const gitDeployer = require('./cli/deploy_git.js');

module.exports = main => {
    main.markdown = new md.MarkdownContext(main);
    main.scss = new scss.SassRenderer(main);
    main.file = new FileContext(main);
    // Plugins
    main.categoryManager = categoryManager;
    main.indexGenerator = indexGenerator;
    main.rss = rss;
    main.staticDirs = staticDirs;
    main.markdownPost = markdownPost;
    main.cname = cname;
    main.draft = draft;

    main.server = server;
    main.generator = generator;
    main.gitDeployer = gitDeployer;
    
    util(main);
}