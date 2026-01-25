const BEST_SCORE_KEY = 'moonrunner.bestScore';

export const getBestScore = () => {
    const storedValue = localStorage.getItem(BEST_SCORE_KEY);
    const parsedValue = Number.parseInt(storedValue, 10);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

export const setBestScoreIfHigher = (score) => {
    const nextScore = Math.max(getBestScore(), Math.floor(score));
    localStorage.setItem(BEST_SCORE_KEY, String(nextScore));
    return nextScore;
};

export const resetBestScore = () => {
    localStorage.removeItem(BEST_SCORE_KEY);
};
