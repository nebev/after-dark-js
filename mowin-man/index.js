document.addEventListener("DOMContentLoaded", async function(event) { 

/**
 * Loads an image
 * @param {string} url URL for image
 * @returns Promise<Image object>
 */
 const loadImage = (url) => {
    return new Promise(resolve => {
        const image = new Image();
        image.addEventListener('load', () => {
            resolve(image);
        });
        image.src = url;
    });
}

// General init
const sprites = await loadImage('mm.png');
const negatives = await loadImage('negatives.png');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let spriteMap, width, height;

// State for everything
let state = {
    speed: 3,
    grassSpeed: 1,
    mowEveryDays: 1,
    clearScreen: 0,
    showControls: 1,

    mowingDirection: 'right',
    travelling: 'down',
    mowingCoords: { x: 0, y: 10 },
    prevCoords: {x: 0, y: 0},
    timeOfDay: 'day',
    daysSinceMowing: 0,
};

// Cycle the day
const dayCycle = () => {
    if (state.mowEveryDays === 0) { return chooseNewPath(); } // It's never night
    state.travelling = 'nowhere';
    state.mowingDirection = 'none';

    if (state.timeOfDay === 'day') {
        state.timeOfDay = 'night';
        document.getElementById('night-overlay').classList = ['night'];
        setTimeout(() => {
            dayCycle();
        }, 7000);
    } else {
        state.timeOfDay = 'day';
        document.getElementById('night-overlay').classList = ['day'];
        state.daysSinceMowing++;
        if (state.daysSinceMowing >= state.mowEveryDays) {
            setTimeout(() => {
                chooseNewPath();
            }, 2000);
        } else {
            setTimeout(() => {
                dayCycle();
            }, 7000);
        }
    }
};

// Start mowin on a new path
const chooseNewPath = () => {
    state.daysSinceMowing = 0;
    if (Math.random() > 0.5) {
        // Vertical
        state = {...state,
            mowingDirection: Math.random() > 0.5 ? 'up' : 'down',
            travelling: Math.random() > 0.5 ? 'left' : 'right',
        };
        state.mowingCoords = {
            x: state.travelling === 'left' ? width - 50 : 0,
            y: state.mowingDirection === 'down' ? -100 : height,
        };
    } else {
        // Horizontal
        state = {...state,
            mowingDirection: Math.random() > 0.5 ? 'left' : 'right',
            travelling: Math.random() > 0.5 ? 'up' : 'down',
        };
        state.mowingCoords = {
            x: state.mowingDirection === 'left' ? -100 : width,
            y: state.travelling === 'up' ? height + 100 : -100,
        };
    }
}

const drawSprite = (spriteName, x, y, blankPreviousPosition = false) => {
    const si = spriteMap.frames[`${spriteName}.png`];

    if (blankPreviousPosition) {
        ctx.drawImage(
            negatives,
            si.frame.x,
            si.frame.y,
            si.frame.w,
            si.frame.h,
            state.prevCoords.x,
            state.prevCoords.y,
            si.sourceSize.w,
            si.sourceSize.h,
        );
    }

    ctx.drawImage(
        sprites,
        si.frame.x,
        si.frame.y,
        si.frame.w,
        si.frame.h,
        x,
        y,
        si.sourceSize.w,
        si.sourceSize.h,
    );

};

const drawGrass = (numberOfBlades) => {
    for (let i = 0; i <= numberOfBlades; i++) {
        const grassPiece = Math.floor(Math.random() * 7) + 1;
        drawSprite(`grass-${grassPiece}`, Math.floor(Math.random() * width) + 1, Math.floor(Math.random() * height) + 1);
    }
};

const drawFlowers = (numberOfFlowers) => {
    for (let i = 0; i < numberOfFlowers; i++) {
        const flowerPiece = Math.floor(Math.random() * 5) + 1;
        drawSprite(`flower-${flowerPiece}`, Math.floor(Math.random() * width) + 1, Math.floor(Math.random() * height) + 1);
    }
};

const init = async () => {
    spriteMap = await (await fetch('mm.json')).json();

    canvas.width = canvas.getBoundingClientRect().width / 1.5;
    canvas.height = canvas.getBoundingClientRect().height / 1.5;
    width = canvas.width;
    height = canvas.height;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    chooseNewPath();

    // Parse the params from the URL
    const queryParams = new URLSearchParams(window.location.search);
    state.grassSpeed = parseInt(queryParams.get('grassSpeed'), 10) || 1;
    state.speed = parseInt(queryParams.get('speed'), 10) || 4;
    state.mowEveryDays = parseInt(queryParams.get('mowEveryDays'), 10) || 1;
    state.clearScreen = parseInt(queryParams.get('clearScreen'), 10) || 0;
    state.showControls = queryParams.get('showControls') === '0' ? 0 : 1;
    document.getElementById('speed').value = state.speed;
    document.getElementById('grassSpeed').value = state.grassSpeed;
    document.getElementById('mowEveryDays').value = state.mowEveryDays;
    document.getElementById('clearScreen').checked = state.clearScreen;
    updateState('grassSpeed', state.grassSpeed);
    updateState('mowEveryDays', state.mowEveryDays);
    if (!state.showControls) { document.getElementById('settings').remove(); }

    if (!state.clearScreen) {
        const windowsBg = await loadImage('windows.png');
        ctx.drawImage(
            windowsBg,
            windowsBg.width > width ? 0 : (width / 2) - (windowsBg.width / 2),
            windowsBg.height > height ? 0 : (height / 2) - (windowsBg.height / 2),
        );
    }

    window.requestAnimationFrame(draw);
};


init();

function draw() {
    if (state.mowingCoords.x !== undefined) {
        state.prevCoords = { x: state.mowingCoords.x, y: state.mowingCoords.y };
    }
    if (state.mowingDirection === 'up') {
        state.mowingCoords.y -= state.speed;
        drawSprite('mowin-up', state.mowingCoords.x, state.mowingCoords.y, true);
        if (state.mowingCoords.y < -110) {
            state.mowingCoords.x = state.travelling === 'right' ? state.mowingCoords.x + 50 : state.mowingCoords.x - 50;
            state.mowingDirection = 'down';
        }
    } else if (state.mowingDirection === 'down') {
        state.mowingCoords.y += state.speed;
        drawSprite('mowin-down', state.mowingCoords.x, state.mowingCoords.y, true);
        if (state.mowingCoords.y > height + 100) {
            state.mowingCoords.x = state.travelling === 'right' ? state.mowingCoords.x + 50 : state.mowingCoords.x - 50;
            state.mowingDirection = 'up';
        }
    } else if (state.mowingDirection === 'right') {
        state.mowingCoords.x += state.speed;
        drawSprite('mowin-right', state.mowingCoords.x, state.mowingCoords.y, true);
        if (state.mowingCoords.x > width + 100) {
            state.mowingCoords.y = state.travelling === 'up' ? state.mowingCoords.y - 80 : state.mowingCoords.y + 80;
            state.mowingDirection = 'left';
        }
    } else if (state.mowingDirection === 'left') {
        state.mowingCoords.x -= state.speed;
        drawSprite('mowin-left', state.mowingCoords.x, state.mowingCoords.y, true);
        if (state.mowingCoords.x < -100) {
            state.mowingCoords.y = state.travelling === 'up' ? state.mowingCoords.y - 80 : state.mowingCoords.y + 80;
            state.mowingDirection = 'right';
        }
    }

    drawGrass(9 * state.grassSpeed);
    if (Math.random() > 0.98) {
        const numberOfFlowers = Math.floor(Math.random() * (state.grassSpeed + 1));
        drawFlowers(numberOfFlowers);
    }

    // Check if out of bounds
    if (
        (state.travelling === 'right' && state.mowingCoords.x > width + 100) ||
        (state.travelling === 'left' && state.mowingCoords.x < - 100) ||
        (state.travelling === 'up' && state.mowingCoords.y < - 100) ||
        (state.travelling === 'down' && state.mowingCoords.y > height + 100)
    ) {
        dayCycle();
    }

    window.requestAnimationFrame(draw);
}

// Handle all the inputs. Old skool style. No libraries here
const friendlyMappings = {
    speed: {1: 'Pokey', 4: 'Normal', 10: 'Hurried', 30: 'Menace'},
    grassSpeed: {1: 'Slow', 2: 'Medium', 3: 'High', 4: 'Tropical'},
    mowEveryDays: {0: 'Always', 1: 'Day', 2: '2 Days', 3: '3 Days', 4: '4 Days', 5: '5 Days', 6: '6 Days', 7: 'Week'},
};
const updateState = (stateKey, stateValue) => {
    if (stateValue === true || stateValue === false) {
        state[stateKey] = stateValue + 0;
    } else {
        state[stateKey] = parseInt(stateValue, 10) + 0;
    }
    if (friendlyMappings[stateKey]) {
        const friendlyEl = document.getElementById(`${stateKey}Friendly`);
        if (friendlyEl) {
            friendlyEl.innerHTML = friendlyMappings[stateKey][state[stateKey]];
        }
    }
    const newQueryParams = {
        speed: state.speed,
        grassSpeed: state.grassSpeed,
        mowEveryDays: state.mowEveryDays,
        clearScreen: state.clearScreen,
        showControls: state.showControls,
    };
    const searchParams = new URLSearchParams(newQueryParams);
    if (!(window.location.href.endsWith(`?${searchParams.toString()}`))) {
        window.history.pushState(newQueryParams, 'State Update', `?${searchParams.toString()}`);
    }
};

// Listeners
Object.keys(state).forEach(s => {
    const el = document.getElementById(s);
    if (el) {
        el.addEventListener('change', function () {
            if (this.type && this.type === 'checkbox') { updateState(s, this.checked); }
            else { updateState(s, this.value); }
        });
        el.addEventListener('input', function () {
            if (this.type && this.type === 'checkbox') { updateState(s, this.checked); }
            else { updateState(s, this.value); }
        });
    }
});
document.getElementById('closeControls').addEventListener('click', () => {
    document.getElementById('settings').remove();
    updateState('showControls', false);
});


});