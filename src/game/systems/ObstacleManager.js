import {
    CRATER_DEPTH,
    CRATER_W,
    DEPTHS,
    GROUND_Y,
    METEOR,
    DEBUG,
    ROCK_BIG_H,
    ROCK_BIG_W,
    ROCK_SMALL_H,
    ROCK_SMALL_W
} from '../../config/gameConfig';

export class ObstacleManager
{
    constructor (scene, { assetLoader, obstacleConfig })
    {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.obstacleConfig = obstacleConfig;

        this.groundGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
        this.airGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
        this.craters = [];

        this.pool = {
            rockSmall: [],
            rockBig: [],
            meteor: [],
            crater: []
        };
    }

    logSpawn (typeKey, x, y, width, height)
    {
        if (!DEBUG)
        {
            return;
        }

        console.log('[spawn]', typeKey, { x, y, w: width, h: height });
    }

    getGroups ()
    {
        return {
            ground: this.groundGroup,
            air: this.airGroup
        };
    }

    getConfigSize (configKey, fallbackWidth, fallbackHeight)
    {
        const fallbackSizeByType = {
            meteor: { width: 85, height: 40 },
            crater: { width: 100, height: 30 },
            rock_small: { width: 60, height: 50 },
            rock_big: { width: 75, height: 85 }
        };

        const config = this.obstacleConfig?.[configKey];
        const asset = this.assetLoader?.get(configKey);

        if (asset && !asset.isPlaceholder)
        {
            return { width: asset.width, height: asset.height };
        }

        return {
            width: config?.baseSize?.width ?? fallbackSizeByType[configKey]?.width ?? fallbackWidth,
            height: config?.baseSize?.height ?? fallbackSizeByType[configKey]?.height ?? fallbackHeight
        };
    }

    spawnRock (type, x)
    {
        const isLarge = type === 'ROCK_BIG';
        const configKey = isLarge ? 'rock_big' : 'rock_small';
        const poolKey = isLarge ? 'rockBig' : 'rockSmall';
        const fallbackWidth = isLarge ? ROCK_BIG_W : ROCK_SMALL_W;
        const fallbackHeight = isLarge ? ROCK_BIG_H : ROCK_SMALL_H;
        const { width, height } = this.getConfigSize(configKey, fallbackWidth, fallbackHeight);
        const y = GROUND_Y - height;

        const obstacleTextureKey = this.assetLoader.ensurePhaserTexture(this.scene, `obstacle:${configKey}`, configKey, width, height, '#e74c3c');

        const obstacle = this.obtainFromPool(poolKey, () => {
            const sprite = this.scene.physics.add.image(0, 0, obstacleTextureKey).setOrigin(0, 0);
            sprite.body.setAllowGravity(false);
            sprite.body.setImmovable(true);
            return sprite;
        });

        obstacle.setTexture(obstacleTextureKey);
        obstacle.setOrigin(0, 0);
        obstacle.setDisplaySize(width, height);
        obstacle.setPosition(x, y);
        obstacle.setActive(true).setVisible(true);
        obstacle.setDepth(DEPTHS.OBSTACLE);
        obstacle.body.enable = true;
        obstacle.body.setSize(width, height, false);
        obstacle.body.setOffset(0, 0);
        obstacle.setData('type', isLarge ? 'ROCK_BIG' : 'ROCK_SMALL');
        obstacle.setData('requiresJump', true);
        this.groundGroup.add(obstacle);

        this.logSpawn(type, x, y, width, height);
        return obstacle;
    }

    spawnMeteor (lane, x)
    {
        const { width, height } = this.getConfigSize('meteor', METEOR.W, METEOR.H);
        const y = (GROUND_Y - 140) - height;
        const obstacleTextureKey = this.assetLoader.ensurePhaserTexture(this.scene, 'obstacle:meteor', 'meteor', width, height, '#e74c3c');

        const obstacle = this.obtainFromPool('meteor', () => {
            const sprite = this.scene.physics.add.image(0, 0, obstacleTextureKey).setOrigin(0, 0);
            sprite.body.setAllowGravity(false);
            sprite.body.setImmovable(true);
            return sprite;
        });

        obstacle.setTexture(obstacleTextureKey);
        obstacle.setOrigin(0, 0);
        obstacle.setDisplaySize(width, height);
        obstacle.setPosition(x, y);
        obstacle.setActive(true).setVisible(true);
        obstacle.setDepth(DEPTHS.OBSTACLE);
        obstacle.body.enable = true;
        obstacle.body.setSize(width, height, false);
        obstacle.body.setOffset(0, 0);
        obstacle.setData('type', 'METEOR');
        obstacle.setData('lane', lane);
        this.airGroup.add(obstacle);

        this.logSpawn('METEOR', x, y, width, height);
        return obstacle;
    }

    spawnCrater (x)
    {
        const { width, height } = this.getConfigSize('crater', CRATER_W, CRATER_DEPTH);
        const y = GROUND_Y;
        const craterTextureKey = this.assetLoader.ensurePhaserTexture(this.scene, 'obstacle:crater', 'crater', width, height, '#e74c3c');

        const crater = this.obtainFromPool('crater', () => this.scene.add.image(0, 0, craterTextureKey).setOrigin(0.5, 0));
        crater.setTexture(craterTextureKey);
        crater.setOrigin(0.5, 0);
        crater.setDisplaySize(width, height);
        crater.setPosition(x, y);
        crater.setActive(true).setVisible(true);
        crater.setDepth(DEPTHS.CRATER);
        crater.setData('type', 'CRATER');
        crater.setData('requiresJump', true);

        this.craters.push({
            sprite: crater,
            xStart: x - crater.displayWidth / 2,
            xEnd: x + crater.displayWidth / 2,
            requiresJump: true
        });

        this.logSpawn('CRATER', x, y, width, height);
        return crater;
    }

    update (speed, deltaSeconds)
    {
        this.groundGroup.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-speed);
            if (obstacle.x < -obstacle.width)
            {
                this.releaseObstacle(obstacle);
            }
        });

        this.airGroup.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-speed * 0.9);
            if (obstacle.x < -obstacle.width)
            {
                this.releaseObstacle(obstacle);
            }
        });

        this.craters = this.craters.filter((craterData) => {
            craterData.sprite.x -= speed * deltaSeconds;
            craterData.xStart = craterData.sprite.x - craterData.sprite.displayWidth / 2;
            craterData.xEnd = craterData.sprite.x + craterData.sprite.displayWidth / 2;
            if (craterData.sprite.x < -craterData.sprite.displayWidth)
            {
                this.releaseCrater(craterData.sprite);
                return false;
            }
            return true;
        });
    }

    releaseObstacle (obstacle)
    {
        obstacle.body.stop();
        obstacle.body.enable = false;
        obstacle.setActive(false).setVisible(false);
        this.groundGroup.remove(obstacle, false);
        this.airGroup.remove(obstacle, false);

        const type = obstacle.getData('type');
        if (type === 'ROCK_SMALL')
        {
            this.pool.rockSmall.push(obstacle);
        }
        else if (type === 'ROCK_BIG')
        {
            this.pool.rockBig.push(obstacle);
        }
        else
        {
            this.pool.meteor.push(obstacle);
        }
    }

    releaseCrater (crater)
    {
        crater.setActive(false).setVisible(false);
        this.pool.crater.push(crater);
    }

    obtainFromPool (poolKey, createFn)
    {
        const pool = this.pool[poolKey];
        if (pool.length > 0)
        {
            return pool.pop();
        }
        return createFn();
    }
}
