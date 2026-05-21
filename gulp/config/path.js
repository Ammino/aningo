//имя папки проекта
import * as nodePath from 'path';
const rootFolder = nodePath.basename(nodePath.resolve());

const buildFolder = "./dist";
const srcFolder = "./src";
const assetsCopyGlobs = [`${srcFolder}/assets/js/*.*`, `${srcFolder}/assets/maps/**/*.json`];

export const path = {
    build: {
		html: `${buildFolder}/`,
		css: `${buildFolder}/css/`,
		js: `${buildFolder}/js/`,
		images: `${buildFolder}/img/`,
		fonts: `${buildFolder}/fonts/`,
		files: `${buildFolder}/assets/js/`,
		vendor: `${buildFolder}/assets/css/`
	},
    src: {
		html: `${srcFolder}/*.html`,
		scss: `${srcFolder}/scss/**/*.scss`,
		// js: `${srcFolder}/js/news.js`,
		js: `${srcFolder}/js/app.js`,
		images: `${srcFolder}/img/**/*.{jpg,jpeg,png,gif,webp}`,
		svg: `${srcFolder}/img/**/*.svg`,
	svgicons: `${srcFolder}/svgicons/**/*.svg`,
		pug: `${srcFolder}/pug/pages/*.pug`,
		files: assetsCopyGlobs,
		vendor: `${srcFolder}/assets/css/*.{scss,css}`
	},
    watch: {
		html: `${srcFolder}/**/*.html`,
		scss: `${srcFolder}/scss/**/*.scss`,
		// scss: `${srcFolder}/sass/**/*.sass`,
		js: `${srcFolder}/js/**/*.js`,
		images: `${srcFolder}/img/**/*.{jpg,jpeg,png,gif,webp,svg,ico}`,
		pug: `${srcFolder}/**/*.pug`,
		svg: `${srcFolder}/svgicons/**/*.svg`,
		files: assetsCopyGlobs,
		vendor: `${srcFolder}/assets/css/*.{scss,css}`
	},
    clean: buildFolder,
	buildFolder: buildFolder,
	srcFolder: srcFolder,
	rootFolder: rootFolder,
	ftp: ''
}
