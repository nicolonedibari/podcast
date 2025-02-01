document.addEventListener('DOMContentLoaded', function() {
    const playButton = document.querySelector('.play-button');
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    const timelineProgress = document.querySelector('.timeline-progress');
    const timeline = document.querySelector('.timeline');
    const currentTimeDisplay = document.createElement('span');
    const durationDisplay = document.createElement('span');
    const timeDisplay = document.createElement('div');
    
    timeDisplay.className = 'time-display d-flex gap-2 mt-2';
    currentTimeDisplay.className = 'current-time';
    durationDisplay.className = 'duration';
    currentTimeDisplay.setAttribute('aria-label', 'Current time');
    durationDisplay.setAttribute('aria-label', 'Total duration');
    
    timeline.parentNode.insertBefore(timeDisplay, timeline.nextSibling);
    timeDisplay.appendChild(currentTimeDisplay);
    timeDisplay.appendChild(document.createTextNode(' / '));
    timeDisplay.appendChild(durationDisplay);


    const audio = new Audio('static/audio/siste.mp3');
    let isPlaying = false;
    let progressInterval;

    audio.preload = 'metadata'; 

    function formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function updateProgress() {
        if (audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            timelineProgress.style.width = `${progress}%`;
            timeline.setAttribute('aria-valuenow', progress);
            currentTimeDisplay.textContent = formatTime(audio.currentTime);
            durationDisplay.textContent = formatTime(audio.duration);
            
            const timeDescription = `${formatTime(audio.currentTime)} of ${formatTime(audio.duration)}`;
            timeline.setAttribute('aria-valuetext', timeDescription);
            timeDisplay.setAttribute('aria-label', `Time: ${timeDescription}`);
        }
    }

    function togglePlayState() {
        if (!isPlaying) {
            const playPromise = audio.play(); 
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        isPlaying = true;
                        progressInterval = setInterval(updateProgress, 100);
                        updatePlayButtonState();
                    })
                    .catch(error => {
                        console.error('Audio playback failed:', error);
                        isPlaying = false;
                        updatePlayButtonState();
                    });
            }
        } else {
            audio.pause();
            isPlaying = false;
            clearInterval(progressInterval);
            updatePlayButtonState();
        }
    }

    function updatePlayButtonState() {
        playIcon.classList.toggle('d-none', isPlaying);
        pauseIcon.classList.toggle('d-none', !isPlaying);
        
        const buttonText = isPlaying ? 'Pausa' : 'Riproduci';
        playButton.setAttribute('aria-label', `${buttonText} episode`);
        playButton.querySelector('span').textContent = buttonText;
    }

    function handleTimelineClick(e) {
        const rect = timeline.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        if (audio.duration) {
            audio.currentTime = clickPosition * audio.duration;
            updateProgress();
        }
    }

    function handleTimelineKeyboard(e) {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            e.preventDefault();
            const skipAmount = e.code === 'ArrowLeft' ? -5 : 5;
            if (audio.duration) {
                audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + skipAmount));
                updateProgress();
            }
        }
    }

    timeline.addEventListener('click', handleTimelineClick);
    timeline.addEventListener('keydown', handleTimelineKeyboard);

    audio.addEventListener('loadedmetadata', function() {
        durationDisplay.textContent = formatTime(audio.duration);
        currentTimeDisplay.textContent = formatTime(0);
        updateProgress();
    });

    audio.addEventListener('error', function(e) {
        console.error('Audio loading error:', e);
        alert('Error loading audio. Please check the file path.');
    });

    audio.addEventListener('ended', function() {
        isPlaying = false;
        clearInterval(progressInterval);
        audio.currentTime = 0;
        updatePlayButtonState();
        updateProgress();
    });

    audio.addEventListener('timeupdate', updateProgress);

    playButton.addEventListener('click', togglePlayState);

    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && document.activeElement === playButton) {
            e.preventDefault();
            togglePlayState();
        }
    });

    window.addEventListener('beforeunload', function() {
        if (isPlaying) {
            audio.pause();
        }
        clearInterval(progressInterval);
    });
});