const { src, dest } = require("gulp");
const concat = require("gulp-concat");
const terser = require("gulp-terser");
const insert = require("gulp-insert");

/**
 * Bundle scripts in _js and output to _includes/gen
 */
function buildScripts(cb) {
  src("src/_js/*.js")
    .pipe(concat("app.min.js"))
    .pipe(
      terser({
        mangle: true
      })
    )
    .pipe(insert.wrap("{% raw %}", "{% endraw %}"))
    .pipe(dest("src/_includes/gen/"));
  cb();
}

exports.default = buildScripts;
