### запуск ###
Скрипты вынесены в package.json раздел scripts

Запуск в режиме разработки
```npm
npm run dev
```

Запуск в режиме продакшн c минификацией файлов и конвертация изображений
```npm
npm run build
```

Генерация svg-sprite
```npm
npm run svgSprive
```

Запуск валидатора
```npm
npm run validate:html
```

Заархивировать проект в zip для отправки
```npm
npm run zip
```

Можно запускать через **package.json scripts**

## Пути ##

Исходные файлы директория **./src/**
- **pug** html шаблоны страниц (реализовано через [gulp-pug]("https://www.npmjs.com/package/gulp-pug") )
- **scss** стили
- **js** скрипты  подключение кода через [gulp-file-include]("https://www.npmjs.com/package/gulp-file-include") *БЕЗ ИСПОЛЬЗОВАНИЯ WEBPACK* и **import**
- **img** картинки
- **svgicons** исходники svg изображений для генерации спрайта [gulp-svg-sprite]("https://www.npmjs.com/package/gulp-svg-sprite")
- **assets** файлы библиотек (js и css) генерируются в папку **dist/assets**


Оптимизированные файлы директория **./dist/**

- **assets** файлы библиотек
- **css** стили
  - основные **style.css**
  - шрифты **font.css**
- **fonts** шрифты
- **img** изображения
- **js** скрипты

## PUG ##
**структура**
- **components** - содержит отдельные (повторяющиеся) компоненты
- **helpers** - содержит миксины и иные хелперы (рекомендовано, но не обязательно)
  - **svg** для использования [svg-спрайтов]("https://www.npmjs.com/package/gulp-svg-sprite")
  - **container** для создания контейнеров (исп container-custom во избежание конфликтов с bootstrap-grid)
  - **button** для создания кнопок

- **pages** - страницы
- **layouts/default.pug** - общий шаблон для всех страниц
- **section** - секции страниц
- для ссылок **на внешние ресурсы** добавляем атрибут **target="_blank"**
```html
<a href="new.html" target="_blank">Открыть в новом окне</a>
```


## SCSS ##
*обязательные файлы style, font, custom
- **custom.scss**  - обязательно создается и остается пустым и подключается *ПОСЛЕ style* для внесения дальнейших правок (для действующих сайтов)
- **fonts.scss**  - подключение шрифтов (содержит два примера для шрифта из google fonts и для шрифта из файла)
- **styles.scss** - общий файл
- **base/_general** базовые стили
- **components/** стили компонентов, все файлы подключаеются в **_components**
- **helpers/** - содержит хелперы
  - _vars - глобальные переменные
  - _mixins - миксины
  - _functions - функции
  - _breakpoint - функции для адаптива

- **section/** - стили секций подключаеются в **_section**

## svgicons ##
- при сохранении в данную папку файл автоматически добавляется в общий файл **img/icons.svg**
- для дальнейшей стилизации svg через css необходимо очистить все атребуты кроме **viewBox** и в дальнейшем стилизовать иконки через css *width, height, fill/stroke*
- далее в pug использовать через миксин *+svg("ИМЯ_ФАЙЛА")*
- **НЕ ИСПОЛЬЗОВАТЬ** если в svg **есть градиент**, вствляем напрямую в код без спрайта
```html
	<svg width="120" height="240" version="1.1" xmlns="http://www.w3.org/2000/svg">
		  <defs>
			<linearGradient id="Gradient1">
			  <stop class="stop1" offset="0%" />
			  <stop class="stop2" offset="50%" />
			  <stop class="stop3" offset="100%" />
			</linearGradient>
		  </defs>

		  <rect id="rect1" x="10" y="10" rx="15" ry="15" width="100" height="100" />
		  <rect
			x="10"
			y="120"
			rx="15"
			ry="15"
			width="100"
			height="100"
			fill="url(#Gradient2)" />
		</svg>
```

## IMG ##
- Картинки в webp не конвертируем
- Responsive images / Retina - тоже не используем
- Вставляем картинки по стандарту
```html
	<div class="block-bg" style="background-image:url(/img/photo1.jpg)"></div>
```

```css
.block-bg {
	background-color: #90a4ae;
	background-repeat: no-repeat;
	background-position: center;
	background-size: cover;
}
```

- статичные фоны (те что не содержат смысловой нагрузки, а носят декаративный характер) добустимо вставлять через css background [Пример](https://skr.sh/sLYzS0zPXMQ)


## Библиотеки ##
- [bootstrap-grid](https://bootstrap-5.ru/docs/5.3/getting-started/introduction/)
- [bootstrap-reboot](https://bootstrap-5.ru/docs/5.3/getting-started/introduction/) - для сброса стилей
- [swiper](https://swiperjs.com/)
- [Fancybox](https://fancyapps.com/fancybox/getting-started/) - для popup
- [inputmask](https://robinherbots.github.io/Inputmask/) - для валидации инпутов с номерами телефонов и email

Стараемся библиотеками не злоупотреблять используем только в случае необходимости

## DEMO ##
- для демонстрации сайта на сервер загружаем только файлы папки **dist**
- после загрузки сайт можно проверить через сервис [http://iloveadaptive.com/ru/](http://iloveadaptive.com/ru/) (включает проверку адаптива и [валидатора](https://skr.sh/sLYXAKvSr2D))
