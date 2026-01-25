const STORAGE_KEY = 'moonrunner.highScore';

export const getHighScore = () => {
    try
    {
        const value = localStorage.getItem(STORAGE_KEY);
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    catch (error)
    {
        return 0;
    }
};

export const setHighScoreIfHigher = (score) => {
    const nextScore = Math.max(getHighScore(), Math.floor(score));
    try
    {
        localStorage.setItem(STORAGE_KEY, String(nextScore));
    }
    catch (error)
    {
        return nextScore;
    }
    return nextScore;
};

export const resetHighScore = () => {
    try
    {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch (error)
    {
        // no-op
    }
};
