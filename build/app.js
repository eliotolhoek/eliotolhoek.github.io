class GameItem {
    constructor(image, position, speed, angle, angularSpeed, offscreenBehaviour = GameItem.OFFSCREEN_BEHAVIOUR_OVERFLOW) {
        this._image = image;
        this._position = position;
        this._speed = speed;
        this._angle = angle;
        this._angularSpeed = angularSpeed;
        this._offscreenBehaviour = offscreenBehaviour;
    }
    get collisionRadius() {
        return this._image.height / 2;
    }
    get position() {
        return this._position;
    }
    get speed() {
        return this._speed;
    }
    move(canvas) {
        this._position = new Vector(this._position.x + this._speed.x, this._position.y - this._speed.y);
        switch (this._offscreenBehaviour) {
            case GameItem.OFFSCREEN_BEHAVIOUR_OVERFLOW:
                this.adjustOverflow(canvas.width, canvas.height);
                break;
            case GameItem.OFFSCREEN_BEHAVIOUR_BOUNCE:
                break;
            case GameItem.OFFSCREEN_BEHAVIOUR_DIE:
                this.adjustDie(canvas.width, canvas.height);
                break;
        }
        this._angle += this._angularSpeed;
    }
    adjustOverflow(maxX, maxY) {
        if (this._position.x > maxX) {
            this._position = new Vector(-this._image.width, this._position.y);
        }
        else if (this._position.x < -this._image.width) {
            this._position = new Vector(maxX, this._position.y);
        }
        if (this._position.y > maxY + this._image.height / 2) {
            this._position = new Vector(this._position.x, -this._image.height / 2);
        }
        else if (this._position.y < -this._image.height / 2) {
            this._position = new Vector(this._position.x, maxY);
        }
    }
    adjustDie(maxX, maxY) {
        if (this._position.x + this._image.width > maxX || this._position.x < 0 ||
            this._position.y + this._image.height / 2 > maxY ||
            this._position.y - this._image.height / 2 < 0) {
            this.die();
        }
    }
    die() {
        this._state = GameItem.STATE_DEAD;
    }
    isDead() {
        return this._state == GameItem.STATE_DEAD;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this._position.x, this._position.y);
        ctx.rotate(this._angle);
        ctx.drawImage(this._image, -this._image.width / 2, -this._image.height / 2);
        ctx.restore();
    }
    drawDebug(ctx) {
        ctx.save();
        ctx.strokeStyle = '#ffffb3';
        ctx.beginPath();
        this.drawCenterInfo(ctx);
        this.drawCollisionBounds(ctx);
        ctx.stroke();
        ctx.restore();
    }
    drawCenterInfo(ctx) {
        ctx.moveTo(this._position.x - 50, this._position.y);
        ctx.lineTo(this._position.x + 50, this._position.y);
        ctx.moveTo(this._position.x, this._position.y - 50);
        ctx.lineTo(this._position.x, this._position.y + 50);
        const text = `(${this._position.x.toPrecision(3)},${this._position.y.toPrecision(3)})`;
        ctx.font = `10px courier`;
        ctx.textAlign = 'left';
        ctx.fillText(text, this._position.x + 10, this._position.y - 10);
    }
    drawCollisionBounds(ctx) {
        ctx.moveTo(this._position.x, this._position.y);
        ctx.arc(this._position.x, this._position.y, this._image.width / 2, 0, 2 * Math.PI, false);
    }
}
GameItem.OFFSCREEN_BEHAVIOUR_OVERFLOW = 0;
GameItem.OFFSCREEN_BEHAVIOUR_BOUNCE = 2;
GameItem.OFFSCREEN_BEHAVIOUR_DIE = 3;
GameItem.STATE_ALIVE = 0;
GameItem.STATE_DYING = 8;
GameItem.STATE_DEAD = 9;
class Block extends GameItem {
    constructor(image) {
        super(image, null, new Vector(0, -44), 0, 0);
    }
    moveLeft() {
        const leftSidePlayingField = this.playingFieldPosition.x - this.playingFieldSize.x / 2;
        const leftSideBlock = this.position.x - (this.blockWidth / 2) * 44;
        if (leftSideBlock - 44 >= leftSidePlayingField) {
            this._position = new Vector(this._position.x - 44, this._position.y);
        }
    }
    moveRight() {
        const rightSidePlayingField = this.playingFieldPosition.x + this.playingFieldSize.x / 2;
        const rightSideBlock = this.position.x + (this.blockWidth / 2) * 44;
        console.log(rightSidePlayingField, rightSideBlock);
        if (rightSideBlock + 44 <= rightSidePlayingField) {
            this._position = new Vector(this._position.x + 44, this._position.y);
        }
    }
    updatePlayingField(playingFieldPosition, playingFieldSize) {
        this.playingFieldPosition = playingFieldPosition;
        this.playingFieldSize = playingFieldSize;
    }
    draw(ctx) {
        if (this.position === null) {
            const leftSide = this.playingFieldPosition.x - this.playingFieldSize.x / 2;
            let initialXPosition = leftSide + 3 * 44;
            if (this.blockWidth % 2 !== 0) {
                initialXPosition += 22;
            }
            const bottom = this.playingFieldPosition.y + this.playingFieldSize.y / 2;
            let initialYPosition = bottom - 13 * 44;
            if (this.blockHeight % 2 !== 0) {
                initialYPosition += 22;
            }
            this._position = new Vector(initialXPosition, initialYPosition);
        }
        super.draw(ctx);
    }
}
class IBlock extends Block {
    get blockHeight() {
        return 4;
    }
    get blockWidth() {
        return 1;
    }
}
class LBlock extends Block {
    get blockHeight() {
        return 3;
    }
    get blockWidth() {
        return 2;
    }
}
class View {
    constructor() {
        this.center = new Vector();
        this.size = new Vector();
        this.isDebugKeysDown = false;
    }
    init(game) {
        this.game = game;
    }
    listen(input) {
        if (input.keyboard.isKeyDown(Input.KEY_CTRL)
            && input.keyboard.isKeyDown(Input.KEY_ALT)
            && input.keyboard.isKeyDown(Input.KEY_D)) {
            if (!this.isDebugKeysDown) {
                this.game.session.debug = !this.game.session.debug;
                this.isDebugKeysDown = true;
                console.log("Debug is set to " + this.game.session.debug);
            }
        }
        else {
            this.isDebugKeysDown = false;
        }
    }
    move(canvas) {
        this.size = new Vector(canvas.width, canvas.height);
        this.center = this.size.scale(0.5);
    }
    adjust(game) { }
    prepareDraw(ctx) {
        ctx.clearRect(0, 0, this.size.x, this.size.y);
    }
    draw(ctx) {
    }
    drawDebug(ctx) {
        ctx.save();
        ctx.translate(this.size.x - 123, this.size.y - 17);
        ctx.fillStyle = 'white';
        const text = `${this.game.timing.fps.toFixed(1)}fps`;
        ctx.font = `12px courier`;
        ctx.textAlign = 'left';
        ctx.fillText(text, 0, 0);
        let x = this.size.x - 120;
        let y = this.size.y - 15;
        ctx.fillRect(0, 3, 102, 10);
        let green = 255 - Math.round(255 * this.game.timing.load);
        let red = 255 - green;
        ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
        ctx.fillRect(1, 4, 100 * this.game.timing.load, 8);
        ctx.restore();
    }
    writeTextToCanvas(ctx, text, fontSize = 20, xCoordinate, yCoordinate, alignment = "center", color = "white") {
        ctx.font = `${fontSize}px Minecraft`;
        ctx.fillStyle = color;
        ctx.textAlign = alignment;
        ctx.fillText(text, xCoordinate, yCoordinate);
    }
    drawImage(ctx, image, xCoordinate, yCoordinate, angle = 0) {
        ctx.save();
        ctx.translate(xCoordinate, yCoordinate);
        ctx.rotate(angle);
        ctx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
        ctx.restore();
    }
}
class LevelView extends View {
    constructor() {
        super(...arguments);
        this.backgroundSize = new Vector(446, 700);
        this.playingFieldSize = new Vector(308, 618);
        this.availableBlocks = ["I", "L", "R", "S", "T"];
        this.delay = 250;
        this.blocksInPlay = [];
        this.lastMoveDown = performance.now();
        this.lastMove = performance.now();
    }
    init(game) {
        super.init(game);
        this.background = game.repo.getImage("background");
        this.createNewMovingBlock(game);
    }
    listen(input) {
        super.listen(input);
        const timeSinceLastMove = performance.now() - this.lastMove;
        if (timeSinceLastMove > 200) {
            if (input.keyboard.isKeyDown(Input.KEY_LEFT)) {
                this.movingBlock.moveLeft();
                this.lastMove = performance.now();
            }
            if (input.keyboard.isKeyDown(Input.KEY_RIGHT)) {
                this.movingBlock.moveRight();
                this.lastMove = performance.now();
            }
        }
    }
    draw(ctx) {
        super.draw(ctx);
        this.drawPlayingField(ctx);
        this.blocksInPlay.forEach(block => {
            block.draw(ctx);
        });
        this.movingBlock.updatePlayingField(this.playingFieldPosition, this.playingFieldSize);
        this.movingBlock.draw(ctx);
    }
    move(canvas) {
        super.move(canvas);
        if (this.movingBlock.position !== null && performance.now() - this.lastMoveDown > this.delay) {
            this.lastMoveDown = performance.now();
            this.movingBlock.move(canvas);
            const bottomField = this.playingFieldPosition.y + this.playingFieldSize.y / 2;
            const bottomBlock = this.movingBlock.position.y + (this.movingBlock.blockHeight / 2) * 44;
            if (bottomField === bottomBlock) {
                this.blocksInPlay.push(this.movingBlock);
                this.createNewMovingBlock(this.game);
            }
        }
    }
    drawPlayingField(ctx) {
        this.background.width = this.backgroundSize.x;
        this.background.height = this.backgroundSize.y;
        this.backgroundPosition = new Vector(this.center.x, this.background.height / 2 + 30);
        const backgroundTopLeft = new Vector(this.backgroundPosition.x - this.backgroundSize.x / 2, this.backgroundPosition.y - this.backgroundSize.y / 2);
        this.playingFieldPosition = new Vector(12 + backgroundTopLeft.x + this.playingFieldSize.x / 2, 68 + backgroundTopLeft.y + this.playingFieldSize.y / 2);
        this.drawImage(ctx, this.background, this.backgroundPosition.x, this.backgroundPosition.y);
    }
    getRandomBlock() {
        return this.availableBlocks[Game.randomInteger(0, this.availableBlocks.length - 1)];
    }
    createNewMovingBlock(game) {
        const randomBlock = this.getRandomBlock();
        switch (randomBlock) {
            case "I":
                this.movingBlock = new IBlock(game.repo.getImage(randomBlock));
                break;
            case "L":
                this.movingBlock = new LBlock(game.repo.getImage(randomBlock));
                break;
            case "R":
                this.movingBlock = new RBlock(game.repo.getImage(randomBlock));
                break;
            case "S":
                this.movingBlock = new SBlock(game.repo.getImage(randomBlock));
                break;
            case "T":
                this.movingBlock = new TBlock(game.repo.getImage(randomBlock));
                break;
        }
    }
}
class Game {
    constructor(canvasId) {
        this.input = new Input();
        this.session = { debug: false };
        this.timing = new Timing();
        this.animate = () => {
            this.timing.onFrameStart();
            if (this.currentView != null) {
                this.currentView.listen(this.input);
                this.currentView.move(this.canvas);
                this.currentView.prepareDraw(this.ctx);
                this.currentView.draw(this.ctx);
                if (this.session.debug) {
                    this.currentView.drawDebug(this.ctx);
                }
                this.currentView.adjust(this);
            }
            this.timing.onFrameEnd();
            requestAnimationFrame(this.animate);
        };
        this.canvas = canvasId;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');
        this.repo = new ResourceRepository(this.initResources());
        this.initGame();
        this.views = this.initViews();
        this.startAnimation();
        this.setCurrentView(new LoadView(Object.keys(this.views)[0]));
    }
    switchViewTo(viewName) {
        const newView = this.views[viewName];
        if (!newView) {
            throw new Error(`A view with the name ${viewName} does not exist.`);
        }
        this.setCurrentView(newView);
    }
    setCurrentView(view) {
        this.currentView = view;
        console.log("Setting view to " + view);
        this.currentView.init(this);
        this.timing.onViewSwitched();
    }
    startAnimation() {
        console.log('start animation');
        requestAnimationFrame(this.animate);
    }
    static randomInteger(min, max) {
        return Math.round(Game.randomNumber(min, max));
    }
    static randomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }
}
class MyGame extends Game {
    initResources() {
        return new ResourceConfig([
            "buttonBlue.png",
            "background.png",
            "I.png",
            "L.png",
            "R.png",
            "S.png",
            "T.png",
        ], "./assets/images/tetris");
    }
    initGame() {
    }
    initViews() {
        return {
            'start': new StartView(),
            'level': new LevelView()
        };
    }
}
let game = null;
window.addEventListener('load', function () {
    game = new MyGame(document.getElementById('canvas'));
});
class RBlock extends Block {
    get blockHeight() {
        return 2;
    }
    get blockWidth() {
        return 2;
    }
}
class SBlock extends Block {
    get blockHeight() {
        return 2;
    }
    get blockWidth() {
        return 3;
    }
}
class StartView extends View {
    constructor() {
        super(...arguments);
        this.shouldGoToNextView = false;
    }
    init(game) {
        super.init(game);
        this.buttonImage = game.repo.getImage("buttonBlue");
    }
    listen(input) {
        super.listen(input);
        if (input.keyboard.isKeyDown(Input.KEY_S)) {
            this.shouldGoToNextView = true;
        }
    }
    adjust(game) {
        if (this.shouldGoToNextView) {
            game.switchViewTo('level');
        }
    }
    draw(ctx) {
        this.writeTextToCanvas(ctx, "Just not Tetris", 140, this.center.x, 150);
        this.writeTextToCanvas(ctx, "HIT 'S' TO START", 40, this.center.x, this.center.y - 135);
        this.drawImage(ctx, this.buttonImage, this.center.x, this.center.y + 220);
        this.writeTextToCanvas(ctx, "Play", 20, this.center.x, this.center.y + 229, 'center', 'black');
    }
}
class TBlock extends Block {
    get blockHeight() {
        return 2;
    }
    get blockWidth() {
        return 3;
    }
}
class LoadView extends View {
    constructor(nextView) {
        super();
        this.nextView = nextView;
    }
    listen(input) {
        super.listen(input);
    }
    adjust(game) {
        if (!game.repo.isLoading() &&
            game.timing.viewTime > LoadView.MINIMUM_FRAME_TIME) {
            game.switchViewTo(this.nextView);
        }
    }
    draw(ctx) {
        this.writeTextToCanvas(ctx, "Loading...", 80, this.center.x, this.center.y);
    }
}
LoadView.MINIMUM_FRAME_TIME = 1000;
class Input {
    constructor() {
        this.keyboard = new KeyListener();
        this.mouse = new MouseListener();
        this.window = new WindowListener();
    }
}
Input.MOUSE_NOTHING = 0;
Input.MOUSE_PRIMARY = 1;
Input.MOUSE_SECONDARY = 2;
Input.MOUSE_AUXILIARY = 4;
Input.MOUSE_FOURTH = 8;
Input.MOUSE_FIFTH = 16;
Input.KEY_ENTER = 13;
Input.KEY_SHIFT = 16;
Input.KEY_CTRL = 17;
Input.KEY_ALT = 18;
Input.KEY_ESC = 27;
Input.KEY_SPACE = 32;
Input.KEY_LEFT = 37;
Input.KEY_UP = 38;
Input.KEY_RIGHT = 39;
Input.KEY_DOWN = 40;
Input.KEY_DEL = 46;
Input.KEY_1 = 49;
Input.KEY_2 = 50;
Input.KEY_3 = 51;
Input.KEY_4 = 52;
Input.KEY_5 = 53;
Input.KEY_6 = 54;
Input.KEY_7 = 55;
Input.KEY_8 = 56;
Input.KEY_9 = 57;
Input.KEY_0 = 58;
Input.KEY_A = 65;
Input.KEY_B = 66;
Input.KEY_C = 67;
Input.KEY_D = 68;
Input.KEY_E = 69;
Input.KEY_F = 70;
Input.KEY_G = 71;
Input.KEY_H = 72;
Input.KEY_I = 73;
Input.KEY_J = 74;
Input.KEY_K = 75;
Input.KEY_L = 76;
Input.KEY_M = 77;
Input.KEY_N = 78;
Input.KEY_O = 79;
Input.KEY_P = 80;
Input.KEY_Q = 81;
Input.KEY_R = 82;
Input.KEY_S = 83;
Input.KEY_T = 84;
Input.KEY_U = 85;
Input.KEY_V = 86;
Input.KEY_W = 87;
Input.KEY_X = 88;
Input.KEY_Y = 89;
Input.KEY_Z = 90;
class KeyListener {
    constructor() {
        this.keyDown = (ev) => {
            this.keyCodeStates[ev.keyCode] = true;
        };
        this.keyUp = (ev) => {
            this.keyCodeStates[ev.keyCode] = false;
        };
        this.keyCodeStates = new Array();
        window.addEventListener("keydown", this.keyDown);
        window.addEventListener("keyup", this.keyUp);
    }
    isKeyDown(keyCode) {
        return this.keyCodeStates[keyCode] == true;
    }
}
class MouseListener {
    constructor() {
        this.mouseDown = (ev) => {
            this.buttonDown = ev.buttons;
        };
        this.mouseUp = (ev) => {
            this.buttonDown = 0;
        };
        this.mouseMove = (ev) => {
            this.position = new Vector(ev.clientX, ev.clientY);
        };
        this.mouseEnter = (ev) => {
            this.inWindow = true;
        };
        this.mouseLeave = (ev) => {
            this.inWindow = false;
        };
        this.position = new Vector();
        this.inWindow = true;
        window.addEventListener("mousedown", this.mouseDown);
        window.addEventListener("mouseup", this.mouseUp);
        window.addEventListener("mousemove", this.mouseMove);
        document.addEventListener("mouseenter", this.mouseEnter);
        document.addEventListener("mouseleave", this.mouseLeave);
    }
}
class WindowListener {
    constructor() {
        this.listen(0);
    }
    listen(interval) {
        var w = 0;
        var h = 0;
        if (!window.innerWidth) {
            if (!(document.documentElement.clientWidth == 0)) {
                w = document.documentElement.clientWidth;
                h = document.documentElement.clientHeight;
            }
            else {
                w = document.body.clientWidth;
                h = document.body.clientHeight;
            }
        }
        else {
            w = window.innerWidth;
            h = window.innerHeight;
        }
        this.size = new Vector(w, h);
    }
}
class ResourceConfig {
    constructor(images, prefix = "") {
        this.images = images;
        this.prefix = prefix;
    }
}
class ResourceRepository {
    constructor(config) {
        this.images = {};
        this.loadingAssets = new Array();
        this.prefix = config.prefix;
        config.images.forEach((name) => {
            this.startLoadingImage(name);
        });
    }
    isLoading() {
        return this.loadingAssets.length > 0;
    }
    getImage(key) {
        return this.images[key];
    }
    startLoadingImage(name) {
        let imageElement = new Image();
        imageElement.addEventListener("load", (event) => {
            const key = this.generateKeyFromSrc(imageElement.src);
            this.images[key] = imageElement;
            this.loadingAssets.splice(this.loadingAssets.indexOf(key), 1);
        });
        const src = this.generateURL(name);
        this.loadingAssets.push(this.generateKeyFromSrc(src));
        imageElement.src = src;
    }
    generateKeyFromSrc(src) {
        const start = this.prefix.substring(1);
        const index = src.indexOf(start) + start.length + 1;
        const key = src.substr(index, src.length - index - 4).split("/").join(".");
        return key;
    }
    generateURL(name) {
        return this.prefix + "/" + name;
    }
}
class Timing {
    constructor() {
        this.gameFrames = 0;
        this.viewFrames = 0;
        this.gameStart = performance.now();
        this.gameTime = 0;
        this.viewTime = 0;
        this.frameTime = 0;
        this.frameIdleTime = 0;
        this.fps = 60;
        this.load = 0;
    }
    get frameComputeTime() {
        return this.frameTime - this.frameIdleTime;
    }
    onViewSwitched() {
        this.viewFrames = 0;
        this.viewStart = performance.now();
    }
    onFrameStart() {
        this.gameFrames++;
        this.viewFrames++;
        const now = performance.now();
        this.frameIdleTime = now - this.frameEnd;
        this.gameTime = now - this.gameStart;
        this.viewTime = now - this.viewStart;
        this.frameTime = now - this.frameStart;
        this.frameStart = now;
        this.fps = Math.round(1000 / this.frameTime);
        this.load = this.frameComputeTime / this.frameTime;
    }
    onFrameEnd() {
        this.frameEnd = performance.now();
    }
}
class Vector {
    constructor(x = 0, y = 0) {
        this._size = null;
        this._angle = null;
        this.x = x;
        this.y = y;
    }
    static fromSizeAndAngle(size, angle) {
        let x = size * Math.sin(angle);
        let y = size * Math.cos(angle);
        return new Vector(x, y);
    }
    get size() {
        if (!this._size) {
            this._size = Math.sqrt(Math.pow(this.x, 2) +
                Math.pow(this.y, 2));
        }
        return this._size;
    }
    get angle() {
        if (!this._angle) {
            this._angle = Math.atan(this.y / this.x);
        }
        return this._angle;
    }
    add(input) {
        return new Vector(this.x + input.x, this.y + input.y);
    }
    subtract(input) {
        return new Vector(this.x - input.x, this.y - input.y);
    }
    scale(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }
    normalize() {
        return Vector.fromSizeAndAngle(1, this.angle);
    }
    mirror_X() {
        return new Vector(this.x, this.y * -1);
    }
    mirror_Y() {
        return new Vector(this.x * -1, this.y);
    }
    distance(input) {
        return this.subtract(input).size;
    }
}
//# sourceMappingURL=app.js.map