const cardThumbsEl = document.querySelector('.js--sl-card-thumbs');
const cardImagesEl = document.querySelector('.js--sl-card-images');

if (cardThumbsEl && cardImagesEl) {
	const swiperCardThumbs = new Swiper(cardThumbsEl, {
		loop: false,
		direction: 'vertical',
		slidesPerView: 3,
		spaceBetween: 10,
		autoHeight: true,
		watchSlidesProgress: true,
		watchOverflow: true,
		slideToClickedSlide: true,

        breakpoints: {
			768: {
				slidesPerView: 4,
			},
			991: {
				slidesPerView: 3,
			},
			1200: {
				slidesPerView: 4,
			},
		},
	});

	const swiperCardImages = new Swiper(cardImagesEl, {
		loop: false,
		slidesPerView: 1,
		speed: 400,
		effect: 'fade',
		fadeEffect: {
			crossFade: true,
		},
		thumbs: {
			swiper: swiperCardThumbs,
		},
		navigation: {
            disabledClass: 'disabled',
			nextEl: '.js--sl-card-thumbs-next',
			prevEl: '.js--sl-card-thumbs-prev',
		},
	});

	let cardSliderResizeRaf = 0;
	const scheduleCardSliderUpdate = () => {
		cancelAnimationFrame(cardSliderResizeRaf);
		cardSliderResizeRaf = requestAnimationFrame(() => {
			swiperCardThumbs.update();
			swiperCardImages.update();
		});
	};

	window.addEventListener('resize', scheduleCardSliderUpdate);
	window.addEventListener('orientationchange', scheduleCardSliderUpdate);
}
