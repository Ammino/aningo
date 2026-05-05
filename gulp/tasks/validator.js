import { htmlValidator } from 'gulp-w3c-html-validator';

export const vlr = () => {
	return app.gulp.src(app.path.build.html + "/**/*.html")
		.pipe(app.plugins.plumber(
				app.plugins.notify.onError({
					title: "validator HTML",
					message: "Error: <%= error.message %>"
				})
			)
		)
		.pipe(htmlValidator.analyzer({}))
		.pipe(htmlValidator.reporter({}));
}
