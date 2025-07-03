const { batchProcess } = require('../utils/dataProcessor');

class GameOfLifeService {
    constructor(width = 50, height = 50) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
        this.generation = 0;
        this.history = [];
        this.patterns = new Map();
        this.loadKnownPatterns();
    }

    createEmptyGrid() {
        return Array(this.height).fill(null).map(() => Array(this.width).fill(false));
    }

    setCell(x, y, alive) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = alive;
        }
    }

    getCell(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[y][x];
        }
        return false;
    }

    countNeighbors(x, y) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (this.getCell(x + dx, y + dy)) {
                    count++;
                }
            }
        }
        return count;
    }

    nextGeneration() {
        const newGrid = this.createEmptyGrid();
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const neighbors = this.countNeighbors(x, y);
                const currentCell = this.getCell(x, y);
                
                // Conway's Game of Life rules
                if (currentCell) {
                    // Live cell with 2-3 neighbors survives
                    newGrid[y][x] = neighbors === 2 || neighbors === 3;
                } else {
                    // Dead cell with exactly 3 neighbors becomes alive
                    newGrid[y][x] = neighbors === 3;
                }
            }
        }
        
        // Store current state in history for pattern analysis
        this.history.push(this.serializeGrid());
        
        this.grid = newGrid;
        this.generation++;
        
        // Analyze patterns every 10 generations
        if (this.generation % 10 === 0) {
            this.analyzePatterns();
        }
        
        return this.getGameState();
    }

    serializeGrid() {
        return this.grid.map(row => row.map(cell => cell ? 1 : 0));
    }

    getGameState() {
        return {
            grid: this.serializeGrid(),
            generation: this.generation,
            aliveCells: this.countAliveCells(),
            detectedPatterns: Array.from(this.patterns.keys()),
            stability: this.calculateStability()
        };
    }

    countAliveCells() {
        return this.grid.reduce((total, row) => 
            total + row.reduce((rowTotal, cell) => rowTotal + (cell ? 1 : 0), 0), 0
        );
    }

    calculateStability() {
        if (this.history.length < 5) return 0;
        
        const recent = this.history.slice(-5);
        const variations = recent.reduce((acc, grid, index) => {
            if (index === 0) return acc;
            const prev = recent[index - 1];
            let changes = 0;
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (grid[y][x] !== prev[y][x]) changes++;
                }
            }
            return acc + changes;
        }, 0);
        
        return Math.max(0, 100 - (variations / (this.width * this.height) * 100));
    }

    // AI Pattern Recognition
    analyzePatterns() {
        const currentPattern = this.extractLocalPatterns();
        
        // Check for oscillators
        this.detectOscillators();
        
        // Check for still lifes
        this.detectStillLifes();
        
        // Check for spaceships
        this.detectSpaceships();
    }

    extractLocalPatterns() {
        const patterns = [];
        const patternSize = 5;
        
        for (let y = 0; y <= this.height - patternSize; y++) {
            for (let x = 0; x <= this.width - patternSize; x++) {
                const pattern = [];
                for (let py = 0; py < patternSize; py++) {
                    const row = [];
                    for (let px = 0; px < patternSize; px++) {
                        row.push(this.getCell(x + px, y + py) ? 1 : 0);
                    }
                    pattern.push(row);
                }
                patterns.push({ x, y, pattern });
            }
        }
        
        return patterns;
    }

    detectOscillators() {
        if (this.history.length < 6) return;
        
        const current = this.serializeGrid();
        for (let period = 2; period <= 4; period++) {
            if (this.history.length > period) {
                const previous = this.history[this.history.length - period];
                if (this.gridsEqual(current, previous)) {
                    this.patterns.set(`oscillator-period-${period}`, {
                        type: 'oscillator',
                        period,
                        detected: this.generation
                    });
                }
            }
        }
    }

    detectStillLifes() {
        if (this.history.length < 2) return;
        
        const current = this.serializeGrid();
        const previous = this.history[this.history.length - 1];
        
        if (this.gridsEqual(current, previous)) {
            this.patterns.set('still-life', {
                type: 'still-life',
                detected: this.generation
            });
        }
    }

    detectSpaceships() {
        if (this.history.length < 8) return;
        
        // Look for patterns that move consistently
        const currentAliveCells = this.getAliveCellPositions();
        
        if (this.history.length > 4) {
            const oldAliveCells = this.getAliveCellPositionsFromGrid(
                this.history[this.history.length - 4]
            );
            
            const displacement = this.calculateDisplacement(oldAliveCells, currentAliveCells);
            if (displacement.consistent && displacement.distance > 0) {
                this.patterns.set('spaceship', {
                    type: 'spaceship',
                    velocity: displacement,
                    detected: this.generation
                });
            }
        }
    }

    getAliveCellPositions() {
        const positions = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.getCell(x, y)) {
                    positions.push({ x, y });
                }
            }
        }
        return positions;
    }

    getAliveCellPositionsFromGrid(grid) {
        const positions = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (grid[y][x]) {
                    positions.push({ x, y });
                }
            }
        }
        return positions;
    }

    calculateDisplacement(oldPositions, newPositions) {
        if (oldPositions.length !== newPositions.length) {
            return { consistent: false };
        }
        
        // Simple displacement calculation - could be improved
        const avgOld = {
            x: oldPositions.reduce((sum, pos) => sum + pos.x, 0) / oldPositions.length,
            y: oldPositions.reduce((sum, pos) => sum + pos.y, 0) / oldPositions.length
        };
        
        const avgNew = {
            x: newPositions.reduce((sum, pos) => sum + pos.x, 0) / newPositions.length,
            y: newPositions.reduce((sum, pos) => sum + pos.y, 0) / newPositions.length
        };
        
        const dx = avgNew.x - avgOld.x;
        const dy = avgNew.y - avgOld.y;
        
        return {
            consistent: true,
            distance: Math.sqrt(dx * dx + dy * dy),
            direction: { dx, dy }
        };
    }

    gridsEqual(grid1, grid2) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (grid1[y][x] !== grid2[y][x]) {
                    return false;
                }
            }
        }
        return true;
    }

    // AI Pattern Generation
    generateRandomPattern(density = 0.3) {
        this.clear();
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.setCell(x, y, Math.random() < density);
            }
        }
        this.generation = 0;
        this.history = [];
    }

    generateKnownPattern(patternName, centerX, centerY) {
        const pattern = this.getKnownPattern(patternName);
        if (!pattern) return false;
        
        this.placePattern(pattern, centerX, centerY);
        return true;
    }

    placePattern(pattern, centerX, centerY) {
        const offsetX = Math.floor(pattern[0].length / 2);
        const offsetY = Math.floor(pattern.length / 2);
        
        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                const cellX = centerX - offsetX + x;
                const cellY = centerY - offsetY + y;
                this.setCell(cellX, cellY, pattern[y][x] === 1);
            }
        }
    }

    loadKnownPatterns() {
        // Famous Game of Life patterns
        this.knownPatterns = {
            'glider': [
                [0, 1, 0],
                [0, 0, 1],
                [1, 1, 1]
            ],
            'block': [
                [1, 1],
                [1, 1]
            ],
            'blinker': [
                [1, 1, 1]
            ],
            'toad': [
                [0, 1, 1, 1],
                [1, 1, 1, 0]
            ],
            'beacon': [
                [1, 1, 0, 0],
                [1, 1, 0, 0],
                [0, 0, 1, 1],
                [0, 0, 1, 1]
            ]
        };
    }

    getKnownPattern(name) {
        return this.knownPatterns[name] || null;
    }

    getKnownPatternNames() {
        return Object.keys(this.knownPatterns);
    }

    clear() {
        this.grid = this.createEmptyGrid();
        this.generation = 0;
        this.history = [];
        this.patterns.clear();
    }

    resize(width, height) {
        const oldGrid = this.grid;
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
        
        // Copy over existing cells that fit
        const copyWidth = Math.min(oldGrid[0].length, width);
        const copyHeight = Math.min(oldGrid.length, height);
        
        for (let y = 0; y < copyHeight; y++) {
            for (let x = 0; x < copyWidth; x++) {
                this.grid[y][x] = oldGrid[y][x];
            }
        }
    }
}

module.exports = GameOfLifeService;