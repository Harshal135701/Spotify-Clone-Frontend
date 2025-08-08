// Create a new Audio object
let currSong = new Audio();

// Utility function to format seconds into MM:SS
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

let songs = [];       // Array to store list of songs
let currFolder;       // Current folder containing songs

// Fetches songs from a specified folder
async function getSongs(folder) {
    currFolder = folder;
    // Using a truly relative path
    let a = await fetch(`${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    const as = div.querySelectorAll("a");

    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        let href = element.getAttribute("href");
        if (!href) continue;
        if (href.toLowerCase().endsWith(".mp3")) {
            // Using a truly relative path
            const fullUrl = new URL(href, `${folder}/`).href;
            songs.push(fullUrl.split(`${folder}/`)[1]);
        }
    }

    // Render song list in the UI
    let songUl = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUl.innerHTML = "";
    let songListHtml = "";
    for (let song of songs) {
        songListHtml += `
        <li data-track="${song}">
            <img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div> ${decodeURIComponent(song).replaceAll("%20", " ")}</div>
                <div>Harsh bhai</div>
            </div>
            <div class="playNow"> <span>play now</span><img class="invert" src="img/playbutton.svg" alt="">
            </div>
        </li>`;
    }
    songUl.innerHTML = songListHtml;

    // Add click event to each song in the list
    Array.from(document.querySelectorAll(".songList li")).forEach(e => {
        e.addEventListener("click", () => {
            const songName = e.querySelector(".info").firstElementChild.textContent.trim();
            playmusic(songName);
        });
    });
}

// Function to play a specific track
const playmusic = (track) => {
    // Using a truly relative path for the audio source
    currSong.src = `${currFolder}/${track}`;
    const play = document.getElementById("play");
    currSong.play();
    play.src = "img/pause.svg";
    document.querySelector(".songInfo").innerHTML = decodeURIComponent(track);
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00"
}

// Displays album cards dynamically
async function displayAlbums() {
    // Using a truly relative path for fetching
    let a = await fetch(`songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    
    cardContainer.innerHTML = "";

    for (const e of Array.from(anchors)) {
        if (e.href.includes("songs/") && !e.href.includes("?C=N;O=D")) {
            const folder = e.href.split("songs/")[1].split("/")[0];
            try {
                // Using a truly relative path for fetching the JSON
                let a = await fetch(`songs/${folder}/info.json`);
                let meta = await a.json();

                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <div style="width: 32px; height: 32px; background-color: #1DB954; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32">
                                <path d="M26 20 C26 20, 26 44, 26 44 C26 44, 46 32, 46 32 C46 32, 26 20, 26 20 Z" fill="black" />
                            </svg>
                        </div>
                    </div>
                    <img src="songs/${folder}/cover.jpeg" alt="">
                    <h4>${meta.title}</h4>
                    <p>${meta.description}</p>
                </div>`;
            } catch (error) {
                console.warn(`Missing info.json in songs/${folder}/`, error);
            }
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async item => {
            await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            if (songs.length > 0) {
                playmusic(songs[0]);
            }
        })
    })
}

// Main function to initialize the player
async function main() {
    await getSongs("songs/cs");
    playmusic(songs[0]);
    displayAlbums();

    const play = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");

    if (play) {
        play.addEventListener("click", () => {
            if (currSong.paused) {
                currSong.play()
                play.src = "img/pause.svg"
            } else {
                currSong.pause()
                play.src = "img/playbutton.svg"
            }
        })
    }

    currSong.addEventListener("timeupdate", () => {
        document.querySelector(".songTime").innerHTML = `${formatTime(currSong.currentTime)}/${formatTime(currSong.duration)}`
        document.querySelector(".circle").style.left = (currSong.currentTime / currSong.duration) * 100 + "%";
    })

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currSong.currentTime = ((currSong.duration) * percent) / 100;
    })

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    })
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    })

    // Previous button functionality
    if (previous) {
        previous.addEventListener("click", () => {
            let currentSongFilename = currSong.src.split('/').pop();
            let index = songs.indexOf(currentSongFilename);
            if ((index - 1) >= 0) {
                playmusic(songs[index - 1]);
            }
        })
    }

    // Next button functionality
    if (next) {
        next.addEventListener("click", () => {
            let currentSongFilename = currSong.src.split('/').pop();
            let index = songs.indexOf(currentSongFilename);
            if ((index + 1) < songs.length) {
                playmusic(songs[index + 1]);
            }
        })
    }

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currSong.volume = parseInt(e.target.value) / 100;
    })

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currSong.volume = 0.2;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 20
        }
    });
}

main();