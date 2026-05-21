export const copy = () => {
	return app.gulp.src(app.path.src.files, { base: app.path.srcFolder })
		.pipe(app.gulp.dest(app.path.buildFolder))
}