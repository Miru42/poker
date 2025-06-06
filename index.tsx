
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// No Gemini API needed for this game logic.
console.log("Poker Script v1.3.3 Loaded - Flop 3 cards, Burn Logic.");

interface Card {
    suit: string;
    rank: string;
    value: number; // For sorting and evaluation: 2-9, 10=10, J=11, Q=12, K=13, A=14
    id: string; // Unique ID for managing DOM elements and animations
}

interface HandEvaluationResult {
    name: string;
    rankValue: number; // Higher is better: High Card=1, Pair=2, ..., Royal Flush=10
    detailedName?: string;
    bestHandCards?: Card[]; // The 5 cards that make up the best hand
}

interface PlayerProfile {
    name: string;
    holeCards: Card[];
    chips: number;
    isFolded: boolean;
    currentBetInRound: number; 
    isAllIn: boolean;
    lastAction?: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'blind' | 'none';
    seat: 'human' | 'ai'; // To easily identify
    hasActedThisRound?: boolean; // Has the player made a voluntary action (not blind) this round?
}

interface AIActionDecision {
    type: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';
    amount?: number; // For 'bet' or 'raise', this is the TOTAL amount AI wants to have in the pot for this round.
}


const SUITS = ['♠', '♥', '♣', '♦']; // Spades, Hearts, Clubs, Diamonds
const RANKS = [
    { rank: '2', value: 2 }, { rank: '3', value: 3 }, { rank: '4', value: 4 },
    { rank: '5', value: 5 }, { rank: '6', value: 6 }, { rank: '7', value: 7 },
    { rank: '8', value: 8 }, { rank: '9', value: 9 }, { rank: '10', value: 10 },
    { rank: 'J', value: 11 }, { rank: 'Q', value: 12 }, { rank: 'K', value: 13 },
    { rank: 'A', value: 14 }
];

interface PokerRankingInfo {
    kor: string;
    eng: string;
    desc: string;
    exampleCards: Card[];
    highlightIndices?: number[]; // Indices of cards to highlight in exampleCards
}

// Ensure example cards have unique IDs for rendering
function addIdsToExampleCards(cards: Omit<Card, 'id'>[]): Card[] {
    return cards.map((card, index) => ({ ...card, id: `example-${card.suit}${card.rank}-${index}` }));
}


const POKER_HAND_RANKINGS: PokerRankingInfo[] = [
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


let deck: Card[] = [];
let communityCards: Card[] = []; 
let revealedCommunityCardIds: Set<string> = new Set();
let revealedPlayerCardIds: Set<string> = new Set();
let revealedAICardIds: Set<string> = new Set();


// Game State
let currentGameMode: 'practice' | 'solo_ai' | null = null;
let humanPlayer: PlayerProfile | null = null;
let aiPlayer: PlayerProfile | null = null;
let currentPot: number = 0;
let selectedAIDifficulty: 'marathon' | 'impossible' | null = null;
let marathonAILevel: number = 1;
let dealerPosition: 'human' | 'ai' = 'ai'; 
let currentBettingRound: 'pre_deal' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'hand_over' = 'pre_deal';
let currentPlayerTurn: 'human' | 'ai' | null = null;
let currentBetToCall: number = 0; 
let minRaiseAmount: number = DEFAULT_BIG_BLIND;
let isHandInProgress: boolean = false;
let playerWhoLastRaised: 'human' | 'ai' | null = null;
let initialStartingChipsSession: number = 1000; 
let playerGlobalChips: number = 100000;
const MAX_GLOBAL_CHIPS = 100000000;
const GLOBAL_CHIPS_STORAGE_KEY = 'texasHoldemGlobalPlayerChips';
let sequentialRevealInProgress = false;

// DOM Elements
const gameBoardDiv = document.getElementById('game-board') as HTMLDivElement;
const playerHoleCardsDiv = document.getElementById('player-hole-cards') as HTMLDivElement;
const communityCardsDiv = document.getElementById('community-cards') as HTMLDivElement;
const messageAreaDiv = document.getElementById('message-area') as HTMLDivElement;
const globalChipsDisplay = document.getElementById('global-chips-display') as HTMLSpanElement;


// Player and AI UI
const playerChipsDisplay = document.getElementById('player-chips-display') as HTMLSpanElement;
const playerActionDisplay = document.getElementById('player-action-display') as HTMLSpanElement;
const dealerChipPlayer = document.getElementById('dealer-chip-player') as HTMLSpanElement;
const aiPlayerAreaDiv = document.getElementById('ai-player-area') as HTMLDivElement;
const aiNameDisplay = document.getElementById('ai-name') as HTMLHeadingElement;
const aiChipsDisplay = document.getElementById('ai-chips-display') as HTMLSpanElement;
const aiActionDisplay = document.getElementById('ai-action-display') as HTMLSpanElement;
const dealerChipAI = document.getElementById('dealer-chip-ai') as HTMLSpanElement;
const aiHoleCardsDiv = document.getElementById('ai-hole-cards') as HTMLDivElement;
const potAmountSpan = document.getElementById('pot-amount') as HTMLSpanElement;
const marathonLevelDisplay = document.getElementById('marathonLevelDisplay') as HTMLSpanElement;
const playerActionAnimationDiv = document.getElementById('player-action-animation') as HTMLDivElement;
const aiActionAnimationDiv = document.getElementById('ai-action-animation') as HTMLDivElement;


// Action Buttons
const setupGameButton = document.getElementById('setup-game-button') as HTMLButtonElement;
const exitGameButton = document.getElementById('exit-game-button') as HTMLButtonElement;


// Practice Mode Buttons
const practiceModeActionsDiv = document.getElementById('practice-mode-actions') as HTMLDivElement;
const dealNewHandPracticeButton = document.getElementById('deal-new-hand-practice-button') as HTMLButtonElement;
const dealFlopButton = document.getElementById('deal-flop-button') as HTMLButtonElement;
const dealTurnButton = document.getElementById('deal-turn-button') as HTMLButtonElement;
const dealRiverButton = document.getElementById('deal-river-button') as HTMLButtonElement;
const evaluateButton = document.getElementById('evaluate-button') as HTMLButtonElement;

// AI Mode Betting Actions
const playerBettingActionsDiv = document.getElementById('player-betting-actions') as HTMLDivElement;
const foldButton = document.getElementById('foldButton') as HTMLButtonElement;
const checkButton = document.getElementById('checkButton') as HTMLButtonElement;
const callButton = document.getElementById('callButton') as HTMLButtonElement;
const confirmBetButton = document.getElementById('confirmBetButton') as HTMLButtonElement;
const startNextHandButton = document.getElementById('startNextHandButton') as HTMLButtonElement;
const betPercentageSlider = document.getElementById('betPercentageSlider') as HTMLInputElement;
const betPercentageValue = document.getElementById('betPercentageValue') as HTMLSpanElement;
const calculatedBetAmountDisplay = document.getElementById('calculatedBetAmountDisplay') as HTMLSpanElement;
const allInButton = document.getElementById('allInButton') as HTMLButtonElement;


// Rankings Modal
const showRankingsButton = document.getElementById('show-rankings-button') as HTMLButtonElement;
const rankingsModal = document.getElementById('rankings-modal') as HTMLDivElement;
const closeRankingsButton = rankingsModal.querySelector('.close-button') as HTMLButtonElement;
const handRankingsList = document.getElementById('hand-rankings-list') as HTMLUListElement;

// Game Setup Modal
const gameSetupModal = document.getElementById('game-setup-modal') as HTMLDivElement;
const closeSetupModalButton = document.getElementById('close-setup-modal-button') as HTMLButtonElement;
const gameModePracticeRadio = document.getElementById('gameModePractice') as HTMLInputElement;
const gameModeSoloAIRadio = document.getElementById('gameModeSoloAI') as HTMLInputElement;
const soloAIOptionsDiv = document.getElementById('solo-ai-options') as HTMLDivElement;
const startingChipsSelect = document.getElementById('startingChipsSelect') as HTMLSelectElement;
const aiDifficultySelect = document.getElementById('aiDifficultySelect') as HTMLSelectElement;
const startConfiguredGameButton = document.getElementById('start-configured-game-button') as HTMLButtonElement;

// Exit Game Modal
const exitGameConfirmationModal = document.getElementById('exit-game-confirmation-modal') as HTMLDivElement;
const confirmExitGameButton = document.getElementById('confirm-exit-game-button') as HTMLButtonElement;
const cancelExitGameButton = document.getElementById('cancel-exit-game-button') as HTMLButtonElement;


let humanAnimationTimeoutId: number | null = null;
let aiAnimationTimeoutId: number | null = null;

function showActionAnimation(target: 'human' | 'ai', message: string) {
    const animDiv = target === 'human' ? playerActionAnimationDiv : aiActionAnimationDiv;
    if (!animDiv) return;

    if (target === 'human' && humanAnimationTimeoutId) {
        clearTimeout(humanAnimationTimeoutId);
    } else if (target === 'ai' && aiAnimationTimeoutId) {
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
        } else if (target === 'ai' && aiAnimationTimeoutId === currentTimeoutId) {
            aiAnimationTimeoutId = null;
        }
    }, 1800);

    if (target === 'human') {
        humanAnimationTimeoutId = currentTimeoutId;
    } else {
        aiAnimationTimeoutId = currentTimeoutId;
    }
}

function generateCardId(suit: string, rank: string): string {
    return `${suit}-${rank}-${Math.random().toString(36).substring(2, 7)}`;
}

function createDeck(): Card[] {
    const newDeck: Card[] = [];
    for (const suit of SUITS) {
        for (const rankObj of RANKS) {
            newDeck.push({ suit, rank: rankObj.rank, value: rankObj.value, id: generateCardId(suit, rankObj.rank) });
        }
    }
    return newDeck;
}

function shuffleDeck(deckToShuffle: Card[]): Card[] {
    const shuffled = [...deckToShuffle];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function dealFromDeck(count: number): Card[] {
    if (deck.length < count) {
        messageAreaDiv.textContent = "덱에 카드가 부족합니다!";
        console.error("Deck depleted. Requested:", count, "Available:", deck.length);
        const availableCards = deck.splice(0, deck.length);
        return availableCards;
    }
    return deck.splice(0, count);
}

function renderCard(card: Card, isExampleCard: boolean = false, isHighlighted: boolean = false, startFaceUp: boolean = false): HTMLDivElement {
    const cardContainer = document.createElement('div');
    cardContainer.classList.add('card-container');
    cardContainer.dataset.cardId = card.id;

    if (isExampleCard) { // Render example card directly (no flip, simplified structure)
        const exampleCardDiv = document.createElement('div');
        exampleCardDiv.classList.add('card', 'example-card');
        if (isHighlighted) exampleCardDiv.classList.add('highlighted-card-component');
        if (card.suit === '♥') exampleCardDiv.classList.add('hearts');
        else if (card.suit === '♦') exampleCardDiv.classList.add('diamonds');
        else if (card.suit === '♣') exampleCardDiv.classList.add('clubs');
        else if (card.suit === '♠') exampleCardDiv.classList.add('spades');
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
    if (card.suit === '♥') cardFrontFace.classList.add('hearts');
    else if (card.suit === '♦') cardFrontFace.classList.add('diamonds');
    else if (card.suit === '♣') cardFrontFace.classList.add('clubs');
    else if (card.suit === '♠') cardFrontFace.classList.add('spades');
    
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


async function revealCardElement(cardEl: HTMLElement | null, staggerDelay: number = 0) {
    if (!cardEl) return;
    const flipper = cardEl.querySelector('.card-flipper') as HTMLElement;
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


function suitToFullName(suitChar: string): string {
    switch (suitChar) {
        case '♠': return '스페이드';
        case '♥': return '하트';
        case '♣': return '클럽';
        case '♦': return '다이아몬드';
        default: return '';
    }
}

async function renderPlayerHoleCards(): Promise<void> {
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

async function renderAIHoleCards(revealAtShowdown: boolean = false): Promise<void> {
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
            } else if (!shouldBeVisibleNow && cardWasAlreadyRevealedInGlobalSet) {
                // This case should not happen often if logic is right, but as a fallback:
                // If card was revealed but shouldn't be now (e.g. new hand), ensure it's reset.
                // However, card elements are re-rendered each hand, so this might be redundant.
                // The important part is `revealedAICardIds.clear()` at start of new hand.
            }
        }
    }
}


async function renderCommunityCards(): Promise<void> {
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


function renderPot(): void {
    potAmountSpan.textContent = String(currentPot);
}

function updatePlayerUIDisplays(): void {
    if (humanPlayer) {
        playerChipsDisplay.textContent = `칩: ${humanPlayer.chips}`;
        playerActionDisplay.textContent = humanPlayer.lastAction && humanPlayer.lastAction !== 'none' ? `(${translateAction(humanPlayer.lastAction)}${humanPlayer.currentBetInRound > 0 && humanPlayer.lastAction !== 'blind' ? ' ' + humanPlayer.currentBetInRound : ''})` : '';
    } else {
        playerChipsDisplay.textContent = `칩: 0`;
        playerActionDisplay.textContent = '';
    }
    if (aiPlayer) {
        aiNameDisplay.textContent = selectedAIDifficulty === 'marathon' ? `AI 상대 (레벨 ${marathonAILevel})` : "AI 상대 (불가능)";
        aiChipsDisplay.textContent = `칩: ${aiPlayer.chips}`;
        aiActionDisplay.textContent = aiPlayer.lastAction && aiPlayer.lastAction !== 'none' ? `(${translateAction(aiPlayer.lastAction)}${aiPlayer.currentBetInRound > 0 && aiPlayer.lastAction !== 'blind' ? ' ' + aiPlayer.currentBetInRound : ''})` : '';
        marathonLevelDisplay.textContent = selectedAIDifficulty === 'marathon' ? `레벨: ${marathonAILevel}` : '';
        marathonLevelDisplay.style.display = selectedAIDifficulty === 'marathon' && currentGameMode === 'solo_ai' ? 'inline' : 'none';

    } else {
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

function getRankName(value: number): string {
    const rankObj = RANKS.find(r => r.value === value);
    if (!rankObj) return String(value);
    if (rankObj.rank === 'A') return '에이스';
    if (rankObj.rank === 'K') return '킹';
    if (rankObj.rank === 'Q') return '퀸';
    if (rankObj.rank === 'J') return '잭';
    return rankObj.rank;
}

function translateHandName(englishName: string): string {
    const found = POKER_HAND_RANKINGS.find(r => r.eng === englishName);
    return found ? found.kor : englishName;
}

function translateAction(action: PlayerProfile['lastAction']): string {
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


function evaluateSingleHand(hand: Card[]): HandEvaluationResult {
    if (hand.length !== 5) throw new Error("패는 반드시 5장의 카드로 구성되어야 합니다.");

    const sortedHand = [...hand].sort((a, b) => a.value - b.value);
    const ranks = sortedHand.map(card => card.value);
    const suits = sortedHand.map(card => card.suit);

    const rankCounts: { [key: number]: number } = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const uniqueRanksDesc = Object.keys(rankCounts).map(Number).sort((a,b) => b-a); 

    const isFlush = new Set(suits).size === 1;
    
    let isStraight = false;
    let straightHighCardValue = 0;
    const uniqueSortedRanksAsc = [...new Set(ranks)].sort((a,b) => a-b);
    
    if (uniqueSortedRanksAsc.length >= 5) {
        for (let i = uniqueSortedRanksAsc.length - 1; i >= 4; i--) { 
            if (uniqueSortedRanksAsc[i] - uniqueSortedRanksAsc[i-4] === 4) {
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
        const ace = sortedHand.find(c=>c.value === 14)!;
        const lowCards = sortedHand.filter(c=>c.value !== 14).sort((a,b)=>a.value-b.value);
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
        const fourKindRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 4)!);
        return { name: "Four of a Kind", rankValue: 8, detailedName: `포 카드, ${fourKindRank}s`, bestHandCards: sortedHand };
    }
    if (counts[0] === 3 && counts[1] === 2) {
        const threeKindRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 3)!);
        const pairRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 2)!);
        return { name: "Full House", rankValue: 7, detailedName: `풀 하우스, ${threeKindRank}s over ${pairRank}s`, bestHandCards: sortedHand };
    }
    if (isFlush) {
        const highCardName = getRankName(sortedHand[sortedHand.length -1].value); 
        return { name: "Flush", rankValue: 6, detailedName: `${highCardName}-high 플러시`, bestHandCards: sortedHand };
    }
    if (isStraight) {
        const highRankValue = straightHighCardValue;
        return { name: "Straight", rankValue: 5, detailedName: `${getRankName(highRankValue)}-high 스트레이트`, bestHandCards: handForDisplay };
    }
    if (counts[0] === 3) {
        const threeKindRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 3)!);
        return { name: "Three of a Kind", rankValue: 4, detailedName: `트리플, ${threeKindRank}s`, bestHandCards: sortedHand };
    }
    if (counts[0] === 2 && counts[1] === 2) {
        const highPairRank = getRankName(uniqueRanksDesc.filter(r => rankCounts[r] === 2).sort((a,b) => b-a)[0]);
        const lowPairRank = getRankName(uniqueRanksDesc.filter(r => rankCounts[r] === 2).sort((a,b) => b-a)[1]);
        return { name: "Two Pair", rankValue: 3, detailedName: `투 페어, ${highPairRank}s and ${lowPairRank}s`, bestHandCards: sortedHand };
    }
    if (counts[0] === 2) {
        const pairRank = getRankName(uniqueRanksDesc.find(r => rankCounts[r] === 2)!);
        return { name: "One Pair", rankValue: 2, detailedName: `원 페어, ${pairRank}s`, bestHandCards: sortedHand };
    }
    
    const highCardName = getRankName(sortedHand[sortedHand.length - 1].value);
    return { name: "High Card", rankValue: 1, detailedName: `하이 카드, ${highCardName}`, bestHandCards: sortedHand };
}


function combinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (k > arr.length) return [];
    if (k === arr.length) return [arr];

    const [head, ...tail] = arr;
    const combsWithoutHead = combinations(tail, k);
    const combsWithHead = combinations(tail, k - 1).map(comb => [head, ...comb]);
    return [...combsWithHead, ...combsWithoutHead];
}

function compareHands(eval1: HandEvaluationResult, eval2: HandEvaluationResult): HandEvaluationResult {
    if (eval1.rankValue > eval2.rankValue) return eval1;
    if (eval2.rankValue > eval1.rankValue) return eval2;

    if (!eval1.bestHandCards || !eval2.bestHandCards) { 
        return eval1.rankValue >= eval2.rankValue ? eval1 : eval2; 
    }
    
    const getEffectiveHighCardValueForStraight = (handEval: HandEvaluationResult): number => {
        if (!handEval.bestHandCards) return 0;
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
        if (high1 > high2) return eval1;
        if (high2 > high1) return eval2;
        return eval1; // Tie, return first (could be further kicker logic for non-straight/flush, but not needed here)
    }
    
    // Kicker comparison for hands of same rank (e.g. Pair vs Pair, High Card vs High Card)
    const hand1Cards = eval1.bestHandCards.map(c => c.value).sort((a: number, b: number) => b - a);
    const hand2Cards = eval2.bestHandCards.map(c => c.value).sort((a: number, b: number) => b - a);

    for (let i = 0; i < Math.min(hand1Cards.length, hand2Cards.length); i++) {
        if (hand1Cards[i] > hand2Cards[i]) return eval1;
        if (hand2Cards[i] > hand1Cards[i]) return eval2;
    }
    return eval1; // Hands are identical or insufficient kickers to break tie
}


function evaluateTexasHoldemHand(hole: Card[], community: Card[]): HandEvaluationResult {
    const allCards = [...hole, ...community];
    if (allCards.length < 5) {
        return { name: "카드가 부족합니다", rankValue: 0, detailedName: "패를 확인하려면 최소 5장의 카드가 필요합니다." };
    }

    const possibleHands = combinations(allCards, 5);
    let bestEvaluation: HandEvaluationResult | null = null;

    for (const hand of possibleHands) {
        const currentEval = evaluateSingleHand(hand);
        if (!bestEvaluation) {
            bestEvaluation = currentEval;
        } else {
            bestEvaluation = compareHands(bestEvaluation, currentEval);
        }
    }
    return bestEvaluation || { name: "오류", rankValue: 0, detailedName: "패를 평가할 수 없습니다." };
}

function resetGameUI(isFullReset: boolean = true) {
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
    if(isFullReset) exitGameButton.style.display = 'none';


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

    } else if (currentGameMode === 'solo_ai') {
        practiceModeActionsDiv.style.display = 'none';
        playerBettingActionsDiv.style.display = isHandInProgress && currentPlayerTurn === 'human' && !sequentialRevealInProgress ? 'flex' : 'none';
        startNextHandButton.style.display = !isHandInProgress && humanPlayer && aiPlayer && (humanPlayer.chips > 0 && aiPlayer.chips > 0) ? 'inline-block' : 'none';
        aiPlayerAreaDiv.style.display = 'block'; 
        exitGameButton.style.display = 'inline-block';
         if (selectedAIDifficulty === 'marathon') {
            marathonLevelDisplay.style.display = 'inline';
            marathonLevelDisplay.textContent = `레벨: ${marathonAILevel}`;
        } else {
            marathonLevelDisplay.style.display = 'none';
        }

        if (isHandInProgress && currentPlayerTurn === 'human' && !sequentialRevealInProgress) {
            updateActionButtonsAvailability();
        } else if (sequentialRevealInProgress) {
            playerBettingActionsDiv.style.display = 'none'; 
        }
    } else { 
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
        } else {
            if (humanPlayer.chips === 0 && aiPlayer.chips === 0) {
                messageAreaDiv.textContent = "무승부! 양쪽 플레이어 모두 칩이 없습니다.";
            } else if (humanPlayer.chips === 0) {
                messageAreaDiv.textContent = "AI 승리! 당신의 칩이 모두 소진되었습니다.";
            } else if (aiPlayer.chips === 0){ 
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
        let calculatedValue = Math.min(humanPlayer.chips, Math.max(1, Math.floor(humanPlayer.chips * (percentage / 100))));
        // Cap bet if AI has fewer chips and is not all-in
        if (aiPlayer && !aiPlayer.isAllIn && calculatedValue > aiPlayer.chips) {
            calculatedValue = aiPlayer.chips;
        }
        calculatedBetAmountDisplay.textContent = `(금액: ${calculatedValue})`;
    } else {
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
        if (humanPlayer) savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips);
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
    } else {
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
            if (tempDeckForSim.length > 0) tempDeckForSim.shift(); 
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
            if (aiPlayer) aiPlayer.holeCards = dealFromDeck(2);
        } else {
             console.log("Impossible AI adjusted hand to win due to low chips vs blind.");
        }
    } else {
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
    } else if (currentGameMode === 'practice') { 
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
    } else if (currentGameMode === 'solo_ai' && currentPlayerTurn === 'human' && humanPlayer && !humanPlayer.isFolded && !humanPlayer.isAllIn && isHandInProgress) {
         messageAreaDiv.textContent = `당신의 턴입니다. (프리플랍)`;
    }
}

function postBlind(player: PlayerProfile, amount: number, type: 'SB' | 'BB') {
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
    allInButton.disabled = humanPlayer.isAllIn || (aiPlayer?.isAllIn ?? false); // Disable All-in if human is already all-in OR AI is already all-in
    
    if (aiPlayer && aiPlayer.isAllIn) {
        // AI is all-in. Human can only fold or call AI's all-in amount.
        checkButton.disabled = true; // Cannot check if AI is all-in with a bet outstanding.
        
        const callAmountForAIAllIn = aiPlayer.currentBetInRound - humanPlayer.currentBetInRound;

        if (callAmountForAIAllIn <= 0) { // Human has already matched or exceeded AI's all-in.
            callButton.disabled = true;
            callButton.textContent = '콜'; 
             checkButton.disabled = humanPlayer.isAllIn;

        } else {
            callButton.disabled = humanPlayer.isAllIn; 
            const humanCanCoverCall = humanPlayer.chips >= callAmountForAIAllIn;
            callButton.textContent = humanCanCoverCall ? `콜 (${callAmountForAIAllIn})` : `올인 콜 (${humanPlayer.chips})`;
        }
        
        confirmBetButton.disabled = true; 
        confirmBetButton.textContent = "벳/레이즈"; 
        betPercentageSlider.disabled = true;
        // allInButton.disabled = true; // Already handled by the combined condition above

    } else { // AI is NOT all-in (or no AI player), normal betting rules apply
        const canCheck = humanPlayer.currentBetInRound >= currentBetToCall && !humanPlayer.isAllIn;
        checkButton.disabled = !canCheck;

        const callAmount = currentBetToCall - humanPlayer.currentBetInRound;
        callButton.disabled = !(callAmount > 0 && !humanPlayer.isAllIn); 
        if (callAmount > 0) {
            callButton.textContent = humanPlayer.chips >= callAmount ? `콜 (${callAmount})` : `올인 콜 (${humanPlayer.chips})`;
        } else {
            callButton.textContent = '콜'; 
        }
        if (humanPlayer.isAllIn || callAmount <= 0) callButton.disabled = true; 
        
        confirmBetButton.disabled = humanPlayer.isAllIn;
        betPercentageSlider.disabled = humanPlayer.isAllIn;
        
        if (humanPlayer.isAllIn) {
             confirmBetButton.textContent = "올인됨";
        } else {
            const percentage = parseInt(betPercentageSlider.value);
            let currentActionValue = humanPlayer.chips > 0 ? Math.min(humanPlayer.chips, Math.max(1, Math.floor(humanPlayer.chips * (percentage / 100)))) : 0;
            
            // Cap actionValue by AI's remaining chips if AI is not all-in
            if (aiPlayer && !aiPlayer.isAllIn && currentActionValue > aiPlayer.chips) {
                currentActionValue = aiPlayer.chips;
            }

            const isRaiseAttempt = currentBetToCall > 0; 
            const newTotalBetIfActionTaken = humanPlayer.currentBetInRound + currentActionValue;

            let isValidAction = false;
            if (isRaiseAttempt) { 
                confirmBetButton.textContent = '레이즈';
                if (currentActionValue === humanPlayer.chips || (newTotalBetIfActionTaken - currentBetToCall >= minRaiseAmount) ) {
                    isValidAction = true;
                }
            } else { // Bet attempt
                confirmBetButton.textContent = '벳';
                if (currentActionValue === humanPlayer.chips || newTotalBetIfActionTaken >= dynamicBigBlind) {
                    isValidAction = true;
                }
            }
            confirmBetButton.disabled = !isValidAction || currentActionValue === 0 || currentActionValue > humanPlayer.chips; 
        }
    }
    updateBetSliderUI(); 
}

async function handleFoldAction() {
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isFolded) return;
    humanPlayer.isFolded = true;
    humanPlayer.lastAction = 'fold';
    showActionAnimation('human', "폴드");
    messageAreaDiv.textContent = "당신은 폴드했습니다.";
    isHandInProgress = false; 
    if (aiPlayer) awardPotToWinner(aiPlayer); 
    await endHand();
}

async function handleCheckAction() {
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isAllIn) return;
    if (humanPlayer.currentBetInRound < currentBetToCall && !(aiPlayer && aiPlayer.isAllIn && humanPlayer.currentBetInRound >= aiPlayer.currentBetInRound) ) {
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
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isAllIn) return;
    
    let callAmountNeeded = currentBetToCall - humanPlayer.currentBetInRound;
    if (aiPlayer && aiPlayer.isAllIn) { 
        callAmountNeeded = Math.max(0, aiPlayer.currentBetInRound - humanPlayer.currentBetInRound);
    }


    if (callAmountNeeded <= 0) { 
        messageAreaDiv.textContent = "콜할 금액이 없습니다. 체크하거나 벳/레이즈 하세요.";
        if (callAmountNeeded === 0 && humanPlayer.currentBetInRound >= currentBetToCall) {
            await handleCheckAction(); 
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
    } else {
        messageAreaDiv.textContent = `당신은 ${amountToCommit}을 콜했습니다. (총 ${humanPlayer.currentBetInRound})`;
        showActionAnimation('human', `콜 (${amountToCommit})`);
    }
    
    await checkBettingRoundEnd();
}

async function handleAllInAction() {
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isAllIn) return;
    if (aiPlayer && aiPlayer.isAllIn) { // Player should use Call button if AI is already all-in
        messageAreaDiv.textContent = "AI가 이미 올인 상태입니다. '콜' 버튼을 사용하세요.";
        return;
    }

    const humanTotalChipsBeforeAction = humanPlayer.chips;
    if (humanTotalChipsBeforeAction <= 0) return;

    let amountCommittedByHumanToPotThisAction: number = humanTotalChipsBeforeAction;
    let finalHumanBetInRound: number = humanPlayer.currentBetInRound + humanTotalChipsBeforeAction; 

    // The "all-in" action means player commits all their chips.
    // The effective bet against AI (if AI has fewer chips) is handled by refund logic in awardPotToWinner
    // and AI's own logic to not call more than it has.
    // For this action, player simply puts all their chips forward.

    const isCurrentlyBet = currentBetToCall === 0;
    const isEffectivelyRaise = !isCurrentlyBet && finalHumanBetInRound > currentBetToCall;
    
    if (isEffectivelyRaise) {
        humanPlayer.lastAction = 'raise';
        minRaiseAmount = finalHumanBetInRound - currentBetToCall; 
        currentBetToCall = finalHumanBetInRound;
        playerWhoLastRaised = 'human';
        if (aiPlayer) aiPlayer.hasActedThisRound = false; 
    } else if (isCurrentlyBet) {
        humanPlayer.lastAction = 'bet';
        minRaiseAmount = finalHumanBetInRound; 
        currentBetToCall = finalHumanBetInRound;
        playerWhoLastRaised = 'human';
        if (aiPlayer) aiPlayer.hasActedThisRound = false; 
    } else { 
        humanPlayer.lastAction = 'call'; // All-in to call an existing bet
    }
    showActionAnimation('human', `올인 (${amountCommittedByHumanToPotThisAction})`);
    messageAreaDiv.textContent = `당신은 올인(${amountCommittedByHumanToPotThisAction}) ${translateAction(humanPlayer.lastAction)}하여 총 ${finalHumanBetInRound}(으)로 만들었습니다!`;
    

    humanPlayer.chips -= amountCommittedByHumanToPotThisAction; 
    currentPot += amountCommittedByHumanToPotThisAction;
    humanPlayer.currentBetInRound = finalHumanBetInRound; 

    if (humanPlayer.chips === 0) { 
        humanPlayer.isAllIn = true;
    }
    
    humanPlayer.hasActedThisRound = true;
    await checkBettingRoundEnd();
}


async function handleBetRaiseAction() {
    if (!humanPlayer || currentPlayerTurn !== 'human' || !isHandInProgress || humanPlayer.isAllIn) return;
    if (aiPlayer && aiPlayer.isAllIn) { 
        messageAreaDiv.textContent = "AI가 이미 올인 상태입니다. 콜 또는 폴드만 가능합니다.";
        return;
    }
    
    let actionAmount = 0; 
    let actionAnimMsgPart = "";
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

    // Cap actionAmount by AI's remaining chips if AI is not all-in
    if (aiPlayer && !aiPlayer.isAllIn && actionAmount > aiPlayer.chips) {
        const originalActionAmount = actionAmount;
        actionAmount = aiPlayer.chips;
        actionAnimMsgPart = ` (AI의 남은 칩 ${actionAmount}에 맞춰 금액 조정됨)`;
        // This message part will be appended to the main action message.
    }


    const isRaiseAttempt = currentBetToCall > 0;
    const newTotalBetInRoundForPlayer = humanPlayer.currentBetInRound + actionAmount;

    if (isRaiseAttempt) { 
        const raiseAmount = newTotalBetInRoundForPlayer - currentBetToCall;
        if (actionAmount < humanPlayer.chips && raiseAmount < minRaiseAmount) { 
            messageAreaDiv.textContent = `최소 레이즈는 ${minRaiseAmount} 만큼 더 올려서 총 ${currentBetToCall + minRaiseAmount}이 되도록 해야 합니다. 또는 올인하세요.`;
            return;
        }
    } else { // Bet attempt
        const currentDynamicBigBlindVal = currentGameMode === 'solo_ai' ? dynamicBigBlind : DEFAULT_BIG_BLIND;
        if (actionAmount < humanPlayer.chips && newTotalBetInRoundForPlayer < currentDynamicBigBlindVal) { 
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
    
    if (humanPlayer.lastAction === 'bet') {
        currentBetToCall = newTotalBetInRoundForPlayer;
        minRaiseAmount = newTotalBetInRoundForPlayer; 
        playerWhoLastRaised = 'human';
    } else if (humanPlayer.lastAction === 'raise') {
        minRaiseAmount = newTotalBetInRoundForPlayer - currentBetToCall; 
        currentBetToCall = newTotalBetInRoundForPlayer;
        playerWhoLastRaised = 'human';
    }
    if (aiPlayer) aiPlayer.hasActedThisRound = false; 
    
    messageAreaDiv.textContent = `당신이 ${actionAmount}을(를) ${translateAction(humanPlayer.lastAction)}하여 총 ${newTotalBetInRoundForPlayer}(으)로 만들었습니다.${actionAnimMsgPart}`;
    showActionAnimation('human', `${translateAction(humanPlayer.lastAction)}: ${actionAmount}`);
    
    await checkBettingRoundEnd();
}


function getMarathonAIAction(level: number, ai: PlayerProfile, human: PlayerProfile, community: Card[], betToCallVal: number, minRaiseVal: number, bigBlindVal: number, potVal: number): AIActionDecision {
    if (level === 10) return getImpossibleAIAction(ai, human, community, betToCallVal, minRaiseVal, bigBlindVal, potVal);

    const canCheck = betToCallVal - ai.currentBetInRound <= 0;
    const amountToCallForAI = betToCallVal - ai.currentBetInRound;
    const aiEval = evaluateTexasHoldemHand(ai.holeCards, community); 
    const handStrength = aiEval.rankValue; 

    if (level === 1) { // Very basic AI
        if (canCheck) {
            if (handStrength >= 2 && Math.random() < 0.3) { // Pair or better, sometimes bet
                let betAmount = Math.min(ai.chips, bigBlindVal);
                 if (human && !human.isAllIn && betAmount > human.chips) { betAmount = human.chips; } // Cap by human stack
                if (betAmount > 0) return { type: 'bet', amount: ai.currentBetInRound + betAmount };
            }
            return { type: 'check' };
        } else { // Must call or fold
            if (handStrength < 2 && amountToCallForAI > ai.chips * 0.05 && Math.random() < 0.95) return { type: 'fold' }; 
            if (handStrength < 3 && amountToCallForAI > ai.chips * 0.15 && Math.random() < 0.8) return { type: 'fold' };
            if (ai.chips <= amountToCallForAI) return {type: 'allin', amount: ai.currentBetInRound + ai.chips}; 
            return { type: 'call' }; 
        }
    }

    const foldProbabilityBase = 0.5; 
    const aggressionFactor = level / 20; 
    const bluffFactor = level / 25; 

    const allCardsForAI = ai.holeCards.concat(community);
    let isFlushDraw = false;
    if (allCardsForAI.length >= 4) {
      const suitCounts: {[key: string]: number} = {};
      allCardsForAI.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
      if (Object.values(suitCounts).some(count => count === 4)) isFlushDraw = true;
    }
    
    let isOpenEndedStraightDraw = false;
    if (allCardsForAI.length >= 4) {
        const uniqueRanksForStraight = [...new Set(allCardsForAI.map(c=>c.value))].sort((a,b)=>a-b);
        if(uniqueRanksForStraight.length >= 4) {
            for(let i=0; i <= uniqueRanksForStraight.length - 4; i++) {
                if(uniqueRanksForStraight[i+3] - uniqueRanksForStraight[i] === 3) isOpenEndedStraightDraw = true; 
                if(uniqueRanksForStraight.includes(14) && uniqueRanksForStraight.includes(2) && uniqueRanksForStraight.includes(3) && uniqueRanksForStraight.includes(4) && i===0) isOpenEndedStraightDraw = true;
            }
        }
    }
    const hasStrongDraw = isFlushDraw || isOpenEndedStraightDraw;


    if (canCheck) {
        if (handStrength >= 4 || (hasStrongDraw && Math.random() < 0.6 + bluffFactor)) { 
            const betPercentage = (Math.floor(Math.random() * (level * 2)) + 5) * 5; 
            let betAmount = Math.min(ai.chips, Math.max(bigBlindVal, Math.floor(ai.chips * (betPercentage / 100))));
            betAmount = Math.max(betAmount, bigBlindVal); 
            if (human && !human.isAllIn && betAmount > human.chips) { betAmount = human.chips; } // Cap by human stack
            if (ai.chips === betAmount) return { type: 'allin', amount: ai.currentBetInRound + betAmount};
            if (betAmount > 0) return { type: 'bet', amount: ai.currentBetInRound + betAmount };
        }
        if (Math.random() < 0.2 + aggressionFactor) { 
             let betAmount = Math.min(ai.chips, bigBlindVal);
             if (human && !human.isAllIn && betAmount > human.chips) { betAmount = human.chips; } // Cap by human stack
             if (betAmount > 0) return { type: 'bet', amount: ai.currentBetInRound + betAmount };
        }
        return { type: 'check' }; 
    } else { 
        if (handStrength < 2 && !hasStrongDraw && amountToCallForAI > bigBlindVal * 2 && Math.random() < foldProbabilityBase + 0.25 - aggressionFactor) return { type: 'fold' };
        
        if (handStrength >= 5 || (hasStrongDraw && Math.random() < 0.5 + bluffFactor) ) { 
            if (ai.chips > amountToCallForAI + minRaiseVal) { 
                let raiseAdditional = Math.max(minRaiseVal, bigBlindVal * (1 + Math.floor(level / 2)), amountToCallForAI * (1 + level/10) );
                if (human && !human.isAllIn && (amountToCallForAI + raiseAdditional) > human.chips) {
                    raiseAdditional = human.chips - amountToCallForAI; // Cap raise by what human can call
                    raiseAdditional = Math.max(0, raiseAdditional);
                }
                let targetTotalBet = betToCallVal + raiseAdditional;
                targetTotalBet = Math.min(ai.currentBetInRound + ai.chips, targetTotalBet);


                if (ai.chips <= (targetTotalBet - ai.currentBetInRound)) return { type: 'allin', amount: ai.currentBetInRound + ai.chips }; 
                if (targetTotalBet > betToCallVal) return { type: 'raise', amount: targetTotalBet };
            }
        }
        if (!hasStrongDraw && amountToCallForAI > ai.chips * (0.45 - aggressionFactor*0.15) && Math.random() < foldProbabilityBase - aggressionFactor) return {type: 'fold'}; 
        if (ai.chips <= amountToCallForAI) return { type: 'allin', amount: ai.currentBetInRound + ai.chips}; 
        return { type: 'call' };
    }
}

function simulateDealingRemainingCommunityCards(deckSnapshot: Card[], currentCommunitySnapshot: Card[]): Card[] {
    let tempDeck = [...deckSnapshot];
    const finalBoard = [...currentCommunitySnapshot];
    const cardsNeededForFullBoard = 5 - finalBoard.length;

    for (let i = 0; i < cardsNeededForFullBoard; i++) {
        if (tempDeck.length === 0) break;
        finalBoard.push(tempDeck.shift()!);
    }
    return finalBoard;
}


function getImpossibleAIAction(ai: PlayerProfile, human: PlayerProfile, community: Card[], betToCallVal: number, minRaiseVal: number, bigBlindVal: number, potVal: number): AIActionDecision {
    const deckSnapshot = [...deck]; 
    
    let tempDeckForSim = [...deckSnapshot];
    let simulatedCommunity = [...community];

    if (simulatedCommunity.length === 0) { 
        if (tempDeckForSim.length > 0) tempDeckForSim.shift(); 
    } else if (simulatedCommunity.length === 3) { 
        if (tempDeckForSim.length > 0) tempDeckForSim.shift(); 
    } else if (simulatedCommunity.length === 4) { 
        if (tempDeckForSim.length > 0) tempDeckForSim.shift(); 
    }
    
    const finalBoard = simulateDealingRemainingCommunityCards(tempDeckForSim, simulatedCommunity);


    const aiFinalEval = evaluateTexasHoldemHand(ai.holeCards, finalBoard);
    const humanFinalEval = evaluateTexasHoldemHand(human.holeCards, finalBoard);
    const comparisonResult = compareHands(aiFinalEval, humanFinalEval);

    let outcome: 'ai_wins' | 'human_wins' | 'split';
    if (comparisonResult === aiFinalEval && aiFinalEval.rankValue > humanFinalEval.rankValue) {
        outcome = 'ai_wins';
    } else if (comparisonResult === humanFinalEval && humanFinalEval.rankValue > aiFinalEval.rankValue) {
        outcome = 'human_wins';
    } else if (comparisonResult === aiFinalEval) { 
         outcome = aiFinalEval.rankValue === humanFinalEval.rankValue ? 'split' : 'ai_wins'; 
         if (outcome === 'split') { 
            const hand1Cards = aiFinalEval.bestHandCards!.map(c => c.value).sort((a, b) => b - a);
            const hand2Cards = humanFinalEval.bestHandCards!.map(c => c.value).sort((a, b) => b - a);
            let trueSplit = true;
            for (let i = 0; i < 5; i++) {
                if (hand1Cards[i] !== hand2Cards[i]) { trueSplit = false; break;}
            }
            if (!trueSplit) outcome = comparisonResult === aiFinalEval ? 'ai_wins' : 'human_wins'; 
         }

    } else { 
        outcome = 'human_wins';
    }
    
    const canCheck = betToCallVal - ai.currentBetInRound <= 0;
    const amountToCallForAI = betToCallVal - ai.currentBetInRound;

    if (outcome === 'human_wins' && !canCheck && amountToCallForAI > 0) {
      return { type: 'fold' };
    }
    if (outcome === 'human_wins' && amountToCallForAI >= ai.chips && amountToCallForAI > 0) {
        return { type: 'fold' };
    }


    if (outcome === 'ai_wins') {
        if (human.isAllIn) { 
            if (ai.chips <= amountToCallForAI && amountToCallForAI > 0) return {type: 'allin', amount: ai.currentBetInRound + ai.chips}; 
            return { type: 'call', amount: ai.currentBetInRound + Math.min(ai.chips, amountToCallForAI) };
        }
        if (canCheck) { 
            if (community.length < 4 && Math.random() < 0.3) { 
                return { type: 'check' }; 
            }
            let betAmount = Math.min(ai.chips, Math.max(bigBlindVal, Math.floor(potVal * (0.6 + Math.random() * 0.4)))); 
            betAmount = Math.max(betAmount, bigBlindVal); 
            if (!human.isAllIn && betAmount > human.chips) { betAmount = human.chips; } // Cap by human stack
            if (ai.chips === betAmount) return { type: 'allin', amount: ai.currentBetInRound + betAmount };
            return { type: 'bet', amount: ai.currentBetInRound + betAmount };
        } else { 
            if (amountToCallForAI <= potVal * 0.5 && community.length < 4 && Math.random() < 0.4) { 
                 if (ai.chips <= amountToCallForAI) return { type: 'allin', amount: ai.currentBetInRound + ai.chips};
                return { type: 'call' }; 
            }
            let raisePotPercentage = 0.7 + Math.random() * 0.8; 
            let raiseAmountOverBet = Math.max(minRaiseVal, Math.floor((potVal + amountToCallForAI) * raisePotPercentage)); 
            if (!human.isAllIn && (amountToCallForAI + raiseAmountOverBet) > human.chips) {
                 raiseAmountOverBet = human.chips - amountToCallForAI; // Cap raise by what human can call
                 raiseAmountOverBet = Math.max(0, raiseAmountOverBet);
            }
            let targetTotalBet = betToCallVal + raiseAmountOverBet;
            targetTotalBet = Math.min(ai.currentBetInRound + ai.chips, targetTotalBet);
            
            if (ai.chips <= (targetTotalBet - ai.currentBetInRound)) return { type: 'allin', amount: ai.currentBetInRound + ai.chips }; 
            if (targetTotalBet > betToCallVal) return { type: 'raise', amount: targetTotalBet };
            if (ai.chips <= amountToCallForAI) return { type: 'allin', amount: ai.currentBetInRound + ai.chips}; // Fallback to call if raise invalid
            return { type: 'call'};
        }
    } else if (outcome === 'human_wins') { 
        if (canCheck) {
            return { type: 'check' }; 
        } else {
            return { type: 'fold' }; 
        }
    } else { // Split pot
        if (canCheck) {
            return { type: 'check' };
        } else {
            if (human.isAllIn || amountToCallForAI <= bigBlindVal / 2 || amountToCallForAI >= ai.chips) {
                if (ai.chips <= amountToCallForAI) return { type: 'allin', amount: ai.currentBetInRound + ai.chips};
                return { type: 'call' };
            }
            return { type: 'fold' }; 
        }
    }
}


async function triggerAIAction() {
    if (!aiPlayer || currentPlayerTurn !== 'ai' || !isHandInProgress || !humanPlayer || sequentialRevealInProgress) {
        if (!isHandInProgress && !sequentialRevealInProgress) console.warn("triggerAIAction called but hand is not in progress or reveal is pending.");
        return;
    }
    messageAreaDiv.textContent = "AI가 생각 중...";
    await updateGameUI(); 

    if (aiPlayer.isFolded || aiPlayer.isAllIn) { 
        aiPlayer.hasActedThisRound = true; 
        await checkBettingRoundEnd();
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500)); 
     
    let decision: AIActionDecision;
    if (selectedAIDifficulty === 'impossible') {
        decision = getImpossibleAIAction(aiPlayer, humanPlayer, communityCards, currentBetToCall, minRaiseAmount, dynamicBigBlind, currentPot);
    } else if (selectedAIDifficulty === 'marathon') {
        decision = getMarathonAIAction(marathonAILevel, aiPlayer, humanPlayer, communityCards, currentBetToCall, minRaiseAmount, dynamicBigBlind, currentPot);
    } else {
        console.error("알 수 없는 AI 난이도:", selectedAIDifficulty);
        decision = { type: 'check' }; 
    }

    let chipsToCommit = 0;
    let actionAnimMsg = "";
    let humanStackLimitAppliedMessage = "";
    
    switch (decision.type) {
        case 'fold':
            aiPlayer.isFolded = true;
            aiPlayer.lastAction = 'fold';
            actionAnimMsg = "AI 폴드";
            messageAreaDiv.textContent = "AI가 폴드했습니다.";
            showActionAnimation('ai', actionAnimMsg);
            awardPotToWinner(humanPlayer); 
            await endHand(); 
            return; 
        case 'check':
            if (currentBetToCall - aiPlayer.currentBetInRound > 0) { 
                chipsToCommit = Math.min(aiPlayer.chips, currentBetToCall - aiPlayer.currentBetInRound);
                aiPlayer.lastAction = 'call'; 
                actionAnimMsg = `AI 콜: ${chipsToCommit}`;
                messageAreaDiv.textContent = `AI가 (강제) ${chipsToCommit}을 콜했습니다.`;
            } else {
                aiPlayer.lastAction = 'check';
                actionAnimMsg = "AI 체크";
                messageAreaDiv.textContent = "AI가 체크했습니다.";
            }
            break;
        case 'call':
            chipsToCommit = Math.min(aiPlayer.chips, currentBetToCall - aiPlayer.currentBetInRound);
            if (chipsToCommit < 0) chipsToCommit = 0; 
            aiPlayer.lastAction = 'call';
            actionAnimMsg = `AI 콜: ${chipsToCommit}`;
            messageAreaDiv.textContent = `AI가 ${chipsToCommit}을 콜했습니다.`;
            break;
        case 'bet': {
            let intendedAdditionalBet = (decision.amount || 0) - aiPlayer.currentBetInRound;
            intendedAdditionalBet = Math.max(0, intendedAdditionalBet); // Must be positive addition
            chipsToCommit = Math.min(aiPlayer.chips, intendedAdditionalBet); // Cannot bet more than AI has

            if (humanPlayer && !humanPlayer.isAllIn && chipsToCommit > humanPlayer.chips) {
                chipsToCommit = humanPlayer.chips; // Cap by human's stack
                humanStackLimitAppliedMessage = ` (당신의 남은 칩 ${humanPlayer.chips}에 맞춰 조정됨)`;
            }
            
            if (chipsToCommit < dynamicBigBlind && chipsToCommit < aiPlayer.chips && !(aiPlayer.chips === chipsToCommit && humanStackLimitAppliedMessage)) { // Not an all-in (by AI or by capping against human) and bet too small
                 chipsToCommit = Math.min(aiPlayer.chips, dynamicBigBlind); 
                 if (humanPlayer && !humanPlayer.isAllIn && chipsToCommit > humanPlayer.chips) { // Re-cap if forced to big blind
                    chipsToCommit = humanPlayer.chips;
                    humanStackLimitAppliedMessage = ` (당신의 남은 칩 ${humanPlayer.chips}에 맞춰 조정됨)`;
                 }
            }

            if (chipsToCommit <=0 && aiPlayer.chips > 0) { 
                chipsToCommit = 0; // ensure it's 0 for the state update
                aiPlayer.lastAction = 'check'; 
                actionAnimMsg = "AI 체크";
                messageAreaDiv.textContent = "AI가 체크했습니다 (잘못된 벳 시도).";
                break; 
            }
            aiPlayer.lastAction = 'bet';
            currentBetToCall = aiPlayer.currentBetInRound + chipsToCommit;
            minRaiseAmount = chipsToCommit; 
            playerWhoLastRaised = 'ai';
            if(humanPlayer) humanPlayer.hasActedThisRound = false; 
            messageAreaDiv.textContent = `AI가 ${chipsToCommit}을 벳하여 총 ${currentBetToCall}(으)로 만들었습니다.${humanStackLimitAppliedMessage}`;
            actionAnimMsg = `AI 벳: ${chipsToCommit}${humanStackLimitAppliedMessage ? ' (플레이어 올인 유도)' : ''}`;
            break;
        }
        case 'raise': {
            const intendedTotalBetForAIRound = decision.amount || 0;
            let intendedAdditionalRaise = intendedTotalBetForAIRound - aiPlayer.currentBetInRound;
            intendedAdditionalRaise = Math.max(0, intendedAdditionalRaise);
            chipsToCommit = Math.min(aiPlayer.chips, intendedAdditionalRaise); // AI cannot raise more than it has

            if (humanPlayer && !humanPlayer.isAllIn && chipsToCommit > humanPlayer.chips) {
                chipsToCommit = humanPlayer.chips; // Cap by human's stack
                humanStackLimitAppliedMessage = ` (당신의 남은 칩 ${humanPlayer.chips}에 맞춰 조정됨)`;
            }

            const newAITotalBetForRound = aiPlayer.currentBetInRound + chipsToCommit;
            const actualRaiseAmount = newAITotalBetForRound - currentBetToCall; 

            if (chipsToCommit < aiPlayer.chips && actualRaiseAmount < minRaiseAmount && !(aiPlayer.chips === chipsToCommit && humanStackLimitAppliedMessage)) {
                const callAmountInstead = Math.min(aiPlayer.chips, currentBetToCall - aiPlayer.currentBetInRound);
                if (callAmountInstead > 0) {
                    chipsToCommit = callAmountInstead;
                    aiPlayer.lastAction = 'call';
                    actionAnimMsg = `AI 콜: ${chipsToCommit}`;
                    messageAreaDiv.textContent = `AI가 (잘못된 레이즈 시도 후) ${chipsToCommit}을 콜했습니다.`;
                } else { 
                    chipsToCommit = 0;
                    aiPlayer.lastAction = 'check';
                    actionAnimMsg = "AI 체크";
                    messageAreaDiv.textContent = "AI가 체크했습니다 (잘못된 레이즈 시도 후).";
                }
            } else { 
                aiPlayer.lastAction = 'raise';
                minRaiseAmount = actualRaiseAmount; 
                currentBetToCall = newAITotalBetForRound;
                playerWhoLastRaised = 'ai';
                if(humanPlayer) humanPlayer.hasActedThisRound = false; 
                messageAreaDiv.textContent = `AI가 ${chipsToCommit}을 레이즈하여 총 ${currentBetToCall}(으)로 만들었습니다.${humanStackLimitAppliedMessage}`;
                actionAnimMsg = `AI 레이즈: ${chipsToCommit}${humanStackLimitAppliedMessage ? ' (플레이어 올인 유도)' : ''}`;
            }
            break;
        }
        case 'allin':
            chipsToCommit = aiPlayer.chips;
            const totalAllInBetByAI = aiPlayer.currentBetInRound + chipsToCommit;

            // Check if AI's all-in is capped by human's ability to call.
            // The currentBetToCall for human will be AI's total bet.
            // If human has less, human can only call with their stack.
            // This specific capping of AI's bet amount isn't explicitly needed here for 'allin' type,
            // as AI commits its whole stack. The human response will be capped.

            if (totalAllInBetByAI > currentBetToCall) { 
                aiPlayer.lastAction = currentBetToCall === 0 ? 'bet' : 'raise';
                if (aiPlayer.lastAction === 'raise') {
                    minRaiseAmount = totalAllInBetByAI - currentBetToCall;
                } else { 
                    minRaiseAmount = totalAllInBetByAI;
                }
                currentBetToCall = totalAllInBetByAI;
                playerWhoLastRaised = 'ai';
                if(humanPlayer) humanPlayer.hasActedThisRound = false; 
                messageAreaDiv.textContent = `AI가 올인 ${translateAction(aiPlayer.lastAction)} (${chipsToCommit}) 하여 총 ${currentBetToCall}(으)로 만들었습니다!`;
            } else { 
                 if (currentBetToCall - aiPlayer.currentBetInRound <= 0 && totalAllInBetByAI <= currentBetToCall) { 
                    aiPlayer.lastAction = 'check';
                    messageAreaDiv.textContent = `AI가 올인 체크 (${chipsToCommit}) 했습니다.`;
                } else { 
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
    if (!humanPlayer || !aiPlayer || !isHandInProgress || sequentialRevealInProgress) return;

    const p1 = humanPlayer;
    const p2 = aiPlayer;

    const p1CanAct = !p1.isFolded && !p1.isAllIn;
    const p2CanAct = !p2.isFolded && !p2.isAllIn;

    if (p1.isFolded || p2.isFolded) { 
        if(!isHandInProgress) return; 
        const winner = p1.isFolded ? p2 : p1;
        awardPotToWinner(winner);
        await endHand();
        return;
    }
    
    let roundOver = false;
    if ( (p1.isAllIn || p1.isFolded) && (p2.isAllIn || p2.isFolded) ) { 
        roundOver = true;
    } 
    else if (p1.currentBetInRound === p2.currentBetInRound) {
        const p1VoluntaryAction = p1.hasActedThisRound || p1.isAllIn || p1.lastAction === 'blind'; 
        const p2VoluntaryAction = p2.hasActedThisRound || p2.isAllIn || p2.lastAction === 'blind';

        if (p1VoluntaryAction && p2VoluntaryAction) {
            if (currentBettingRound === 'preflop') {
                const bbPlayer = dealerPosition === 'human' ? p2 : p1;
                const otherPlayer = dealerPosition === 'human' ? p1 : p2;
                if (playerWhoLastRaised === bbPlayer.seat && bbPlayer.lastAction === 'check' && bbPlayer.currentBetInRound === dynamicBigBlind && otherPlayer.currentBetInRound === dynamicBigBlind) {
                    roundOver = true;
                } 
                else if (p1.lastAction !== 'blind' && p2.lastAction !== 'blind') { 
                     roundOver = true;
                }
            } else { 
                 if (p1.lastAction !== 'blind' && p2.lastAction !== 'blind') {
                    roundOver = true;
                 }
            }
        }
        if ( (p1.isAllIn && p2.currentBetInRound >= p1.currentBetInRound && !p2.isFolded) || 
             (p2.isAllIn && p1.currentBetInRound >= p2.currentBetInRound && !p1.isFolded) ) {
            roundOver = true;
        }
    }


    if(roundOver){
        await advanceBettingRound();
        return;
    }

    if (playerWhoLastRaised) { 
        if (currentPlayerTurn === 'human' && playerWhoLastRaised === 'human') { 
             currentPlayerTurn = 'ai';
        } else if (currentPlayerTurn === 'ai' && playerWhoLastRaised === 'ai') { 
             currentPlayerTurn = 'human';
        } else { 
             if (currentPlayerTurn === 'human') currentPlayerTurn = 'ai';
             else currentPlayerTurn = 'human';
        }
    } else { 
         if (currentPlayerTurn === 'human') currentPlayerTurn = 'ai';
         else currentPlayerTurn = 'human';
    }


    if (currentPlayerTurn === 'human' && !p1CanAct) {
        currentPlayerTurn = 'ai';
        if (!p2CanAct) { await advanceBettingRound(); return; } 
    } else if (currentPlayerTurn === 'ai' && !p2CanAct) {
        currentPlayerTurn = 'human';
        if (!p1CanAct) { await advanceBettingRound(); return; } 
    }


    if (currentPlayerTurn === 'human') {
        if (humanPlayer.isFolded || humanPlayer.isAllIn) { 
            await checkBettingRoundEnd(); 
            return;
        }
        messageAreaDiv.textContent = `당신의 턴입니다. (${currentBettingRound === 'preflop' ? '프리플랍' : currentBettingRound})`;
        await updateGameUI();
    } else { 
        if (aiPlayer.isFolded || aiPlayer.isAllIn) { 
            await checkBettingRoundEnd(); 
            return;
        }
        await updateGameUI(); 
        setTimeout(triggerAIAction, 100); 
    }
}

async function advanceBettingRound() {
    if (!humanPlayer || !aiPlayer || sequentialRevealInProgress) return;

    humanPlayer.currentBetInRound = 0; 
    aiPlayer.currentBetInRound = 0;
    
    humanPlayer.hasActedThisRound = false;
    aiPlayer.hasActedThisRound = false;
    currentBetToCall = 0;
    minRaiseAmount = currentGameMode === 'solo_ai' ? dynamicBigBlind : DEFAULT_BIG_BLIND; 
    playerWhoLastRaised = null; 

    const bettingConcludedDueToAllIn = 
        (humanPlayer.isAllIn || aiPlayer.isAllIn) && 
        !(humanPlayer.isFolded || aiPlayer.isFolded) &&
        ( 
            (humanPlayer.isAllIn && aiPlayer.currentBetInRound >= humanPlayer.currentBetInRound && !aiPlayer.isFolded) ||
            (aiPlayer.isAllIn && humanPlayer.currentBetInRound >= aiPlayer.currentBetInRound && !humanPlayer.isFolded) ||
            (humanPlayer.isAllIn && aiPlayer.isAllIn)
        );


    if (bettingConcludedDueToAllIn && currentBettingRound !== 'river' && currentBettingRound !== 'showdown' && currentBettingRound !== 'hand_over') {
        sequentialRevealInProgress = true;
        messageAreaDiv.textContent = "한 명 이상 올인 상태. 남은 커뮤니티 카드를 순차적으로 공개합니다...";
        playerBettingActionsDiv.style.display = 'none'; 

        const delayBetweenStreets = 800; 

        if (currentBettingRound === 'preflop' || communityCards.length < 3) {
            if (deck.length > 0 && communityCards.length === 0) dealFromDeck(1); 
            await dealCommunity(3 - communityCards.length); 
            if (sequentialRevealInProgress && isHandInProgress) await new Promise(resolve => setTimeout(resolve, delayBetweenStreets));
        }
        if (sequentialRevealInProgress && isHandInProgress && communityCards.length < 4) { 
            if (deck.length > 0) dealFromDeck(1); 
            await dealCommunity(1); 
            if (sequentialRevealInProgress && isHandInProgress) await new Promise(resolve => setTimeout(resolve, delayBetweenStreets));
        }
        if (sequentialRevealInProgress && isHandInProgress && communityCards.length < 5) { 
            if (deck.length > 0) dealFromDeck(1); 
            await dealCommunity(1); 
             if (sequentialRevealInProgress && isHandInProgress) await new Promise(resolve => setTimeout(resolve, delayBetweenStreets / 2));
        }
        
        sequentialRevealInProgress = false; 
        currentBettingRound = 'showdown'; 
        await handleShowdown(); 
        return; 
    }

    switch (currentBettingRound) {
        case 'preflop':
            currentBettingRound = 'flop';
            if (deck.length > 0) dealFromDeck(1); 
            await dealCommunity(3); 
            messageAreaDiv.textContent = "플랍 카드 (3장)가 공개되었습니다.";
            break;
        case 'flop':
            currentBettingRound = 'turn';
            if (deck.length > 0) dealFromDeck(1); 
            await dealCommunity(1); 
            messageAreaDiv.textContent = "턴 카드 (4번째)가 공개되었습니다.";
            break;
        case 'turn':
            currentBettingRound = 'river';
            if (deck.length > 0) dealFromDeck(1); 
            await dealCommunity(1); 
            messageAreaDiv.textContent = "리버 카드 (5번째)가 공개되었습니다.";
            break;
        case 'river':
            currentBettingRound = 'showdown'; 
            break; 
        default: 
            if (currentBettingRound === 'showdown' || currentBettingRound === 'hand_over') {  }
            else return; 
    }


    if (currentBettingRound === 'showdown') {
        await handleShowdown();
    } else if (isHandInProgress) { 
        if (dealerPosition === 'ai') { 
            currentPlayerTurn = humanPlayer.isFolded || humanPlayer.isAllIn ? 'ai' : 'human';
        } else { 
            currentPlayerTurn = aiPlayer.isFolded || aiPlayer.isAllIn ? 'human' : 'ai';
        }
        
        if (currentPlayerTurn === 'human' && (humanPlayer.isFolded || humanPlayer.isAllIn)) {
            currentPlayerTurn = 'ai';
        }
        if (currentPlayerTurn === 'ai' && (aiPlayer.isFolded || aiPlayer.isAllIn)) {
            currentPlayerTurn = 'human';
        }
        
        if ((humanPlayer.isFolded || humanPlayer.isAllIn) && (aiPlayer.isFolded || aiPlayer.isAllIn)) {
             await handleShowdown(); 
             return;
        }

        const roundNameKor = currentBettingRound === 'flop' ? '플랍' : currentBettingRound === 'turn' ? '턴' : '리버';
        if (currentPlayerTurn === 'ai') {
             if (aiPlayer.isFolded || aiPlayer.isAllIn) { 
                await checkBettingRoundEnd(); 
             } else {
                messageAreaDiv.textContent += ` AI의 턴입니다. (${roundNameKor})`;
                setTimeout(triggerAIAction, 1000);
             }
        } else { 
             if (humanPlayer.isFolded || humanPlayer.isAllIn) { 
                await checkBettingRoundEnd(); 
             } else {
                messageAreaDiv.textContent += ` 당신의 턴입니다. (${roundNameKor})`;
             }
        }
        await updateGameUI();
    }
}

async function dealCommunity(count: number) {
    let cardsDealtThisCall = 0;
    for (let i = 0; i < count; i++) {
        const dealt = dealFromDeck(1);
        if (dealt.length > 0 && communityCards.length < 5) { 
            communityCards.push(dealt[0]);
            cardsDealtThisCall++;
        } else {
             console.warn(`덱에 카드가 부족하거나 커뮤니티 카드가 5장이라 카드를 더 딜할 수 없습니다.`);
            break; 
        }
    }
    if (communityCards.length > 5) communityCards = communityCards.slice(0,5);

    if (cardsDealtThisCall > 0) { 
        await renderCommunityCards(); 
    }
}


async function handleShowdown() {
    if ((!humanPlayer || !aiPlayer) && currentGameMode === 'solo_ai') {
         console.warn("Showdown called without players.");
         if (currentBettingRound === 'hand_over') return; 
         await endHand(); return;
    }
    sequentialRevealInProgress = false; 
    
    playerBettingActionsDiv.style.display = 'none';


    currentBettingRound = 'showdown'; 
    messageAreaDiv.textContent = "쇼다운!";
    isHandInProgress = false; 

    await renderAIHoleCards(true); 

    const humanEval = humanPlayer && !humanPlayer.isFolded ? evaluateTexasHoldemHand(humanPlayer.holeCards, communityCards) : { name: "Folded", rankValue: -1, detailedName: "폴드" };
    const aiEval = aiPlayer && !aiPlayer.isFolded ? evaluateTexasHoldemHand(aiPlayer.holeCards, communityCards) : { name: "Folded", rankValue: -1, detailedName: "폴드" };

    let winnerToShowdown: PlayerProfile | 'split' | null = null; 
    let resultMessage = "";

    if (humanPlayer && humanPlayer.isFolded) {
        winnerToShowdown = aiPlayer;
        resultMessage = `당신 폴드. AI 승리 (${aiPlayer ? (translateHandName(aiEval.name) + (aiEval.detailedName && aiEval.name !== aiEval.detailedName ? ' - ' + aiEval.detailedName : '')) : 'N/A'}).`;
    } else if (aiPlayer && aiPlayer.isFolded) {
        winnerToShowdown = humanPlayer;
        resultMessage = `AI 폴드. 당신 승리 (${humanPlayer ? (translateHandName(humanEval.name) + (humanEval.detailedName && humanEval.name !== humanEval.detailedName ? ' - ' + humanEval.detailedName : '')) : 'N/A'}).`;
    } else if (humanPlayer && aiPlayer) { 
        const comparison = compareHands(humanEval, aiEval);
        if (comparison === humanEval && humanEval.rankValue > aiEval.rankValue) {
            winnerToShowdown = humanPlayer;
        } else if (comparison === aiEval && aiEval.rankValue > aiEval.rankValue) {
            winnerToShowdown = aiPlayer;
        } else { 
             const hand1Cards = humanEval.bestHandCards?.map(c => c.value).sort((a,b)=>b-a) || [];
             const hand2Cards = aiEval.bestHandCards?.map(c => c.value).sort((a,b)=>b-a) || [];
             let trueSplit = humanEval.rankValue === aiEval.rankValue; 
             if (trueSplit) { 
                for (let i = 0; i < Math.min(hand1Cards.length, hand2Cards.length); i++) {
                    if (hand1Cards[i] > hand2Cards[i]) { winnerToShowdown = humanPlayer; trueSplit = false; break; }
                    if (hand2Cards[i] > hand1Cards[i]) { winnerToShowdown = aiPlayer; trueSplit = false; break; }
                }
             }
             if (trueSplit) winnerToShowdown = 'split';
             else if (!winnerToShowdown) winnerToShowdown = comparison === humanEval ? humanPlayer : aiPlayer; 
        }

        resultMessage = `당신: ${translateHandName(humanEval.name)}${humanEval.detailedName && humanEval.name !== humanEval.detailedName ? ` (${humanEval.detailedName})` : ''}. AI: ${translateHandName(aiEval.name)}${aiEval.detailedName && aiEval.name !== aiEval.detailedName ? ` (${aiEval.detailedName})` : ''}. `;
        if (winnerToShowdown === humanPlayer) resultMessage += "당신 승리!";
        else if (winnerToShowdown === aiPlayer) resultMessage += "AI 승리!";
        else resultMessage += "무승부 (팟 분배)!";
    } else {
        resultMessage = "쇼다운 오류: 플레이어 정보 누락.";
    }
    
    messageAreaDiv.textContent = resultMessage;
    awardPotToWinner(winnerToShowdown);
    await endHand(); 
}

function awardPotToWinner(winner: PlayerProfile | 'split' | null) {
    let finalContestedPot = currentPot;
    let refundMessagePart = "";

    if (humanPlayer && aiPlayer && (humanPlayer.isAllIn || aiPlayer.isAllIn) && humanPlayer.currentBetInRound !== aiPlayer.currentBetInRound) {
        let refundOccurred = false;
        if (humanPlayer.currentBetInRound > aiPlayer.currentBetInRound && aiPlayer.isAllIn) {
            const overBet = humanPlayer.currentBetInRound - aiPlayer.currentBetInRound;
            if (overBet > 0) {
                const actualRefund = Math.min(overBet, finalContestedPot); 
                humanPlayer.chips += actualRefund;
                finalContestedPot -= actualRefund;
                refundOccurred = true;
                if (actualRefund > 0) refundMessagePart = ` (당신의 초과 베팅 ${actualRefund} 반환됨.)`;
            }
        } else if (aiPlayer.currentBetInRound > humanPlayer.currentBetInRound && humanPlayer.isAllIn) {
            const overBet = aiPlayer.currentBetInRound - humanPlayer.currentBetInRound;
            if (overBet > 0) {
                const actualRefund = Math.min(overBet, finalContestedPot);
                aiPlayer.chips += actualRefund;
                finalContestedPot -= actualRefund;
                refundOccurred = true;
                 if (actualRefund > 0) refundMessagePart = ` (AI의 초과 베팅 ${actualRefund} 반환됨.)`;
            }
        }
        if (refundOccurred && finalContestedPot < 0) finalContestedPot = 0; 
        if (refundOccurred) console.log(`Pot adjusted. Original: ${currentPot}, Contested: ${finalContestedPot}, Refund: ${refundMessagePart}`);
    }

    if (winner === 'split' && humanPlayer && aiPlayer) {
        const splitAmount = Math.floor(finalContestedPot / 2);
        const remainder = finalContestedPot % 2; 
        humanPlayer.chips += splitAmount;
        aiPlayer.chips += splitAmount;
        if (remainder > 0) { 
            if (dealerPosition === 'human' && aiPlayer) aiPlayer.chips += remainder; 
            else if (dealerPosition === 'ai' && humanPlayer) humanPlayer.chips += remainder; 
            else if (humanPlayer) humanPlayer.chips += remainder; 
        }
        messageAreaDiv.textContent += `${refundMessagePart} 각각 ${splitAmount} 칩 획득.`;

    } else if (winner && winner !== 'split' && winner.name) { 
        (winner as PlayerProfile).chips += finalContestedPot;
        messageAreaDiv.textContent += `${refundMessagePart} ${(winner as PlayerProfile).name === humanPlayer?.name ? '당신' : 'AI'}이(가) 팟 ${finalContestedPot}을(를) 획득했습니다.`;
    }
    currentPot = 0; 

    if(humanPlayer) humanPlayer.currentBetInRound = 0; 
    if(aiPlayer) aiPlayer.currentBetInRound = 0;


    if (currentGameMode === 'solo_ai' && selectedAIDifficulty === 'marathon' && aiPlayer && aiPlayer.chips === 0 && humanPlayer && humanPlayer.chips > 0) {
        if (marathonAILevel >= 10) { 
             messageAreaDiv.textContent += ` 축하합니다! 마라톤 모드 (레벨 10) 클리어!`;
             if (humanPlayer) { 
                savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips);
            }
        } else {
            marathonAILevel++;
            messageAreaDiv.textContent += ` AI 파산! 마라톤 레벨 ${marathonAILevel}(으)로 진입합니다. AI 칩이 초기화됩니다.`;
            aiPlayer.chips = initialStartingChipsSession; 
        }
    } else if (currentGameMode === 'solo_ai' && selectedAIDifficulty === 'impossible' && humanPlayer && aiPlayer && aiPlayer.chips <= 0) {
        messageAreaDiv.textContent += ` AI가 모든 칩을 잃었습니다! 당신의 압도적인 승리!`;
        if (humanPlayer) { 
            savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips);
        }
    }

    updatePlayerUIDisplays();
}

async function endHand() {
    isHandInProgress = false;
    currentBettingRound = 'hand_over';
    currentPlayerTurn = null; 
    sequentialRevealInProgress = false;


    if(humanPlayer) humanPlayer.lastAction = 'none';
    if(aiPlayer) aiPlayer.lastAction = 'none';

    await updateGameUI(); 
    if (humanPlayer && aiPlayer && (humanPlayer.chips === 0 || (aiPlayer.chips === 0 && selectedAIDifficulty !== 'marathon'))) {
        if (humanPlayer.chips > 0 && aiPlayer.chips === 0 && selectedAIDifficulty !== 'marathon') { 
            savePlayerGlobalChips(playerGlobalChips + humanPlayer.chips); 
            humanPlayer.chips = 0; 
        } else if (humanPlayer.chips === 0) { 
             savePlayerGlobalChips(playerGlobalChips); 
        }
        if (!(selectedAIDifficulty === 'marathon' && aiPlayer.chips === 0 && marathonAILevel > 10)) {
            setupGameButton.disabled = false;
            setupGameButton.style.display = 'inline-block';
            exitGameButton.style.display = 'none';
            startNextHandButton.style.display = 'none';
        }
    } else if (selectedAIDifficulty === 'marathon' && aiPlayer && aiPlayer.chips > 0 && humanPlayer && humanPlayer.chips === 0) {
        messageAreaDiv.textContent = "당신의 칩이 모두 소진되었습니다. 마라톤 실패!";
        savePlayerGlobalChips(playerGlobalChips); 
        setupGameButton.disabled = false;
        setupGameButton.style.display = 'inline-block';
        exitGameButton.style.display = 'none';
        startNextHandButton.style.display = 'none';
    }
}


async function handleDealNewHandPractice(): Promise<void> { 
    if (currentGameMode !== 'practice') return;
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


async function handleDealFlop(): Promise<void> { 
    if (currentGameMode !== 'practice' || communityCards.length !== 0) return; 
    if (deck.length > 0) dealFromDeck(1); 
    await dealCommunity(3); 
    messageAreaDiv.textContent = "플랍 카드 (3장)가 공개되었습니다.";
    await updateGameUI();
}

async function handleDealTurn(): Promise<void> { 
    if (currentGameMode !== 'practice' || communityCards.length !== 3) return; 
    if (deck.length > 0) dealFromDeck(1); 
    await dealCommunity(1); 
    messageAreaDiv.textContent = "턴 카드 (4번째)가 공개되었습니다.";
    await updateGameUI();
}

async function handleDealRiver(): Promise<void> { 
    if (currentGameMode !== 'practice' || communityCards.length !== 4) return;
    if (deck.length > 0) dealFromDeck(1); 
    await dealCommunity(1); 
    messageAreaDiv.textContent = "리버 카드 (5번째)가 공개되었습니다.";
    await updateGameUI();
}

async function handleEvaluate(): Promise<void> { 
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

function populateRankingsModal(): void {
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

function showRankingsModal(): void {
    populateRankingsModal();
    rankingsModal.style.display = 'block';
    closeRankingsButton.focus(); 
}

function hideRankingsModal(): void {
    rankingsModal.style.display = 'none';
    showRankingsButton.focus(); 
}

function showGameSetupModal(): void {
    resetGameUI(true); 
    gameSetupModal.style.display = 'block';
    gameModePracticeRadio.checked = true; 
    soloAIOptionsDiv.style.display = 'none';
    startingChipsSelect.value = "1000"; 
    aiDifficultySelect.value = "marathon"; 
    gameModePracticeRadio.focus();
    updateGlobalChipsDisplay();
}

function hideGameSetupModal(): void {
    gameSetupModal.style.display = 'none';
    setupGameButton.focus();
}

function handleGameModeChange(): void {
    if (gameModeSoloAIRadio.checked) {
        soloAIOptionsDiv.style.display = 'block';
    } else {
        soloAIOptionsDiv.style.display = 'none';
    }
}

async function handleStartConfiguredGame(): Promise<void> {
    const mode = gameModeSoloAIRadio.checked ? 'solo_ai' : 'practice';
    let sessionStartingChips = 0;
    
    if (mode === 'solo_ai') {
        sessionStartingChips = parseInt(startingChipsSelect.value, 10);
        if (isNaN(sessionStartingChips) || sessionStartingChips <=0) { 
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
        selectedAIDifficulty = aiDifficultySelect.value as 'marathon' | 'impossible';
        if (selectedAIDifficulty === 'marathon') {
            marathonAILevel = 1; 
        }
        dealerPosition = 'ai'; 
        
        dynamicBigBlind = Math.max(10, Math.floor(sessionStartingChips / 100 / 5) * 5); 
        if (dynamicBigBlind === 0 && sessionStartingChips > 0) dynamicBigBlind = 5; 
        dynamicSmallBlind = Math.max(5, Math.floor(dynamicBigBlind / 2));
        if (dynamicSmallBlind === 0 && dynamicBigBlind > 0) dynamicSmallBlind = Math.max(1, Math.floor(dynamicBigBlind/2));


    } else { 
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
    } else {
        aiPlayer = null; 
    }
    
    gameBoardDiv.style.display = 'flex'; 
    hideGameSetupModal();
    
    if (mode === 'solo_ai') {
        await startNewHand();
    } else { 
        await handleDealNewHandPractice(); 
    }
     setupGameButton.disabled = true;
     setupGameButton.style.display = 'none';
     exitGameButton.style.display = (mode === 'solo_ai') ? 'inline-block' : 'none';
}


function loadPlayerGlobalChips(): void {
    const storedChips = localStorage.getItem(GLOBAL_CHIPS_STORAGE_KEY);
    if (storedChips) {
        playerGlobalChips = parseInt(storedChips, 10);
    } else {
        playerGlobalChips = 100000; 
        savePlayerGlobalChips(playerGlobalChips);
    }
    updateGlobalChipsDisplay();
}

function savePlayerGlobalChips(chips: number): void {
    playerGlobalChips = Math.min(chips, MAX_GLOBAL_CHIPS); 
    playerGlobalChips = Math.max(0, playerGlobalChips); 
    localStorage.setItem(GLOBAL_CHIPS_STORAGE_KEY, String(playerGlobalChips));
    updateGlobalChipsDisplay();
}

function updateGlobalChipsDisplay(): void {
    if (globalChipsDisplay) {
        globalChipsDisplay.textContent = playerGlobalChips.toLocaleString();
    }
}

function showExitGameConfirmationModal(): void {
    exitGameConfirmationModal.style.display = 'block';
    confirmExitGameButton.focus();
}
function hideExitGameConfirmationModal(): void {
    exitGameConfirmationModal.style.display = 'none';
    exitGameButton.focus();
}
async function handleConfirmExitGame(): Promise<void> {
    if (humanPlayer && currentGameMode === 'solo_ai') {
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
