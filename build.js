#!/usr/bin/env node

const browserify = require('browserify');
const fs = require('fs-extra');

const js = fs.createWriteStream('main.js');
browserify()
  .add('src/main.js')
  .bundle()
  .pipe(js);
