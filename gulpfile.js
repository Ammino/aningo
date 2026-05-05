import gulp from "gulp";


import { path } from "./gulp/config/path.js";
import { plugins } from "./gulp/config/plugins.js";


global.app = {
	isBuild: process.argv.includes('--build'),
	isDev: !process.argv.includes('--build'),
	path: path,
	gulp: gulp,
	plugins: plugins
}

import { copy } from "./gulp/tasks/copy.js";
import { reset } from "./gulp/tasks/reset.js";
import { html } from "./gulp/tasks/html.js";
import { pugHTML } from "./gulp/tasks/pug.js";
import { server } from "./gulp/tasks/server.js";
import { scss } from "./gulp/tasks/scss.js";
import { js } from "./gulp/tasks/js.js";
import { images } from "./gulp/tasks/images.js";
import { otfToTtf, ttfToWoff } from "./gulp/tasks/fonts.js";
import { svgSprive } from "./gulp/tasks/svgSprive.js";
import { zip } from "./gulp/tasks/zip.js";
import { vlr } from './gulp/tasks/validator.js';
import { lintPUG } from './gulp/tasks/lintPUG.js';
import { vendorStyles } from "./gulp/tasks/vendorStyles.js";

const usePUG = true;


function watcher() {
	gulp.watch(path.watch.files, copy);
	usePUG ? gulp.watch(path.watch.pug, pugHTML) : gulp.watch(path.watch.html, html);
	gulp.watch(path.watch.scss, scss);
	gulp.watch(path.watch.js, js);
	gulp.watch(path.watch.images, images);
	gulp.watch(path.watch.svg, svgSprive);
	gulp.watch(path.watch.vendor, vendorStyles)

}
//create svg icons
export { svgSprive }


const fonts = gulp.series(otfToTtf, ttfToWoff);
const mainTasks = gulp.series(fonts, gulp.parallel(copy, usePUG ? pugHTML : html, js, gulp.series(images, scss), svgSprive, vendorStyles));
// сценарии
const dev = gulp.series(reset, mainTasks,  gulp.parallel(watcher, server));
const build = gulp.series(reset, mainTasks);
const deployZIP = gulp.series(reset, mainTasks, zip);

export { dev }
export { build }
export { deployZIP }
export { fonts }

export { vlr }
export { lintPUG }



gulp.task('default', dev);

