import { deleteAsync } from "del";
import zipPlugin from "gulp-zip";


export const zip = () => {
	return deleteAsync(`./${app.path.rootFolder}.zip`, { force: true }).then(() =>
		app.gulp.src(`${app.path.buildFolder}/**/*.*`)
		.pipe(app.plugins.plumber(
			app.plugins.notify.onError({
				title: "ZIP",
				message: "Error: <%= error.message %>"
			})
			)
		)
		.pipe(zipPlugin(`${app.path.rootFolder}.zip`))
		.pipe(app.gulp.dest('./'))
	);
};