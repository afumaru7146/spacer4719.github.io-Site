
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
    "TIGER",
    "HYPED",
    "HYPER",
    "LOVEL",
    "WIDER",

];



// ==========================================
// Wordle Game Engine
// ==========================================

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const STORAGE_KEY = "wordle-save-v4";


// ==========================================
// 今日の日付
// ==========================================

function getTodayKey() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// ==========================================
// 日付から問題番号を作る
// ==========================================

function getPuzzleNumber() {

    const start =
        new Date("2026-01-01T00:00:00");

    const today =
        new Date();

    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return Math.floor(
        (today - start) / 86400000
    );

}


// ==========================================
// 今日の答え
// ==========================================

function getDailyAnswer() {

    const number =
        getPuzzleNumber();

    return ANSWER_WORDS[
        number % ANSWER_WORDS.length
    ];

}


const ANSWER =
    getDailyAnswer();


// ==========================================
// 状態
// ==========================================

let currentRow = 0;

let currentGuess = "";

let gameOver = false;

let guesses = [];


// ==========================================
// DOM
// ==========================================

const board = document.getElementById("board");

function createBoard() {
    board.innerHTML = "";

    for (let i = 0; i < 6 * 5; i++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        board.appendChild(tile);
    }
}

createBoard();

const message =
    document.getElementById("message");


// ==========================================
// ボード生成
// ==========================================

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


// ==========================================
// キーボード
// ==========================================

document
    .querySelectorAll(".key")
    .forEach(key => {

        key.addEventListener(
            "click",
            () => {

                handleKey(
                    key.dataset.key
                );

            }
        );

    });


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

        if (/^[A-Z]$/.test(key)) {

            handleKey(key);

        }

    }
);


// ==========================================
// キー処理
// ==========================================

function handleKey(key) {

    if (gameOver) {
        return;
    }


    if (/^[A-Z]$/.test(key)) {

        if (
            currentGuess.length <
            WORD_LENGTH
        ) {

            currentGuess += key;

            updateCurrentRow();

        }

        return;
    }


    if (key === "BACKSPACE") {

        currentGuess =
            currentGuess.slice(0, -1);

        updateCurrentRow();

        return;

    }


    if (key === "ENTER") {

        submitGuess();

    }

}


// ==========================================
// 入力表示
// ==========================================

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

    }


    if (currentGuess.length > 0) {

        const tile =
            board.children[
                start +
                currentGuess.length -
                1
            ];

        tile.classList.remove("pop");

        void tile.offsetWidth;

        tile.classList.add("pop");

    }

}


// ==========================================
// 回答
// ==========================================

function submitGuess() {

    if (
        currentGuess.length !==
        WORD_LENGTH
    ) {

        showMessage(
            "5文字入力してください"
        );

        shake();

        return;

    }


    if (
        !VALID_WORDS.has(currentGuess)
    ) {

        showMessage(
            "その単語は辞書にありません"
        );

        shake();

        return;

    }


    const result =
        checkGuess(currentGuess);


    guesses.push({
        word: currentGuess,
        result: result
    });


    reveal(
        currentGuess,
        result
    );


    saveState();


    if (
        currentGuess === ANSWER
    ) {

        gameOver = true;

        finishGame(true);

        return;

    }


    currentRow++;

    currentGuess = "";


    if (
        currentRow >=
        MAX_ATTEMPTS
    ) {

        gameOver = true;

        finishGame(false);

    }

}


// ==========================================
// 判定
// ==========================================

function checkGuess(guess) {

    const result =
        Array(WORD_LENGTH)
            .fill("absent");

    const remaining =
        ANSWER.split("");


    // 正解

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


    // 含まれている

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


// ==========================================
// 結果表示
// ==========================================

function reveal(
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

        setTimeout(
            () => {

                const tile =
                    board.children[
                        start + i
                    ];


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


// ==========================================
// キーボード状態
// ==========================================

const priority = {

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


    const oldState =
        key.dataset.state;


    if (
        oldState &&
        priority[oldState] >=
        priority[state]
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


// ==========================================
// Shake
// ==========================================

function shake() {

    const start =
        currentRow * WORD_LENGTH;


    for (
        let i = 0;
        i < WORD_LENGTH;
        i++
    ) {

        const tile =
            board.children[start + i];

        tile.classList.remove("shake");

        void tile.offsetWidth;

        tile.classList.add("shake");

    }

}


// ==========================================
// ゲーム保存
// ==========================================

function saveState() {

    const data = {

        date: getTodayKey(),

        row: currentRow,

        currentGuess: currentGuess,

        guesses: guesses,

        gameOver: gameOver

    };


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}


// ==========================================
// ゲーム復元
// ==========================================

function loadState() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {
        return;
    }


    try {

        const data =
            JSON.parse(saved);


        // 日付が違えば
        // 新しいゲーム

        if (
            data.date !==
            getTodayKey()
        ) {

            return;

        }


        currentRow =
            data.row || 0;

        currentGuess =
            data.currentGuess || "";

        guesses =
            data.guesses || [];

        gameOver =
            data.gameOver || false;


        // 過去の回答を復元

        guesses.forEach(
            (guessData, row) => {

                const start =
                    row *
                    WORD_LENGTH;


                for (
                    let i = 0;
                    i < WORD_LENGTH;
                    i++
                ) {

                    const tile =
                        board.children[
                            start + i
                        ];


                    tile.textContent =
                        guessData.word[i];


                    tile.classList.add(
                        guessData.result[i]
                    );


                    updateKeyboard(
                        guessData.word[i],
                        guessData.result[i]
                    );

                }

            }
        );


        updateCurrentRow();


    }

    catch {

        localStorage.removeItem(
            STORAGE_KEY
        );

    }

}


loadState();


// ==========================================
// 終了
// ==========================================

function finishGame(win) {

    setTimeout(() => {

        if (win) {

            showMessage(
                `🎉 ${currentRow + 1}回で正解！`
            );


            const start =
                currentRow *
                WORD_LENGTH;


            for (
                let i = 0;
                i < WORD_LENGTH;
                i++
            ) {

                setTimeout(() => {

                    board.children[
                        start + i
                    ].classList.add("win");

                }, i * 120);

            }

        }

        else {

            showMessage(
                `答えは ${ANSWER}`
            );

        }


        updateStatistics(win);

        saveState();


    }, 1800);

}




// ==========================================
// 統計
// ==========================================
// ==========================================
// Statistics
// ==========================================

const STATISTICS_KEY =
    "wordle-statistics-v5";


function getStatistics() {

    return JSON.parse(
        localStorage.getItem(
            STATISTICS_KEY
        )
    ) || {

        played: 0,

        wins: 0,

        streak: 0,

        maxStreak: 0,

        distribution: {

            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0

        }

    };

}


// ==========================================
// 結果保存
// ==========================================

function updateStatistics(win) {

    const stats =
        getStatistics();


    stats.played++;


    if (win) {

        stats.wins++;

        stats.streak++;

        stats.maxStreak =
            Math.max(
                stats.maxStreak,
                stats.streak
            );


        const attempts =
            currentRow + 1;


        if (
            attempts >= 1 &&
            attempts <= 6
        ) {

            stats.distribution[
                attempts
            ]++;

        }

    }

    else {

        stats.streak = 0;

    }


    localStorage.setItem(
        STATISTICS_KEY,
        JSON.stringify(stats)
    );

}


// ==========================================
// 統計表示
// ==========================================

function renderStatistics() {

    const stats =
        getStatistics();


document
    .getElementById("shareButton")
    .addEventListener(
        "click",
        async () => {

            const attempt =
                gameOver &&
                guesses.length <= 6
                    ? guesses.length
                    : "X";


            const puzzle =
                getPuzzleNumber();


            const grid =
                guesses
                    .map(item => {

                        return item.result
                            .map(state => {

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

                            })
                            .join("");

                    })
                    .join("\n");


            const text =
`Wordle Clone ${puzzle} ${attempt}/6

${grid}`;


            try {

                await navigator.clipboard
                    .writeText(text);


                showMessage(
                    "結果をコピーしました"
                );

            }

            catch {

                alert(text);

            }

        }
    );




    document.getElementById(
        "winRate"
    ).textContent =
        winRate;


    document.getElementById(
        "currentStreak"
    ).textContent =
        stats.streak;


    document.getElementById(
        "maxStreak"
    ).textContent =
        stats.maxStreak;


    const values =
        Object.values(
            stats.distribution
        );


    const maximum =
        Math.max(
            ...values,
            1
        );


    document
        .querySelectorAll(
            ".distribution-row"
        )
        .forEach(row => {

            const number =
                row.querySelector(
                    "[data-count]"
                ).dataset.count;


            const count =
                stats.distribution[
                    number
                ] || 0;


            const percentage =
                count /
                maximum *
                100;


            const bar =
                row.querySelector(
                    ".bar span"
                );


            const value =
                row.querySelector(
                    "strong"
                );


            bar.style.width =
                `${Math.max(
                    percentage,
                    count > 0 ? 8 : 0
                )}%`;


            value.textContent =
                count;

        });

}


// ==========================================
// 統計モーダル
// ==========================================

function openStatistics() {

    renderStatistics();

    openModal(
        "statsModal"
    );

}




// ==========================================
// メッセージ
// ==========================================

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

