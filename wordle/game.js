// ==========================================
// WORDLE CLONE - GAME.JS
// ==========================================

"use strict";


// ==========================================
// 基本設定
// ==========================================

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const GAME_STORAGE_KEY = "wordle-game-v5";
const STATS_STORAGE_KEY = "wordle-statistics-v5";
const THEME_STORAGE_KEY = "wordle-dark";


// ==========================================
// DOM
// ==========================================

const board = document.getElementById("board");
const message = document.getElementById("message");


// ==========================================
// ゲーム状態
// ==========================================

let currentRow = 0;
let currentGuess = "";
let guesses = [];
let gameOver = false;


// ==========================================
// 日付
// ==========================================

function getTodayKey() {

    const date = new Date();

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==========================================
// パズル番号
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
// 初期化
// ==========================================

function init() {

    createBoard();

    setupKeyboard();

    setupPhysicalKeyboard();

    setupModals();

    setupSettings();

    loadGame();

}


// ==========================================
// 盤面生成
// ==========================================

function createBoard() {

    if (!board) {
        console.error("board element not found");
        return;
    }

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


// ==========================================
// クリックキーボード
// ==========================================

function setupKeyboard() {

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

}


// ==========================================
// PCキーボード
// ==========================================

function setupPhysicalKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                handleKey("ENTER");

                return;
            }

            if (event.key === "Backspace") {

                event.preventDefault();

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

}


// ==========================================
// キー処理
// ==========================================

function handleKey(key) {

    if (gameOver) {
        return;
    }


    // 文字入力

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


// ==========================================
// 現在の行を表示
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

        if (!tile) {
            return;
        }

        tile.textContent =
            currentGuess[i] || "";

    }


    // Popアニメーション

    if (currentGuess.length > 0) {

        const index =
            start +
            currentGuess.length -
            1;

        const tile =
            board.children[index];

        tile.classList.remove("pop");

        void tile.offsetWidth;

        tile.classList.add("pop");

    }

}


// ==========================================
// 回答送信
// ==========================================

function submitGuess() {

    if (gameOver) {
        return;
    }


    // 5文字未満
    if (
        currentGuess.length !== WORD_LENGTH
    ) {

        showMessage(
            "5文字入力してください"
        );

        shakeRow();

        return;
    }


    // 辞書チェック
    if (
        !VALID_WORDS.has(currentGuess)
    ) {

        showMessage(
            "その単語は辞書にありません"
        );

        shakeRow();

        return;
    }


    const guess = currentGuess;

    const result = checkGuess(guess);


    // 回答を保存
    guesses.push({
        word: guess,
        result: result
    });


    // 現在の行に表示
    revealTiles(
        guess,
        result
    );


    // ======================================
    // 正解
    // ======================================

    if (guess === ANSWER) {

        gameOver = true;

        // 正解した場合は
        // currentRow はそのまま
        saveGame();

        setTimeout(
            () => finishGame(true),
            1800
        );

        return;
    }


    // ======================================
    // 次の行へ
    // ======================================

    currentRow++;

    currentGuess = "";


    // ======================================
    // 6回目まで外れた
    // ======================================

    if (
        currentRow >= MAX_ATTEMPTS
    ) {

        gameOver = true;

        saveGame();

        setTimeout(
            () => finishGame(false),
            1800
        );

        return;
    }


    // ======================================
    // ここで保存
    // ======================================

    saveGame();

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


    // 正しい位置

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


    // 含まれているが位置が違う

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
// タイル表示
// ==========================================

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

        setTimeout(
            () => {

                const tile =
                    board.children[start + i];

                if (!tile) {
                    return;
                }


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
// キーボード色
// ==========================================

const STATE_PRIORITY = {

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
            `.key[data-key="${letter}"]`
        );


    if (!key) {
        return;
    }


    const oldState =
        key.dataset.state;


    if (
        oldState &&
        STATE_PRIORITY[oldState] >=
        STATE_PRIORITY[state]
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

        if (!tile) {
            continue;
        }


        tile.classList.remove(
            "shake"
        );

        void tile.offsetWidth;

        tile.classList.add(
            "shake"
        );

    }

}


// ==========================================
// メッセージ
// ==========================================

let messageTimer = null;


function showMessage(text) {

    if (!message) {
        return;
    }


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


// ==========================================
// ゲーム保存
// ==========================================

function saveGame() {

    const data = {

        date: getTodayKey(),

        row: currentRow,

        currentGuess: currentGuess,

        guesses: guesses,

        gameOver: gameOver

    };


    localStorage.setItem(
        GAME_STORAGE_KEY,
        JSON.stringify(data)
    );

}

// ==========================================
// ゲーム復元
// ==========================================

function loadGame() {

    const saved =
        localStorage.getItem(
            GAME_STORAGE_KEY
        );


    if (!saved) {
        return;
    }


    try {

        const data =
            JSON.parse(saved);


        // 日付が違う場合
        if (
            data.date !==
            getTodayKey()
        ) {

            return;
        }


        // ==================================
        // 状態復元
        // ==================================

        guesses =
            Array.isArray(data.guesses)
                ? data.guesses.slice(
                    0,
                    MAX_ATTEMPTS
                )
                : [];


        // currentRow は
        // 保存データと回答数の
        // 大きい方を基準にする
        currentRow =
            Math.max(
                Number(data.row) || 0,
                guesses.length
            );


        // 最大6行
        currentRow =
            Math.min(
                currentRow,
                MAX_ATTEMPTS
            );


        currentGuess =
            data.currentGuess || "";


        gameOver =
            Boolean(data.gameOver);


        // ==================================
        // 盤面復元
        // ==================================

        guesses.forEach(
            (guessData, row) => {

                if (
                    !guessData ||
                    !guessData.word ||
                    !guessData.result
                ) {

                    return;
                }


                const start =
                    row * WORD_LENGTH;


                for (
                    let i = 0;
                    i < WORD_LENGTH;
                    i++
                ) {

                    const tile =
                        board.children[
                            start + i
                        ];


                    if (!tile) {
                        continue;
                    }


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


        // 現在入力中の文字を復元
        if (!gameOver) {

            updateCurrentRow();

        }

    }
    catch (error) {

        console.error(
            "ゲームデータの復元に失敗:",
            error
        );

        localStorage.removeItem(
            GAME_STORAGE_KEY
        );

    }

}

// ==========================================
// ゲーム終了
// ==========================================

function finishGame(win) {

    if (win) {

        showMessage(
            `🎉 ${currentRow + 1}回で正解！`
        );


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


                    if (tile) {

                        tile.classList.add(
                            "win"
                        );

                    }

                },
                i * 120
            );

        }

    }
    else {

        showMessage(
            `答えは ${ANSWER}`
        );

    }


    updateStatistics(win);

    saveGame();

}


// ==========================================
// モーダル
// ==========================================

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.add("show");

}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

}


function setupModals() {

    const helpButton =
        document.getElementById(
            "helpButton"
        );

    const statsButton =
        document.getElementById(
            "statsButton"
        );

    const settingsButton =
        document.getElementById(
            "settingsButton"
        );


    if (helpButton) {

        helpButton.addEventListener(
            "click",
            () => {

                openModal(
                    "helpModal"
                );

            }
        );

    }


    if (statsButton) {

        statsButton.addEventListener(
            "click",
            () => {

                renderStatistics();

                openModal(
                    "statsModal"
                );

            }
        );

    }


    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            () => {

                openModal(
                    "settingsModal"
                );

            }
        );

    }


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


    // モーダル外クリック

    document
        .querySelectorAll(".modal")
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        modal.classList.remove(
                            "show"
                        );

                    }

                }
            );

        });

}


// ==========================================
// 統計表示
// ==========================================

function renderStatistics() {

    const stats =
        getStatistics();


    const played =
        document.getElementById(
            "played"
        );

    const winRate =
        document.getElementById(
            "winRate"
        );

    const streak =
        document.getElementById(
            "currentStreak"
        );

    const maxStreak =
        document.getElementById(
            "maxStreak"
        );


    if (played) {

        played.textContent =
            stats.played;

    }


    if (winRate) {

        winRate.textContent =
            stats.played === 0
                ? 0
                : Math.round(
                    stats.wins /
                    stats.played *
                    100
                );

    }


    if (streak) {

        streak.textContent =
            stats.streak;

    }


    if (maxStreak) {

        maxStreak.textContent =
            stats.maxStreak;

    }


    const values =
        Object.values(
            stats.distribution
        );


    const maximum =
        Math.max(...values, 1);


    document
        .querySelectorAll(
            ".distribution-row"
        )
        .forEach(row => {

            const countElement =
                row.querySelector(
                    "[data-count]"
                );


            const valueElement =
                row.querySelector(
                    "strong"
                );


            const bar =
                row.querySelector(
                    ".bar span"
                );


            if (
                !countElement ||
                !valueElement ||
                !bar
            ) {

                return;

            }


            const number =
                countElement.dataset.count;


            const count =
                stats.distribution[number] || 0;


            const percentage =
                count === 0
                    ? 0
                    : Math.max(
                        count / maximum * 100,
                        8
                    );


            bar.style.width =
                `${percentage}%`;


            valueElement.textContent =
                count;

        });

}


// ==========================================
// 結果共有
// ==========================================

function setupShare() {

    const button =
        document.getElementById(
            "shareButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            const attempt =
                gameOver
                    ? guesses.length <= 6
                        ? guesses.length
                        : "X"
                    : "X";


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
`Wordle Clone ${getPuzzleNumber()} ${attempt}/6

${grid}`;


            try {

                await navigator.clipboard
                    .writeText(text);

                showMessage(
                    "結果をコピーしました"
                );

            }
            catch {

                window.prompt(
                    "結果をコピーしてください",
                    text
                );

            }

        }
    );

}


// ==========================================
// ダークモード
// ==========================================

function setupSettings() {

    const darkMode =
        document.getElementById(
            "darkMode"
        );


    if (!darkMode) {
        return;
    }


    const saved =
        localStorage.getItem(
            THEME_STORAGE_KEY
        ) === "true";


    darkMode.checked = saved;


    document.body.classList.toggle(
        "dark",
        saved
    );


    darkMode.addEventListener(
        "change",
        () => {

            const enabled =
                darkMode.checked;


            document.body.classList.toggle(
                "dark",
                enabled
            );


            localStorage.setItem(
                THEME_STORAGE_KEY,
                enabled
            );

        }
    );

}


// ==========================================
// 共有ボタン
// ==========================================

setupShare();


// ==========================================
// ゲーム開始
// ==========================================

init();
setupSettings();