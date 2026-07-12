(() => {
    const videos = Array.from(document.querySelectorAll('video[autoplay]'));
    if (!videos.length) return;

    const prepareVideo = video => {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.preload = 'auto';
    };

    const tryPlay = video => {
        if (!video.isConnected || document.hidden) return;
        prepareVideo(video);
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === 'function') {
            playAttempt
                .then(() => video.classList.remove('autoplay-blocked'))
                .catch(() => video.classList.add('autoplay-blocked'));
        }
    };

    videos.forEach(video => {
        prepareVideo(video);
        video.addEventListener('loadedmetadata', () => tryPlay(video), { once: true });
        video.addEventListener('canplay', () => tryPlay(video), { once: true });
        tryPlay(video);
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                tryPlay(video);
            } else if (!video.paused) {
                video.pause();
            }
        });
    }, { rootMargin: '120px 0px', threshold: 0.01 });

    videos.forEach(video => observer.observe(video));

    const retryVisibleVideos = () => {
        videos.forEach(video => {
            const rect = video.getBoundingClientRect();
            if (rect.bottom >= -120 && rect.top <= window.innerHeight + 120) tryPlay(video);
        });
    };

    window.addEventListener('pageshow', retryVisibleVideos);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) retryVisibleVideos();
    });

    // Bazı mobil tarayıcılar ilk açılışta oynatmayı engellerse,
    // kullanıcının sayfadaki ilk doğal etkileşiminde tüm görünür videoları başlat.
    document.addEventListener('pointerdown', retryVisibleVideos, { once: true, passive: true });
})();
