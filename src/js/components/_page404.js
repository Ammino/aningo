// 404 page animations
const page404Element = document.querySelector('.page-404');
if (page404Element) {
	const eyesContainer = document.querySelector('.p404-eyes');
	const eyebrowsContainer = document.querySelector('.p404-eyebrows');
	const faceElement = document.querySelector('.p404-face');
	const imgBlock = document.querySelector('.page-404__img');
	const imgStone = document.querySelector('.page-404__img__stone');
	const svg = imgBlock?.querySelector('svg');

	if (eyesContainer && eyebrowsContainer && faceElement && imgBlock && imgStone && svg) {
		// Get eye circles
		const eyes = eyesContainer.querySelectorAll('circle');

		// Eye positions in SVG coordinates (initial positions)
		const eyePositions = [
			{ x: 183, y: 145, r: 7 }, // left eye
			{ x: 220, y: 145, r: 7 }, // right eye (adjusted for transform)
		];

		// Store original positions for reset
		const originalPositions = eyePositions.map(ep => ({ ...ep }));

		// Get viewBox dimensions
		const viewBox = svg.getAttribute('viewBox');
		const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);

		// Eye following - track mouse movement
		const followEyesCursor = (e) => {
			const svgRect = svg.getBoundingClientRect();
			const mouseX = e.clientX - svgRect.left;
			const mouseY = e.clientY - svgRect.top;

			// Convert mouse position to SVG coordinates
			const svgX = (mouseX / svgRect.width) * vbWidth;
			const svgY = (mouseY / svgRect.height) * vbHeight;

			eyes.forEach((eye, index) => {
				const eyePos = eyePositions[index];
				const dx = svgX - eyePos.x;
				const dy = svgY - eyePos.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const angle = Math.atan2(dy, dx);

				// Limit pupil movement within the eye - max 30% of eye radius
				const maxDist = eyePos.r * 0.5;
				const pupilX = eyePos.x + Math.cos(angle) * Math.min(distance * 0.15, maxDist);
				const pupilY = eyePos.y + Math.sin(angle) * Math.min(distance * 0.15, maxDist);

				gsap.to(eye, {
					attr: {
						cx: pupilX,
						cy: pupilY,
					},
					duration: 0.08,
				});
			});

			// Eyebrows movement - raise slightly on cursor movement
			if (eyebrowsContainer) {
				const eyebrows = eyebrowsContainer.querySelectorAll('path');
				eyebrows.forEach((brow) => {
					gsap.to(brow, {
						y: -5,
						duration: 0.15,
					});
				});
			}
		};

		// Reset eyebrows on mouse leave
		const resetEyebrows = () => {
			if (eyebrowsContainer) {
				const eyebrows = eyebrowsContainer.querySelectorAll('path');
				eyebrows.forEach((brow) => {
					gsap.to(brow, {
						y: 0,
						duration: 0.3,
						ease: 'power2.out',
					});
				});
			}
		};

		document.addEventListener('mousemove', followEyesCursor);
		document.addEventListener('mouseleave', resetEyebrows);

		// Floating animation for stone (img block with ::after) and face
		// Stone moves via its parent, face moves with it
		const floatingTimeline = gsap.timeline({ repeat: -1, yoyo: true });

		floatingTimeline.to(
			[imgStone, faceElement],
			{
				y: 5,
				duration: 2,
				ease: 'sine.inOut',
			},
			0 // Start at the same time
		);

		// Cleanup function
		window.page404Cleanup = () => {
			document.removeEventListener('mousemove', followEyesCursor);
			document.removeEventListener('mouseleave', resetEyebrows);
			floatingTimeline.kill();
		};
	}
}
