// 필요한 모듈을 Import (Matter 사용을 위한 기본 설정)
const { Engine, Render, Runner, World, Bodies, Events } = Matter;

// 기본 설정
const engine = Engine.create();
const { world } = engine;
engine.world.gravity.y = 1; // 중력 설정

const canvas = document.getElementById('game-canvas');

// Initialize canvas size before creating render
function initializeCanvas() {
    const container = document.getElementById('canvas-container');
    const containerRect = container.getBoundingClientRect();
    
    // Set canvas size to match container
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    canvas.style.width = containerRect.width + 'px';
    canvas.style.height = containerRect.height + 'px';
}

// Initialize canvas size first
initializeCanvas();

const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        wireframes: false,
        background: '#281c33',
        width: canvas.width,
        height: canvas.height
    }
});



// Add a clear button functionality
function clearPath() {
    circleDrawer.clearCircle();
}

// 시뮬레이션 종료 후 처리
function finishSimulation() {
    // 닉네임을 입력받는 모달을 표시
}

// 지우기 버튼
document.getElementById('redo-button').onclick = function () {
    clearPath();
};

document.getElementById('clear-button').onclick = function() {
  // Reset localstorage
  if (confirm('정말로 모든 기록을 지우시겠습니까?')) {
    localStorage.removeItem('leaderboard');
    updateLeaderboard(); // Update leaderboard display
  }
}

$('#nickname-modal').on('shown.bs.modal', function () {
    // Focus on nickname input when modal is shown
    $('#nickname-input').focus();
});

// 이론적 최적 경로 보여주기 버튼
document.getElementById('best-button').onclick = function () {
    showBestCircle();
};

// Show theoretical best circle (perfect circle)
function showBestCircle() {
    // Clear current circle and reset
    clearPath();
    
    // Set flag to prevent modal from showing
    window.circleDrawer.isDemoMode = true;
    
    // Create perfect circle directly as physics body
    window.circleDrawer.createPerfectCircle();
    
    // Drop circle
    window.circleDrawer.dropCircle();
}

function saveHandler() {
    const nickname = document.getElementById('nickname-input').value.trim();
    if (nickname) {
        saveResult(nickname);
        $('#nickname-input').val(''); // Clear input field
        $('#nickname-modal').modal('hide'); // Hide the modal using Bootstrap
    }
}

// Prevent form from submitting
$('#nickname-form').on('submit', function (e) {
    e.preventDefault(); // Prevent default form submission
    saveHandler();
});

// 저장 버튼 클릭 이벤트 처리
document.getElementById('saveButton').onclick = saveHandler;

// 결과 데이터 저장
function saveResult(nickname) {
    const timestamp = new Date().toISOString();
    
    // Capture path snapshot
    const pathSnapshot = capturePathSnapshot();
    
    const record = {
        nickname: nickname,
        time: currentTime, // Use the actual final time
        pathImage: pathSnapshot,
        timestamp: timestamp
    };
    
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push(record);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));

    // Reset game
    clearPath();
    resetTimer();

    // 리더보드 업데이트
    updateLeaderboard();
}

// Capture circle snapshot as base64 image
function capturePathSnapshot() {
    try {
        // Create a temporary canvas for the snapshot
        const snapshotCanvas = document.createElement('canvas');
        snapshotCanvas.width = 200; // Thumbnail width
        snapshotCanvas.height = 150; // Thumbnail height
        const snapshotCtx = snapshotCanvas.getContext('2d');
        
        // Set background
        snapshotCtx.fillStyle = '#281c33';
        snapshotCtx.fillRect(0, 0, snapshotCanvas.width, snapshotCanvas.height);
        
        if (window.circleDrawer && window.circleDrawer.rawPoints && window.circleDrawer.rawPoints.length > 1) {
            // Scale the circle to fit the thumbnail
            const scaleX = snapshotCanvas.width / canvas.width;
            const scaleY = snapshotCanvas.height / canvas.height;
            const scale = Math.min(scaleX, scaleY);
            
            snapshotCtx.save();
            snapshotCtx.scale(scale, scale);
            
            // Draw the actual raw circle points with better visibility
            const points = window.circleDrawer.rawPoints;
            snapshotCtx.strokeStyle = '#1abc9c';
            snapshotCtx.lineWidth = 6 / scale; // Thicker line for better visibility
            snapshotCtx.lineCap = 'round';
            snapshotCtx.lineJoin = 'round';
            
            // Add shadow for better contrast
            snapshotCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            snapshotCtx.shadowBlur = 2 / scale;
            snapshotCtx.shadowOffsetX = 1 / scale;
            snapshotCtx.shadowOffsetY = 1 / scale;
            
            snapshotCtx.beginPath();
            snapshotCtx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                snapshotCtx.lineTo(points[i].x, points[i].y);
            }
            snapshotCtx.closePath();
            snapshotCtx.stroke();
            
            snapshotCtx.restore();
        }
        
        return snapshotCanvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error capturing circle snapshot:', error);
        return null;
    }
}

function timeSince(date) {

  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + "년 전";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + "개월 전";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + "일 전";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + "시간 전";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + "분 전";
  }
  return Math.floor(seconds) + "초 전";
}

// 리더보드 업데이트
function updateLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.sort((a, b) => a.time - b.time); // 시간 오름차순 정렬
    
    // 리더보드에 표시
    const leaderboardElement = document.getElementById('leaderboard-list');
    leaderboardElement.innerHTML = ''; // 기존 리더보드 초기화
    
    leaderboard.forEach((record, index) => {
        const entry = document.createElement('div');
        entry.className = 'leaderboard-entry';
        entry.style.cssText = `
            padding: 10px;
            margin: 5px 0;
            background-color: #322541ff;
            border-radius: 5px;
            border-left: 3px solid ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#1abc9c'};
        `;
        
        const timeFormatted = record.time ? record.time.toFixed(2) : 'N/A';
        const dateFormatted = timeSince(new Date(record.timestamp));
        
        entry.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="flex-shrink: 0;">
                    <div style="font-weight: bold; color: #ecf0f1;">#${index + 1}</div>
                    <div style="font-size: 0.9em; color: #bdc3c7;">${timeFormatted}s</div>
                </div>
                ${record.pathImage ? `
                    <img src="${record.pathImage}" 
                         style="width: 60px; height: 45px; border-radius: 3px; border: 1px solid #555;" 
                         alt="Path preview">
                ` : '<div style="width: 60px; height: 45px; background: #555; border-radius: 3px;"></div>'}
                <div style="flex-grow: 1;">
                    <div style="font-weight: bold; color: #ecf0f1;">${record.nickname}</div>
                    <div style="font-size: 0.8em; color: #95a5a6;">${dateFormatted}</div>
                </div>
            </div>
        `;
        
        leaderboardElement.appendChild(entry);
    });
}


// Timer variables
let startTime = null;
let timerInterval = null;
let currentTime = 0;

// Update timer display
function updateTimer() {
    if (startTime) {
        currentTime = (Date.now() - startTime) / 1000;
        const minutes = Math.floor(currentTime / 60);
        const seconds = (currentTime % 60).toFixed(2);
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.padStart(5, '0')}`;
    }
}

// Start timer
function startTimer() {
    if (!startTime) {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 10); // Update every 10ms for smooth display
    }
}

// Stop timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    return currentTime;
}

// Reset timer
function resetTimer() {
    stopTimer();
    startTime = null;
    currentTime = 0;
    document.getElementById('timer').textContent = '00:00.00';
}


////////
class CircleDrawer {
    constructor(canvas, world) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.world = world;

        this.isDrawing = false;
        this.rawPoints = [];
        this.currentCircle = null;
        this.circleDropped = false;
        this.isDemoMode = false; // Flag for demo mode
        this.inclinedPlane = null;
        this.finishLine = null;

        this.createPreviewCanvas();
        this.setupEventListeners();
        this.createInclinedPlane();
        this.setupCollisionDetection();
    }

    createPreviewCanvas() {
        // Create preview canvas with same dimensions as main canvas
        this.previewCanvas = document.createElement('canvas');
        this.updatePreviewCanvasSize();
        
        this.previewCanvas.style.position = 'absolute';
        this.previewCanvas.style.top = '0';
        this.previewCanvas.style.left = '0';
        this.previewCanvas.style.pointerEvents = 'none';
        this.previewCanvas.style.zIndex = '10';
        this.previewCanvas.classList.add('preview-canvas');
        
        this.canvas.parentNode.appendChild(this.previewCanvas);
        this.previewCtx = this.previewCanvas.getContext('2d');
    }

    updatePreviewCanvasSize() {
        this.previewCanvas.width = this.canvas.width;
        this.previewCanvas.height = this.canvas.height;
        this.previewCanvas.style.width = this.canvas.style.width;
        this.previewCanvas.style.height = this.canvas.style.height;
    }

    createInclinedPlane() {
        // Remove existing plane if any
        if (this.inclinedPlane) {
            Matter.World.remove(this.world, this.inclinedPlane);
        }
        if (this.finishLine) {
            Matter.World.remove(this.world, this.finishLine);
        }

        // Create inclined plane
        const planeWidth = canvas.width * 0.9;
        const planeHeight = 20;
        const planeAngle = 0.3; // Slight downward slope
        
        this.inclinedPlane = Matter.Bodies.rectangle(
            canvas.width * 0.5,
            canvas.height * 0.6,
            planeWidth,
            planeHeight,
            {
                angle: planeAngle,
                isStatic: true,
                friction: 1, // High friction for rolling
                render: {
                    fillStyle: '#453472ff',
                    strokeStyle: '#302c50ff',
                    lineWidth: 2
                }
            }
        );

        // Create finish line
        this.finishLine = Matter.Bodies.rectangle(
            canvas.width,
            canvas.height * 0.9,
            100,
            200,
            {
                isStatic: true,
                isSensor: true, // Sensor so objects pass through
                render: {
                    fillStyle: '#e74d3c11',
                    strokeStyle: '#eeeeee00',
                    lineWidth: 2
                }
            }
        );

        Matter.World.add(this.world, [this.inclinedPlane, this.finishLine]);
        this.drawPlaneIndicators();
    }

    drawPlaneIndicators() {
        // Draw drawing area indicator
        // i dont want to
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.startDrawing(x, y);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDrawing || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.addPoint(x, y);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.finishDrawing();
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.startDrawing(x, y);
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.addPoint(x, y);
    }

    handleMouseUp(e) {
        this.finishDrawing();
    }

    startDrawing(x, y) {
        this.isDrawing = true;
        this.rawPoints = [];
        this.rawPoints.push({ x, y });

        // Clear previous circle if exists
        if (this.currentCircle) {
            Matter.World.remove(this.world, this.currentCircle);
            this.currentCircle = null;
        }

        // Clear preview canvas
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        this.drawPlaneIndicators();
    }

    addPoint(x, y) {
        const lastPoint = this.rawPoints[this.rawPoints.length - 1];
        const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);

        if (distance > 3) {
            this.rawPoints.push({ x, y });
            this.drawPreview();
        }
    }

    finishDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.rawPoints.length > 10) {
            // Erase preview pane
            this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
            this.processAndCreateCircle();
        }
    }

    drawPreview() {
        // Clear preview canvas and redraw
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        if (this.rawPoints.length > 1) {
            this.previewCtx.strokeStyle = '#888';
            this.previewCtx.lineWidth = 3;
            this.previewCtx.lineCap = 'round';
            this.previewCtx.lineJoin = 'round';
            this.previewCtx.beginPath();
            this.previewCtx.moveTo(this.rawPoints[0].x, this.rawPoints[0].y);

            for (let i = 1; i < this.rawPoints.length; i++) {
                this.previewCtx.lineTo(this.rawPoints[i].x, this.rawPoints[i].y);
            }
            this.previewCtx.stroke();
        }

        this.drawPlaneIndicators();
    }

    setupCollisionDetection() {
        // Listen for collision events to detect when circle reaches finish line
        Events.on(engine, 'afterUpdate', () => {
            if (this.currentCircle && this.circleDropped) {
                const circlePosition = this.currentCircle.position;
                
                // Check if circle passed the finish line
                if (circlePosition.x >= canvas.width - 60) {
                    this.finishRace();
                }
            }
        });
    }

    finishRace() {
        if (this.circleDropped) {
            this.circleDropped = false;
            const finalTime = stopTimer();
            
            // Only show modal if not in demo mode
            if (!this.isDemoMode) {
                setTimeout(() => {
                    $('#modal-record-text').text(`기록: ${finalTime.toFixed(2)}초`);
                    $('#nickname-input').val(''); // Clear input field
                    $('#nickname-modal').modal('show');
                    finishSimulation();
                }, 100);
            } else {
                // Reset demo mode
                this.isDemoMode = false;
            }
        }
    }

    calculateCircularity(points) {
        if (points.length < 4) return 0;

        // Calculate center of mass
        let centerX = 0, centerY = 0;
        for (let point of points) {
            centerX += point.x;
            centerY += point.y;
        }
        centerX /= points.length;
        centerY /= points.length;

        // Calculate distances from center
        const distances = points.map(point => 
            Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2)
        );

        // Calculate average radius and standard deviation
        const avgRadius = distances.reduce((a, b) => a + b, 0) / distances.length;
        const variance = distances.reduce((sum, dist) => sum + Math.pow(dist - avgRadius, 2), 0) / distances.length;
        const stdDev = Math.sqrt(variance);

        // Circularity score (lower standard deviation = more circular)
        const circularity = Math.max(0, 1 - (stdDev / avgRadius));
        return circularity;
    }

    processAndCreateCircle() {
        // Calculate circularity score
        const circularity = this.calculateCircularity(this.rawPoints);
        
        // Create physics circle
        this.createPhysicsCircle(this.rawPoints, circularity);

        // Drop the circle
        this.dropCircle();
    }

    createPhysicsCircle(points, circularity = 1) {
        if (points.length < 3) return;

        // Calculate center of original drawing
        let centerX = 0, centerY = 0;
        for (let point of points) {
            centerX += point.x;
            centerY += point.y;
        }
        centerX /= points.length;
        centerY /= points.length;

        // Fixed radius for all circles regardless of drawn size
        const fixedRadius = 30;
        
        // Normalize vertices to fixed size while maintaining shape
        const normalizedVertices = this.normalizeVerticesSize(points, centerX, centerY, fixedRadius);

        // Create the physics body with fixed size
        this.currentCircle = Matter.Bodies.fromVertices(centerX, centerY, [normalizedVertices], {
            restitution: 0.3,
            friction: 0.8,
            frictionAir: 0, // Less circular = more air resistance
            density: 0.001, // Fixed density for consistent mass
            render: {
                fillStyle: '#3b8aafff',
                strokeStyle: '#4a2c50ff',
                lineWidth: 2
            }
        });

        Matter.World.add(this.world, this.currentCircle);
    }

    createPerfectCircle() {
        // Remove existing circle if any
        if (this.currentCircle) {
            Matter.World.remove(this.world, this.currentCircle);
            this.currentCircle = null;
        }

        // Create a perfect circular physics body using Matter.js circle
        const centerX = this.canvas.width * 0.2;
        const centerY = this.canvas.height * 0.3;
        const radius = 30; // Same fixed radius as other circles

        this.currentCircle = Matter.Bodies.circle(centerX, centerY, radius, {
            restitution: 0.3,
            friction: 0.8,
            frictionAir: 0, // No air resistance penalty for perfect circle
            density: 0.001, // Same density as other circles
            render: {
                fillStyle: '#00ff00', // Bright green for perfect circle
                strokeStyle: '#2c3e50',
                lineWidth: 2
            }
        });

        Matter.World.add(this.world, this.currentCircle);
        
        // Set empty rawPoints for consistency
        this.rawPoints = [];
    }

    normalizeVerticesSize(points, centerX, centerY, targetRadius) {
        // Calculate the current radius of the drawn shape
        const distances = points.map(point => 
            Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2)
        );
        const currentRadius = distances.reduce((a, b) => a + b, 0) / distances.length;
        
        // Calculate scale factor to achieve target radius
        const scaleFactor = targetRadius / currentRadius;
        
        // Use more points and reduce them intelligently to maintain shape fidelity
        const targetPointCount = Math.min(points.length, 50); // Use up to 50 points for better shape accuracy
        const step = Math.max(1, Math.floor(points.length / targetPointCount));
        
        // Sample points evenly from the original drawing
        const sampledPoints = [];
        for (let i = 0; i < points.length; i += step) {
            const point = points[i];
            sampledPoints.push({
                x: centerX + (point.x - centerX) * scaleFactor,
                y: centerY + (point.y - centerY) * scaleFactor
            });
        }
        
        // Ensure we have the last point if it wasn't included
        if (sampledPoints.length > 0) {
            const lastOriginalPoint = points[points.length - 1];
            const lastSampledPoint = sampledPoints[sampledPoints.length - 1];
            const lastScaledPoint = {
                x: centerX + (lastOriginalPoint.x - centerX) * scaleFactor,
                y: centerY + (lastOriginalPoint.y - centerY) * scaleFactor
            };
            
            // Check if last point is significantly different
            const distance = Math.sqrt(
                Math.pow(lastScaledPoint.x - lastSampledPoint.x, 2) + 
                Math.pow(lastScaledPoint.y - lastSampledPoint.y, 2)
            );
            
            if (distance > 5) { // Only add if it's far enough from the last sampled point
                sampledPoints.push(lastScaledPoint);
            }
        }
        
        return sampledPoints;
    }

    dropCircle() {
        if (!this.currentCircle) return;

        // Position circle at the start of the inclined plane
        Matter.Body.setPosition(this.currentCircle, { 
            x: canvas.width * 0.2, 
            y: canvas.height * 0.3
        });

        this.circleDropped = true;
        
        // Start the timer
        resetTimer();
        startTimer();
    }

    clearCircle() {
        if (this.currentCircle) {
            Matter.World.remove(this.world, this.currentCircle);
            this.currentCircle = null;
        }
        
        this.circleDropped = false;
        this.isDemoMode = false;
        resetTimer();
        
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        this.drawPlaneIndicators();
    }
}

///
// 엔진 실행 설정
window.addEventListener('load', () => {
    updateLeaderboard(); // Load leaderboard on startup
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    window.circleDrawer = new CircleDrawer(canvas, world);
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
});

// Global resize handler
function handleResize() {
    const container = document.getElementById('canvas-container');
    const containerRect = container.getBoundingClientRect();
    
    // Update main canvas
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    canvas.style.width = containerRect.width + 'px';
    canvas.style.height = containerRect.height + 'px';
    
    // Update Matter.js render options
    render.options.width = canvas.width;
    render.options.height = canvas.height;
    render.canvas.width = canvas.width;
    render.canvas.height = canvas.height;
    
    // Update preview canvas if circleDrawer exists
    if (window.circleDrawer) {
        window.circleDrawer.updatePreviewCanvasSize();
        window.circleDrawer.createInclinedPlane(); // Recreate plane for new dimensions
    }
}