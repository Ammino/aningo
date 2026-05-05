const sliderBlog = document.querySelector('.js--sl-blog');

if(sliderBlog) {
	const gallerySwiper = new Swiper(sliderBlog, {
		loop: false,
		slidesPerView: 2,
        slidesPerGroup: 2,
		autoHeight: true,
		spaceBetween: 10,

        breakpoints: {
			768: {
				slidesPerView: 3,
				slidesPerGroup: 3,
				spaceBetween: 10,
			},
			991: {
				slidesPerView: 4,
				slidesPerGroup: 4,
				spaceBetween: 20,
			},
			1200: {
				slidesPerView: 5,
				slidesPerGroup: 5,
				spaceBetween: 20,
			}
		},

        // pagination: {
		// 	el: '.js--sl-blog-pag',
		// 	clickable: true,
		// 	bulletClass: 'slider__pag__bullet',
		// 	bulletActiveClass: 'active'
		// },

        navigation: {
			disabledClass: 'disabled',
			nextEl: '.js--sl-blog-next',
			prevEl: '.js--sl-blog-prev',
		},
	})
}
