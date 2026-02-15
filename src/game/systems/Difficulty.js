import { Math as PhaserMath } from 'phaser';

export class Difficulty
{
    constructor ({
        baseSpeed,
        maxSpeed,
        speedRamp,
        spawnIntervalStart,
        spawnIntervalMin,
        spawnIntervalRamp
    })
    {
        this.baseSpeed = baseSpeed;
        this.maxSpeed = maxSpeed;
        this.speedRamp = speedRamp;
        this.spawnIntervalStart = spawnIntervalStart;
        this.spawnIntervalMin = spawnIntervalMin;
        this.spawnIntervalRamp = spawnIntervalRamp;
    }

    getSpeed (elapsedSeconds)
    {
        const rawSpeed = this.baseSpeed + elapsedSeconds * this.speedRamp;
        return PhaserMath.Clamp(rawSpeed, this.baseSpeed, this.maxSpeed);
    }

    getSpawnInterval (elapsedSeconds)
    {
        const rawInterval = this.spawnIntervalStart - elapsedSeconds * this.spawnIntervalRamp;
        return PhaserMath.Clamp(rawInterval, this.spawnIntervalMin, this.spawnIntervalStart);
    }
}
