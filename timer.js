let timers = {};
let completionCount = 0;
let stopwatch = { time: 0, interval: null };
let lastTimerEndTime = null;


function toggleStopwatch(timerId) {
    let sw = document.getElementById(timerId);
    if (!stopwatch.interval) {
        stopwatch.interval = setInterval(() => {
            stopwatch.time++;
            displayStopwatchTime(timerId);
            saveStopwatchState();
        }, 1000);
        sw.querySelector('.timer-display').style.color = 'green';
        playSelectedSound();
    } else {
        clearInterval(stopwatch.interval);
        stopwatch.interval = null;
        sw.querySelector('.timer-display').style.color = 'black';
        stopSelectedSound();
        saveStopwatchState();
    }
    updateLastUsedTimestamp(); // Update the last used timestamp
}




function resetStopwatch(timerId) {
    clearInterval(stopwatch.interval);
    stopwatch.time = 0;
    stopwatch.interval = null;
    displayStopwatchTime(timerId);
    document.getElementById(timerId).querySelector('.timer-display').style.color = 'black';
    stopSelectedSound();
    saveStopwatchState();
    updateLastUsedTimestamp(); // Update the last used timestamp
}



function saveStopwatchState() {
    let stopwatchState = {
        time: stopwatch.time,
        running: stopwatch.interval ? true : false
    };
    localStorage.setItem('stopwatchState', JSON.stringify(stopwatchState));
}

function addToStopwatch(duration) {
    stopwatch.time += duration;
    displayStopwatchTime('stopwatch');
    saveStopwatchState();
}


function loadStopwatchState() {
    let savedState = localStorage.getItem('stopwatchState');
    if (savedState) {
        let stopwatchState = JSON.parse(savedState);
        stopwatch.time = stopwatchState.time;
        if (stopwatchState.running) {
            toggleStopwatch('stopwatch');
        } else {
            displayStopwatchTime('stopwatch');
        }
    }
}

function displayStopwatchTime(timerId) {
    let hours = Math.floor(stopwatch.time / 3600);
    let minutes = Math.floor((stopwatch.time % 3600) / 60);
    let seconds = stopwatch.time % 60;
    let display = document.getElementById(timerId).querySelector('.timer-display');
    display.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


function saveTimerState(timerId) {
    localStorage.setItem(`timerState_${timerId}`, JSON.stringify(timers[timerId]));
}

function loadTimerState(timerId, defaultDuration) {
    let savedState = localStorage.getItem(`timerState_${timerId}`);
    if (savedState) {
        timers[timerId] = JSON.parse(savedState);
        if (timers[timerId].timeLeft > 0 && timers[timerId].interval) {
            startTimer(timers[timerId].timeLeft, timerId);
        } else {
            displayTime(timerId);
        }
    } else {
        resetTimer(defaultDuration, timerId);
    }
}

function toggleTimer(duration, timerId) {
    if (!timers[timerId] || !timers[timerId].interval) {
        startTimer(duration, timerId);
    } else {
        pauseTimer(timerId);
    }
	updateLastUsedTimestamp();
}

function startTimer(duration, timerId) {
    timers[timerId] = timers[timerId] || { duration: duration, timeLeft: duration, interval: null };
    let timer = timers[timerId];
    if (timer.interval) clearInterval(timer.interval);

    timer.interval = setInterval(() => {
        if (timer.timeLeft > 0) {
            timer.timeLeft--;
            displayTime(timerId);
        } else {
            clearInterval(timer.interval);
            timer.interval = null;
            timerComplete(timerId); // Ensure this is called when the timer reaches 00:00
            stopAllSounds();
            document.getElementById('completionSound').play(); // Play completion sound
        }
        saveTimerState(timerId);
    }, 1000);

    playSelectedSound(); // Moved this line here, after setting the timer interval
}


function playSelectedSound() {
    stopAllSounds();

    let soundChoice = document.getElementById('soundSelector').value;
    let soundElement;

    if (soundChoice === 'ticking') {
        soundElement = document.getElementById('tickingSound');
    } else if (soundChoice === 'whiteNoise') {
        soundElement = document.getElementById('whiteNoiseSound');
    }

    if (soundElement && (isAnyTimerRunning() || stopwatch.interval)) {
        soundElement.play();
        soundElement.loop = true;
    }
}



function stopAllSounds() {
    let tickingSound = document.getElementById('tickingSound');
    let whiteNoiseSound = document.getElementById('whiteNoiseSound');
    tickingSound.pause();
    tickingSound.currentTime = 0;
    whiteNoiseSound.pause();
    whiteNoiseSound.currentTime = 0;
}

function pauseTimer(timerId) {
    let timer = timers[timerId];
    if (timer && timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
        stopSelectedSound();
        saveTimerState(timerId);
    }
}

function stopSelectedSound() {
    let soundChoice = document.getElementById('soundSelector').value;
    if (soundChoice === 'ticking') {
        document.getElementById('tickingSound').pause();
    } else if (soundChoice === 'whiteNoise') {
        document.getElementById('whiteNoiseSound').pause();
    }
}
function resetTimer(duration, timerId) {
    let timer = timers[timerId] || {};
    clearInterval(timer.interval);

    // Check if the timer is already full, if so, complete it
    if (timer.timeLeft === duration) {
        timerComplete(timerId);
    } else {
        timer.duration = duration;
        timer.timeLeft = duration;
        timer.interval = null;
        timers[timerId] = timer;
        displayTime(timerId);
        document.getElementById('tickingSound').pause();
        document.getElementById('tickingSound').currentTime = 0;
        saveTimerState(timerId);
    }
}

function timerComplete(timerId) {
    document.getElementById('completionSound').play(); // Play completion sound
    let timer = timers[timerId];
    if (timer) {
        timer.timeLeft = 0;
        timer.interval = null;
        displayTime(timerId);
        document.getElementById('tickingSound').pause();
        document.getElementById('tickingSound').currentTime = 0;
        saveTimerState(timerId);
    }

    // Add timer duration to stopwatch
    addToStopwatch(timer.duration);

    // Check and increment completion count
    checkAndIncrementCompletion();
lastTimerEndTime = new Date(); // Set the end time
    updateElapsedTimeDisplay(); // Update elapsed time display
}

function updateElapsedTimeDisplay() {
    if (!lastTimerEndTime) {
        document.getElementById('elapsed-time').innerText = '00:00:00';
        return;
    }

    let currentTime = new Date();
    let elapsedSeconds = Math.floor((currentTime - lastTimerEndTime) / 1000);
    let hours = Math.floor(elapsedSeconds / 3600);
    let minutes = Math.floor((elapsedSeconds % 3600) / 60);
    let seconds = elapsedSeconds % 60;

    document.getElementById('elapsed-time').innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function addToStopwatchFromElapsed() {
    if (!lastTimerEndTime) return;

    let currentTime = new Date();
    let elapsedSeconds = Math.floor((currentTime - lastTimerEndTime) / 1000);

    addToStopwatch(elapsedSeconds);
}


function checkAndIncrementCompletion() {
    const allTimersCompleted = Object.values(timers).every(timer => timer.timeLeft === 0);

    if (allTimersCompleted) {
        completionCount++;
        updateCompletionCountDisplay();
        saveCompletionCount(); // Save to local storage
    }
}

function saveCompletionCount() {
    localStorage.setItem('timerCompletionCount', completionCount);
}

function loadCompletionCount() {
    const savedCount = localStorage.getItem('timerCompletionCount');
    if (savedCount !== null) {
        completionCount = parseInt(savedCount, 10);
    } else {
        completionCount = 0; // Default to 0 if nothing is saved
    }
    updateCompletionCountDisplay();
}


function updateCompletionCountDisplay() {
    document.getElementById('complete-count').innerText = completionCount;
}

function resetCompletionCount() {
    completionCount = 0;
    updateCompletionCountDisplay();
    saveCompletionCount(); // Also reset the saved count in local storage
}



function displayTime(timerId) {
    let timer = timers[timerId];
    if (timer) {
        let minutes = Math.floor(timer.timeLeft / 60);
        let seconds = timer.timeLeft % 60;
        let display = document.getElementById(timerId).querySelector('.timer-display');
        display.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Calculate the percentage of time left
        let percent = (timer.timeLeft / timer.duration) * 100;

        // Apply a gradient based on the time left
        // The gradient will now start with the green color (for elapsed time)
        // and transition to gray (for remaining time)
        let timerBlock = document.getElementById(timerId);
        timerBlock.style.background = `linear-gradient(to right, #1a8b00 ${100 - percent}%, #cccccc ${100 - percent}%)`;
    }
}

function resetAllTimers() {
    // Array of all timer durations corresponding to their IDs
    const timerSettings = {
        'timer-1min': 60,
        'timer-3min': 180,
        'timer-6min': 360,
        'timer-10min': 600,
        'timer-20min': 1200
    };

    // Reset each timer
    Object.keys(timerSettings).forEach(timerId => {
        let duration = timerSettings[timerId];
        let timer = timers[timerId];

        // Clear any running interval
        if (timer && timer.interval) {
            clearInterval(timer.interval);
            timer.interval = null;
        }

        // Reset timer to its full duration
        timer.duration = duration;
        timer.timeLeft = duration;
        displayTime(timerId);

        // Save the reset state
        saveTimerState(timerId);
    });
}



window.onload = function() {
    // Load the timer states for each timer
    loadTimerState('timer-1min', 60);
    loadTimerState('timer-3min', 180);
    loadTimerState('timer-6min', 360);
    loadTimerState('timer-10min', 600);
    loadTimerState('timer-20min', 1200);

    // Set up the volume control slider
    document.getElementById('volumeControl').addEventListener('input', function() {
        setVolume(this.value);
    });

    // Set initial volume based on the slider's current position
    setVolume(document.getElementById('volumeControl').value);

    // Add event listener to the sound selector
    document.getElementById('soundSelector').addEventListener('change', function() {
    if (isAnyTimerRunning() || stopwatch.interval) {
        playSelectedSound();
    } else {
        stopAllSounds();
    }
});


    // Initialize completion count display
    updateCompletionCountDisplay();
    loadCompletionCount(); // Load the completion count

    loadStopwatchState(); // Load the stopwatch state
	displayLastUsedTimestamp(); // Add this line
setInterval(updateElapsedTimeDisplay, 1000); // Update elapsed time every second
};


function isAnyTimerRunning() {
    return Object.values(timers).some(timer => timer.interval);
}


function setVolume(volume) {
    // Update the volume of all audio elements
    document.querySelectorAll('audio').forEach(audio => {
        audio.volume = volume;
    });
}


function updateLastUsedTimestamp() {
    let now = new Date();
    localStorage.setItem('lastUsedTime', now);
    displayLastUsedTimestamp();
}

function displayLastUsedTimestamp() {
    let lastUsedTime = localStorage.getItem('lastUsedTime');
    if (lastUsedTime) {
        let date = new Date(lastUsedTime);
        let formattedDate = date.toLocaleString('en-GB'); // Formats the date in DD/MM/YYYY, HH:MM:SS format
        document.getElementById('last-used-time').innerText = formattedDate;
    } else {
        document.getElementById('last-used-time').innerText = 'Never';
    }
}

