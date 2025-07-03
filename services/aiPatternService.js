class AIPatternService {
    constructor() {
        this.patternLibrary = new Map();
        this.interestingConfigurations = [];
        this.evolutionPredictions = new Map();
        this.initializePatternDatabase();
    }

    initializePatternDatabase() {
        // Initialize with known interesting patterns and their characteristics
        this.patternLibrary.set('stable-patterns', {
            category: 'still-life',
            patterns: ['block', 'beehive', 'loaf', 'boat'],
            characteristics: { stability: 100, lifespan: Infinity }
        });
        
        this.patternLibrary.set('oscillators', {
            category: 'oscillator',
            patterns: ['blinker', 'toad', 'beacon', 'pulsar'],
            characteristics: { stability: 95, periodicity: true }
        });
        
        this.patternLibrary.set('spaceships', {
            category: 'spaceship',
            patterns: ['glider', 'lightweight-spaceship', 'middleweight-spaceship'],
            characteristics: { mobility: 100, directional: true }
        });
    }

    // AI-driven pattern analysis
    analyzePatternComplexity(grid) {
        const metrics = {
            density: this.calculateDensity(grid),
            clustering: this.calculateClustering(grid),
            symmetry: this.calculateSymmetry(grid),
            entropy: this.calculateEntropy(grid),
            connectivity: this.calculateConnectivity(grid)
        };
        
        return {
            ...metrics,
            interestScore: this.calculateInterestScore(metrics),
            recommendation: this.generateRecommendation(metrics)
        };
    }

    calculateDensity(grid) {
        const total = grid.length * grid[0].length;
        const alive = grid.reduce((sum, row) => 
            sum + row.reduce((rowSum, cell) => rowSum + (cell ? 1 : 0), 0), 0
        );
        return alive / total;
    }

    calculateClustering(grid) {
        let clusterScore = 0;
        const height = grid.length;
        const width = grid[0].length;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x]) {
                    let neighbors = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const ny = y + dy;
                            const nx = x + dx;
                            if (ny >= 0 && ny < height && nx >= 0 && nx < width && grid[ny][nx]) {
                                neighbors++;
                            }
                        }
                    }
                    clusterScore += neighbors / 8; // Normalized by max possible neighbors
                }
            }
        }
        
        const aliveCells = grid.reduce((sum, row) => 
            sum + row.reduce((rowSum, cell) => rowSum + (cell ? 1 : 0), 0), 0
        );
        
        return aliveCells > 0 ? clusterScore / aliveCells : 0;
    }

    calculateSymmetry(grid) {
        const height = grid.length;
        const width = grid[0].length;
        
        // Check horizontal symmetry
        let horizontalMatches = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < Math.floor(width / 2); x++) {
                if (grid[y][x] === grid[y][width - 1 - x]) {
                    horizontalMatches++;
                }
            }
        }
        
        // Check vertical symmetry
        let verticalMatches = 0;
        for (let y = 0; y < Math.floor(height / 2); y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x] === grid[height - 1 - y][x]) {
                    verticalMatches++;
                }
            }
        }
        
        const totalCells = height * width;
        const horizontalSymmetry = horizontalMatches / (height * Math.floor(width / 2));
        const verticalSymmetry = verticalMatches / (Math.floor(height / 2) * width);
        
        return Math.max(horizontalSymmetry, verticalSymmetry);
    }

    calculateEntropy(grid) {
        // Calculate information entropy based on local patterns
        const patternCounts = new Map();
        const height = grid.length;
        const width = grid[0].length;
        
        // Analyze 2x2 patterns
        for (let y = 0; y < height - 1; y++) {
            for (let x = 0; x < width - 1; x++) {
                const pattern = `${grid[y][x]}${grid[y][x+1]}${grid[y+1][x]}${grid[y+1][x+1]}`;
                patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
            }
        }
        
        const totalPatterns = (height - 1) * (width - 1);
        let entropy = 0;
        
        for (const count of patternCounts.values()) {
            const probability = count / totalPatterns;
            entropy -= probability * Math.log2(probability);
        }
        
        return entropy / Math.log2(16); // Normalized by max possible entropy for 2x2 patterns
    }

    calculateConnectivity(grid) {
        // Find connected components of alive cells
        const height = grid.length;
        const width = grid[0].length;
        const visited = Array(height).fill(null).map(() => Array(width).fill(false));
        let components = 0;
        let totalSize = 0;
        
        const dfs = (y, x) => {
            if (y < 0 || y >= height || x < 0 || x >= width || 
                visited[y][x] || !grid[y][x]) {
                return 0;
            }
            
            visited[y][x] = true;
            let size = 1;
            
            // Check 4-connected neighbors
            size += dfs(y - 1, x);
            size += dfs(y + 1, x);
            size += dfs(y, x - 1);
            size += dfs(y, x + 1);
            
            return size;
        };
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x] && !visited[y][x]) {
                    const componentSize = dfs(y, x);
                    components++;
                    totalSize += componentSize;
                }
            }
        }
        
        // Return average component size normalized
        return components > 0 ? (totalSize / components) / (height * width) : 0;
    }

    calculateInterestScore(metrics) {
        // Weighted scoring based on what makes patterns interesting
        const weights = {
            density: 0.2,      // Neither too sparse nor too dense
            clustering: 0.25,   // Some clustering is good
            symmetry: 0.15,     // Some symmetry can be beautiful
            entropy: 0.25,      // Higher entropy = more complex/interesting
            connectivity: 0.15  // Good connectivity suggests structure
        };
        
        // Normalize scores (optimal ranges)
        const normalizedDensity = this.normalizeRange(metrics.density, 0.2, 0.6);
        const normalizedClustering = metrics.clustering;
        const normalizedSymmetry = metrics.symmetry;
        const normalizedEntropy = metrics.entropy;
        const normalizedConnectivity = metrics.connectivity;
        
        return (
            weights.density * normalizedDensity +
            weights.clustering * normalizedClustering +
            weights.symmetry * normalizedSymmetry +
            weights.entropy * normalizedEntropy +
            weights.connectivity * normalizedConnectivity
        ) * 100;
    }

    normalizeRange(value, min, max) {
        if (value <= min) return 0;
        if (value >= max) return 1;
        return (value - min) / (max - min);
    }

    generateRecommendation(metrics) {
        const recommendations = [];
        
        if (metrics.density < 0.1) {
            recommendations.push("Pattern is too sparse - consider adding more alive cells");
        } else if (metrics.density > 0.7) {
            recommendations.push("Pattern is too dense - may lead to mass extinction");
        }
        
        if (metrics.clustering < 0.3) {
            recommendations.push("Cells are too isolated - add connections for more interesting evolution");
        }
        
        if (metrics.entropy < 0.3) {
            recommendations.push("Pattern lacks complexity - introduce more varied local structures");
        }
        
        if (metrics.connectivity < 0.1) {
            recommendations.push("Consider creating larger connected components");
        }
        
        if (recommendations.length === 0) {
            if (metrics.interestScore > 70) {
                recommendations.push("Excellent pattern! This configuration shows high potential for interesting evolution");
            } else {
                recommendations.push("Good pattern with potential for interesting behavior");
            }
        }
        
        return recommendations;
    }

    // AI pattern prediction
    predictEvolution(grid, generations = 5) {
        const predictions = [];
        let currentGrid = grid.map(row => [...row]);
        
        for (let gen = 0; gen < generations; gen++) {
            const nextGrid = this.simulateNextGeneration(currentGrid);
            const analysis = this.analyzePatternComplexity(nextGrid);
            
            predictions.push({
                generation: gen + 1,
                aliveCells: this.countAliveCells(nextGrid),
                interestScore: analysis.interestScore,
                stability: this.calculateStabilityChange(currentGrid, nextGrid),
                prediction: this.predictOutcome(nextGrid, analysis)
            });
            
            currentGrid = nextGrid;
        }
        
        return {
            predictions,
            overallTrend: this.analyzeTrend(predictions),
            recommendation: this.generateEvolutionRecommendation(predictions)
        };
    }

    simulateNextGeneration(grid) {
        const height = grid.length;
        const width = grid[0].length;
        const newGrid = Array(height).fill(null).map(() => Array(width).fill(false));
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const neighbors = this.countNeighbors(grid, x, y);
                const currentCell = grid[y][x];
                
                if (currentCell) {
                    newGrid[y][x] = neighbors === 2 || neighbors === 3;
                } else {
                    newGrid[y][x] = neighbors === 3;
                }
            }
        }
        
        return newGrid;
    }

    countNeighbors(grid, x, y) {
        let count = 0;
        const height = grid.length;
        const width = grid[0].length;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width && grid[ny][nx]) {
                    count++;
                }
            }
        }
        return count;
    }

    countAliveCells(grid) {
        return grid.reduce((total, row) => 
            total + row.reduce((rowTotal, cell) => rowTotal + (cell ? 1 : 0), 0), 0
        );
    }

    calculateStabilityChange(oldGrid, newGrid) {
        let changes = 0;
        const height = oldGrid.length;
        const width = oldGrid[0].length;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (oldGrid[y][x] !== newGrid[y][x]) {
                    changes++;
                }
            }
        }
        
        return 100 * (1 - (changes / (height * width)));
    }

    predictOutcome(grid, analysis) {
        const aliveCells = this.countAliveCells(grid);
        
        if (aliveCells === 0) {
            return 'extinction';
        } else if (analysis.interestScore > 80) {
            return 'thriving';
        } else if (analysis.interestScore > 60) {
            return 'stable';
        } else if (analysis.interestScore > 40) {
            return 'declining';
        } else {
            return 'unstable';
        }
    }

    analyzeTrend(predictions) {
        if (predictions.length < 2) return 'insufficient-data';
        
        const finalPrediction = predictions[predictions.length - 1];
        const stabilityTrend = predictions.map(p => p.stability);
        const interestTrend = predictions.map(p => p.interestScore);
        
        const stabilitySlope = this.calculateSlope(stabilityTrend);
        const interestSlope = this.calculateSlope(interestTrend);
        
        if (finalPrediction.aliveCells === 0) {
            return 'extinction';
        } else if (stabilitySlope > 5) {
            return 'stabilizing';
        } else if (stabilitySlope < -5) {
            return 'chaos';
        } else if (interestSlope > 5) {
            return 'growing-complexity';
        } else {
            return 'steady-state';
        }
    }

    calculateSlope(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    generateEvolutionRecommendation(predictions) {
        const trend = this.analyzeTrend(predictions);
        
        switch (trend) {
            case 'extinction':
                return 'Pattern will likely die out - consider adding stable structures or increasing density';
            case 'stabilizing':
                return 'Pattern is evolving toward stability - good for observing final structures';
            case 'chaos':
                return 'Pattern shows chaotic behavior - interesting for complexity studies';
            case 'growing-complexity':
                return 'Pattern is developing interesting complexity - excellent for continued observation';
            case 'steady-state':
                return 'Pattern appears to be reaching equilibrium - may develop oscillators or still lifes';
            default:
                return 'Continue observation to determine pattern behavior';
        }
    }

    // AI-generated pattern suggestions
    generateOptimalConfiguration(targetType = 'interesting') {
        switch (targetType) {
            case 'stable':
                return this.generateStableConfiguration();
            case 'oscillating':
                return this.generateOscillatingConfiguration();
            case 'chaotic':
                return this.generateChaoticConfiguration();
            case 'sparse':
                return this.generateSparseConfiguration();
            default:
                return this.generateInterestingConfiguration();
        }
    }

    generateStableConfiguration() {
        // Create a configuration likely to reach stability
        return {
            patterns: ['block', 'beehive', 'loaf'],
            density: 0.15,
            clustering: 0.8,
            description: 'Configuration optimized for reaching stable end state'
        };
    }

    generateOscillatingConfiguration() {
        return {
            patterns: ['blinker', 'toad', 'beacon'],
            density: 0.25,
            clustering: 0.6,
            description: 'Configuration optimized for oscillating behavior'
        };
    }

    generateChaoticConfiguration() {
        return {
            patterns: ['random-high-density'],
            density: 0.45,
            clustering: 0.3,
            description: 'Configuration optimized for chaotic, unpredictable evolution'
        };
    }

    generateSparseConfiguration() {
        return {
            patterns: ['glider', 'lightweight-spaceship'],
            density: 0.08,
            clustering: 0.9,
            description: 'Sparse configuration with mobile patterns'
        };
    }

    generateInterestingConfiguration() {
        return {
            patterns: ['mixed'],
            density: 0.3,
            clustering: 0.5,
            description: 'Balanced configuration for maximum interesting behavior'
        };
    }
}

module.exports = AIPatternService;