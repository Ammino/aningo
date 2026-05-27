import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import rename from "gulp-rename";

import cleanCss from "gulp-clean-css";
import autoprefixer from 'gulp-autoprefixer';
import groupMedia from 'gulp-group-css-media-queries';


const sass = gulpSass(dartSass);

export const scss = () => {
	return app.gulp.src(app.path.src.scss, { sourcemaps: app.isDev })
		.pipe(app.plugins.plumber(
			app.plugins.notify.onError({
				title: "SCSS",
				message: "Error: <%= error.message %>"
			})
			)
		)
		.pipe(app.plugins.replace(/@img\//g, '../img/'))
		.pipe(app.plugins.replace('@npm', "../../node_modules"))
		.pipe(sass({
			outputStyle: "expanded"
		}))
		.pipe(groupMedia())
		.pipe(
			app.plugins.if(
				app.isBuild,
				autoprefixer()
			)
		)
		//загрузка несжатого файла
		.pipe(app.gulp.dest(app.path.build.css))
		.pipe(
			app.plugins.if(
				app.isBuild,
				cleanCss()
			)
		)
		.pipe(
			app.plugins.if(
				app.isBuild,
				rename({
					extname: ".min.css"
				})
			)
		)
		.pipe(app.gulp.dest(app.path.build.css))
		.pipe(app.plugins.browsersync.stream())
}
