    // Data dan state game
        let gameState = {
            board: [],
            solution: [],
            original: [],
            selectedCell: null,
            difficulty: 'easy',
            timer: 0,
            timerInterval: null,
            hints: 3,
            errors: 0,
            gameActive: false,
            gameCompleted: false,
            highlightEnabled: true,
            usedAutoSolver: false,
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                bestTime: null,
                totalTime: 0
            },
            leaderboard: []
        };

        // Inisialisasi game
        document.addEventListener('DOMContentLoaded', function() {
            initGame();
            loadStats();
            loadLeaderboard();
            
            // Event listener untuk tombol angka
            document.querySelectorAll('.num-btn[data-number]').forEach(btn => {
                btn.addEventListener('click', function() {
                    const number = parseInt(this.getAttribute('data-number'));
                    if (gameState.selectedCell && !gameState.gameCompleted) {
                        placeNumber(number);
                    }
                });
            });
            
            // Event listener untuk tombol lainnya
            document.getElementById('clear-btn').addEventListener('click', clearCell);
            document.getElementById('hint-btn').addEventListener('click', provideHint);
            document.getElementById('new-game-btn').addEventListener('click', newGame);
            document.getElementById('check-btn').addEventListener('click', checkAllBoard);
            document.getElementById('save-btn').addEventListener('click', saveGame);
            document.getElementById('load-btn').addEventListener('click', loadGame);
            document.getElementById('solve-btn').addEventListener('click', solveBoard);
            document.getElementById('highlight-toggle').addEventListener('change', toggleHighlight);
            document.getElementById('save-score-btn').addEventListener('click', saveScore);
            document.getElementById('skip-score-btn').addEventListener('click', skipScore);
            
            // Event listener untuk tombol tingkat kesulitan
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    gameState.difficulty = this.getAttribute('data-difficulty');
                    newGame();
                });
            });
            
            // Event listener untuk input keyboard
            document.addEventListener('keydown', handleKeyboardInput);
            
            // Mulai timer
            startTimer();
        });

        // Menangani input keyboard
        function handleKeyboardInput(event) {
            if (!gameState.gameActive || gameState.gameCompleted) return;
            
            const key = event.key;
            
            // Jika tombol angka ditekan (1-9)
            if (key >= '1' && key <= '9') {
                const number = parseInt(key);
                if (gameState.selectedCell) {
                    placeNumber(number);
                }
            }
            
            // Jika tombol backspace atau delete ditekan
            else if (key === 'Backspace' || key === 'Delete' || key === '0') {
                clearCell();
            }
            
            // Jika tombol panah ditekan
            else if (key.startsWith('Arrow')) {
                if (!gameState.selectedCell) return;
                
                let { row, col } = gameState.selectedCell;
                
                switch(key) {
                    case 'ArrowUp': row = Math.max(0, row - 1); break;
                    case 'ArrowDown': row = Math.min(8, row + 1); break;
                    case 'ArrowLeft': col = Math.max(0, col - 1); break;
                    case 'ArrowRight': col = Math.min(8, col + 1); break;
                }
                
                selectCell(row, col);
            }
        }

        // Inisialisasi game
        function initGame() {
            createGrid();
            newGame();
        }

        // Membuat grid Sudoku
        function createGrid() {
            const grid = document.getElementById('sudoku-grid');
            grid.innerHTML = '';
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.setAttribute('data-row', row);
                    cell.setAttribute('data-col', col);
                    cell.addEventListener('click', () => selectCell(row, col));
                    
                    grid.appendChild(cell);
                }
            }
        }

        // Memulai game baru
        function newGame() {
            // Reset state game
            gameState.board = Array(9).fill().map(() => Array(9).fill(0));
            gameState.solution = [];
            gameState.original = [];
            gameState.selectedCell = null;
            gameState.hints = 3;
            gameState.errors = 0;
            gameState.gameActive = true;
            gameState.gameCompleted = false;
            gameState.usedAutoSolver = false;
            
            // Reset timer
            resetTimer();
            startTimer();
            
            // Update tampilan
            updateHints();
            updateErrors();
            document.getElementById('game-status').textContent = '';
            document.getElementById('game-status').className = 'game-status';
            
            // Buat puzzle baru berdasarkan tingkat kesulitan
            generatePuzzleByDifficulty();
            updateGrid();
            
            // Update statistik
            gameState.stats.gamesPlayed++;
            updateStats();
            saveStats();
        }

        // Membuat puzzle berdasarkan tingkat kesulitan
        function generatePuzzleByDifficulty() {
            // Buat solusi Sudoku yang valid
            generateSolution();
            
            // Salin solusi ke board
            gameState.solution = gameState.board.map(row => [...row]);
            
            // Buat salinan untuk original (angka awal)
            gameState.original = gameState.board.map(row => [...row]);
            
            // Hapus angka berdasarkan tingkat kesulitan dengan perbedaan signifikan
            let cellsToRemove;
            switch(gameState.difficulty) {
                case 'easy':
                    cellsToRemove = 30; // Mudah: banyak angka yang terisi
                    break;
                case 'medium':
                    cellsToRemove = 45; // Sedang: cukup menantang
                    break;
                case 'hard':
                    cellsToRemove = 55; // Sulit: sedikit petunjuk
                    break;
                case 'expert':
                    cellsToRemove = 60; // Expert: sangat sulit
                    break;
                default:
                    cellsToRemove = 30;
            }
            
            // Hapus angka dengan pola yang berbeda untuk setiap tingkat kesulitan
            removeNumbersByDifficulty(cellsToRemove);
            
            // Simpan original board setelah angka dihapus
            gameState.original = gameState.board.map(row => [...row]);
        }

        // Membuat solusi Sudoku yang valid
        function generateSolution() {
            // Reset board
            gameState.board = Array(9).fill().map(() => Array(9).fill(0));
            
            // Isi diagonal kotak 3x3 (lebih mudah untuk memulai)
            for (let i = 0; i < 9; i += 3) {
                fillDiagonalBox(i, i);
            }
            
            // Isi selanjutnya dengan backtracking
            solveSudoku(gameState.board);
        }

        // Mengisi kotak 3x3 diagonal dengan angka acak
        function fillDiagonalBox(row, col) {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            shuffleArray(numbers);
            
            let index = 0;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    gameState.board[row + i][col + j] = numbers[index++];
                }
            }
        }

        // Algoritma backtracking untuk menyelesaikan Sudoku
        function solveSudoku(board) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                        shuffleArray(numbers);
                        
                        for (let num of numbers) {
                            if (isValid(board, row, col, num)) {
                                board[row][col] = num;
                                
                                if (solveSudoku(board)) {
                                    return true;
                                }
                                
                                board[row][col] = 0;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        }

        // Memeriksa apakah angka valid pada posisi tertentu
        function isValid(board, row, col, num) {
            // Periksa baris
            for (let x = 0; x < 9; x++) {
                if (board[row][x] === num) return false;
            }
            
            // Periksa kolom
            for (let x = 0; x < 9; x++) {
                if (board[x][col] === num) return false;
            }
            
            // Periksa kotak 3x3
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (board[boxRow + i][boxCol + j] === num) return false;
                }
            }
            
            return true;
        }

        // Menghapus angka berdasarkan tingkat kesulitan
        function removeNumbersByDifficulty(count) {
            let removed = 0;
            const maxAttempts = 1000;
            let attempts = 0;
            
            // Untuk tingkat kesulitan yang lebih tinggi, hapus angka dengan pola yang lebih sulit
            let removalPattern = getRemovalPattern(gameState.difficulty);
            
            while (removed < count && attempts < maxAttempts) {
                attempts++;
                
                let row, col;
                
                // Pilih sel berdasarkan pola penghapusan
                if (removalPattern === 'random') {
                    row = Math.floor(Math.random() * 9);
                    col = Math.floor(Math.random() * 9);
                } else if (removalPattern === 'symmetric') {
                    // Pola simetris untuk kesulitan medium
                    row = Math.floor(Math.random() * 9);
                    col = Math.floor(Math.random() * 9);
                    // Pastikan sel simetris juga dihapus
                    if (removed + 1 < count) {
                        const symRow = 8 - row;
                        const symCol = 8 - col;
                        if (gameState.board[symRow][symCol] !== 0) {
                            gameState.board[symRow][symCol] = 0;
                            removed++;
                        }
                    }
                } else if (removalPattern === 'clustered') {
                    // Pola berkelompok untuk kesulitan tinggi
                    const clusterRow = Math.floor(Math.random() * 3) * 3;
                    const clusterCol = Math.floor(Math.random() * 3) * 3;
                    row = clusterRow + Math.floor(Math.random() * 3);
                    col = clusterCol + Math.floor(Math.random() * 3);
                }
                
                // Pastikan sel tidak kosong
                if (gameState.board[row][col] !== 0) {
                    // Simpan nilai sementara
                    const temp = gameState.board[row][col];
                    gameState.board[row][col] = 0;
                    
                    // Periksa apakah masih memiliki solusi unik
                    // Untuk sederhananya, kita akan selalu menghapus
                    // (implementasi lengkap akan memeriksa keunikan solusi)
                    removed++;
                }
            }
        }

        // Mendapatkan pola penghapusan berdasarkan tingkat kesulitan
        function getRemovalPattern(difficulty) {
            switch(difficulty) {
                case 'easy': return 'random'; // Mudah: penghapusan acak
                case 'medium': return 'symmetric'; // Sedang: pola simetris
                case 'hard': return 'clustered'; // Sulit: pola berkelompok
                case 'expert': return 'clustered'; // Expert: pola berkelompok dengan lebih sedikit petunjuk
                default: return 'random';
            }
        }

        // Mengacak array
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        // Memilih sel
        function selectCell(row, col) {
            if (!gameState.gameActive || gameState.gameCompleted) return;
            
            // Hapus seleksi sebelumnya
            if (gameState.selectedCell) {
                const prevCell = document.querySelector(`.cell[data-row="${gameState.selectedCell.row}"][data-col="${gameState.selectedCell.col}"]`);
                prevCell.classList.remove('selected');
                
                // Hapus sorotan angka sama jika aktif
                if (gameState.highlightEnabled) {
                    removeHighlight();
                }
            }
            
            // Pilih sel baru jika bukan angka awal
            gameState.selectedCell = { row, col };
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('selected');
            
            // Sorot angka sama jika aktif
            if (gameState.highlightEnabled) {
                const value = gameState.board[row][col];
                if (value !== 0) {
                    highlightSameNumbers(value);
                }
            }
        }

        // Menempatkan angka di sel yang dipilih
        function placeNumber(number) {
            if (!gameState.selectedCell || gameState.gameCompleted) return;
            
            const { row, col } = gameState.selectedCell;
            
            // Periksa apakah sel dapat diisi (bukan angka awal)
            if (gameState.original[row][col] !== 0) return;
            
            // Periksa apakah angka valid
            const isValidMove = gameState.solution[row][col] === number;
            
            // Tempatkan angka
            gameState.board[row][col] = number;
            
            // Update tampilan dengan validasi realtime
            updateCellWithValidation(row, col, isValidMove);
            
            // Periksa kesalahan jika bukan angka yang benar
            if (!isValidMove) {
                gameState.errors++;
                updateErrors();
            } else {
                // Periksa apakah game selesai
                checkGameCompletion();
            }
            
            // Sorot angka sama jika aktif
            if (gameState.highlightEnabled) {
                removeHighlight();
                highlightSameNumbers(number);
            }
        }

        // Membersihkan sel yang dipilih
        function clearCell() {
            if (!gameState.selectedCell || gameState.gameCompleted) return;
            
            const { row, col } = gameState.selectedCell;
            
            // Pastikan sel dapat dibersihkan (bukan angka awal)
            if (gameState.original[row][col] !== 0) return;
            
            // Hapus angka
            gameState.board[row][col] = 0;
            
            // Update tampilan
            updateCell(row, col);
            
            // Hapus sorotan angka sama
            if (gameState.highlightEnabled) {
                removeHighlight();
            }
        }

        // Memberikan petunjuk
        function provideHint() {
            if (!gameState.gameActive || gameState.gameCompleted || gameState.hints <= 0) return;
            
            // Temukan sel kosong acak
            const emptyCells = [];
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (gameState.board[row][col] === 0) {
                        emptyCells.push({ row, col });
                    }
                }
            }
            
            if (emptyCells.length === 0) return;
            
            // Pilih sel kosong acak
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const { row, col } = emptyCells[randomIndex];
            
            // Isi dengan angka yang benar
            gameState.board[row][col] = gameState.solution[row][col];
            
            // Update tampilan dengan warna benar
            updateCellWithValidation(row, col, true);
            
            // Kurangi jumlah petunjuk
            gameState.hints--;
            updateHints();
            
            // Periksa apakah game selesai
            checkGameCompletion();
        }

        // Memperbarui tampilan sel dengan validasi
        function updateCellWithValidation(row, col, isCorrect) {
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            const value = gameState.board[row][col];
            
            cell.textContent = value !== 0 ? value : '';
            cell.classList.remove('error', 'user-filled', 'same-number', 'correct', 'incorrect');
            
            if (value !== 0) {
                if (gameState.original[row][col] !== 0) {
                    cell.classList.add('prefilled');
                } else {
                    cell.classList.add('user-filled');
                    
                    // Tambahkan kelas berdasarkan kebenaran jawaban
                    if (isCorrect) {
                        cell.classList.add('correct');
                    } else {
                        cell.classList.add('incorrect');
                    }
                }
            }
        }

        // Memperbarui tampilan sel tanpa validasi
        function updateCell(row, col) {
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            const value = gameState.board[row][col];
            
            cell.textContent = value !== 0 ? value : '';
            cell.classList.remove('error', 'user-filled', 'same-number', 'correct', 'incorrect');
            
            if (value !== 0) {
                if (gameState.original[row][col] !== 0) {
                    cell.classList.add('prefilled');
                } else {
                    cell.classList.add('user-filled');
                }
            }
        }

        // Memperbarui seluruh grid
        function updateGrid() {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    updateCell(row, col);
                }
            }
        }

        // Menyorot angka yang sama
        function highlightSameNumbers(number) {
            if (number === 0) return;
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (gameState.board[row][col] === number) {
                        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                        cell.classList.add('same-number');
                    }
                }
            }
        }

        // Menghapus sorotan angka
        function removeHighlight() {
            document.querySelectorAll('.cell.same-number').forEach(cell => {
                cell.classList.remove('same-number');
            });
        }

        // Mengaktifkan/menonaktifkan sorotan
        function toggleHighlight() {
            gameState.highlightEnabled = document.getElementById('highlight-toggle').checked;
            
            if (!gameState.highlightEnabled) {
                removeHighlight();
            } else if (gameState.selectedCell) {
                const { row, col } = gameState.selectedCell;
                const value = gameState.board[row][col];
                if (value !== 0) {
                    highlightSameNumbers(value);
                }
            }
        }

        // Memeriksa seluruh papan untuk kesalahan
        function checkAllBoard() {
            if (!gameState.gameActive || gameState.gameCompleted) return;
            
            let hasErrors = false;
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    const value = gameState.board[row][col];
                    const correctValue = gameState.solution[row][col];
                    
                    if (value !== 0 && value !== correctValue) {
                        hasErrors = true;
                        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                        cell.classList.add('incorrect');
                    } else if (value !== 0 && value === correctValue) {
                        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                        cell.classList.add('correct');
                    }
                }
            }
            
            if (hasErrors) {
                document.getElementById('game-status').textContent = 'Ada kesalahan pada papan!';
                document.getElementById('game-status').style.color = '#e74c3c';
            } else {
                document.getElementById('game-status').textContent = 'Semua angka benar!';
                document.getElementById('game-status').style.color = '#2ecc71';
            }
            
            // Hapus highlight setelah 3 detik
            setTimeout(() => {
                document.querySelectorAll('.cell.correct, .cell.incorrect').forEach(cell => {
                    cell.classList.remove('correct', 'incorrect');
                });
                document.getElementById('game-status').textContent = '';
            }, 3000);
        }

        // Memeriksa apakah game selesai
        function checkGameCompletion() {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (gameState.board[row][col] !== gameState.solution[row][col]) {
                        return false;
                    }
                }
            }
            
            // Game selesai!
            gameState.gameCompleted = true;
            gameState.gameActive = false;
            clearInterval(gameState.timerInterval);
            
            // Update statistik
            gameState.stats.gamesWon++;
            
            // Update waktu terbaik jika diperlukan
            if (gameState.stats.bestTime === null || gameState.timer < gameState.stats.bestTime) {
                gameState.stats.bestTime = gameState.timer;
            }
            
            gameState.stats.totalTime += gameState.timer;
            
            updateStats();
            saveStats();
            
            // Tampilkan pesan kemenangan
            document.getElementById('game-status').textContent = 'Selamat! Anda menyelesaikan Sudoku!';
            document.getElementById('game-status').className = 'game-status win-message';
            
            // Tampilkan modal input nama jika tidak menggunakan auto solver
            if (!gameState.usedAutoSolver) {
                showNameModal();
            }
            
            return true;
        }

        // Memecahkan seluruh papan
        function solveBoard() {
            if (!confirm("Pemecah otomatis akan menyelesaikan seluruh papan. Apakah Anda yakin? (Catatan: Skor tidak akan dicatat)")) {
                return;
            }
            
            // Tandai bahwa auto solver digunakan
            gameState.usedAutoSolver = true;
            
            // Salin solusi ke board
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    gameState.board[row][col] = gameState.solution[row][col];
                }
            }
            
            updateGrid();
            gameState.gameActive = false;
            gameState.gameCompleted = true;
            clearInterval(gameState.timerInterval);
            
            document.getElementById('game-status').textContent = 'Papan telah diselesaikan oleh pemecah otomatis!';
            document.getElementById('game-status').style.color = '#9b59b6';
        }

        // Menampilkan modal input nama
        function showNameModal() {
            const modal = document.getElementById('name-modal');
            const completionTime = document.getElementById('completion-time');
            
            // Format waktu penyelesaian
            const minutes = Math.floor(gameState.timer / 60).toString().padStart(2, '0');
            const seconds = (gameState.timer % 60).toString().padStart(2, '0');
            completionTime.textContent = `${minutes}:${seconds}`;
            
            // Tampilkan modal
            modal.style.display = 'flex';
            
            // Fokus pada input nama
            document.getElementById('player-name').focus();
        }

        // Menyimpan skor ke leaderboard
        function saveScore() {
            const playerName = document.getElementById('player-name').value.trim();
            
            if (!playerName) {
                alert('Silakan masukkan nama Anda!');
                return;
            }
            
            // Tambahkan skor ke leaderboard
            const scoreEntry = {
                name: playerName,
                time: gameState.timer,
                difficulty: gameState.difficulty,
                date: new Date().toISOString().split('T')[0]
            };
            
            gameState.leaderboard.push(scoreEntry);
            
            // Urutkan leaderboard berdasarkan waktu (tercepat ke terlama)
            gameState.leaderboard.sort((a, b) => a.time - b.time);
            
            // Simpan leaderboard
            saveLeaderboard();
            
            // Update tampilan leaderboard
            updateLeaderboard();
            
            // Tutup modal
            document.getElementById('name-modal').style.display = 'none';
            
            // Reset input
            document.getElementById('player-name').value = '';
        }

        // Melewatkan penyimpanan skor
        function skipScore() {
            document.getElementById('name-modal').style.display = 'none';
            document.getElementById('player-name').value = '';
        }

        // Timer functions
        function startTimer() {
            resetTimer();
            gameState.timerInterval = setInterval(() => {
                gameState.timer++;
                updateTimer();
            }, 1000);
        }

        function resetTimer() {
            gameState.timer = 0;
            updateTimer();
            if (gameState.timerInterval) {
                clearInterval(gameState.timerInterval);
            }
        }

        function updateTimer() {
            const minutes = Math.floor(gameState.timer / 60).toString().padStart(2, '0');
            const seconds = (gameState.timer % 60).toString().padStart(2, '0');
            document.getElementById('timer').textContent = `${minutes}:${seconds}`;
        }

        function updateHints() {
            document.getElementById('hint-count').textContent = gameState.hints;
        }

        function updateErrors() {
            document.getElementById('error-count').textContent = gameState.errors;
        }

        // Statistik functions
        function loadStats() {
            const savedStats = localStorage.getItem('sudokuStats');
            if (savedStats) {
                gameState.stats = JSON.parse(savedStats);
                updateStats();
            }
        }

        function saveStats() {
            localStorage.setItem('sudokuStats', JSON.stringify(gameState.stats));
        }

        function updateStats() {
            document.getElementById('games-played').textContent = gameState.stats.gamesPlayed;
            document.getElementById('games-won').textContent = gameState.stats.gamesWon;
            
            // Format waktu terbaik
            if (gameState.stats.bestTime !== null) {
                const minutes = Math.floor(gameState.stats.bestTime / 60).toString().padStart(2, '0');
                const seconds = (gameState.stats.bestTime % 60).toString().padStart(2, '0');
                document.getElementById('best-time').textContent = `${minutes}:${seconds}`;
            }
            
            // Format rata-rata waktu
            if (gameState.stats.gamesWon > 0) {
                const avgTime = Math.floor(gameState.stats.totalTime / gameState.stats.gamesWon);
                const minutes = Math.floor(avgTime / 60).toString().padStart(2, '0');
                const seconds = (avgTime % 60).toString().padStart(2, '0');
                document.getElementById('avg-time').textContent = `${minutes}:${seconds}`;
            }
        }

        // Leaderboard functions
        function loadLeaderboard() {
            const savedLeaderboard = localStorage.getItem('sudokuLeaderboard');
            if (savedLeaderboard) {
                gameState.leaderboard = JSON.parse(savedLeaderboard);
                updateLeaderboard();
            }
        }

        function saveLeaderboard() {
            localStorage.setItem('sudokuLeaderboard', JSON.stringify(gameState.leaderboard));
        }

        function updateLeaderboard() {
            const leaderboardBody = document.getElementById('leaderboard-body');
            leaderboardBody.innerHTML = '';
            
            // Ambil 10 skor teratas
            const topScores = gameState.leaderboard.slice(0, 10);
            
            if (topScores.length === 0) {
                leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Belum ada skor yang dicatat</td></tr>';
                return;
            }
            
            // Tampilkan skor
            topScores.forEach((score, index) => {
                const row = document.createElement('tr');
                
                // Format waktu
                const minutes = Math.floor(score.time / 60).toString().padStart(2, '0');
                const seconds = (score.time % 60).toString().padStart(2, '0');
                const formattedTime = `${minutes}:${seconds}`;
                
                // Format tingkat kesulitan
                let difficultyText = score.difficulty;
                if (score.difficulty === 'easy') difficultyText = 'Mudah';
                else if (score.difficulty === 'medium') difficultyText = 'Sedang';
                else if (score.difficulty === 'hard') difficultyText = 'Sulit';
                else if (score.difficulty === 'expert') difficultyText = 'Expert';
                
                // Tambahkan emoji berdasarkan peringkat
                let rankEmoji = '';
                if (index === 0) rankEmoji = '🥇';
                else if (index === 1) rankEmoji = '🥈';
                else if (index === 2) rankEmoji = '🥉';
                
                row.innerHTML = `
                    <td>${index + 1} ${rankEmoji}</td>
                    <td>${score.name}</td>
                    <td>${formattedTime}</td>
                    <td>${difficultyText}</td>
                    <td>${score.date}</td>
                `;
                
                leaderboardBody.appendChild(row);
            });
        }

        // Save/load game functions
        function saveGame() {
            if (!gameState.gameActive) return;
            
            const gameData = {
                board: gameState.board,
                solution: gameState.solution,
                original: gameState.original,
                difficulty: gameState.difficulty,
                timer: gameState.timer,
                hints: gameState.hints,
                errors: gameState.errors,
                usedAutoSolver: gameState.usedAutoSolver
            };
            
            localStorage.setItem('sudokuSavedGame', JSON.stringify(gameData));
            alert('Game telah disimpan!');
        }

        function loadGame() {
            const savedGame = localStorage.getItem('sudokuSavedGame');
            if (!savedGame) {
                alert('Tidak ada game yang tersimpan.');
                return;
            }
            
            if (!confirm("Memuat game yang tersimpan akan menggantikan game saat ini. Lanjutkan?")) {
                return;
            }
            
            const gameData = JSON.parse(savedGame);
            
            // Muat data game
            gameState.board = gameData.board;
            gameState.solution = gameData.solution;
            gameState.original = gameData.original;
            gameState.difficulty = gameData.difficulty;
            gameState.timer = gameData.timer;
            gameState.hints = gameData.hints;
            gameState.errors = gameData.errors;
            gameState.usedAutoSolver = gameData.usedAutoSolver || false;
            gameState.gameActive = true;
            gameState.gameCompleted = false;
            
            // Update UI
            updateGrid();
            updateTimer();
            updateHints();
            updateErrors();
            
            // Update tombol kesulitan aktif
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-difficulty') === gameState.difficulty) {
                    btn.classList.add('active');
                }
            });
            
            // Mulai timer lagi
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = setInterval(() => {
                gameState.timer++;
                updateTimer();
            }, 1000);
            
            document.getElementById('game-status').textContent = 'Game dimuat!';
            document.getElementById('game-status').style.color = '#3498db';
            
            setTimeout(() => {
                document.getElementById('game-status').textContent = '';
            }, 2000);
        }