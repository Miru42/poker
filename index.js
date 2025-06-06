"use strict";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// No Gemini API needed for this game logic.
console.log("Poker Script v1.3.3 Loaded - Flop 3 cards, Burn Logic.");
const SUITS = ['♠', '♥', '♣', '♦']; // Spades, Hearts, Clubs, Diamonds
const RANKS = [
    { rank: '2', value: 2 }, { rank: '3', value: 3 }, { rank: '4', value: 4 },
    { rank: '5', value: 5 }, { rank: '6', value: 6 }, { rank: '7', value: 7 },
    { rank: '8', value: 8 }, { rank: '9', value: 9 }, { rank: '10', value: 10 },
    { rank: 'J', value: 11 }, { rank: 'Q', value: 12 }, { rank: 'K', value: 13 },
    { rank: 'A', value: 14 }
];
// Ensure example cards have unique IDs for rendering
function addIdsToExampleCards(cards) {
    return cards.map((card, index) => ({ ...card, id: `example-${card.suit}${card.rank}-${index}` }));
}
const POKER_HAND_RANKINGS = [
    {
        kor: "로열 플러시", eng: "Royal Flush", desc: "A, K, Q, J, 10 (모두 같은 무늬)",
        exampleCards: addIdsToExampleCards([
            { suit: '♥', rank: 'A', value: 14 }, { suit: '♥', rank: 'K', value: 13 },
            { suit: '♥', rank: 'Q', value: 12 }, { suit: '♥', rank: 'J', value: 11 },
            { suit: '♥', rank: '10', value: 10 }
        ]),
        highlightIndices: [0, 1, 2, 3, 4]
    },
    {
        kor: "스트레이트 플러시", eng: "Straight Flush", desc: "연속된 숫자 5장 (모두 같은 무늬, 로열 플러시 제외)",
        exampleCards: addIdsToExampleCards([
            { suit: '♠', rank: '9', value: 9 }, { suit: '♠', rank: '8', value: 8 },
            { suit: '♠', rank: '7', value: 7 }, { suit: '♠', rank: '6', value: 6 },
            { suit: '♠', rank: '5', value: 5 }
        ]),
        highlightIndices: [0, 1, 2, 3, 4]
    },
    {
        kor: "포 카드", eng: "Four of a Kind", desc: "같은 숫자 4장 + 아무 카드 1장",
        exampleCards: addIdsToExampleCards([
            { suit: '♦', rank: 'A', value: 14 }, { suit: '♠', rank: 'A', value: 14 },
            { suit: '♥', rank: 'A', value: 14 }, { suit: '♣', rank: 'A', value: 14 },
            { suit: '♠', rank: 'K', value: 13 }
        ]),
        highlightIndices: [0, 1, 2, 3]
    },
    {
        kor: "풀 하우스", eng: "Full House", desc: "같은 숫자 3장 + 같은 숫자 2장 (트리플 + 원 페어)",
        exampleCards: addIdsToExampleCards([
            { suit: '♥', rank: 'K', value: 13 }, { suit: '♠', rank: 'K', value: 13 },
            { suit: '♦', rank: 'K', value: 13 }, { suit: '♣', rank: 'Q', value: 12 },
            { suit: '♥', rank: 'Q', value: 12 }
        ]),
        highlightIndices: [0, 1, 2, 3, 4]
    },
    {
        kor: "플러시", eng: "Flush", desc: "무늬가 같은 카드 5장 (숫자는 연속되지 않음)",
        exampleCards: addIdsToExampleCards([
            { suit: '♦', rank: 'A', value: 14 }, { suit: '♦', rank: 'J', value: 11 },
            { suit: '♦', rank: '8', value: 8 }, { suit: '♦', rank: '5', value: 5 },
            { suit: '♦', rank: '2', value: 2 }
        ]),
        highlightIndices: [0, 1, 2, 3, 4]
    },
    {
        kor: "스트레이트", eng: "Straight", desc: "연속된 숫자 5장 (무늬는 달라도 됨)",
        exampleCards: addIdsToExampleCards([
            { suit: '♠', rank: '10', value: 10 }, { suit: '♥', rank: '9', value: 9 },
            { suit: '♦', rank: '8', value: 8 }, { suit: '♣', rank: '7', value: 7 },
            { suit: '♥', rank: '6', value: 6 }
        ]),
        highlightIndices: [0, 1, 2, 3, 4]
    },
    {
        kor: "트리플", eng: "Three of a Kind", desc: "같은 숫자 3장 + 서로 다른 숫자 2장",
        exampleCards: addIdsToExampleCards([
            { suit: '♣', rank: 'Q', value: 12 }, { suit: '♥', rank: 'Q', value: 12 },
            { suit: '♠', rank: 'Q', value: 12 }, { suit: '♦', rank: 'A', value: 14 },
            { suit: '♣', rank: 'K', value: 13 }
        ]),
        highlightIndices: [0, 1, 2]
    },
    {
        kor: "투 페어", eng: "Two Pair", desc: "같은 숫자 2장 + 같은 숫자 2장 + 아무 카드 1장",
        exampleCards: addIdsToExampleCards([
            { suit: '♥', rank: 'J', value: 11 }, { suit: '♠', rank: 'J', value: 11 },
            { suit: '♦', rank: '8', value: 8 }, { suit: '♣', rank: '8', value: 8 },
            { suit: '♥', rank: 'K', value: 13 }
        ]),
        highlightIndices: [0, 1, 2, 3]
    },
    {
        kor: "원 페어", eng: "One Pair", desc: "같은 숫자 2장 + 서로 다른 숫자 3장",
        exampleCards: addIdsToExampleCards([
            { suit: '♥', rank: '10', value: 10 }, { suit: '♠', rank: '10', value: 10 },
            { suit: '♦', rank: 'Q', value: 12 }, { suit: '♣', rank: 'J', value: 11 },
            { suit: '♥', rank: '9', value: 9 }
        ]),
        highlightIndices: [0, 1]
    },
    {
        kor: "하이 카드", eng: "High Card", desc: "위 족보에 해당하지 않는 경우, 가장 높은 숫자의 카드로 결정",
        exampleCards: addIdsToExampleCards([
            { suit: '♠', rank: 'A', value: 14 }, { suit: '♥', rank: 'K', value: 13 },
            { suit: '♦', rank: 'Q', value: 12 }, { suit: '♣', rank: 'J', value: 11 },
            { suit: '♣', rank: '9', value: 9 }
        ]),
        highlightIndices: [0]
    }
];
const DEFAULT_SMALL_BLIND = 10;
const DEFAULT_BIG_BLIND = 20;
let dynamicSmallBlind = DEFAULT_SMALL_BLIND;
let dynamicBigBlind = DEFAULT_BIG_BLIND;
let deck = [];
let communityCards = [];
let revealedCommunityCardIds = new Set();
let revealedPlayerCardIds = new Set();
let revealedAICardIds = new Set();
// Game State
let currentGameMode = null;
let humanPlayer = null;
let aiPlayer = null;
let currentPot = 0;
let selectedAIDifficulty = null;
let marathonAILevel = 1;
let dealerPosition = 'ai';
let currentBettingRound = 'pre_deal';
let currentPlayerTurn = null;
let currentBetToCall = 0;
let minRaiseAmount = DEFAULT_BIG_BLIND;
let isHandInProgress = false;
let playerWhoLastRaised = null;
let initialStartingChipsSession = 1000;
let playerGlobalChips = 100000;
const MAX_GLOBAL_CHIPS = 100000000;
const GLOBAL_CHIPS_STORAGE_KEY = 'texasHoldemGlobalPlayerChips';
let sequentialRevealInProgress = false;
// DOM Elements
const gameBoardDiv = document.getElementById('game-board');
const playerHoleCardsDiv = document.getElementById('player-hole-cards');
const communityCardsDiv = document.getElementById('community-cards');
const messageAreaDiv = document.getElementById('message-area');
const globalChipsDisplay = document.getElementById('global-chips-display');
// Player and AI UI
const playerChipsDisplay = document.getElementById('player-chips-display');
const playerActionDisplay = document.getElementById('player-action-display');
const dealerChipPlayer = document.getElementById('dealer-chip-player');
const aiPlayerAreaDiv = document.getElementById('ai-player-area');
const aiNameDisplay = document.getElementById('ai-name');
const aiChipsDisplay = document.getElementById('ai-chips-display');
const aiActionDisplay = document.getElementById('ai-action-display');
const dealerChipAI = document.getElementById('dealer-chip-ai');
const aiHoleCardsDiv = document.getElementById('ai-hole-cards');
const potAmountSpan = document.getElementById('pot-amount');
const marathonLevelDisplay = document.getElementById('marathonLevelDisplay');
const playerActionAnimationDiv = document.getElementById('player-action-animation');
const aiActionAnimationDiv = document.getElementById('ai-action-animation');
// Action Buttons
const setupGameButton = document.getElementById('setup-game-button');
const exitGameButton = document.getElementById('exit-game-button');
// Practice Mode Buttons
const practiceModeActionsDiv = document.getElementById('practice-mode-actions');
const dealNewHandPracticeButton = document.getElementById('deal-new-hand-practice-button');
const dealFlopButton = document.getElementById('deal-flop-button');
const dealTurnButton = document.getElementById('deal-turn-button');
const dealRiverButton = document.getElementById('deal-river-button');
const evaluateButton = document.getElementById('evaluate-button');
// AI Mode Betting Actions
const playerBettingActionsDiv = document.getElementById('player-betting-actions');
const foldButton = document.getElementById('foldButton');
const checkButton = document.getElementById('checkButton');
const callButton = document.getElementById('callButton');
const confirmBetButton = document.getElementById('confirmBetButton');
const startNextHandButton = document.getElementById('startNextHandButton');
const betPercentageSlider = document.getElementById('betPercentageSlider');
const betPercentageValue = document.getElementById('betPercentageValue');
const calculatedBetAmountDisplay = document.getElementById('calculatedBetAmountDisplay');
const allInButton = document.getElementById('allInButton');
// Rankings Modal
const showRankingsButton = document.getElementById('show-rankings-button');
const rankingsModal = document.getElementById('rankings-modal');
const closeRankingsButton = rankingsModal.querySelector('.close-button');
const handRankingsList = document.getElementById('hand-rankings-list');
// Game Setup Modal
const gameSetupModal = document.getElementById('game-setup-modal');
const closeSetupModalButton = document.getElementById('close-setup-modal-button');
const gameModePracticeRadio = document.getElementById('gameModePractice');
const gameModeSoloAIRadio = document.getElementById('gameModeSoloAI');
const soloAIOptionsDiv = document.getElementById('solo-ai-options');
const startingChipsSelect = document.getElementById('startingChipsSelect');
const aiDifficultySelect = document.getElementById('aiDifficultySelect');
const startConfiguredGameButton = document.getElementById('start-configured-game-button');
// Exit Game Modal
const exitGameConfirmationModal = document.getElementById('exit-game-confirmation-modal');
const confirmExitGameButton = document.getElementById('confirm-exit-game-button');
const cancelExitGameButton = document.getElementById('cancel-exit-game-button');
let humanAnimationTimeoutId = null;
let aiAnimationTimeoutId = null;
function showActionAnimation(target, message) {
    const animDiv = target === 'human' ? playerActionAnimationDiv : aiActionAnimationDiv;
    if (!animDiv)
        return;
    if (target === 'human' && humanAnimationTimeoutId) {
        clearTimeout(humanAnimationTimeoutId);
    }
    else if (target === 'ai' && aiAnimationTimeoutId) {
        clearTimeout(aiAnimationTimeoutId);
    }
    animDiv.textContent = message;
    animDiv.classList.remove('show');
    void animDiv.offsetWidth;
    animDiv.classList.add('show');
    const currentTimeoutId = window.setTimeout(() => {
        animDiv.classList.remove('show');
        if (target === 'human' && humanAnimationTimeoutId === currentTimeoutId) {
            humanAnimationTimeoutId = null;
        }
        else if (target === 'ai' && aiAnimationTimeoutId === currentTimeoutId) {
            aiAnimationTimeoutId = null;
        }
    }, 1800);
    if (target === 'human') {
        humanAnimationTimeoutId = currentTimeoutId;
    }
    else {
        aiAnimationTimeoutId = currentTimeoutId;
    }
}
function generateCardId(suit, rank) {
    return `${suit}-${rank}-${Math.random().toString(36).substring(2, 7)}`;
}
function createDeck() {
    const newDeck = [];
    for (const suit of SUITS) {
        for (const rankObj of RANKS) {
            newDeck.push({ suit, rank: rankObj.rank, value: rankObj.value, id: generateCardId(suit, rankObj.rank) });
        }
    }
    return newDeck;
}
function shuffleDeck(deckToShuffle) {
    const shuffled = [...deckToShuffle];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
function dealFromDeck(count) {
    if (deck.length < count) {
        messageAreaDiv.textContent = "덱에 카드가 부족합니다!";
        console.error("Deck depleted. Requested:", count, "Available:", deck.length);
        const availableCards = deck.splice(0, deck.length);
        return availableCards;
    }
    return deck.splice(0, count);
}
function renderCard(card, isExampleCard = false, isHighlighted = false, startFaceUp = false) {
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card-container');
    cardContainer.dataset.cardId = card.id;
    if (isExampleCard) { // Render example card directly (no flip, simplified structure)
        const exampleCardDiv = document.createElement('div');
        exampleCardDiv.classList.add('card', 'example-card');
        if (isHighlighted)
            exampleCardDiv.classList.add('highlighted-card-component');
        if (card.suit === '♥')
            exampleCardDiv.classList.add('hearts');
        else if (card.suit === '♦')
            exampleCardDiv.classList.add('diamonds');
        else if (card.suit === '♣')
            exampleCardDiv.classList.add('clubs');
        else if (card.suit === '♠')
            exampleCardDiv.classList.add('spades');
        exampleCardDiv.setAttribute('aria-label', `${card.rank === '10' ? '10' : getRankName(card.value)} ${suitToFullName(card.suit)}`);
        const rankSpanEx = document.createElement('span');
        rankSpanEx.classList.add('rank');
        rankSpanEx.textContent = card.rank;
        exampleCardDiv.appendChild(rankSpanEx);
        const suitSpanEx = document.createElement('span');
        suitSpanEx.classList.add('suit');
        suitSpanEx.textContent = card.suit;
        exampleCardDiv.appendChild(suitSpanEx);
        return exampleCardDiv; // Return the simplified example card
    }
    // Normal game card with flipper
    const cardFlipper = document.createElement('div');
    cardFlipper.classList.add('card-flipper');
    const cardFrontFace = document.createElement('div');
    cardFrontFace.classList.add('card-face', 'card-front-face');
    if (card.suit === '♥')
        cardFrontFace.classList.add('hearts');
    else if (card.suit === '♦')
        cardFrontFace.classList.add('diamonds');
    else if (card.suit === '♣')
        cardFrontFace.classList.add('clubs');
    else if (card.suit === '♠')
        cardFrontFace.classList.add('spades');
    const rankSpanFront = document.createElement('span');
    rankSpanFront.classList.add('rank');
    rankSpanFront.textContent = card.rank;
    cardFrontFace.appendChild(rankSpanFront);
    const suitSpanFront = document.createElement('span');
    suitSpanFront.classList.add('suit');
    suitSpanFront.textContent = card.suit;
    cardFrontFace.appendChild(suitSpanFront);
    cardFrontFace.setAttribute('aria-label', `${card.rank === '10' ? '10' : getRankName(card.value)} ${suitToFullName(card.suit)}`);
    const cardBackFace = document.createElement('div');
    cardBackFace.classList.add('card-face', 'card-back-face');
    cardBackFace.setAttribute('aria-label', '숨겨진 카드');
    cardFlipper.appendChild(cardBackFace);
    cardFlipper.appendChild(cardFrontFace);
    cardContainer.appendChild(cardFlipper);
    if (startFaceUp) { // If card should be shown face up immediately without animation
        cardFlipper.classList.add('is-flipped');
    }
    cardContainer.setAttribute('role', 'img');
    return cardContainer;
}
async function revealCardElement(cardEl, staggerDelay = 0) {
    if (!cardEl)
        return;
    const flipper = cardEl.querySelector('.card-flipper');
    if (flipper && !flipper.classList.contains('is-flipped')) {
        // Wait for the initial stagger delay (if any)
        if (staggerDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, staggerDelay));
        }
        // Add class to start animation
        flipper.classList.add('is-flipped');
        // Wait for animation to complete (CSS transition is 0.6s)
        const animationDuration = 600; // Matches CSS transition duration
        await new Promise(resolve => setTimeout(resolve, animationDuration));
    }
}
function suitToFullName(suitChar) {
    switch (suitChar) {
        case '♠': return '스페이드';
        case '♥': return '하트';
        case '♣': return '클럽';
        case '♦': return '다이아몬드';
        default: return '';
    }
}
async function renderPlayerHoleCards() {
    playerHoleCardsDiv.innerHTML = '';
    if (humanPlayer && humanPlayer.holeCards) {
        for (let i = 0; i < humanPlayer.holeCards.length; i++) {
            const card = humanPlayer.holeCards[i];
            const cardWasAlreadyRevealed = revealedPlayerCardIds.has(card.id);
            const cardElement = renderCard(card, false, false, cardWasAlreadyRevealed);
            playerHoleCardsDiv.appendChild(cardElement);
            if (!cardWasAlreadyRevealed) {
                await revealCardElement(cardElement, 100 + i * 200);
                revealedPlayerCardIds.add(card.id);
            }
        }
    }
}
async function renderAIHoleCards(revealAtShowdown = false) {
    aiHoleCardsDiv.innerHTML = '';
    if (aiPlayer && aiPlayer.holeCards) {
        for (let i = 0; i < aiPlayer.holeCards.length; i++) {
            const card = aiPlayer.holeCards[i];
            const shouldBeVisibleNow = revealAtShowdown || aiPlayer.isAllIn;
            const cardWasAlreadyRevealedInGlobalSet = revealedAICardIds.has(card.id);
            let startCardFaceUp = false;
            if (shouldBeVisibleNow && cardWasAlreadyRevealedInGlobalSet) {
                startCardFaceUp = true;
            }
            const cardElement = renderCard(card, false, false, startCardFaceUp);
            aiHoleCardsDiv.appendChild(cardElement);
            if (shouldBeVisibleNow && !cardWasAlreadyRevealedInGlobalSet) {
                await revealCardElement(cardElement, 100 + i * 200);
                revealedAICardIds.add(card.id);
            }
            else if (!shouldBeVisibleNow && cardWasAlreadyRevealedInGlobalSet) {
                // This case should not happen often if logic is right, but as a fallback:
                // If card was revealed but shouldn't be now (e.g. new hand), ensure it's reset.
                // However, card elements are re-rendered each hand, so this might be redundant.
                // The important part is `revealedAICardIds.clear()` at start of new hand.
            }
        }
    }
}
async function renderCommunityCards() {
    communityCardsDiv.innerHTML = '';
    let animationDelayOffset = 0;
    for (let i = 0; i < communityCards.length; i++) {
        const card = communityCards[i];
        const cardWasAlreadyRevealedInGlobalSet = revealedCommunityCardIds.has(card.id);
        const cardElement = renderCard(card, false, false, cardWasAlreadyRevealedInGlobalSet);
        communityCardsDiv.appendChild(cardElement);
        if (!cardWasAlreadyRevealedInGlobalSet) {
            await revealCardElement(cardElement, 100 + animationDelayOffset * 150);
            revealedCommunityCardIds.add(card.id);
            animationDelayOffset++;
        }
    }
}
function renderPot() {
    potAmountSpan.textContent = String(currentPot);
}
function updatePlayerUIDisplays() {
    if (humanPlayer) {
        playerChipsDisplay.textContent = `칩: ${humanPlayer.chips}`;
        playerActionDisplay.textContent = humanPlayer.lastAction && humanPlayer.lastAction !== 'none' ? `(${translateAction(humanPlayer.lastAction)}${humanPlayer.currentBetInRound > 0 && humanPlayer.lastAction !== 'blind' ? ' ' + humanPlayer.currentBetInRound : ''})` : '';
    }
    else {
        playerChipsDisplay.textContent = `칩: 0`;
        playerActionDisplay.textContent = '';
    }
    if (aiPlayer) {
        aiNameDisplay.textContent = selectedAIDifficulty === 'marathon' ? `AI 상대 (레벨 ${marathonAILevel})` : "AI 상대 (불가능)";
        aiChipsDisplay.textContent = `칩: ${aiPlayer.chips}`;
        aiActionDisplay.textContent = aiPlayer.lastAction && aiPlayer.lastAction !== 'none' ? `(${translateAction(aiPlayer.lastAction)}${aiPlayer.currentBetInRound > 0 && aiPlayer.lastAction !== 'blind' ? ' ' + aiPlayer.currentBetInRound : ''})` : '';
        marathonLevelDisplay.textContent = selectedAIDifficulty === 'marathon' ? `레벨: ${marathonAILevel}` : '';
        marathonLevelDisplay.style.display = selectedAIDifficulty === 'marathon' && currentGameMode === 'solo_ai' ? 'inline' : 'none';
    }
    else {
        aiNameDisplay.textContent = "AI 상대";
        aiChipsDisplay.textContent = `칩: 0`;
        aiActionDisplay.textContent = '';
        marathonLevelDisplay.style.display = 'none';
    }
    renderPot();
    updateDealerChip();
    updateGlobalChipsDisplay();
}
function updateDealerChip() {
    dealerChipPlayer.style.display = (currentGameMode === 'solo_ai' && dealerPosition === 'human') ? 'flex' : 'none';
    dealerChipAI.style.display = (currentGameMode === 'solo_ai' && dealerPosition === 'ai') ? 'flex' : 'none';
}
function getRankName(value) {
    const rankObj = RANKS.find(r => r.value === value);
    if (!rankObj)
        return String(value);
    if (rankObj.rank === 'A')
        return '에이스';
    if (rankObj.rank === 'K')
        return '킹';
    if (rankObj.rank === 'Q')
        return '퀸';
    if (rankObj.rank === 'J')
        return '잭';
    return rankObj.rank;
}
function translateHandName(englishName) {
    const found = POKER_HAND_RANKINGS.find(r => r.eng === englishName);
    return found ? found.kor : englishName;
}
function translateAction(action) {
    switch (action) {
        case 'fold': return '폴드';
        case 'check': return '체크';
        case 'call': return '콜';
        case 'bet': return '벳';
        case 'raise': return '레이즈';
        case 'blind': return '블라인드';
        default: return '';
    }
}
function evaluateSingleHand(hand) {
    if (hand.length !== 5)
        throw new Error("패는 반드시 5장의 카드로 구성되어야 합니다.");
    const sortedHand = [...hand].sort((a, b) => a.value - b.value);
    const ranks = sortedHand.map(card => card.value);
    const suits = sortedHand.map(card => card.suit);
    const rankCounts = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const uniqueRanksDesc = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);
    const isFlush = new Set(suits).size === 1;
    let isStraight = false;
    let straightHighCardValue = 0;
    const uniqueSortedRanksAsc = [...new Set(ranks)].sort((a, b) => a - b);
    if (uniqueSortedRanksAsc.length >= 5) {
        for (let i = uniqueSortedRanksAsc.length - 1; i >= 4; i--) {
            if (uniqueSortedRanksAsc[i] - uniqueSortedRanksAsc[i - 4] === 4) {
                isStraight = true;
                straightHighCardValue = uniqueSortedRanksAsc[i];
                break;
            }
        }
    }
    // Ace-low straight (A-2-3-4-5)
    if (!isStraight && uniqueSortedRanksAsc.includes(14) && uniqueSortedRanksAsc.includes(2) && uniqueSortedRanksAsc.includes(3) && uniqueSortedRanksAsc.includes(4) && uniqueSortedRanksAsc.includes(5)) {
        isStraight = true;
        straightHighCardValue = 5; // Ace plays as 1 for ranking this straight
    }
    let handForDisplay = sortedHand;
    if (isStraight && straightHighCardValue === 5) { // A-5 straight
        const ace = sortedHand.find(c => c.value === 14);
        const lowCards = sortedHand.filter(c => c.value !== 14).sort((a, b) => a.value - b.value);
        handForDisplay = [ace, ...lowCards.filter(c => c.value <= 5).reverse()]; // A, 5, 4, 3, 2
    }
    if (isStraight && isFlush) {
        const highRankValue = straightHighCardValue;
        if (highRankValue === 14) {
            return { name: "Royal Flush", rankValue: 10, detailedName: "로열 플러시", bestHandCards: handForDisplay };
        }
        return { name: "Straight Flush", rankValue: 9, detailedName: `${getRankName(highRankValue)}-high 스트레이트 플러시`, bestHandCards: handForDisplay };
    }
    if (counts[0] === 4) {
        const fourKindRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 4));
        return { name: "Four of a Kind", rankValue: 8, detailedName: `포 카드, ${fourKindRank}s`, bestHandCards: sortedHand };
    }
    if (counts[0] === 3 && counts[1] === 2) {
        const threeKindRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 3));
        const pairRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 2));
        return { name: "Full House", rankValue: 7, detailedName: `풀 하우스, ${threeKindRank}s over ${pairRank}s`, bestHandCards: sortedHand };
    }
    if (isFlush) {
        const highCardName = getRankName(sortedHand[sortedHand.length - 1].value);
        return { name: "Flush", rankValue: 6, detailedName: `${highCardName}-high 플러시`, bestHandCards: sortedHand };
    }
    if (isStraight) {
        const highRankValue = straightHighCardValue;
        return { name: "Straight", rankValue: 5, detailedName: `${getRankName(highRankValue)}-high 스트레이트`, bestHandCards: handForDisplay };
    }
    if (counts[0] === 3) {
        const threeKindRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 3));
        return { name: "Three of a Kind", rankValue: 4, detailedName: `트리플, ${threeKindRank}s`, bestHandCards: sortedHand };
    }
    if (counts[0] === 2 && counts[1] === 2) {
        const highPairRank = getRankName(uniqueRanksDesc.filter(r => rankCounts[r] === 2).sort((a, b) => b - a)[0]);
        const lowPairRank = getRankName(uniqueRanksDesc.filter(r => rankCounts[r] === 2).sort((a, b) => b - a)[1]);
        return { name: "Two Pair", rankValue: 3, detailedName: `투 페어, ${highPairRank}s and ${lowPairRank}s`, bestHandCards: sortedHand };
    }
    if (counts[0] === 2) {
        const pairRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 2));
        return { name: "One Pair", rankValue: 2, detailedName: `원 페어, ${pairRank}s`, bestHandCards: sortedHand };
    }
    const highCardName = getRankName(sortedHand[sortedHand.length - 1].value);
    return { name: "High Card", rankValue: 1, detailedName: `하이 카드, ${highCardName}`, bestHandCards: sortedHand };
}
function combinations(arr, k) {
    if (k === 0)
        return [[]];
    if (k > arr.length)
        return [];
    if (k === arr.length)
        return [arr];
    const [head, ...tail] = arr;
    const combsWithoutHead = combinations(tail, k);
    const combsWithHead = combinations(tail, k - 1).map(comb => [head, ...comb]);
    return [...combsWithHead, ...combsWithoutHead];
}
function compareHands(eval1, eval2) {
    if (eval1.rankValue > eval2.rankValue)
        return eval1;
    if (eval2.rankValue > eval1.rankValue)
        return eval2;
    if (!eval1.bestHandCards || !eval2.bestHandCards) {
        return eval1.rankValue >= eval2.rankValue ? eval1 : eval2;
    }
    const getEffectiveHighCardValueForStraight = (handEval) => {
        if (!handEval.bestHandCards)
            return 0;
        // For A-5 straight, the Ace plays low for rank comparison of straights
        const values = handEval.bestHandCards.map(c => c.value);
        if ((handEval.name === "Straight" || handEval.name === "Straight Flush") &&
            values.includes(14) && values.includes(2) && values.includes(3) && values.includes(4) && values.includes(5)) {
            return 5; // Ace is low in A-5 straight
        }
        return handEval.bestHandCards.map(c => c.value).sort((a, b) => b - a)[0]; // Highest card by value
    };
    if ((eval1.name === "Straight" || eval1.name === "Straight Flush") &&
        (eval2.name === "Straight" || eval2.name === "Straight Flush")) {
        const high1 = getEffectiveHighCardValueForStraight(eval1);
        const high2 = getEffectiveHighCardValueForStraight(eval2);
        if (high1 > high2)
            return eval1;
        if (high2 > high1)
            return eval2;
        return eval1; // Tie, return first (could be further kicker logic for non-straight/flush, but not needed here)
    }
    // Kicker comparison for hands of same rank (e.g. Pair vs Pair, High Card vs High Card)
    const hand1Cards = eval1.bestHandCards.map(c => c.value).sort((a, b) => b - a);
    const hand2Cards = eval2.bestHandCards.map(c => c.value).sort((a, b) => b - a);
    for (let i = 0; i < Math.min(hand1Cards.length, hand2Cards.length); i++) {
        if (hand1Cards[i] > hand2Cards[i])
            return eval1;
        if (hand2Cards[i] > hand1Cards[i])
            return eval2;
    }
    return eval1; // Hands are identical or insufficient kickers to break tie
}
function evaluateTexasHoldemHand(hole, community) {
    const allCards = [...hole, ...community];
    if (allCards.length < 5) {
        return { name: "카드가 부족합니다", rankValue: 0, detailedName: "패를 확인하려면 최소 5장의 카드가 필요합니다." };
    }
    const possibleHands = combinations(allCards, 5);
    let bestEvaluation = null;
    for (const hand of possibleHands) {
        const currentEval = evaluateSingleHand(hand);
        if (!bestEvaluation) {
            bestEvaluation = currentEval;
        }
        else {
            bestEvaluation = compareHands(bestEvaluation, currentEval);
        }
    }
    return bestEvaluation || { name: "오류", rankValue: 0, detailedName: "패를 평가할 수 없습니다." };
}
function resetGameUI(isFullReset = true) {
    if (isFullReset) {
        gameBoardDiv.style.display = 'none';
        aiPlayerAreaDiv.style.display = 'none';
        exitGameButton.style.display = 'none';
        currentGameMode = null;
        humanPlayer = null;
        aiPlayer = null;
        selectedAIDifficulty = null;
        isHandInProgress = false;
        messageAreaDiv.textContent = '환영합니다! "새 게임 설정" 버튼을 눌러 게임을 시작하세요.';
        dynamicSmallBlind = DEFAULT_SMALL_BLIND;
        dynamicBigBlind = DEFAULT_BIG_BLIND;
        marathonAILevel = 1;
        marathonLevelDisplay.style.display = 'none';
    }
    if (humanPlayer) {
        humanPlayer.holeCards = [];
        humanPlayer.currentBetInRound = 0;
        humanPlayer.isFolded = false;
        humanPlayer.isAllIn = false;
        humanPlayer.lastAction = 'none';
        humanPlayer.hasActedThisRound = false;
    }
    if (aiPlayer) {
        aiPlayer.holeCards = [];
        aiPlayer.currentBetInRound = 0;
        aiPlayer.isFolded = false;
        aiPlayer.isAllIn = false;
        aiPlayer.lastAction = 'none';
        aiPlayer.hasActedThisRound = false;
    }
    communityCards = [];
    revealedCommunityCardIds.clear();
    revealedPlayerCardIds.clear();
    revealedAICardIds.clear();
    currentPot = 0;
    currentBetToCall = 0;
    minRaiseAmount = currentGameMode === 'solo_ai' ? dynamicBigBlind : DEFAULT_BIG_BLIND;
    currentPlayerTurn = null;
    currentBettingRound = 'pre_deal';
    playerWhoLastRaised = null;
    sequentialRevealInProgress = false;
    renderPlayerHoleCards();
    renderAIHoleCards();
    renderCommunityCards();
    updatePlayerUIDisplays();
    setupGameButton.disabled = false;
    setupGameButton.style.display = 'inline-block';
    if (isFullReset)
        exitGameButton.style.display = 'none';
    practiceModeActionsDiv.style.display = 'none';
    playerBettingActionsDiv.style.display = 'none';
    startNextHandButton.style.display = 'none';
}
async function updateGameUI() {
    if (currentGameMode === 'practice') {
        practiceModeActionsDiv.style.display = 'flex';
        playerBettingActionsDiv.style.display = 'none';
        startNextHandButton.style.display = 'none';
        aiPlayerAreaDiv.style.display = 'none';
        marathonLevelDisplay.style.display = 'none';
        exitGameButton.style.display = 'none';
        dealNewHandPracticeButton.style.display = humanPlayer ? 'inline-block' : 'none';
        dealFlopButton.style.display = (humanPlayer && humanPlayer.holeCards.length > 0 && communityCards.length === 0) ? 'inline-block' : 'none';
        dealTurnButton.style.display = (communityCards.length === 3) ? 'inline-block' : 'none';
        dealRiverButton.style.display = (communityCards.length === 4) ? 'inline-block' : 'none';
        evaluateButton.style.display = (communityCards.length === 5) ? 'inline-block' : 'none';
        dealNewHandPracticeButton.disabled = isHandInProgress && humanPlayer !== null && humanPlayer.holeCards.length > 0;
        dealFlopButton.disabled = !(humanPlayer && humanPlayer.holeCards.length > 0 && communityCards.length === 0);
        dealTurnButton.disabled = !(communityCards.length === 3);
        dealRiverButton.disabled = !(communityCards.length === 4);
        evaluateButton.disabled = !(communityCards.length === 5);
    }
    else if (currentGameMode === 'solo_ai') {
        practiceModeActionsDiv.style.display = 'none';
        playerBettingActionsDiv.style.display = isHandInProgress && currentPlayerTurn === 'human' && !sequentialRevealInProgress ? 'flex' : 'none';
        startNextHandButton.style.display = !isHandInProgress && humanPlayer && aiPlayer && (humanPlayer.chips > 0 && aiPlayer.chips > 0) ? 'inline-block' : 'none';
        aiPlayerAreaDiv.style.display = 'block';
        exitGameButton.style.display = 'inline-block';
        if (selectedAIDifficulty === 'marathon') {
            marathonLevelDisplay.style.display = 'inline';
            marathonLevelDisplay.textContent = `레벨: ${marathonAILevel}`;
        }
        else {
            marathonLevelDisplay.style.display = 'none';
        }
        if (isHandInProgress && currentPlayerTurn === 'human' && !sequentialRevealInProgress) {
            updateActionButtonsAvailability();
        }
        else if (sequentialRevealInProgress) {
            playerBettingActionsDiv.style.display = 'none';
        }
    }
    else {
        practiceModeActionsDiv.style.display = 'none';
        playerBettingActionsDiv.style.display = 'none';
        startNextHandButton.style.display = 'none';
        aiPlayerAreaDiv.style.display = 'none';
        marathonLevelDisplay.style.display = 'none';
        exitGameButton.style.display = 'none';
    }
    updatePlayerUIDisplays();
    await renderPlayerHoleCards();
    await renderAIHoleCards(currentBettingRound === 'showdown' || currentBettingRound === 'hand_over' || (aiPlayer?.isAllIn ?? false));
    await renderCommunityCards();
    if (!isHandInProgress && humanPlayer && aiPlayer && (humanPlayer.chips === 0 || aiPlayer.chips === 0)) {
        if (selectedAIDifficulty === 'marathon' && aiPlayer.chips === 0 && humanPlayer.chips > 0 && marathonAILevel <= 10) {
            // AI bankrupt in Marathon, level up logic handled in awardPotToWinner/endHand
        }
        else {
            if (humanPlayer.chips === 0 && aiPlayer.chips === 0) {
                messageAreaDiv.textContent = "무승부! 양쪽 플레이어 모두 칩이 없습니다.";
            }
            else if (humanPlayer.chips === 0) {
                messageAreaDiv.textContent = "AI 승리! 당신의 칩이 모두 소진되었습니다.";
            }
            else if (aiPlayer.chips === 0) {
                messageAreaDiv.textContent = "당신 승리! AI의 칩이 모두 소진되었습니다.";
            }
            if (humanPlayer.chips === 0 || (aiPlayer.chips === 0 && selectedAIDifficulty !== 'marathon')) {
                if (humanPlayer) {
                    savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips);
                }
            }
            setupGameButton.disabled = false;
            setupGameButton.style.display = 'inline-block';
            exitGameButton.style.display = 'none';
            startNextHandButton.style.display = 'none';
        }
    }
}
function updateBetSliderUI() {
    if (!humanPlayer || currentGameMode !== 'solo_ai' || currentPlayerTurn !== 'human' || !isHandInProgress) {
        betPercentageSlider.disabled = true;
        betPercentageValue.textContent = '-';
        calculatedBetAmountDisplay.textContent = '(금액: -)';
        return;
    }
    // Slider should be disabled if AI is all-in, handled in updateActionButtonsAvailability
    if (betPercentageSlider.disabled || humanPlayer.isAllIn) {
        betPercentageValue.textContent = '-';
        calculatedBetAmountDisplay.textContent = `(금액: ${humanPlayer.isAllIn ? '올인됨' : '-'})`;
        return;
    }
    const percentage = parseInt(betPercentageSlider.value);
    betPercentageValue.textContent = `${percentage}%`;
    if (humanPlayer.chips > 0) {
        const calculatedValue = Math.min(humanPlayer.chips, Math.max(1, Math.floor(humanPlayer.chips * (percentage / 100))));
        calculatedBetAmountDisplay.textContent = `(금액: ${calculatedValue})`;
    }
    else {
        calculatedBetAmountDisplay.textContent = `(금액: 0)`;
    }
}
async function startNewHand() {
    if (!humanPlayer || (currentGameMode === 'solo_ai' && !aiPlayer)) {
        messageAreaDiv.textContent = "플레이어 정보가 없습니다. 게임을 먼저 설정하세요.";
        return;
    }
    if (selectedAIDifficulty === 'marathon' && marathonAILevel > 10) {
        messageAreaDiv.textContent = `축하합니다! 마라톤 모드 (레벨 10) 클리어! "새 게임 설정"으로 다시 시작하세요.`;
        isHandInProgress = false;
        startNextHandButton.style.display = 'none';
        setupGameButton.disabled = false;
        setupGameButton.style.display = 'inline-block';
        exitGameButton.style.display = 'none';
        if (humanPlayer)
            savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips);
        humanPlayer.chips = 0;
        await updateGameUI();
        return;
    }
    if (humanPlayer.chips === 0 || (aiPlayer && aiPlayer.chips === 0 && !(selectedAIDifficulty === 'marathon' && marathonAILevel <= 10 && aiPlayer.chips === 0))) {
        messageAreaDiv.textContent = "게임 종료. 한 플레이어의 칩이 없습니다. '새 게임 설정'으로 다시 시작하세요.";
        if (humanPlayer.chips > 0) {
            savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips);
            humanPlayer.chips = 0;
        }
        setupGameButton.disabled = false;
        setupGameButton.style.display = 'inline-block';
        exitGameButton.style.display = 'none';
        await updateGameUI();
        return;
    }
    isHandInProgress = true;
    deck = createDeck();
    deck = shuffleDeck(deck);
    revealedCommunityCardIds.clear();
    revealedPlayerCardIds.clear();
    revealedAICardIds.clear();
    humanPlayer.holeCards = [];
    humanPlayer.currentBetInRound = 0;
    humanPlayer.isFolded = false;
    humanPlayer.isAllIn = false;
    humanPlayer.lastAction = 'none';
    humanPlayer.hasActedThisRound = false;
    if (aiPlayer) {
        aiPlayer.holeCards = [];
        aiPlayer.currentBetInRound = 0;
        aiPlayer.isFolded = false;
        aiPlayer.isAllIn = false;
        aiPlayer.lastAction = 'none';
        aiPlayer.hasActedThisRound = false;
    }
    communityCards = [];
    currentPot = 0;
    playerWhoLastRaised = null;
    if (currentGameMode === 'solo_ai') {
        dealerPosition = dealerPosition === 'human' ? 'ai' : 'human';
        minRaiseAmount = dynamicBigBlind;
    }
    else {
        minRaiseAmount = DEFAULT_BIG_BLIND;
    }
    if (selectedAIDifficulty === 'impossible' && aiPlayer && humanPlayer && aiPlayer.chips <= dynamicBigBlind) {
        let maxRetries = 50;
        let aiWins = false;
        let originalDeckState = createDeck();
        while (maxRetries > 0 && !aiWins) {
            deck = shuffleDeck([...originalDeckState]);
            const tempPlayerHole = dealFromDeck(2);
            const tempAIHole = dealFromDeck(2);
            let tempDeckForSim = [...deck];
            if (tempDeckForSim.length > 0)
                tempDeckForSim.shift();
            const tempCommunityForEval = simulateDealingRemainingCommunityCards(tempDeckForSim, []);
            const humanEval = evaluateTexasHoldemHand(tempPlayerHole, tempCommunityForEval);
            const aiEval = evaluateTexasHoldemHand(tempAIHole, tempCommunityForEval);
            if (compareHands(aiEval, humanEval) === aiEval && aiEval.rankValue > humanEval.rankValue) {
                humanPlayer.holeCards = tempPlayerHole;
                aiPlayer.holeCards = tempAIHole;
                aiWins = true;
            }
            maxRetries--;
        }
        if (!aiWins) {
            console.warn("Impossible AI couldn't ensure a win before blind bust after retries. Proceeding with current deal.");
            deck = shuffleDeck([...originalDeckState]);
            humanPlayer.holeCards = dealFromDeck(2);
            if (aiPlayer)
                aiPlayer.holeCards = dealFromDeck(2);
        }
        else {
            console.log("Impossible AI adjusted hand to win due to low chips vs blind.");
        }
    }
    else {
        humanPlayer.holeCards = dealFromDeck(2);
        if (aiPlayer) {
            aiPlayer.holeCards = dealFromDeck(2);
        }
    }
    if (currentGameMode === 'solo_ai' && aiPlayer) {
        currentBettingRound = 'preflop';
        const sbPlayer = dealerPosition === 'human' ? humanPlayer : aiPlayer;
        const bbPlayer = dealerPosition === 'human' ? aiPlayer : humanPlayer;
        postBlind(sbPlayer, dynamicSmallBlind, 'SB');
        postBlind(bbPlayer, dynamicBigBlind, 'BB');
        currentBetToCall = dynamicBigBlind;
        playerWhoLastRaised = bbPlayer.seat;
        currentPlayerTurn = dealerPosition === 'human' ? 'human' : 'ai';
    }
    else if (currentGameMode === 'practice') {
        messageAreaDiv.textContent = "연습 모드: 개인 카드 2장이 지급되었습니다.";
        currentBettingRound = 'pre_deal';
    }
    await updateGameUI();
    setupGameButton.disabled = true;
    setupGameButton.style.display = 'none';
    exitGameButton.style.display = 'inline-block';
    if (currentGameMode === 'solo_ai' && currentPlayerTurn === 'ai' && aiPlayer && !aiPlayer.isFolded && !aiPlayer.isAllIn && isHandInProgress) {
        const initialMessage = `AI의 턴입니다. (프리플랍)`;
        messageAreaDiv.textContent = initialMessage;
        setTimeout(triggerAIAction, 1200);
    }
    else if (currentGameMode === 'solo_ai' && currentPlayerTurn === 'human' && humanPlayer && !humanPlayer.isFolded && !humanPlayer.isAllIn && isHandInProgress) {
        messageAreaDiv.textContent = `당신의 턴입니다. (프리플랍)`;
    }
}
function postBlind(player, amount, type) {
    const blindAmount = Math.min(player.chips, amount);
    player.chips -= blindAmount;
    player.currentBetInRound = blindAmount;
    currentPot += blindAmount;
    player.lastAction = 'blind';
    if (player.chips === 0) {
        player.isAllIn = true;
    }
}
function updateActionButtonsAvailability() {
    if (currentGameMode !== 'solo_ai' || !humanPlayer || !isHandInProgress || currentPlayerTurn !== 'human' || sequentialRevealInProgress) {
        foldButton.disabled = true;
        checkButton.disabled = true;
        callButton.disabled = true;
        confirmBetButton.disabled = true;
        allInButton.disabled = true;
        betPercentageSlider.disabled = true;
        updateBetSliderUI();
        return;
    }
    foldButton.disabled = humanPlayer.isAllIn;
    allInButton.disabled = humanPlayer.isAllIn;
    if (aiPlayer && aiPlayer.isAllIn) {
        // AI is all-in. Human can only fold or call AI's all-in amount.
        checkButton.disabled = true; // Cannot check if AI is all-in with a bet outstanding.
        const callAmountForAIAllIn = aiPlayer.currentBetInRound - humanPlayer.currentBetInRound;
        if (callAmountForAIAllIn <= 0) { // Human has already matched or exceeded AI's all-in.
            callButton.disabled = true;
            callButton.textContent = '콜'; // Or "매치됨"
            // Check button might be enabled if human has matched and it's their turn to act further (complex, usually round ends)
            // For simplicity, if AI is all-in and human matched, betting round should end or check is option.
            // If AI is all in and human's currentBetInRound >= AI's currentBetInRound, human can check if no further action possible.
            // Let's assume checkButton is enabled if callAmountForAIAllIn <= 0 and human isn't all-in.
            checkButton.disabled = humanPlayer.isAllIn;
        }
        else {
            callButton.disabled = humanPlayer.isAllIn;
            const humanCanCoverCall = humanPlayer.chips >= callAmountForAIAllIn;
            callButton.textContent = humanCanCoverCall ? `콜 (${callAmountForAIAllIn})` : `올인 콜 (${humanPlayer.chips})`;
        }
        confirmBetButton.disabled = true;
        confirmBetButton.textContent = "벳/레이즈";
        betPercentageSlider.disabled = true;
    }
    else { // AI is NOT all-in (or no AI player), normal betting rules apply
        const canCheck = humanPlayer.currentBetInRound >= currentBetToCall && !humanPlayer.isAllIn;
        checkButton.disabled = !canCheck;
        const callAmount = currentBetToCall - humanPlayer.currentBetInRound;
        callButton.disabled = !(callAmount > 0 && !humanPlayer.isAllIn);
        if (callAmount > 0) {
            callButton.textContent = humanPlayer.chips >= callAmount ? `콜 (${callAmount})` : `올인 콜 (${humanPlayer.chips})`;
        }
        else {
            callButton.textContent = '콜';
        }
        if (humanPlayer.isAllIn || callAmount <= 0)
            callButton.disabled = true;
        confirmBetButton.disabled = humanPlayer.isAllIn;
        betPercentageSlider.disabled = humanPlayer.isAllIn;
        if (humanPlayer.isAllIn) {
            confirmBetButton.textContent = "올인됨";
        }
        else {
            const percentage = parseInt(betPercentageSlider.value);
            // Ensure calculatedValue is derived from a positive chip amount for slider UI
            const currentActionValue = humanPlayer.chips > 0 ? Math.min(humanPlayer.chips, Math.max(1, Math.floor(humanPlayer.chips * (percentage / 100)))) : 0;
            const isRaiseAttempt = currentBetToCall > 0;
            const newTotalBetIfActionTaken = humanPlayer.currentBetInRound + currentActionValue;
            let isValidAction = false;
            if (isRaiseAttempt) {
                confirmBetButton.textContent = '레이즈';
                // Valid if it's an all-in, or the raise amount meets minRaiseAmount
                if (currentActionValue === humanPlayer.chips || (newTotalBetIfActionTaken - currentBetToCall >= minRaiseAmount)) {
                    isValidAction = true;
                }
            }
            else { // Bet attempt
                confirmBetButton.textContent = '벳';
                // Valid if it's an all-in, or the bet amount meets big blind
                if (currentActionValue === humanPlayer.chips || newTotalBetIfActionTaken >= dynamicBigBlind) {
                    isValidAction = true;
                }
            }
            // Disable if not a valid action, or trying to bet 0, or betting more than chips
            confirmBetButton.disabled = !isValidAction || currentActionValue === 0 || currentActionValue > humanPlayer.chips;
        }
    }
    updateBetSliderUI();
}
async function handleFoldAction() {
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isFolded)
        return;
    humanPlayer.isFolded = true;
    humanPlayer.lastAction = 'fold';
    showActionAnimation('human', "폴드");
    messageAreaDiv.textContent = "당신은 폴드했습니다.";
    isHandInProgress = false;
    if (aiPlayer)
        awardPotToWinner(aiPlayer);
    await endHand();
}
async function handleCheckAction() {
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isAllIn)
        return;
    if (humanPlayer.currentBetInRound < currentBetToCall && !(aiPlayer && aiPlayer.isAllIn && humanPlayer.currentBetInRound >= aiPlayer.currentBetInRound)) {
        messageAreaDiv.textContent = "체크할 수 없습니다. 현재 벳에 콜하거나 레이즈해야 합니다.";
        return;
    }
    humanPlayer.lastAction = 'check';
    humanPlayer.hasActedThisRound = true;
    showActionAnimation('human', "체크");
    messageAreaDiv.textContent = "당신은 체크했습니다.";
    await checkBettingRoundEnd();
}
async function handleCallAction() {
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isAllIn)
        return;
    let callAmountNeeded = currentBetToCall - humanPlayer.currentBetInRound;
    if (aiPlayer && aiPlayer.isAllIn) { // If AI is all-in, call amount is capped by AI's bet
        callAmountNeeded = Math.max(0, aiPlayer.currentBetInRound - humanPlayer.currentBetInRound);
    }
    if (callAmountNeeded <= 0) {
        messageAreaDiv.textContent = "콜할 금액이 없습니다. 체크하거나 벳/레이즈 하세요.";
        // This state should ideally be prevented by disabling call button if no call is needed.
        // Or, treat as check if call amount is 0.
        if (callAmountNeeded === 0 && humanPlayer.currentBetInRound >= currentBetToCall) {
            await handleCheckAction(); // Treat as check
        }
        return;
    }
    const amountToCommit = Math.min(callAmountNeeded, humanPlayer.chips);
    humanPlayer.chips -= amountToCommit;
    currentPot += amountToCommit;
    humanPlayer.currentBetInRound += amountToCommit;
    humanPlayer.lastAction = 'call';
    humanPlayer.hasActedThisRound = true;
    if (humanPlayer.chips === 0) {
        humanPlayer.isAllIn = true;
        messageAreaDiv.textContent = `당신은 올인 콜했습니다 (총 ${humanPlayer.currentBetInRound}).`;
        showActionAnimation('human', `올인 콜 (${amountToCommit})`);
    }
    else {
        messageAreaDiv.textContent = `당신은 ${amountToCommit}을 콜했습니다. (총 ${humanPlayer.currentBetInRound})`;
        showActionAnimation('human', `콜 (${amountToCommit})`);
    }
    await checkBettingRoundEnd();
}
async function handleAllInAction() {
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isAllIn)
        return;
    const humanTotalChipsBeforeAction = humanPlayer.chips;
    if (humanTotalChipsBeforeAction <= 0)
        return;
    let amountCommittedByHumanToPotThisAction;
    let finalHumanBetInRound; // Human's total bet for this round after this action
    // Assume human commits all their chips initially for calculation
    finalHumanBetInRound = humanPlayer.currentBetInRound + humanTotalChipsBeforeAction;
    amountCommittedByHumanToPotThisAction = humanTotalChipsBeforeAction;
    if (aiPlayer && aiPlayer.isAllIn && finalHumanBetInRound > aiPlayer.currentBetInRound) {
        // AI is already all-in, and human's intended all-in would exceed AI's total bet.
        // Human effectively calls AI's all-in. Amount committed to THIS pot is capped.
        const requiredToCallAIAllIn = aiPlayer.currentBetInRound - humanPlayer.currentBetInRound;
        if (requiredToCallAIAllIn <= 0) {
            // Human has already met or exceeded AI's bet. All-in doesn't add to *this* pot.
            amountCommittedByHumanToPotThisAction = 0;
            // finalHumanBetInRound is already humanPlayer.currentBetInRound + humanTotalChipsBeforeAction
            // but the effective bet for this pot is capped at AI's bet.
            // player.currentBetInRound should reflect total committed. Pot adjustment handles contestable amount.
        }
        else {
            // Human needs to commit more to call AI's all-in. Cap at AI's bet or human's remaining chips.
            amountCommittedByHumanToPotThisAction = Math.min(humanTotalChipsBeforeAction, requiredToCallAIAllIn);
        }
        // Update finalHumanBetInRound to reflect actual commitment for this action
        finalHumanBetInRound = humanPlayer.currentBetInRound + amountCommittedByHumanToPotThisAction;
        humanPlayer.lastAction = 'call'; // Effectively a call of AI's all-in
        showActionAnimation('human', `올인 (AI 콜: ${amountCommittedByHumanToPotThisAction})`);
        messageAreaDiv.textContent = `당신은 AI의 올인(${aiPlayer.currentBetInRound})에 콜하고, 당신도 올인합니다.`;
        // DO NOT change currentBetToCall or playerWhoLastRaised, AI is the one who is all-in and capped.
    }
    else {
        // Normal all-in situation (AI not all-in, or AI all-in for more, or human has fewer chips than AI's bet)
        // amountCommittedByHumanToPotThisAction remains humanTotalChipsBeforeAction
        // finalHumanBetInRound remains humanPlayer.currentBetInRound + humanTotalChipsBeforeAction
        const isCurrentlyBet = currentBetToCall === 0;
        // Check if this all-in constitutes a raise
        const isEffectivelyRaise = !isCurrentlyBet && finalHumanBetInRound > currentBetToCall;
        if (isEffectivelyRaise) {
            humanPlayer.lastAction = 'raise';
            minRaiseAmount = finalHumanBetInRound - currentBetToCall; // The amount of the raise itself
            currentBetToCall = finalHumanBetInRound;
            playerWhoLastRaised = 'human';
            if (aiPlayer)
                aiPlayer.hasActedThisRound = false; // AI needs to act again
        }
        else if (isCurrentlyBet) {
            humanPlayer.lastAction = 'bet';
            minRaiseAmount = finalHumanBetInRound; // The bet amount itself
            currentBetToCall = finalHumanBetInRound;
            playerWhoLastRaised = 'human';
            if (aiPlayer)
                aiPlayer.hasActedThisRound = false; // AI needs to act again
        }
        else { // Is effectively a call (or matching all-in if currentBetToCall was already met)
            humanPlayer.lastAction = 'call';
        }
        showActionAnimation('human', `올인 (${amountCommittedByHumanToPotThisAction})`);
        messageAreaDiv.textContent = `당신은 올인(${amountCommittedByHumanToPotThisAction}) ${translateAction(humanPlayer.lastAction)}하여 총 ${finalHumanBetInRound}(으)로 만들었습니다!`;
    }
    humanPlayer.chips = 0; // Human is always out of chips after clicking all-in
    humanPlayer.isAllIn = true;
    currentPot += amountCommittedByHumanToPotThisAction;
    humanPlayer.currentBetInRound = finalHumanBetInRound; // This tracks total committed by human this round
    humanPlayer.hasActedThisRound = true;
    await checkBettingRoundEnd();
}
async function handleBetRaiseAction() {
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isAllIn)
        return;
    if (aiPlayer && aiPlayer.isAllIn) { // Cannot bet/raise an all-in player
        messageAreaDiv.textContent = "AI가 이미 올인 상태입니다. 콜 또는 폴드만 가능합니다.";
        return;
    }
    let actionAmount = 0;
    if (humanPlayer.chips > 0) {
        const percentage = parseInt(betPercentageSlider.value);
        actionAmount = Math.min(humanPlayer.chips, Math.max(1, Math.floor(humanPlayer.chips * (percentage / 100))));
    }
    if (actionAmount <= 0) {
        messageAreaDiv.textContent = "벳할 금액이 없습니다.";
        return;
    }
    if (actionAmount > humanPlayer.chips) {
        messageAreaDiv.textContent = "칩이 부족합니다.";
        return;
    }
    const isRaiseAttempt = currentBetToCall > 0;
    const newTotalBetInRoundForPlayer = humanPlayer.currentBetInRound + actionAmount;
    if (isRaiseAttempt) {
        const raiseAmount = newTotalBetInRoundForPlayer - currentBetToCall;
        if (actionAmount < humanPlayer.chips && raiseAmount < minRaiseAmount) { // Not an all-in and raise too small
            messageAreaDiv.textContent = `최소 레이즈는 ${minRaiseAmount} 만큼 더 올려서 총 ${currentBetToCall + minRaiseAmount}이 되도록 해야 합니다. 또는 올인하세요.`;
            return;
        }
    }
    else { // Bet attempt
        const currentDynamicBigBlindVal = currentGameMode === 'solo_ai' ? dynamicBigBlind : DEFAULT_BIG_BLIND;
        if (actionAmount < humanPlayer.chips && newTotalBetInRoundForPlayer < currentDynamicBigBlindVal) { // Not an all-in and bet too small
            messageAreaDiv.textContent = `최소 벳 금액은 ${currentDynamicBigBlindVal} 입니다. 또는 올인하세요.`;
            return;
        }
    }
    humanPlayer.chips -= actionAmount;
    currentPot += actionAmount;
    humanPlayer.currentBetInRound = newTotalBetInRoundForPlayer;
    humanPlayer.lastAction = isRaiseAttempt ? 'raise' : 'bet';
    humanPlayer.hasActedThisRound = true;
    if (humanPlayer.chips === 0) {
        humanPlayer.isAllIn = true;
    }
    // Update game state based on bet/raise
    if (humanPlayer.lastAction === 'bet') {
        currentBetToCall = newTotalBetInRoundForPlayer;
        minRaiseAmount = newTotalBetInRoundForPlayer; // Next raise must be at least this bet amount again
        playerWhoLastRaised = 'human';
    }
    else if (humanPlayer.lastAction === 'raise') {
        minRaiseAmount = newTotalBetInRoundForPlayer - currentBetToCall; // The size of this raise becomes new minRaise
        currentBetToCall = newTotalBetInRoundForPlayer;
        playerWhoLastRaised = 'human';
    }
    if (aiPlayer)
        aiPlayer.hasActedThisRound = false; // AI needs to act again
    messageAreaDiv.textContent = `당신이 ${actionAmount}을(를) ${translateAction(humanPlayer.lastAction)}하여 총 ${newTotalBetInRoundForPlayer}(으)로 만들었습니다.`;
    showActionAnimation('human', `${translateAction(humanPlayer.lastAction)}: ${actionAmount}`);
    await checkBettingRoundEnd();
}
function getMarathonAIAction(level, ai, human, community, betToCallVal, minRaiseVal, bigBlindVal, potVal) {
    if (level === 10)
        return getImpossibleAIAction(ai, human, community, betToCallVal, minRaiseVal, bigBlindVal, potVal);
    const canCheck = betToCallVal - ai.currentBetInRound <= 0;
    const amountToCallForAI = betToCallVal - ai.currentBetInRound;
    const aiEval = evaluateTexasHoldemHand(ai.holeCards, community);
    const handStrength = aiEval.rankValue;
    if (level === 1) { // Very basic AI
        if (canCheck) {
            if (handStrength >= 2 && Math.random() < 0.3) { // Pair or better, sometimes bet
                const betAmount = Math.min(ai.chips, bigBlindVal);
                if (betAmount > 0)
                    return { type: 'bet', amount: ai.currentBetInRound + betAmount };
            }
            return { type: 'check' };
        }
        else { // Must call or fold
            if (handStrength < 2 && amountToCallForAI > ai.chips * 0.05 && Math.random() < 0.95)
                return { type: 'fold' }; // High card, small call, usually fold
            if (handStrength < 3 && amountToCallForAI > ai.chips * 0.15 && Math.random() < 0.8)
                return { type: 'fold' }; // Pair, larger call, often fold
            if (ai.chips <= amountToCallForAI)
                return { type: 'allin', amount: ai.currentBetInRound + ai.chips }; // Must go all-in to call
            return { type: 'call' };
        }
    }
    // More advanced AI for levels 2-9
    const foldProbabilityBase = 0.5;
    const aggressionFactor = level / 20; // Max 0.45 for level 9
    const bluffFactor = level / 25; // Max 0.36 for level 9
    // Check for draws
    const allCardsForAI = ai.holeCards.concat(community);
    let isFlushDraw = false;
    if (allCardsForAI.length >= 4) {
        const suitCounts = {};
        allCardsForAI.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
        if (Object.values(suitCounts).some(count => count === 4))
            isFlushDraw = true;
    }
    let isOpenEndedStraightDraw = false;
    if (allCardsForAI.length >= 4) {
        const uniqueRanksForStraight = [...new Set(allCardsForAI.map(c => c.value))].sort((a, b) => a - b);
        if (uniqueRanksForStraight.length >= 4) {
            for (let i = 0; i <= uniqueRanksForStraight.length - 4; i++) {
                // Check for 4 consecutive ranks like 5,6,7,8 (needs one more for straight)
                if (uniqueRanksForStraight[i + 3] - uniqueRanksForStraight[i] === 3)
                    isOpenEndedStraightDraw = true;
                // Check for A,2,3,4 for wheel draw
                if (uniqueRanksForStraight.includes(14) && uniqueRanksForStraight.includes(2) && uniqueRanksForStraight.includes(3) && uniqueRanksForStraight.includes(4) && i === 0)
                    isOpenEndedStraightDraw = true;
            }
        }
    }
    const hasStrongDraw = isFlushDraw || isOpenEndedStraightDraw;
    if (canCheck) {
        if (handStrength >= 4 || (hasStrongDraw && Math.random() < 0.6 + bluffFactor)) { // Three of a kind or better, or strong draw with bluff chance
            const betPercentage = (Math.floor(Math.random() * (level * 2)) + 5) * 5; // Bet 25% to (level*10+25)% of chips
            let betAmount = Math.min(ai.chips, Math.max(bigBlindVal, Math.floor(ai.chips * (betPercentage / 100))));
            betAmount = Math.max(betAmount, bigBlindVal); // Ensure at least big blind
            if (ai.chips === betAmount)
                return { type: 'allin', amount: ai.currentBetInRound + betAmount };
            if (betAmount > 0)
                return { type: 'bet', amount: ai.currentBetInRound + betAmount };
        }
        if (Math.random() < 0.2 + aggressionFactor) { // Random aggression bet
            const betAmount = Math.min(ai.chips, bigBlindVal);
            if (betAmount > 0)
                return { type: 'bet', amount: ai.currentBetInRound + betAmount };
        }
        return { type: 'check' };
    }
    else { // Must call, raise or fold
        // Fold logic: weak hand, no strong draw, facing significant bet
        if (handStrength < 2 && !hasStrongDraw && amountToCallForAI > bigBlindVal * 2 && Math.random() < foldProbabilityBase + 0.25 - aggressionFactor)
            return { type: 'fold' };
        // Raise logic: strong hand or strong draw with bluff
        if (handStrength >= 5 || (hasStrongDraw && Math.random() < 0.5 + bluffFactor)) { // Straight or better, or strong draw
            if (ai.chips > amountToCallForAI + minRaiseVal) { // Can make a meaningful raise
                // Raise to a varying amount, e.g., call + (minRaise to 2*pot)
                let raiseTotal = Math.min(ai.chips + ai.currentBetInRound, betToCallVal + Math.max(minRaiseVal, bigBlindVal * (1 + Math.floor(level / 2)), amountToCallForAI * (1 + level / 10)));
                if (ai.chips <= (raiseTotal - ai.currentBetInRound))
                    return { type: 'allin', amount: ai.currentBetInRound + ai.chips }; // All-in if raise is for all chips
                return { type: 'raise', amount: raiseTotal };
            }
        }
        // Call or Fold based on odds and hand strength
        if (!hasStrongDraw && amountToCallForAI > ai.chips * (0.45 - aggressionFactor * 0.15) && Math.random() < foldProbabilityBase - aggressionFactor)
            return { type: 'fold' }; // Fold if call is too expensive for weak hand
        if (ai.chips <= amountToCallForAI)
            return { type: 'allin', amount: ai.currentBetInRound + ai.chips }; // Must go all-in to call
        return { type: 'call' };
    }
}
function simulateDealingRemainingCommunityCards(deckSnapshot, currentCommunitySnapshot) {
    let tempDeck = [...deckSnapshot];
    const finalBoard = [...currentCommunitySnapshot];
    const cardsNeededForFullBoard = 5 - finalBoard.length;
    for (let i = 0; i < cardsNeededForFullBoard; i++) {
        if (tempDeck.length === 0)
            break;
        // In simulation, we don't burn cards after the first street (flop) is out or being simulated.
        // The initial burn for the flop (if simulating from pre-flop) should be handled by the caller by providing a deckSnapshot that already accounts for that burn.
        // Burns for turn/river also need to be handled by the caller before calling this.
        // This function is simplified to just deal 'cardsNeeded' from the provided deck.
        finalBoard.push(tempDeck.shift());
    }
    return finalBoard;
}
function getImpossibleAIAction(ai, human, community, betToCallVal, minRaiseVal, bigBlindVal, potVal) {
    const deckSnapshot = [...deck]; // Use a snapshot of the current game deck
    // Simulate the rest of the board
    let tempDeckForSim = [...deckSnapshot];
    let simulatedCommunity = [...community];
    // Account for burns IF we are simulating future streets
    if (simulatedCommunity.length === 0) { // Pre-flop, need to simulate flop, turn, river
        if (tempDeckForSim.length > 0)
            tempDeckForSim.shift(); // Burn for flop
    }
    else if (simulatedCommunity.length === 3) { // Flop is out, need to simulate turn, river
        if (tempDeckForSim.length > 0)
            tempDeckForSim.shift(); // Burn for turn
    }
    else if (simulatedCommunity.length === 4) { // Turn is out, need to simulate river
        if (tempDeckForSim.length > 0)
            tempDeckForSim.shift(); // Burn for river
    }
    const finalBoard = simulateDealingRemainingCommunityCards(tempDeckForSim, simulatedCommunity);
    // Evaluate hands with the final board
    const aiFinalEval = evaluateTexasHoldemHand(ai.holeCards, finalBoard);
    const humanFinalEval = evaluateTexasHoldemHand(human.holeCards, finalBoard);
    const comparisonResult = compareHands(aiFinalEval, humanFinalEval);
    let outcome;
    if (comparisonResult === aiFinalEval && aiFinalEval.rankValue > humanFinalEval.rankValue) {
        outcome = 'ai_wins';
    }
    else if (comparisonResult === humanFinalEval && humanFinalEval.rankValue > aiFinalEval.rankValue) {
        outcome = 'human_wins';
    }
    else if (comparisonResult === aiFinalEval) { // AI wins ties based on compareHands returning eval1 in case of exact tie value
        outcome = aiFinalEval.rankValue === humanFinalEval.rankValue ? 'split' : 'ai_wins';
        if (outcome === 'split') { // True split check based on card values if ranks are same
            const hand1Cards = aiFinalEval.bestHandCards.map(c => c.value).sort((a, b) => b - a);
            const hand2Cards = humanFinalEval.bestHandCards.map(c => c.value).sort((a, b) => b - a);
            let trueSplit = true;
            for (let i = 0; i < 5; i++) {
                if (hand1Cards[i] !== hand2Cards[i]) {
                    trueSplit = false;
                    break;
                }
            }
            if (!trueSplit)
                outcome = comparisonResult === aiFinalEval ? 'ai_wins' : 'human_wins'; // If not true split, use original compare
        }
    }
    else { // humanFinalEval was returned by compareHands and was better
        outcome = 'human_wins';
    }
    const canCheck = betToCallVal - ai.currentBetInRound <= 0;
    const amountToCallForAI = betToCallVal - ai.currentBetInRound;
    // "Impossible" AI logic:
    // If AI is losing, fold if has to call. Check if can check.
    if (outcome === 'human_wins' && !canCheck && amountToCallForAI > 0) {
        return { type: 'fold' };
    }
    // If AI is losing and calling means all-in, fold (unless it's a tiny amount, but impossible AI is cautious)
    if (outcome === 'human_wins' && amountToCallForAI >= ai.chips && amountToCallForAI > 0) {
        return { type: 'fold' };
    }
    // If AI is winning:
    if (outcome === 'ai_wins') {
        if (human.isAllIn) { // Human is all-in, AI just needs to call to win
            if (ai.chips <= amountToCallForAI && amountToCallForAI > 0)
                return { type: 'allin', amount: ai.currentBetInRound + ai.chips }; // Call with all-in if necessary
            return { type: 'call', amount: ai.currentBetInRound + Math.min(ai.chips, amountToCallForAI) };
        }
        if (canCheck) { // AI can check
            // Slow play sometimes on earlier streets
            if (community.length < 4 && Math.random() < 0.3) { // 30% chance to check on flop/turn if winning
                return { type: 'check' };
            }
            // Otherwise, bet for value
            let betAmount = Math.min(ai.chips, Math.max(bigBlindVal, Math.floor(potVal * (0.6 + Math.random() * 0.4)))); // Bet 60-100% of pot
            betAmount = Math.max(betAmount, bigBlindVal); // Ensure at least big blind
            if (ai.chips === betAmount)
                return { type: 'allin', amount: ai.currentBetInRound + betAmount };
            return { type: 'bet', amount: ai.currentBetInRound + betAmount };
        }
        else { // AI must call or raise
            // If call is cheap and not on river, might just call to see next card (even if winning)
            if (amountToCallForAI <= potVal * 0.5 && community.length < 4 && Math.random() < 0.4) { // 40% chance to just call small bets
                if (ai.chips <= amountToCallForAI)
                    return { type: 'allin', amount: ai.currentBetInRound + ai.chips };
                return { type: 'call' };
            }
            // Otherwise, raise for value
            let raisePotPercentage = 0.7 + Math.random() * 0.8; // Raise 0.7 to 1.5 times the (pot + call amount)
            let raiseAmountOverBet = Math.max(minRaiseVal, Math.floor((potVal + amountToCallForAI) * raisePotPercentage));
            let targetTotalBet = betToCallVal + raiseAmountOverBet;
            if (ai.chips <= (targetTotalBet - ai.currentBetInRound))
                return { type: 'allin', amount: ai.currentBetInRound + ai.chips }; // All-in if raise is for all chips
            return { type: 'raise', amount: targetTotalBet };
        }
    }
    else if (outcome === 'human_wins') { // AI is losing based on perfect info
        if (canCheck) {
            return { type: 'check' }; // Check if possible to avoid putting more money
        }
        else {
            return { type: 'fold' }; // Fold if must call
        }
    }
    else { // Split pot
        if (canCheck) {
            return { type: 'check' };
        }
        else {
            // Call if human is all-in, or call is very small, or AI must go all-in to call
            if (human.isAllIn || amountToCallForAI <= bigBlindVal / 2 || amountToCallForAI >= ai.chips) {
                if (ai.chips <= amountToCallForAI)
                    return { type: 'allin', amount: ai.currentBetInRound + ai.chips };
                return { type: 'call' };
            }
            return { type: 'fold' }; // Otherwise, fold in a split pot scenario if call is significant
        }
    }
}
async function triggerAIAction() {
    if (!aiPlayer || currentPlayerTurn !== 'ai' || !isHandInProgress || !humanPlayer || sequentialRevealInProgress) {
        if (!isHandInProgress && !sequentialRevealInProgress)
            console.warn("triggerAIAction called but hand is not in progress or reveal is pending.");
        return;
    }
    messageAreaDiv.textContent = "AI가 생각 중...";
    await updateGameUI();
    if (aiPlayer.isFolded || aiPlayer.isAllIn) {
        aiPlayer.hasActedThisRound = true; // Mark as acted if already folded/all-in to prevent loops
        await checkBettingRoundEnd();
        return;
    }
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500)); // AI "thinking" time
    let decision;
    if (selectedAIDifficulty === 'impossible') {
        decision = getImpossibleAIAction(aiPlayer, humanPlayer, communityCards, currentBetToCall, minRaiseAmount, dynamicBigBlind, currentPot);
    }
    else if (selectedAIDifficulty === 'marathon') {
        decision = getMarathonAIAction(marathonAILevel, aiPlayer, humanPlayer, communityCards, currentBetToCall, minRaiseAmount, dynamicBigBlind, currentPot);
    }
    else {
        console.error("알 수 없는 AI 난이도:", selectedAIDifficulty);
        decision = { type: 'check' }; // Default to check on error
    }
    let chipsToCommit = 0;
    let actionAnimMsg = "";
    switch (decision.type) {
        case 'fold':
            aiPlayer.isFolded = true;
            aiPlayer.lastAction = 'fold';
            actionAnimMsg = "AI 폴드";
            messageAreaDiv.textContent = "AI가 폴드했습니다.";
            showActionAnimation('ai', actionAnimMsg);
            awardPotToWinner(humanPlayer); // Human wins if AI folds
            await endHand();
            return; // Hand ends here
        case 'check':
            // AI can only check if currentBetToCall is 0 or already met by AI
            if (currentBetToCall - aiPlayer.currentBetInRound > 0) {
                // This means AI decided to check but there's a bet to call. This is an invalid check.
                // Fallback: AI should call if it intended to check but couldn't.
                // Or, a more robust AI would not return 'check' in this state.
                // For now, treat as a forced call of the minimum.
                chipsToCommit = Math.min(aiPlayer.chips, currentBetToCall - aiPlayer.currentBetInRound);
                aiPlayer.lastAction = 'call';
                actionAnimMsg = `AI 콜: ${chipsToCommit}`;
                messageAreaDiv.textContent = `AI가 (강제) ${chipsToCommit}을 콜했습니다.`;
            }
            else {
                aiPlayer.lastAction = 'check';
                actionAnimMsg = "AI 체크";
                messageAreaDiv.textContent = "AI가 체크했습니다.";
            }
            break;
        case 'call':
            chipsToCommit = Math.min(aiPlayer.chips, currentBetToCall - aiPlayer.currentBetInRound);
            if (chipsToCommit < 0)
                chipsToCommit = 0; // Should not happen if logic is right
            aiPlayer.lastAction = 'call';
            actionAnimMsg = `AI 콜: ${chipsToCommit}`;
            messageAreaDiv.textContent = `AI가 ${chipsToCommit}을 콜했습니다.`;
            break;
        case 'bet':
            chipsToCommit = Math.min(aiPlayer.chips, (decision.amount || 0) - aiPlayer.currentBetInRound);
            if (chipsToCommit < 0)
                chipsToCommit = 0;
            // Ensure bet is at least big blind unless it's an all-in
            if (chipsToCommit < dynamicBigBlind && chipsToCommit < aiPlayer.chips) {
                chipsToCommit = Math.min(aiPlayer.chips, dynamicBigBlind);
            }
            if (chipsToCommit <= 0 && aiPlayer.chips > 0) { // Invalid bet amount (e.g. trying to bet 0)
                aiPlayer.lastAction = 'check'; // Fallback to check
                actionAnimMsg = "AI 체크";
                messageAreaDiv.textContent = "AI가 체크했습니다 (잘못된 벳 시도).";
                break;
            }
            aiPlayer.lastAction = 'bet';
            currentBetToCall = aiPlayer.currentBetInRound + chipsToCommit;
            minRaiseAmount = chipsToCommit; // The bet amount itself becomes the min raise size for next player
            playerWhoLastRaised = 'ai';
            if (humanPlayer)
                humanPlayer.hasActedThisRound = false; // Human needs to act again
            actionAnimMsg = `AI 벳: ${chipsToCommit}`;
            messageAreaDiv.textContent = `AI가 ${chipsToCommit}을 벳하여 총 ${currentBetToCall}(으)로 만들었습니다.`;
            break;
        case 'raise':
            const intendedRaiseTotalBet = decision.amount || 0;
            // Amount AI adds to its current bet
            chipsToCommit = Math.min(aiPlayer.chips, intendedRaiseTotalBet - aiPlayer.currentBetInRound);
            if (chipsToCommit < 0)
                chipsToCommit = 0;
            const newAITotalBetForRound = aiPlayer.currentBetInRound + chipsToCommit;
            const actualRaiseAmount = newAITotalBetForRound - currentBetToCall; // Size of the raise over the current bet to call
            // Validate raise: must be at least minRaiseAmount unless it's an all-in
            if (chipsToCommit < aiPlayer.chips && actualRaiseAmount < minRaiseAmount) {
                // Invalid raise (too small and not all-in). AI should call instead if possible.
                const callAmountInstead = Math.min(aiPlayer.chips, currentBetToCall - aiPlayer.currentBetInRound);
                if (callAmountInstead > 0) {
                    chipsToCommit = callAmountInstead;
                    aiPlayer.lastAction = 'call';
                    actionAnimMsg = `AI 콜: ${chipsToCommit}`;
                    messageAreaDiv.textContent = `AI가 (잘못된 레이즈 시도 후) ${chipsToCommit}을 콜했습니다.`;
                }
                else { // Cannot even call (already matched or no bet to call)
                    chipsToCommit = 0;
                    aiPlayer.lastAction = 'check';
                    actionAnimMsg = "AI 체크";
                    messageAreaDiv.textContent = "AI가 체크했습니다 (잘못된 레이즈 시도 후).";
                }
            }
            else { // Valid raise or all-in raise
                aiPlayer.lastAction = 'raise';
                minRaiseAmount = actualRaiseAmount; // This raise amount is the new minimum raise for others
                currentBetToCall = newAITotalBetForRound;
                playerWhoLastRaised = 'ai';
                if (humanPlayer)
                    humanPlayer.hasActedThisRound = false; // Human needs to act again
                actionAnimMsg = `AI 레이즈: ${chipsToCommit}`;
                messageAreaDiv.textContent = `AI가 ${chipsToCommit}을 레이즈하여 총 ${currentBetToCall}(으)로 만들었습니다.`;
            }
            break;
        case 'allin':
            chipsToCommit = aiPlayer.chips;
            const totalAllInBetByAI = aiPlayer.currentBetInRound + chipsToCommit;
            if (totalAllInBetByAI > currentBetToCall) { // All-in is a bet or raise
                aiPlayer.lastAction = currentBetToCall === 0 ? 'bet' : 'raise';
                if (aiPlayer.lastAction === 'raise') {
                    minRaiseAmount = totalAllInBetByAI - currentBetToCall;
                }
                else { // bet
                    minRaiseAmount = totalAllInBetByAI;
                }
                currentBetToCall = totalAllInBetByAI;
                playerWhoLastRaised = 'ai';
                if (humanPlayer)
                    humanPlayer.hasActedThisRound = false;
                messageAreaDiv.textContent = `AI가 올인 ${translateAction(aiPlayer.lastAction)} (${chipsToCommit}) 하여 총 ${currentBetToCall}(으)로 만들었습니다!`;
            }
            else { // All-in is a call or check
                if (currentBetToCall - aiPlayer.currentBetInRound <= 0 && totalAllInBetByAI <= currentBetToCall) {
                    // AI already matched or no bet to call, all-in is effectively a check
                    aiPlayer.lastAction = 'check';
                    messageAreaDiv.textContent = `AI가 올인 체크 (${chipsToCommit}) 했습니다.`;
                }
                else {
                    aiPlayer.lastAction = 'call';
                    messageAreaDiv.textContent = `AI가 올인 콜 (${chipsToCommit}) 했습니다.`;
                }
            }
            actionAnimMsg = `AI 올인 (${chipsToCommit})`;
            break;
    }
    aiPlayer.chips -= chipsToCommit;
    currentPot += chipsToCommit;
    aiPlayer.currentBetInRound += chipsToCommit;
    if (aiPlayer.chips === 0) {
        aiPlayer.isAllIn = true;
    }
    aiPlayer.hasActedThisRound = true;
    showActionAnimation('ai', actionAnimMsg);
    await checkBettingRoundEnd();
}
async function checkBettingRoundEnd() {
    if (!humanPlayer || !aiPlayer || !isHandInProgress || sequentialRevealInProgress)
        return;
    const p1 = humanPlayer;
    const p2 = aiPlayer;
    const p1CanAct = !p1.isFolded && !p1.isAllIn;
    const p2CanAct = !p2.isFolded && !p2.isAllIn;
    // If one player folds, hand ends immediately (handled in fold action)
    if (p1.isFolded || p2.isFolded) {
        if (!isHandInProgress)
            return; // Avoid multiple endHand calls
        const winner = p1.isFolded ? p2 : p1;
        awardPotToWinner(winner);
        await endHand();
        return;
    }
    let roundOver = false;
    // Condition 1: Both players are all-in (or one is all-in and the other called/folded)
    if ((p1.isAllIn || p1.isFolded) && (p2.isAllIn || p2.isFolded)) {
        roundOver = true;
    }
    // Condition 2: Bets are equal AND both players have had a chance to act on the current bet level
    else if (p1.currentBetInRound === p2.currentBetInRound) {
        // Both players must have acted (or be all-in/folded) for the round to end if bets are equal.
        // hasActedThisRound is crucial. 'Blind' is not a voluntary action for this check.
        const p1VoluntaryAction = p1.hasActedThisRound || p1.isAllIn || p1.lastAction === 'blind'; // Blind counts as action for BB check
        const p2VoluntaryAction = p2.hasActedThisRound || p2.isAllIn || p2.lastAction === 'blind';
        if (p1VoluntaryAction && p2VoluntaryAction) {
            // Preflop specific: Big Blind can check if no raise.
            if (currentBettingRound === 'preflop') {
                const bbPlayer = dealerPosition === 'human' ? p2 : p1;
                const otherPlayer = dealerPosition === 'human' ? p1 : p2;
                // If BB (playerWhoLastRaised initially) checks, and other player called/checked.
                if (playerWhoLastRaised === bbPlayer.seat && bbPlayer.lastAction === 'check' && bbPlayer.currentBetInRound === dynamicBigBlind && otherPlayer.currentBetInRound === dynamicBigBlind) {
                    roundOver = true;
                }
                // If betting came back to BB and BB hasn't re-raised, and other player also acted.
                else if (p1.lastAction !== 'blind' && p2.lastAction !== 'blind') { // Both made voluntary actions after blinds
                    roundOver = true;
                }
            }
            else { // Post-flop: if bets are equal and both acted voluntarily, round ends.
                if (p1.lastAction !== 'blind' && p2.lastAction !== 'blind') {
                    roundOver = true;
                }
            }
        }
        // If one player is all-in and the other has called that all-in (bets are equal)
        if ((p1.isAllIn && p2.currentBetInRound >= p1.currentBetInRound && !p2.isFolded) ||
            (p2.isAllIn && p1.currentBetInRound >= p2.currentBetInRound && !p1.isFolded)) {
            roundOver = true;
        }
    }
    if (roundOver) {
        await advanceBettingRound();
        return;
    }
    // Determine next player if round is not over
    // If there was a bet/raise, the player who did not make that last bet/raise is next.
    if (playerWhoLastRaised) {
        if (currentPlayerTurn === 'human' && playerWhoLastRaised === 'human') { // Human just raised/bet
            currentPlayerTurn = 'ai';
        }
        else if (currentPlayerTurn === 'ai' && playerWhoLastRaised === 'ai') { // AI just raised/bet
            currentPlayerTurn = 'human';
        }
        else { // Current player called or checked a bet from the other player
            if (currentPlayerTurn === 'human')
                currentPlayerTurn = 'ai';
            else
                currentPlayerTurn = 'human';
        }
    }
    else { // No bet/raise yet in this round (e.g. checks around post-flop, or pre-flop before BB option)
        if (currentPlayerTurn === 'human')
            currentPlayerTurn = 'ai';
        else
            currentPlayerTurn = 'human';
    }
    // Skip players who cannot act (folded or all-in)
    if (currentPlayerTurn === 'human' && !p1CanAct) {
        currentPlayerTurn = 'ai';
        if (!p2CanAct) {
            await advanceBettingRound();
            return;
        } // Both cannot act, advance
    }
    else if (currentPlayerTurn === 'ai' && !p2CanAct) {
        currentPlayerTurn = 'human';
        if (!p1CanAct) {
            await advanceBettingRound();
            return;
        } // Both cannot act, advance
    }
    // Trigger next action
    if (currentPlayerTurn === 'human') {
        if (humanPlayer.isFolded || humanPlayer.isAllIn) { // Should have been caught by p1CanAct
            await checkBettingRoundEnd(); // Re-evaluate if human cannot act
            return;
        }
        messageAreaDiv.textContent = `당신의 턴입니다. (${currentBettingRound === 'preflop' ? '프리플랍' : currentBettingRound})`;
        await updateGameUI();
    }
    else { // AI's turn
        if (aiPlayer.isFolded || aiPlayer.isAllIn) { // Should have been caught by p2CanAct
            await checkBettingRoundEnd(); // Re-evaluate if AI cannot act
            return;
        }
        await updateGameUI();
        setTimeout(triggerAIAction, 100); // Short delay for AI "thinking"
    }
}
async function advanceBettingRound() {
    if (!humanPlayer || !aiPlayer || sequentialRevealInProgress)
        return;
    // Reset per-round state for players
    humanPlayer.currentBetInRound = 0;
    aiPlayer.currentBetInRound = 0;
    humanPlayer.hasActedThisRound = false;
    aiPlayer.hasActedThisRound = false;
    currentBetToCall = 0;
    minRaiseAmount = currentGameMode === 'solo_ai' ? dynamicBigBlind : DEFAULT_BIG_BLIND;
    playerWhoLastRaised = null;
    // Check if betting is concluded due to all-ins before reaching showdown street by street
    const bettingConcludedDueToAllIn = (humanPlayer.isAllIn || aiPlayer.isAllIn) &&
        !(humanPlayer.isFolded || aiPlayer.isFolded) &&
        ( // This condition means at least one player is all-in, the other has matched or is also all-in for less/equal
        (humanPlayer.isAllIn && aiPlayer.currentBetInRound >= humanPlayer.currentBetInRound && !aiPlayer.isFolded) ||
            (aiPlayer.isAllIn && humanPlayer.currentBetInRound >= aiPlayer.currentBetInRound && !humanPlayer.isFolded) ||
            (humanPlayer.isAllIn && aiPlayer.isAllIn));
    if (bettingConcludedDueToAllIn && currentBettingRound !== 'river' && currentBettingRound !== 'showdown' && currentBettingRound !== 'hand_over') {
        sequentialRevealInProgress = true;
        messageAreaDiv.textContent = "한 명 이상 올인 상태. 남은 커뮤니티 카드를 순차적으로 공개합니다...";
        playerBettingActionsDiv.style.display = 'none';
        const delayBetweenStreets = 800;
        if (currentBettingRound === 'preflop' || communityCards.length < 3) {
            if (deck.length > 0 && communityCards.length === 0)
                dealFromDeck(1); // Burn before flop
            await dealCommunity(3 - communityCards.length); // Deal up to 3 community cards
            // currentBettingRound = 'flop'; // No betting round change, just card dealing
            if (sequentialRevealInProgress && isHandInProgress)
                await new Promise(resolve => setTimeout(resolve, delayBetweenStreets));
        }
        if (sequentialRevealInProgress && isHandInProgress && communityCards.length < 4) {
            if (deck.length > 0)
                dealFromDeck(1); // Burn before turn
            await dealCommunity(1); // Deal 4th card
            // currentBettingRound = 'turn';
            if (sequentialRevealInProgress && isHandInProgress)
                await new Promise(resolve => setTimeout(resolve, delayBetweenStreets));
        }
        if (sequentialRevealInProgress && isHandInProgress && communityCards.length < 5) {
            if (deck.length > 0)
                dealFromDeck(1); // Burn before river
            await dealCommunity(1); // Deal 5th card
            // currentBettingRound = 'river';
            if (sequentialRevealInProgress && isHandInProgress)
                await new Promise(resolve => setTimeout(resolve, delayBetweenStreets / 2));
        }
        sequentialRevealInProgress = false;
        currentBettingRound = 'showdown'; // All cards dealt, go to showdown
        await handleShowdown();
        return;
    }
    // Advance to the next betting round if not concluded by all-in
    switch (currentBettingRound) {
        case 'preflop':
            currentBettingRound = 'flop';
            if (deck.length > 0)
                dealFromDeck(1); // Burn card
            await dealCommunity(3);
            messageAreaDiv.textContent = "플랍 카드 (3장)가 공개되었습니다.";
            break;
        case 'flop':
            currentBettingRound = 'turn';
            if (deck.length > 0)
                dealFromDeck(1); // Burn card
            await dealCommunity(1);
            messageAreaDiv.textContent = "턴 카드 (4번째)가 공개되었습니다.";
            break;
        case 'turn':
            currentBettingRound = 'river';
            if (deck.length > 0)
                dealFromDeck(1); // Burn card
            await dealCommunity(1);
            messageAreaDiv.textContent = "리버 카드 (5번째)가 공개되었습니다.";
            break;
        case 'river':
            currentBettingRound = 'showdown'; // After river betting, it's showdown
            break;
        default:
            // If already in showdown or hand_over, or an unexpected state, don't advance further.
            if (currentBettingRound === 'showdown' || currentBettingRound === 'hand_over') { }
            else
                return;
    }
    if (currentBettingRound === 'showdown') {
        await handleShowdown();
    }
    else if (isHandInProgress) {
        // Determine who starts the betting in the new round (usually SB or player after dealer)
        if (dealerPosition === 'ai') { // Human is SB (or first to act post-flop if BB is dealer)
            currentPlayerTurn = humanPlayer.isFolded || humanPlayer.isAllIn ? 'ai' : 'human';
        }
        else { // AI is SB
            currentPlayerTurn = aiPlayer.isFolded || aiPlayer.isAllIn ? 'human' : 'ai';
        }
        // If the determined starting player cannot act, give turn to the other.
        if (currentPlayerTurn === 'human' && (humanPlayer.isFolded || humanPlayer.isAllIn)) {
            currentPlayerTurn = 'ai';
        }
        if (currentPlayerTurn === 'ai' && (aiPlayer.isFolded || aiPlayer.isAllIn)) {
            currentPlayerTurn = 'human';
        }
        // If both players are all-in (or one folded and other all-in), showdown should have been triggered.
        if ((humanPlayer.isFolded || humanPlayer.isAllIn) && (aiPlayer.isFolded || aiPlayer.isAllIn)) {
            await handleShowdown(); // This should be caught by bettingConcludedDueToAllIn earlier
            return;
        }
        const roundNameKor = currentBettingRound === 'flop' ? '플랍' : currentBettingRound === 'turn' ? '턴' : '리버';
        if (currentPlayerTurn === 'ai') {
            if (aiPlayer.isFolded || aiPlayer.isAllIn) { // AI cannot act
                await checkBettingRoundEnd(); // Effectively pass turn to human or advance if human also can't act
            }
            else {
                messageAreaDiv.textContent += ` AI의 턴입니다. (${roundNameKor})`;
                setTimeout(triggerAIAction, 1000);
            }
        }
        else { // Human's turn
            if (humanPlayer.isFolded || humanPlayer.isAllIn) { // Human cannot act
                await checkBettingRoundEnd(); // Effectively pass turn to AI or advance
            }
            else {
                messageAreaDiv.textContent += ` 당신의 턴입니다. (${roundNameKor})`;
            }
        }
        await updateGameUI();
    }
}
async function dealCommunity(count) {
    let cardsDealtThisCall = 0;
    for (let i = 0; i < count; i++) {
        const dealt = dealFromDeck(1);
        if (dealt.length > 0 && communityCards.length < 5) {
            communityCards.push(dealt[0]);
            cardsDealtThisCall++;
        }
        else {
            console.warn(`덱에 카드가 부족하거나 커뮤니티 카드가 5장이라 카드를 더 딜할 수 없습니다.`);
            break;
        }
    }
    if (communityCards.length > 5)
        communityCards = communityCards.slice(0, 5);
    if (cardsDealtThisCall > 0) {
        await renderCommunityCards();
    }
}
async function handleShowdown() {
    if ((!humanPlayer || !aiPlayer) && currentGameMode === 'solo_ai') {
        console.warn("Showdown called without players.");
        if (currentBettingRound === 'hand_over')
            return;
        await endHand();
        return;
    }
    sequentialRevealInProgress = false;
    playerBettingActionsDiv.style.display = 'none';
    currentBettingRound = 'showdown';
    messageAreaDiv.textContent = "쇼다운!";
    isHandInProgress = false;
    await renderAIHoleCards(true);
    const humanEval = humanPlayer && !humanPlayer.isFolded ? evaluateTexasHoldemHand(humanPlayer.holeCards, communityCards) : { name: "Folded", rankValue: -1, detailedName: "폴드" };
    const aiEval = aiPlayer && !aiPlayer.isFolded ? evaluateTexasHoldemHand(aiPlayer.holeCards, communityCards) : { name: "Folded", rankValue: -1, detailedName: "폴드" };
    let winnerToShowdown = null; // Renamed to avoid conflict with function param
    let resultMessage = "";
    if (humanPlayer && humanPlayer.isFolded) {
        winnerToShowdown = aiPlayer;
        resultMessage = `당신 폴드. AI 승리 (${aiPlayer ? (translateHandName(aiEval.name) + (aiEval.detailedName && aiEval.name !== aiEval.detailedName ? ' - ' + aiEval.detailedName : '')) : 'N/A'}).`;
    }
    else if (aiPlayer && aiPlayer.isFolded) {
        winnerToShowdown = humanPlayer;
        resultMessage = `AI 폴드. 당신 승리 (${humanPlayer ? (translateHandName(humanEval.name) + (humanEval.detailedName && humanEval.name !== humanEval.detailedName ? ' - ' + humanEval.detailedName : '')) : 'N/A'}).`;
    }
    else if (humanPlayer && aiPlayer) {
        const comparison = compareHands(humanEval, aiEval);
        if (comparison === humanEval && humanEval.rankValue > aiEval.rankValue) {
            winnerToShowdown = humanPlayer;
        }
        else if (comparison === aiEval && aiEval.rankValue > humanEval.rankValue) {
            winnerToShowdown = aiPlayer;
        }
        else { // Potentially a split
            const hand1Cards = humanEval.bestHandCards?.map(c => c.value).sort((a, b) => b - a) || [];
            const hand2Cards = aiEval.bestHandCards?.map(c => c.value).sort((a, b) => b - a) || [];
            let trueSplit = humanEval.rankValue === aiEval.rankValue; // Start by assuming split if ranks are same
            if (trueSplit) { // Compare kickers if ranks are identical
                for (let i = 0; i < Math.min(hand1Cards.length, hand2Cards.length); i++) {
                    if (hand1Cards[i] > hand2Cards[i]) {
                        winnerToShowdown = humanPlayer;
                        trueSplit = false;
                        break;
                    }
                    if (hand2Cards[i] > hand1Cards[i]) {
                        winnerToShowdown = aiPlayer;
                        trueSplit = false;
                        break;
                    }
                }
            }
            if (trueSplit)
                winnerToShowdown = 'split';
            // If not a true split, but compareHands returned one due to value tie, assign winner based on who was eval1
            else if (!winnerToShowdown)
                winnerToShowdown = comparison === humanEval ? humanPlayer : aiPlayer;
        }
        resultMessage = `당신: ${translateHandName(humanEval.name)}${humanEval.detailedName && humanEval.name !== humanEval.detailedName ? ` (${humanEval.detailedName})` : ''}. AI: ${translateHandName(aiEval.name)}${aiEval.detailedName && aiEval.name !== aiEval.detailedName ? ` (${aiEval.detailedName})` : ''}. `;
        if (winnerToShowdown === humanPlayer)
            resultMessage += "당신 승리!";
        else if (winnerToShowdown === aiPlayer)
            resultMessage += "AI 승리!";
        else
            resultMessage += "무승부 (팟 분배)!";
    }
    else {
        resultMessage = "쇼다운 오류: 플레이어 정보 누락.";
    }
    messageAreaDiv.textContent = resultMessage;
    awardPotToWinner(winnerToShowdown);
    await endHand();
}
function awardPotToWinner(winner) {
    // --- Pot Adjustment for unequal all-ins before awarding ---
    let finalContestedPot = currentPot;
    let refundMessagePart = "";
    if (humanPlayer && aiPlayer && (humanPlayer.isAllIn || aiPlayer.isAllIn) && humanPlayer.currentBetInRound !== aiPlayer.currentBetInRound) {
        let refundOccurred = false;
        if (humanPlayer.currentBetInRound > aiPlayer.currentBetInRound && aiPlayer.isAllIn) {
            const overBet = humanPlayer.currentBetInRound - aiPlayer.currentBetInRound;
            if (overBet > 0) {
                // Ensure the currentPot has enough to cover the overBet refund.
                // This check might be complex if pot was already manipulated.
                // Assuming currentPot includes all bets.
                const actualRefund = Math.min(overBet, finalContestedPot); // Cannot refund more than what's in pot from this overbet
                humanPlayer.chips += actualRefund;
                finalContestedPot -= actualRefund;
                refundOccurred = true;
                if (actualRefund > 0)
                    refundMessagePart = ` (당신의 초과 베팅 ${actualRefund} 반환됨.)`;
            }
        }
        else if (aiPlayer.currentBetInRound > humanPlayer.currentBetInRound && humanPlayer.isAllIn) {
            const overBet = aiPlayer.currentBetInRound - humanPlayer.currentBetInRound;
            if (overBet > 0) {
                const actualRefund = Math.min(overBet, finalContestedPot);
                aiPlayer.chips += actualRefund;
                finalContestedPot -= actualRefund;
                refundOccurred = true;
                if (actualRefund > 0)
                    refundMessagePart = ` (AI의 초과 베팅 ${actualRefund} 반환됨.)`;
            }
        }
        if (refundOccurred && finalContestedPot < 0)
            finalContestedPot = 0; // Safety net
        if (refundOccurred)
            console.log(`Pot adjusted. Original: ${currentPot}, Contested: ${finalContestedPot}, Refund: ${refundMessagePart}`);
    }
    // --- End Pot Adjustment ---
    if (winner === 'split' && humanPlayer && aiPlayer) {
        const splitAmount = Math.floor(finalContestedPot / 2);
        const remainder = finalContestedPot % 2;
        humanPlayer.chips += splitAmount;
        aiPlayer.chips += splitAmount;
        if (remainder > 0) {
            // Give remainder to player out of position (closer to dealer's left)
            // For 1v1, SB gets it if dealer is BB, or BB gets it if dealer is SB.
            // Simpler: dealerPosition determines who is "earlier" in post-flop sense.
            if (dealerPosition === 'human' && aiPlayer)
                aiPlayer.chips += remainder; // AI is SB equivalent
            else if (dealerPosition === 'ai' && humanPlayer)
                humanPlayer.chips += remainder; // Human is SB equivalent
            else if (humanPlayer)
                humanPlayer.chips += remainder; // Fallback
        }
        messageAreaDiv.textContent += `${refundMessagePart} 각각 ${splitAmount} 칩 획득.`;
    }
    else if (winner && winner !== 'split' && winner.name) {
        winner.chips += finalContestedPot;
        messageAreaDiv.textContent += `${refundMessagePart} ${winner.name === humanPlayer?.name ? '당신' : 'AI'}이(가) 팟 ${finalContestedPot}을(를) 획득했습니다.`;
    }
    currentPot = 0;
    if (humanPlayer)
        humanPlayer.currentBetInRound = 0; // Reset for next hand display consistency
    if (aiPlayer)
        aiPlayer.currentBetInRound = 0;
    // Marathon mode advancement or game over conditions
    if (currentGameMode === 'solo_ai' && selectedAIDifficulty === 'marathon' && aiPlayer && aiPlayer.chips === 0 && humanPlayer && humanPlayer.chips > 0) {
        if (marathonAILevel >= 10) {
            messageAreaDiv.textContent += ` 축하합니다! 마라톤 모드 (레벨 10) 클리어!`;
            if (humanPlayer) {
                savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips);
                humanPlayer.chips = 0;
            }
        }
        else {
            marathonAILevel++;
            messageAreaDiv.textContent += ` AI 파산! 마라톤 레벨 ${marathonAILevel}(으)로 진입합니다. AI 칩이 초기화됩니다.`;
            aiPlayer.chips = initialStartingChipsSession;
        }
    }
    else if (currentGameMode === 'solo_ai' && selectedAIDifficulty === 'impossible' && humanPlayer && aiPlayer && aiPlayer.chips <= 0) {
        messageAreaDiv.textContent += ` AI가 모든 칩을 잃었습니다! 당신의 압도적인 승리!`;
        if (humanPlayer) {
            savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips);
            humanPlayer.chips = 0;
        }
    }
    updatePlayerUIDisplays();
}
async function endHand() {
    isHandInProgress = false;
    currentBettingRound = 'hand_over';
    currentPlayerTurn = null;
    sequentialRevealInProgress = false;
    if (humanPlayer)
        humanPlayer.lastAction = 'none';
    if (aiPlayer)
        aiPlayer.lastAction = 'none';
    await updateGameUI();
    // Check for game over conditions (player or AI bankrupt)
    if (humanPlayer && aiPlayer && (humanPlayer.chips === 0 || (aiPlayer.chips === 0 && selectedAIDifficulty !== 'marathon'))) {
        // If human won against non-marathon AI or AI won against human
        if (humanPlayer.chips > 0 && aiPlayer.chips === 0 && selectedAIDifficulty !== 'marathon') {
            savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips); // Human collects winnings
            humanPlayer.chips = 0; // Reset session chips for human
        }
        else if (humanPlayer.chips === 0) {
            // Human lost, global chips already updated at game start, or by losing bets.
            // No positive addition here, just make sure session chips are 0.
            savePlayerGlobalChips(playerGlobalChips); // Save current global (which might be unchanged if lost all)
        }
        // Special case for marathon AI losing level 10 already handled in awardPotToWinner
        if (!(selectedAIDifficulty === 'marathon' && aiPlayer.chips === 0 && marathonAILevel > 10)) {
            setupGameButton.disabled = false;
            setupGameButton.style.display = 'inline-block';
            exitGameButton.style.display = 'none';
            startNextHandButton.style.display = 'none';
        }
    }
    else if (selectedAIDifficulty === 'marathon' && aiPlayer && aiPlayer.chips > 0 && humanPlayer && humanPlayer.chips === 0) {
        // Human lost in marathon mode
        messageAreaDiv.textContent = "당신의 칩이 모두 소진되었습니다. 마라톤 실패!";
        savePlayerGlobalChips(playerGlobalChips); // Save whatever global chips remain
        setupGameButton.disabled = false;
        setupGameButton.style.display = 'inline-block';
        exitGameButton.style.display = 'none';
        startNextHandButton.style.display = 'none';
    }
}
async function handleDealNewHandPractice() {
    if (currentGameMode !== 'practice')
        return;
    isHandInProgress = true;
    revealedPlayerCardIds.clear();
    revealedCommunityCardIds.clear();
    deck = createDeck();
    deck = shuffleDeck(deck);
    if (humanPlayer) {
        humanPlayer.holeCards = dealFromDeck(2);
        humanPlayer.currentBetInRound = 0;
        humanPlayer.isFolded = false;
        humanPlayer.lastAction = 'none';
    }
    communityCards = [];
    currentPot = 0;
    messageAreaDiv.textContent = "연습 모드: 개인 카드 2장이 지급되었습니다.";
    await updateGameUI();
    setupGameButton.disabled = true;
    setupGameButton.style.display = 'none';
}
async function handleDealFlop() {
    if (currentGameMode !== 'practice' || communityCards.length !== 0)
        return;
    if (deck.length > 0)
        dealFromDeck(1); // Burn card
    await dealCommunity(3);
    messageAreaDiv.textContent = "플랍 카드 (3장)가 공개되었습니다.";
    await updateGameUI();
}
async function handleDealTurn() {
    if (currentGameMode !== 'practice' || communityCards.length !== 3)
        return;
    if (deck.length > 0)
        dealFromDeck(1); // Burn card
    await dealCommunity(1);
    messageAreaDiv.textContent = "턴 카드 (4번째)가 공개되었습니다.";
    await updateGameUI();
}
async function handleDealRiver() {
    if (currentGameMode !== 'practice' || communityCards.length !== 4)
        return;
    if (deck.length > 0)
        dealFromDeck(1); // Burn card
    await dealCommunity(1);
    messageAreaDiv.textContent = "리버 카드 (5번째)가 공개되었습니다.";
    await updateGameUI();
}
async function handleEvaluate() {
    if (currentGameMode !== 'practice' || !humanPlayer || humanPlayer.holeCards.length === 0 || communityCards.length < 5) {
        messageAreaDiv.textContent = "아직 카드가 충분하지 않습니다. 딜을 완료해주세요.";
        return;
    }
    const evaluation = evaluateTexasHoldemHand(humanPlayer.holeCards, communityCards);
    const translatedName = translateHandName(evaluation.name);
    messageAreaDiv.textContent = `최고의 패: ${translatedName}${evaluation.detailedName && evaluation.name !== evaluation.detailedName ? ` (${evaluation.detailedName})` : ''}`;
    isHandInProgress = false;
    await updateGameUI();
    setupGameButton.disabled = false;
    setupGameButton.style.display = 'inline-block';
}
function populateRankingsModal() {
    handRankingsList.innerHTML = '';
    POKER_HAND_RANKINGS.forEach(ranking => {
        const listItem = document.createElement('li');
        const titleStrong = document.createElement('strong');
        titleStrong.textContent = `${ranking.kor} (${ranking.eng})`;
        listItem.appendChild(titleStrong);
        const detailsWrapper = document.createElement('div');
        detailsWrapper.classList.add('ranking-details-wrapper');
        const exampleCardsDiv = document.createElement('div');
        exampleCardsDiv.classList.add('ranking-example-cards');
        ranking.exampleCards.forEach((cardData, index) => {
            const isHighlighted = ranking.highlightIndices ? ranking.highlightIndices.includes(index) : false;
            exampleCardsDiv.appendChild(renderCard(cardData, true, isHighlighted));
        });
        detailsWrapper.appendChild(exampleCardsDiv);
        const descP = document.createElement('p');
        descP.classList.add('ranking-description');
        descP.textContent = ranking.desc;
        detailsWrapper.appendChild(descP);
        listItem.appendChild(detailsWrapper);
        handRankingsList.appendChild(listItem);
    });
}
function showRankingsModal() {
    populateRankingsModal();
    rankingsModal.style.display = 'block';
    closeRankingsButton.focus();
}
function hideRankingsModal() {
    rankingsModal.style.display = 'none';
    showRankingsButton.focus();
}
function showGameSetupModal() {
    resetGameUI(true);
    gameSetupModal.style.display = 'block';
    gameModePracticeRadio.checked = true;
    soloAIOptionsDiv.style.display = 'none';
    startingChipsSelect.value = "1000";
    aiDifficultySelect.value = "marathon";
    gameModePracticeRadio.focus();
    updateGlobalChipsDisplay();
}
function hideGameSetupModal() {
    gameSetupModal.style.display = 'none';
    setupGameButton.focus();
}
function handleGameModeChange() {
    if (gameModeSoloAIRadio.checked) {
        soloAIOptionsDiv.style.display = 'block';
    }
    else {
        soloAIOptionsDiv.style.display = 'none';
    }
}
async function handleStartConfiguredGame() {
    const mode = gameModeSoloAIRadio.checked ? 'solo_ai' : 'practice';
    let sessionStartingChips = 0;
    if (mode === 'solo_ai') {
        sessionStartingChips = parseInt(startingChipsSelect.value, 10);
        if (isNaN(sessionStartingChips) || sessionStartingChips <= 0) {
            alert("유효한 칩 금액을 선택해주세요.");
            return;
        }
        if (playerGlobalChips < sessionStartingChips) {
            alert(`보유 칩이 부족합니다. (현재 보유: ${playerGlobalChips}, 필요: ${sessionStartingChips})`);
            return;
        }
        playerGlobalChips -= sessionStartingChips;
        savePlayerGlobalChips(playerGlobalChips);
        updateGlobalChipsDisplay();
        initialStartingChipsSession = sessionStartingChips;
        selectedAIDifficulty = aiDifficultySelect.value;
        if (selectedAIDifficulty === 'marathon') {
            marathonAILevel = 1;
        }
        dealerPosition = 'ai';
        dynamicBigBlind = Math.max(10, Math.floor(sessionStartingChips / 100 / 5) * 5);
        if (dynamicBigBlind === 0 && sessionStartingChips > 0)
            dynamicBigBlind = 5;
        dynamicSmallBlind = Math.max(5, Math.floor(dynamicBigBlind / 2));
        if (dynamicSmallBlind === 0 && dynamicBigBlind > 0)
            dynamicSmallBlind = Math.max(1, Math.floor(dynamicBigBlind / 2));
    }
    else {
        sessionStartingChips = 0;
        dynamicSmallBlind = DEFAULT_SMALL_BLIND;
        dynamicBigBlind = DEFAULT_BIG_BLIND;
    }
    currentGameMode = mode;
    humanPlayer = { name: "나", holeCards: [], chips: sessionStartingChips, isFolded: false, currentBetInRound: 0, isAllIn: false, lastAction: 'none', seat: 'human', hasActedThisRound: false };
    if (mode === 'solo_ai') {
        let aiSessionChips = sessionStartingChips;
        if (selectedAIDifficulty === 'impossible') {
            aiSessionChips = Math.floor(sessionStartingChips / 10);
            aiSessionChips = Math.max(aiSessionChips, dynamicBigBlind * 5, 50);
        }
        aiPlayer = { name: "AI 상대", holeCards: [], chips: aiSessionChips, isFolded: false, currentBetInRound: 0, isAllIn: false, lastAction: 'none', seat: 'ai', hasActedThisRound: false };
    }
    else {
        aiPlayer = null;
    }
    gameBoardDiv.style.display = 'flex';
    hideGameSetupModal();
    if (mode === 'solo_ai') {
        await startNewHand();
    }
    else {
        await handleDealNewHandPractice();
    }
    setupGameButton.disabled = true;
    setupGameButton.style.display = 'none';
    exitGameButton.style.display = (mode === 'solo_ai') ? 'inline-block' : 'none';
}
function loadPlayerGlobalChips() {
    const storedChips = localStorage.getItem(GLOBAL_CHIPS_STORAGE_KEY);
    if (storedChips) {
        playerGlobalChips = parseInt(storedChips, 10);
    }
    else {
        playerGlobalChips = 100000;
        savePlayerGlobalChips(playerGlobalChips);
    }
    updateGlobalChipsDisplay();
}
function savePlayerGlobalChips(chips) {
    playerGlobalChips = Math.min(chips, MAX_GLOBAL_CHIPS);
    playerGlobalChips = Math.max(0, playerGlobalChips);
    localStorage.setItem(GLOBAL_CHIPS_STORAGE_KEY, String(playerGlobalChips));
    updateGlobalChipsDisplay();
}
function updateGlobalChipsDisplay() {
    if (globalChipsDisplay) {
        globalChipsDisplay.textContent = playerGlobalChips.toLocaleString();
    }
}
function showExitGameConfirmationModal() {
    exitGameConfirmationModal.style.display = 'block';
    confirmExitGameButton.focus();
}
function hideExitGameConfirmationModal() {
    exitGameConfirmationModal.style.display = 'none';
    exitGameButton.focus();
}
async function handleConfirmExitGame() {
    if (humanPlayer && currentGameMode === 'solo_ai') {
        // Add back any chips from the current session if game is exited mid-session
        savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips);
    }
    resetGameUI(true);
    hideExitGameConfirmationModal();
    setupGameButton.style.display = 'inline-block';
    exitGameButton.style.display = 'none';
    messageAreaDiv.textContent = '게임이 종료되었습니다. "새 게임 설정"으로 다시 시작하세요.';
    updateGlobalChipsDisplay();
}
setupGameButton.addEventListener('click', showGameSetupModal);
exitGameButton.addEventListener('click', showExitGameConfirmationModal);
confirmExitGameButton.addEventListener('click', handleConfirmExitGame);
cancelExitGameButton.addEventListener('click', hideExitGameConfirmationModal);
closeSetupModalButton.addEventListener('click', hideGameSetupModal);
gameModePracticeRadio.addEventListener('change', handleGameModeChange);
gameModeSoloAIRadio.addEventListener('change', handleGameModeChange);
startConfiguredGameButton.addEventListener('click', handleStartConfiguredGame);
dealNewHandPracticeButton.addEventListener('click', handleDealNewHandPractice);
dealFlopButton.addEventListener('click', handleDealFlop);
dealTurnButton.addEventListener('click', handleDealTurn);
dealRiverButton.addEventListener('click', handleDealRiver);
evaluateButton.addEventListener('click', handleEvaluate);
foldButton.addEventListener('click', handleFoldAction);
checkButton.addEventListener('click', handleCheckAction);
callButton.addEventListener('click', handleCallAction);
confirmBetButton.addEventListener('click', handleBetRaiseAction);
allInButton.addEventListener('click', handleAllInAction);
startNextHandButton.addEventListener('click', startNewHand);
betPercentageSlider.addEventListener('input', updateActionButtonsAvailability);
showRankingsButton.addEventListener('click', showRankingsModal);
closeRankingsButton.addEventListener('click', hideRankingsModal);
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (rankingsModal.style.display === 'block') {
            hideRankingsModal();
        }
        if (gameSetupModal.style.display === 'block') {
            hideGameSetupModal();
        }
        if (exitGameConfirmationModal.style.display === 'block') {
            hideExitGameConfirmationModal();
        }
    }
});
document.addEventListener('DOMContentLoaded', () => {
    loadPlayerGlobalChips();
    resetGameUI(true);
    updateBetSliderUI();
    updateGameUI();
    messageAreaDiv.textContent = '환영합니다! "새 게임 설정" 버튼을 눌러 게임을 시작하세요.';
});
