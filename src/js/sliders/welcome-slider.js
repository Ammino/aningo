const sliderWelcome = document.querySelector('.js--sl-welcome');

if(sliderWelcome) {
	const welcomeSwiper = new Swiper(sliderWelcome, {
		loop: true,
		slidesPerView: 1,
		autoHeight: true,
		spaceBetween: 20,
		effect: 'fade',
		autoplay: {
			delay: 3000,
			disableOnInteraction: false,
		},
        autoplay: true,
        pauseOnMouseEnter: true,

        pagination: {
			el: '.js--welcome-pag',
			clickable: true,
			bulletClass: 'slider__pag__bullet',
			bulletActiveClass: 'active'
		}
	})
}
