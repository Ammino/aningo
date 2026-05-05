const sliderArticle = document.querySelector('.js--sl-artgallery');

if(sliderArticle) {
	const articleSwiper = new Swiper(sliderArticle, {
		loop: false,
		slidesPerView: 1,
		slidesPerGroup: 1,
		autoHeight: true,
		effect: 'fade',

		pagination: {
			el: '.js--sl-artgallery-pag',
			clickable: true,
			bulletClass: 'slider__pag__bullet',
			bulletActiveClass: 'active'
		},
	})
}
