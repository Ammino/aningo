import pugLinter from "gulp-pug-linter";

export const lintPUG = () => {
	return app.gulp.src(app.path.src.pug)
		.pipe(app.plugins.plumber(
				app.plugins.notify.onError({
					title: "PUG lint",
					message: "Error: <%= error.message %>"
				})
			)
		)
		.pipe(pugLinter({
			reporter: 'default'
		}))
}
