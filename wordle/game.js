
// ======================================
// Wordle Clone
// ======================================


// ------------------------------
// 設定
// ------------------------------

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;


// ------------------------------
// 単語リスト
// ------------------------------

const WORDS = [

    "APPLE",
    "HOUSE",
    "MOUSE",
    "PLANT",
    "WORLD",
    "LIGHT",
    "WATER",
    "MUSIC",
    "STONE",
    "GREEN",
    "BLACK",
    "WHITE",
    "PHONE",
    "CLOUD",
    "NIGHT",
    "HEART",
    "EARTH",
    "SPACE",
    "TRAIN",
    "CHAIR",
    "BREAD",
    "DREAM",
    "SMILE",
    "BRAVE",
    "SOUND",
    "RIVER",
    "BEACH",
    "CROWN",
    "SNAKE",
    "TIGER"

];


// ======================================
// DOM
// ======================================

const board =
    document.getElementById("board");

const message =
    document.getElementById("message");


// ======================================
// ゲーム状態
// ======================================

let currentRow = 0;

let currentGuess = "";

let gameOver = false;

let guesses = [];


// ======================================
// 今日の問題
// ======================================

function getDailyWord() {

    const start =
        new Date("2026-01-01");

    const today =
        new Date();

    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const difference =
        Math.floor(
            (today - start) /
            86400000
        );

    return WORDS[
        difference % WORDS.length
    ];

}


const ANSWER =
    getDailyWord();


// ======================================
// ボード生成
// ======================================

function createBoard() {

    board.innerHTML = "";

    for (
        let i = 0;
        i < MAX_ATTEMPTS * WORD_LENGTH;
        i++
    ) {

        const tile =
            document.createElement("div");

        tile.className = "tile";

        board.appendChild(tile);

    }

}

createBoard();


// ======================================
// キーボード
// ======================================

document
    .querySelectorAll(".key")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                handleKey(
                    button.dataset.key
                );

            }
        );

    });


// ======================================
// PCキーボード
// ======================================

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            handleKey("ENTER");

            return;

        }

        if (
            event.key === "Backspace"
        ) {

            handleKey("BACKSPACE");

            return;

        }

        const key =
            event.key.toUpperCase();

        if (
            /^[A-Z]$/.test(key)
        ) {

            handleKey(key);

        }

    }
);


// ======================================
// キー処理
// ======================================

function handleKey(key) {

    if (gameOver) {
        return;
    }


    // 文字

    if (
        /^[A-Z]$/.test(key)
    ) {

        if (
            currentGuess.length <
            WORD_LENGTH
        ) {

            currentGuess += key;

            updateCurrentRow();

        }

        return;

    }


    // Backspace

    if (key === "BACKSPACE") {

        currentGuess =
            currentGuess.slice(0, -1);

        updateCurrentRow();

        return;

    }


    // Enter

    if (key === "ENTER") {

        submitGuess();

    }

}


// ======================================
// 現在の行を更新
// ======================================

function updateCurrentRow() {

    const start =
        currentRow * WORD_LENGTH;


    for (
        let i = 0;
        i < WORD_LENGTH;
        i++
    ) {

        const tile =
            board.children[start + i];

        tile.textContent =
            currentGuess[i] || "";

        tile.classList.remove("pop");

    }


    // Pop animation

    if (currentGuess.length > 0) {

        const tile =
            board.children[
                start +
                currentGuess.length -
                1
            ];

        tile.classList.add("pop");

    }

}


// ======================================
// 回答
// ======================================

function submitGuess() {

    if (
        currentGuess.length !==
        WORD_LENGTH
    ) {

        showMessage(
            "5文字入力してください"
        );

        shakeRow();

        return;

    }


    const guess =
        currentGuess;


    // 単語チェック

    if (
        !WORDS.includes(guess)
    ) {

        showMessage(
            "登録されていない単語です"
        );

        shakeRow();

        return;

    }


    const result =
        checkGuess(guess);


    revealTiles(
        guess,
        result
    );


    guesses.push(result);


    if (guess === ANSWER) {

        gameOver = true;

        saveGame(true);

        setTimeout(
            () => {

                showMessage(
                    "🎉 正解！"
                );

                showStats();

            },
            1500
        );

        return;

    }


    currentRow++;

    currentGuess = "";


    if (
        currentRow >=
        MAX_ATTEMPTS
    ) {

        gameOver = true;

        saveGame(false);

        setTimeout(
            () => {

                showMessage(
                    `答えは ${ANSWER}`
                );

                showStats();

            },
            800
        );

    }

}


// ======================================
// 判定
// ======================================

function checkGuess(guess) {

    const result =
        Array(WORD_LENGTH)
            .fill("absent");

    const remaining =
        ANSWER.split("");


    // --------------------------
    // 正解位置
    // --------------------------

    for (
        let i = 0;
        i < WORD_LENGTH;
        i++
    ) {

        if (
            guess[i] === ANSWER[i]
        ) {

            result[i] = "correct";

            remaining[i] = null;

        }

    }


    // --------------------------
    // 含まれる文字
    // --------------------------

    for (
        let i = 0;
        i < WORD_LENGTH;
        i++
    ) {

        if (
            result[i] === "correct"
        ) {

            continue;

        }


        const index =
            remaining.indexOf(
                guess[i]
            );


        if (index !== -1) {

            result[i] = "present";

            remaining[index] = null;

        }

    }


    return result;

}


// ======================================
// タイル表示
// ======================================

function revealTiles(
    guess,
    result
) {

    const start =
        currentRow * WORD_LENGTH;


    for (
        let i = 0;
        i < WORD_LENGTH;
        i++
    ) {

        const tile =
            board.children[start + i];


        setTimeout(
            () => {

                tile.classList.add(
                    "flip"
                );

                setTimeout(
                    () => {

                        tile.classList.add(
                            result[i]
                        );

                        updateKeyboard(
                            guess[i],
                            result[i]
                        );

                    },
                    250
                );

            },
            i * 300
        );

    }

}


// ======================================
// キーボード色
// ======================================

const keyboardPriority = {

    absent: 1,
    present: 2,
    correct: 3

};


function updateKeyboard(
    letter,
    state
) {

    const key =
        document.querySelector(
            `[data-key="${letter}"]`
        );


    if (!key) {
        return;
    }


    const currentState =
        key.dataset.state;


    if (
        currentState &&
        keyboardPriority[currentState]
        >=
        keyboardPriority[state]
    ) {

        return;

    }


    key.dataset.state = state;

    key.classList.remove(
        "correct",
        "present",
        "absent"
    );

    key.classList.add(state);

}


// ======================================
// Shake
// ======================================

function shakeRow() {

    const start =
        currentRow * WORD_LENGTH;


    for (
        let i = 0;
        i < WORD_LENGTH;
        i++
    ) {

        const tile =
            board.children[start + i];

        tile.classList.remove(
            "shake"
        );

        void tile.offsetWidth;

        tile.classList.add(
            "shake"
        );

    }

}


// ======================================
// メッセージ
// ======================================

let messageTimer;


function showMessage(text) {

    clearTimeout(messageTimer);

    message.textContent = text;


    messageTimer =
        setTimeout(
            () => {

                message.textContent = "";

            },
            2500
        );

}


// ======================================
// 統計
// ======================================

function getStats() {

    return JSON.parse(
        localStorage.getItem(
            "wordle-stats"
        )
    ) || {

        played: 0,

        wins: 0,

        streak: 0,

        maxStreak: 0

    };

}


function saveGame(win) {

    const stats =
        getStats();


    stats.played++;


    if (win) {

        stats.wins++;

        stats.streak++;

        stats.maxStreak =
            Math.max(
                stats.maxStreak,
                stats.streak
            );

    }

    else {

        stats.streak = 0;

    }


    localStorage.setItem(
        "wordle-stats",
        JSON.stringify(stats)
    );

}


// ======================================
// 統計画面
// ======================================

function showStats() {

    const stats =
        getStats();


    document.getElementById(
        "played"
    ).textContent =
        stats.played;


    document.getElementById(
        "winRate"
    ).textContent =
        stats.played
            ? Math.round(
                stats.wins /
                stats.played *
                100
            )
            : 0;


    document.getElementById(
        "streak"
    ).textContent =
        stats.streak;


    document.getElementById(
        "maxStreak"
    ).textContent =
        stats.maxStreak;


    openModal(
        "statsModal"
    );

}


// ======================================
// 結果共有
// ======================================

document
    .getElementById("shareButton")
    .addEventListener(
        "click",
        async () => {

            const result =
                guesses.map(row => {

                    return row.map(
                        state => {

                            if (
                                state ===
                                "correct"
                            ) {
                                return "🟩";
                            }

                            if (
                                state ===
                                "present"
                            ) {
                                return "🟨";
                            }

                            return "⬛";

                        }
                    ).join("");

                }).join("\n");


            const text =
                `Wordle Clone\n\n${result}`;


            try {

                await navigator.clipboard.writeText(
                    text
                );

                showMessage(
                    "結果をコピーしました"
                );

            }

            catch {

                alert(text);

            }

        }
    );


// ======================================
// Modal
// ======================================

function openModal(id) {

    document
        .getElementById(id)
        .classList.add("show");

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList.remove("show");

}


document
    .getElementById("helpButton")
    .addEventListener(
        "click",
        () => openModal("helpModal")
    );


document
    .getElementById("statsButton")
    .addEventListener(
        "click",
        showStats
    );


document
    .getElementById("settingsButton")
    .addEventListener(
        "click",
        () => openModal("settingsModal")
    );


document
    .querySelectorAll("[data-close]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closeModal(
                    button.dataset.close
                );

            }
        );

    });


// ======================================
// ダークモード
// ======================================

const darkMode =
    document.getElementById(
        "darkMode"
    );


darkMode.checked =
    localStorage.getItem(
        "wordle-dark"
    ) === "true";


if (darkMode.checked) {

    document.body.classList.add(
        "dark"
    );

}


darkMode.addEventListener(
    "change",
    () => {

        document.body.classList.toggle(
            "dark",
            darkMode.checked
        );


        localStorage.setItem(
            "wordle-dark",
            darkMode.checked
        );

    }
);

