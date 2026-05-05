const sliderGallery = document.querySelector('.js--gallery-slider');

if(sliderGallery) {
	const gallerySwiper = new Swiper(sliderGallery, {
		loop: true,
		slidesPerView: 1,
        slidesPerGroup: 1,
		autoHeight: true,
		spaceBetween: 10,
        
        breakpoints: {
			991: {			  
				slidesPerView: 2,
				slidesPerGroup: 1,
				spaceBetween: 40,
			}
		},

        pagination: {
			el: '.js--gallery-pag',
			clickable: true,
			bulletClass: 'slider__pag__bullet',
			bulletActiveClass: 'active'
		},

        navigation: {
			disabledClass: 'slider__nav__btn__disable',
			nextEl: '.js--gallery-next',
			prevEl: '.js--gallery-prev',
		},
	})
}