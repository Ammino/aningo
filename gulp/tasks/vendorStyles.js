import gulpSass from "gulp-sass";
import * as dartSass from 'sass';
import autoprefixer from "gulp-autoprefixer";
import cleanCss from "gulp-clean-css";
import rename from "gulp-rename";

const sass = gulpSass(dartSass);

export const vendorStyles = () => {
    return app.gulp.src(app.path.src.vendor, {sourcemaps: app.isDev})
        .pipe(app.plugins.plumber(
            app.plugins.notify.onError({
                title: "vendor styles",
                message: "Error: <%= error.message %>"
            })
        ))
        .pipe(app.plugins.replace('@npm', "../../node_modules"))
        .pipe(sass({
            outputStyle: "expanded"
        }))
        .pipe(
            app.plugins.if(
                app.isBuild,
                autoprefixer({
                    grid: true,
                    overrideBrowserslist: ['last 20 versions'],
                    cascade: true
                })
            )
        )
        .pipe(app.gulp.dest(app.path.build.vendor))
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
        .pipe(app.gulp.dest(app.path.build.vendor))
        .pipe(app.plugins.browsersync.stream())
}