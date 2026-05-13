// video blocks
(() => {
	const roots = document.querySelectorAll('.js--video');
	if (!roots.length) return;

	let activeRoot = null;

	const getEls = (root) => {
		const video = root.querySelector('.js--video-player');
		const btn = root.querySelector('.js--video-play');
		return { video, btn };
	};

	const setUiStopped = (root) => {
		const { video, btn } = getEls(root);
		if (!video) return;

		root.classList.remove('is-video-playing');
		video.controls = false;
		if (btn) btn.hidden = false;
	};

	const setUiPlaying = (root) => {
		const { video, btn } = getEls(root);
		if (!video) return;

		root.classList.add('is-video-playing');
		video.controls = true;
		if (btn) btn.hidden = true;
	};

	const stopIfActive = (root) => {
		const { video } = getEls(root);
		if (!video) return;

		if (!video.paused && !video.ended) {
			video.pause();
		}
		setUiStopped(root);
	};

	const stopAllExcept = (nextRoot) => {
		roots.forEach((r) => {
			if (r !== nextRoot) stopIfActive(r);
		});
	};

	roots.forEach((root) => {
		const { video, btn } = getEls(root);
		if (!video) return;

		setUiStopped(root);

		if (btn) {
			btn.addEventListener('click', async (e) => {
				e.preventDefault();

				stopAllExcept(root);
				activeRoot = root;
				setUiPlaying(root);

				try {
					await video.play();
				} catch (err) {
					// Autoplay restrictions or other playback errors — revert UI
					setUiStopped(root);
				}
			});
		}

		video.addEventListener('pause', () => {
			setUiStopped(root);
			if (activeRoot === root) activeRoot = null;
		});

		video.addEventListener('ended', () => {
			setUiStopped(root);
			if (activeRoot === root) activeRoot = null;
		});

		video.addEventListener('play', () => {
			stopAllExcept(root);
			activeRoot = root;
			setUiPlaying(root);
		});
	});
})();
