
import svgSprite from "gulp-svg-sprite";
import svgo from "gulp-svgo";

export const svgSprive = () => {
	return app.gulp.src(app.path.src.svgicons)
		.pipe(app.plugins.plumber(
			app.plugins.notify.onError({
				title: "SVG",
				message: "Error: <%= error.message %>"
			})
			)
		)
		.pipe(svgo({
			plugins: [
				{
				name: 'removeAttributesBySelector',
				params: {
					selector: "[fill='none']",
					attributes: "fill"
				}
			},
				{ removeUselessDefs: false },
			]
		}))
		.pipe(svgSprite({
			svg: {
				rootAttributes: {
					style: "position: absolute; width: 0; height: 0; visibility: hidden;"
				},
	// 			transform: [
	// 				(svg) => {
	// 	console.log(svg)
	// }
	// 			]
			},
			mode: {
				inline: true,
				symbol: {
					sprite: "../icons.svg", //sprite file name
				},
			}
		}))
		.pipe(app.gulp.dest(`${app.path.srcFolder}/img/`))
		.pipe(app.gulp.dest(`${app.path.buildFolder}/img/`))
		.pipe(app.plugins.browsersync.stream())
}
