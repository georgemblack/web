const { src, dest, watch } = require("gulp");
const concat = require("gulp-concat");
const terser = require("gulp-terser");
const insert = require("gulp-insert");
const sass = require("gulp-sass");
const cleanCSS = require("gulp-clean-css");

/**
 * Bundle _scripts and output to _includes/gen/app.min.js
 * Bundle _styles and output to _includes/gen/main.css
 */
function buildAll(cb) {
  src("src/_scripts/*.js")
    .pipe(concat("app.min.js"))
    .pipe(
      terser({
        mangle: true
      })
    )
    .pipe(insert.wrap("{% raw %}", "{% endraw %}"))
    .pipe(dest("src/_includes/gen/"));

  src("src/_styles/*.scss")
    .pipe(sass())
    .pipe(cleanCSS())
    .pipe(insert.wrap("{% raw %}", "{% endraw %}"))
    .pipe(dest("src/_includes/gen/"));

  cb();
}

function watchAll() {
  watch(['src/_scripts/*.js', 'src/_styles/*.scss'], buildAll);
}

exports.default = buildAll
exports.watch = watchAll
