"use strict";

/* =========================================================
   WORDLE GAME
   ========================================================= */


/* =========================================================
   基本設定
   ========================================================= */

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const GAME_STORAGE_KEY = "wordle-game-v6";
const STATS_STORAGE_KEY = "wordle-statistics-v6";
const THEME_STORAGE_KEY = "wordle-dark";


/* =========================================================
   DOM
   ========================================================= */

const board = document.getElementById("board");
const message = document.getElementById("message");


/* =========================================================
   ゲーム状態
   ========================================================= */

let currentRow = 0;
let currentGuess = "";
let guesses = [];
let gameOver = false;


/* =========================================================
   今日の日付
   ========================================================= */

function getTodayKey() {

    const date = new Date();

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   パズル番号
   ========================================================= */

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


/* =========================================================
   今日の答え
   ========================================================= */

function getDailyAnswer() {

    if (
        typeof ANSWER_WORDS === "undefined" ||
        ANSWER_WORDS.length === 0
    ) {

        console.error(
            "ANSWER_WORDS が見つかりません。words.jsを確認してください。"
        );

        return "APPLE";
    }

    const number =
        getPuzzleNumber();

    return ANSWER_WORDS[
        number % ANSWER_WORDS.length
    ].toUpperCase();

}

const ANSWER =
    getDailyAnswer();


/* =========================================================
   初期化
   ========================================================= */

function init() {

    createBoard();

    setupKeyboard();

    setupPhysicalKeyboard();

    setupModals();

    setupSettings();

    setupDictionary();

    setupShare();

    loadGame();

}


/* =========================================================
   盤面生成
   ========================================================= */

function createBoard() {

    if (!board) {

        console.error(
            "#board が見つかりません。"
        );

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


/* =========================================================
   クリックキーボード
   ========================================================= */

function setupKeyboard() {

    document
        .querySelectorAll(".key")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const key =
                        button.dataset.key;

                    if (key) {

                        handleKey(
                            key.toUpperCase()
                        );

                    }

                }
            );

        });

}


/* =========================================================
   PCキーボード
   ========================================================= */

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


/* =========================================================
   キー処理
   ========================================================= */

function handleKey(key) {

    if (gameOver) {
        return;
    }


    /* 文字入力 */

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


    /* Backspace */

    if (key === "BACKSPACE") {

        currentGuess =
            currentGuess.slice(0, -1);

        updateCurrentRow();

        return;
    }


    /* Enter */

    if (key === "ENTER") {

        submitGuess();

    }

}


/* =========================================================
   現在の行を更新
   ========================================================= */

function updateCurrentRow() {

    if (!board) {
        return;
    }

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

        tile.textContent =
            currentGuess[i] || "";

    }


    if (currentGuess.length > 0) {

        const index =
            start +
            currentGuess.length -
            1;

        const tile =
            board.children[index];

        if (tile) {

            tile.classList.remove("pop");

            void tile.offsetWidth;

            tile.classList.add("pop");

        }

    }

}


/* =========================================================
   回答送信
   ========================================================= */

function submitGuess() {

    if (gameOver) {
        return;
    }


    /* 5文字チェック */

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


    /* 辞書チェック */

    if (
        typeof VALID_WORDS === "undefined"
    ) {

        console.error(
            "VALID_WORDS が見つかりません。words.jsを確認してください。"
        );

        return;
    }


    if (
        !VALID_WORDS.has(currentGuess)
    ) {

        showMessage(
            "その単語は辞書にありません"
        );

        shakeRow();

        return;
    }


    const guess =
        currentGuess;


    const result =
        checkGuess(guess);


    /* 回答を追加 */

    guesses.push({

        word: guess,

        result: result

    });


    /* タイルを反転 */

    revealTiles(
        guess,
        result
    );


    /* 正解 */

    if (
        guess === ANSWER
    ) {

        gameOver = true;

        currentGuess = "";

        saveGame();

        setTimeout(
            () => finishGame(true),
            1800
        );

        return;
    }


    /* 次の行へ */

    currentRow++;

    currentGuess = "";


    /* 6回失敗 */

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


    /* 正しい状態で保存 */

    saveGame();

}


/* =========================================================
   Wordle判定
   ========================================================= */

function checkGuess(guess) {

    const result =
        Array(WORD_LENGTH)
            .fill("absent");

    const remaining =
        ANSWER.split("");


    /* 正しい位置 */

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


    /* 含まれているが位置が違う */

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


/* =========================================================
   タイル表示
   ========================================================= */

function revealTiles(
    guess,
    result
) {

    if (!board) {
        return;
    }

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


/* =========================================================
   キーボード状態
   ========================================================= */

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


    key.dataset.state =
        state;


    key.classList.remove(
        "correct",
        "present",
        "absent"
    );


    key.classList.add(
        state
    );

}


/* =========================================================
   行を揺らす
   ========================================================= */

function shakeRow() {

    if (!board) {
        return;
    }

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


/* =========================================================
   メッセージ
   ========================================================= */

let messageTimer = null;


function showMessage(text) {

    if (!message) {
        return;
    }


    clearTimeout(
        messageTimer
    );


    message.textContent =
        text;


    messageTimer =
        setTimeout(
            () => {

                message.textContent =
                    "";

            },
            2500
        );

}


/* =========================================================
   ゲーム保存
   ========================================================= */

function saveGame() {

    const data = {

        date:
            getTodayKey(),

        row:
            currentRow,

        currentGuess:
            currentGuess,

        guesses:
            guesses,

        gameOver:
            gameOver

    };


    localStorage.setItem(
        GAME_STORAGE_KEY,
        JSON.stringify(data)
    );

}


/* =========================================================
   ゲーム復元
   ========================================================= */

function loadGame() {

    if (!board) {
        return;
    }


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


        /* 日付が違う */

        if (
            data.date !==
            getTodayKey()
        ) {

            return;
        }


        /* 回答復元 */

        guesses =
            Array.isArray(data.guesses)
                ? data.guesses.slice(
                    0,
                    MAX_ATTEMPTS
                )
                : [];


        /*
         * currentRowは
         * 回答数を基準にする。
         *
         * これによって
         * リロード後に同じ行へ
         * 上書きするバグを防止。
         */

        currentRow =
            Math.max(
                Number(data.row) || 0,
                guesses.length
            );


        currentRow =
            Math.min(
                currentRow,
                MAX_ATTEMPTS
            );


        currentGuess =
            typeof data.currentGuess === "string"
                ? data.currentGuess
                : "";


        gameOver =
            Boolean(data.gameOver);


        /* 盤面復元 */

        guesses.forEach(
            (guessData, row) => {

                if (
                    !guessData ||
                    typeof guessData.word !==
                    "string" ||
                    !Array.isArray(
                        guessData.result
                    )
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
                        guessData.word[i] || "";


                    const state =
                        guessData.result[i];


                    if (
                        state === "correct" ||
                        state === "present" ||
                        state === "absent"
                    ) {

                        tile.classList.add(
                            state
                        );


                        updateKeyboard(
                            guessData.word[i],
                            state
                        );

                    }

                }

            }
        );


        /* 現在入力中の文字 */

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


/* =========================================================
   統計
   ========================================================= */

function createDefaultStatistics() {

    return {

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


/* =========================================================
   統計取得
   ========================================================= */

function getStatistics() {

    const defaultStats =
        createDefaultStatistics();


    const saved =
        localStorage.getItem(
            STATS_STORAGE_KEY
        );


    if (!saved) {

        return defaultStats;

    }


    try {

        const stats =
            JSON.parse(saved);


        return {

            played:
                Number(stats.played) || 0,

            wins:
                Number(stats.wins) || 0,

            streak:
                Number(stats.streak) || 0,

            maxStreak:
                Number(stats.maxStreak) || 0,

            distribution: {

                1:
                    Number(
                        stats.distribution?.[1]
                    ) || 0,

                2:
                    Number(
                        stats.distribution?.[2]
                    ) || 0,

                3:
                    Number(
                        stats.distribution?.[3]
                    ) || 0,

                4:
                    Number(
                        stats.distribution?.[4]
                    ) || 0,

                5:
                    Number(
                        stats.distribution?.[5]
                    ) || 0,

                6:
                    Number(
                        stats.distribution?.[6]
                    ) || 0

            }

        };

    }
    catch (error) {

        console.error(
            "統計データの読み込みに失敗:",
            error
        );


        return defaultStats;

    }

}


/* =========================================================
   統計更新
   ========================================================= */

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
            attempts <= MAX_ATTEMPTS
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
        STATS_STORAGE_KEY,
        JSON.stringify(stats)
    );

}


/* =========================================================
   統計表示
   ========================================================= */

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
                ? "0"
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


    /* 分布 */

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
                stats.distribution[
                    number
                ] || 0;


            const allValues =
                Object.values(
                    stats.distribution
                );


            const maximum =
                Math.max(
                    ...allValues,
                    1
                );


            const percentage =
                count === 0
                    ? 0
                    : Math.max(
                        count /
                        maximum *
                        100,
                        8
                    );


            bar.style.width =
                `${percentage}%`;


            valueElement.textContent =
                count;

        });

}


/* =========================================================
   ゲーム終了
   ========================================================= */

function finishGame(win) {

    if (win) {

        showMessage(
            `🎉 ${currentRow + 1}回で正解！`
        );


        if (board) {

            const start =
                currentRow *
                WORD_LENGTH;


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

    }
    else {

        showMessage(
            `答えは ${ANSWER}`
        );

    }


    updateStatistics(win);

    saveGame();

}


/* =========================================================
   モーダル
   ========================================================= */

function openModal(id) {

    const modal =
        document.getElementById(id);


    if (!modal) {
        return;
    }


    modal.classList.add(
        "show"
    );

}


function closeModal(id) {

    const modal =
        document.getElementById(id);


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );

}


/* =========================================================
   モーダル設定
   ========================================================= */

function setupModals() {

    /* data-close */

    document
        .querySelectorAll(
            "[data-close]"
        )
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


    /* モーダル外クリック */

    document
        .querySelectorAll(
            ".modal"
        )
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


/* =========================================================
   設定
   ========================================================= */

function setupSettings() {

    const settingsButton =
        document.getElementById(
            "settingsButton"
        );


    const settingsModal =
        document.getElementById(
            "settingsModal"
        );


    const darkMode =
        document.getElementById(
            "darkMode"
        );


    /* 設定ボタン */

    if (
        settingsButton &&
        settingsModal
    ) {

        settingsButton.addEventListener(
            "click",
            () => {

                openModal(
                    "settingsModal"
                );

            }
        );

    }


    /* ダークモード */

    if (darkMode) {

        const saved =
            localStorage.getItem(
                THEME_STORAGE_KEY
            ) === "true";


        darkMode.checked =
            saved;


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

}


/* =========================================================
   辞書
   ========================================================= */

function setupDictionary() {

    const button =
        document.getElementById(
            "dictionaryButton"
        );


    const modal =
        document.getElementById(
            "dictionaryModal"
        );


    const list =
        document.getElementById(
            "dictionaryList"
        );


    const count =
        document.getElementById(
            "dictionaryCount"
        );


    const search =
        document.getElementById(
            "dictionarySearch"
        );


    if (
        !button ||
        !modal ||
        !list
    ) {

        return;

    }


    function renderDictionary(
        keyword = ""
    ) {

        if (
            typeof VALID_WORDS ===
            "undefined"
        ) {

            list.innerHTML =
                "<p>辞書を読み込めません。</p>";

            return;

        }


        const words =
            [...VALID_WORDS]
                .filter(word =>
                    word.includes(
                        keyword
                            .trim()
                            .toUpperCase()
                    )
                )
                .sort();


        if (count) {

            count.textContent =
                `${words.length}語`;

        }


        list.innerHTML = "";


        words.forEach(word => {

            const element =
                document.createElement(
                    "span"
                );


            element.className =
                "dictionary-word";


            element.textContent =
                word;


            list.appendChild(
                element
            );

        });

    }


    /* 辞書ボタン */

    button.addEventListener(
        "click",
        () => {

            if (search) {

                search.value = "";

            }


            renderDictionary();

            openModal(
                "dictionaryModal"
            );

        }
    );


    /* 辞書検索 */

    if (search) {

        search.addEventListener(
            "input",
            () => {

                renderDictionary(
                    search.value
                );

            }
        );

    }

}


/* =========================================================
   結果共有
   ========================================================= */

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

            if (
                guesses.length === 0
            ) {

                showMessage(
                    "まだ結果がありません"
                );

                return;
            }


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


/* =========================================================
   起動
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

}
else {

    init();

}