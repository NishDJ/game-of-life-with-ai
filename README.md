# 🎮 Conway's Game of Life with AI 🤖

A modern implementation of Conway's Game of Life enhanced with artificial intelligence for pattern recognition, analysis, and evolution prediction.

## ✨ Features

### 🎯 Core Game Mechanics
- **Interactive Grid**: Click to toggle cells and create custom patterns
- **Real-time Simulation**: Smooth animation with adjustable speed
- **Pattern Library**: Pre-built famous patterns (Glider, Blinker, Toad, etc.)
- **Random Generation**: Create random patterns with configurable density

### 🤖 AI-Powered Analysis
- **Pattern Recognition**: Automatically detect oscillators, still lifes, and spaceships
- **Complexity Analysis**: Calculate density, clustering, symmetry, and entropy metrics
- **Evolution Prediction**: AI predicts pattern behavior over multiple generations
- **Smart Recommendations**: Get AI suggestions to improve pattern interestingness

### 🌐 Modern Web Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Socket.IO for synchronized multi-client experiences
- **Beautiful UI**: Modern glassmorphism design with smooth animations
- **Live Statistics**: Generation count, alive cells, stability metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with Canvas support

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd game-of-life-with-ai
   npm install
   ```

2. **Set environment variables (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. **Start the server:**
   ```bash
   npm start
   # For development with auto-reload:
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🎮 How to Play

### Basic Controls
- **Play/Pause**: Start or stop the simulation
- **Step**: Advance one generation manually
- **Clear**: Reset the grid to empty state
- **Speed Control**: Adjust simulation speed (100ms - 2000ms)

### Creating Patterns
- **Click to Draw**: Click cells to toggle them alive/dead
- **Pattern Library**: Use pre-built patterns like Glider or Block
- **Random Generator**: Create random patterns with adjustable density

### AI Analysis
- **Analyze Pattern**: Get detailed metrics about current pattern
- **Predict Evolution**: See AI predictions for next 5 generations
- **Smart Suggestions**: Receive recommendations for interesting configurations

## 🤖 AI Features Explained

### Pattern Complexity Metrics

- **Density**: Ratio of alive cells to total cells (optimal: 20-60%)
- **Clustering**: How grouped together alive cells are
- **Symmetry**: Horizontal and vertical pattern symmetry
- **Entropy**: Information complexity based on local patterns
- **Connectivity**: Average size of connected cell components

### Evolution Prediction

The AI analyzes patterns and predicts:
- **Stability trends**: Whether patterns will stabilize or continue changing
- **Population dynamics**: How cell count will change over time
- **Outcome classification**: Extinction, stable, chaotic, or thriving states
- **Recommendation**: Actionable advice based on predicted behavior

### Pattern Recognition

Automatically detects:
- **Still Lifes**: Patterns that never change (e.g., Block, Beehive)
- **Oscillators**: Patterns that cycle through states (e.g., Blinker, Toad)
- **Spaceships**: Patterns that move across the grid (e.g., Glider)

## 🛠 API Documentation

### Game Management
- `POST /api/game/create` - Create new game instance
- `GET /api/game/:id/state` - Get current game state
- `POST /api/game/:id/cell` - Toggle individual cell
- `POST /api/game/:id/next` - Advance one generation
- `POST /api/game/:id/clear` - Clear the grid
- `POST /api/game/:id/pattern` - Place pattern or generate random

### AI Analysis
- `POST /api/ai/analyze` - Analyze pattern complexity
- `POST /api/ai/predict` - Predict evolution outcomes
- `GET /api/ai/suggestions/:type` - Get AI-generated configurations

### System
- `GET /health` - Health check with system status
- `GET /` - Main web interface

## 🔧 Configuration

### Environment Variables
```bash
JWT_SECRET=your-secret-key-here    # JWT token secret (auto-generated if not set)
PORT=3000                          # Server port (default: 3000)
```

### Grid Settings
- **Default Size**: 100x75 cells
- **Cell Size**: 8px per cell
- **Max Grid**: 200x200 cells
- **Supported Patterns**: Glider, Block, Blinker, Toad, Beacon, Random

## 🧪 Technical Details

### Architecture
- **Backend**: Node.js with Express
- **Real-time**: Socket.IO for live updates
- **Frontend**: Vanilla JavaScript with Canvas API
- **AI Engine**: Custom pattern analysis algorithms
- **Security**: JWT authentication, input validation, CORS protection

### Performance Features
- **Optimized Algorithms**: O(n) complexity for data processing
- **Memory Management**: Automatic cleanup of old game instances
- **Async Processing**: Non-blocking AI computations
- **Batch Operations**: Efficient pattern analysis

### Security Improvements
- ✅ Fixed SQL injection vulnerabilities
- ✅ JWT secret externalized to environment variables
- ✅ Input validation and sanitization
- ✅ Authentication required for sensitive endpoints
- ✅ Memory leak prevention
- ✅ Stack overflow protection

## 🎯 Famous Patterns to Try

### Still Lifes
- **Block**: Simple 2x2 square
- **Beehive**: Stable hexagonal pattern
- **Loaf**: Asymmetric stable pattern

### Oscillators
- **Blinker**: Simple 3-cell oscillator (period 2)
- **Toad**: 6-cell oscillator (period 2)
- **Beacon**: 6-cell oscillator (period 2)

### Spaceships
- **Glider**: The most famous pattern, travels diagonally
- **Lightweight Spaceship**: Faster horizontal traveler

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- John Conway for creating the Game of Life
- The cellular automata research community
- Modern web development best practices
- AI/ML pattern recognition techniques

---

**Enjoy exploring the fascinating world of cellular automata with AI-powered insights!** 🎮🤖