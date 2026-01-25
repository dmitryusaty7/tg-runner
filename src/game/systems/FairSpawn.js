import { Math as PhaserMath } from 'phaser';

export class FairSpawn
{
    constructor ({
        segmentWidth,
        spawnWindow,
        meteorCooldownSegments,
        maxAttempts
    })
    {
        this.segmentWidth = segmentWidth;
        this.spawnWindow = spawnWindow;
        this.meteorCooldownSegments = meteorCooldownSegments;
        this.maxAttempts = maxAttempts;
        this.lastPatterns = [];
        this.segmentsSinceMeteor = meteorCooldownSegments;
    }

    nextPattern (elapsedSeconds, canPlaceMeteor)
    {
        const groundChance = PhaserMath.Clamp(0.35 + elapsedSeconds * 0.003, 0.35, 0.75);
        const meteorChanceBase = PhaserMath.Clamp(0.18 + elapsedSeconds * 0.0015, 0.18, 0.4);
        const meteorChance = this.segmentsSinceMeteor < this.meteorCooldownSegments ? 0 : meteorChanceBase;

        for (let attempt = 0; attempt < this.maxAttempts; attempt += 1)
        {
            const ground = this.pickGroundType(groundChance);
            const meteor = this.pickMeteorLane(meteorChance);
            const pattern = this.buildPattern(ground, meteor);

            if (pattern.meteor !== 'NONE' && !canPlaceMeteor())
            {
                continue;
            }

            if (this.isPatternAllowed(pattern))
            {
                this.registerPattern(pattern);
                return pattern;
            }
        }

        const fallback = this.buildPattern('NONE', 'NONE');
        this.registerPattern(fallback);
        return fallback;
    }

    registerPattern (pattern)
    {
        this.lastPatterns.push(pattern);
        if (this.lastPatterns.length > 2)
        {
            this.lastPatterns.shift();
        }

        if (pattern.meteor !== 'NONE')
        {
            this.segmentsSinceMeteor = 0;
        }
        else
        {
            this.segmentsSinceMeteor += 1;
        }
    }

    pickGroundType (chance)
    {
        if (Math.random() > chance)
        {
            return 'NONE';
        }

        const roll = Math.random();
        if (roll < 0.55)
        {
            return 'ROCK_SMALL';
        }
        if (roll < 0.85)
        {
            return 'ROCK_BIG';
        }
        return 'CRATER';
    }

    pickMeteorLane (chance)
    {
        if (Math.random() > chance)
        {
            return 'NONE';
        }

        const roll = Math.random();
        if (roll < 0.4)
        {
            return 'HIGH';
        }
        if (roll < 0.75)
        {
            return 'MID';
        }
        return 'LOW';
    }

    buildPattern (ground, meteor)
    {
        const requiresJump = ['ROCK_SMALL', 'ROCK_BIG', 'CRATER'].includes(ground) || meteor === 'LOW';
        return {
            ground,
            meteor,
            requiresJump
        };
    }

    isPatternAllowed (pattern)
    {
        if (pattern.ground === 'CRATER' && pattern.meteor === 'LOW')
        {
            return false;
        }

        if (pattern.ground === 'ROCK_BIG' && pattern.meteor === 'LOW')
        {
            return false;
        }

        const recentRequiresJump = this.lastPatterns.filter((item) => item.requiresJump).length;
        if (recentRequiresJump >= 2 && pattern.requiresJump)
        {
            return false;
        }

        if (recentRequiresJump >= 2 && pattern.meteor === 'LOW')
        {
            return false;
        }

        return true;
    }
}
