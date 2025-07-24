// Initialize face-api.js models
async function loadModels() {
  await Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/'),
    faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/')
  ]);
}

// Add storage instance at the top
const storage = new FaceDataStorage();

// Store registered faces with multiple samples
let registeredFaces = new Map(); // name -> array of descriptors
let faceMatcher = null;

// DOM elements
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const registerBtn = document.getElementById('registerBtn');
const markAttendanceBtn = document.getElementById('markAttendanceBtn');
const registerModal = document.getElementById('registerModal');
const personName = document.getElementById('personName');
const captureBtn = document.getElementById('captureBtn');
const cancelRegister = document.getElementById('cancelRegister');
const status = document.getElementById('status');
const attendanceData = document.getElementById('attendanceData');
const captureProgress = document.getElementById('captureProgress');
const progressBar = document.getElementById('progressBar');
const cameraSelect = document.getElementById('cameraSelect');

let currentStream = null;

// Get available cameras
async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    cameraSelect.innerHTML = videoDevices.length === 0 
      ? '<option value="">No cameras found</option>'
      : videoDevices.map(device => 
          `<option value="${device.deviceId}">${device.label || `Camera ${videoDevices.indexOf(device) + 1}`}</option>`
        ).join('');
    
    // If no camera is selected but we have cameras, select the first one
    if (!cameraSelect.value && videoDevices.length > 0) {
      cameraSelect.value = videoDevices[0].deviceId;
    }
    
    return videoDevices;
  } catch (err) {
    console.error('Error getting cameras:', err);
    cameraSelect.innerHTML = '<option value="">Error loading cameras</option>';
    throw err;
  }
}

// Start video stream
async function startVideo(deviceId = null) {
  // Stop any existing stream
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : true
  };

  try {
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve();
      };
    });
    
    // Get initial camera list if we haven't already
    if (cameraSelect.options.length <= 1) {
      await getCameras();
    }
    
    return true;
  } catch (err) {
    console.error('Error accessing camera:', err);
    status.textContent = 'Error accessing camera. Please make sure camera permissions are granted.';
    status.className = 'status error';
    throw err;
  }
}

// Camera selection change handler
cameraSelect.addEventListener('change', async () => {
  try {
    status.textContent = 'Switching camera...';
    await startVideo(cameraSelect.value);
    status.textContent = 'Camera switched successfully!';
    status.className = 'status success';
  } catch (err) {
    status.textContent = 'Failed to switch camera.';
    status.className = 'status error';
  }
});

// Modify the registerFace function to take more samples
async function registerFace(name) {
  const samples = [];
  const totalSamples = 10; // Increased from 5 to 10 samples
  const detectionThreshold = 0.8; // Confidence threshold for face detection
  const minFaceSize = 150; // Minimum face size in pixels
  
  progressBar.style.width = '0%';
  captureProgress.style.display = 'block';
  
  for (let i = 0; i < totalSamples;) {
    try {
      // Add a small delay between captures to get different angles/expressions
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const detection = await faceapi.detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        status.textContent = 'No face detected. Please look at the camera.';
        continue;
      }

      // Validate face detection quality
      const faceSize = detection.detection.box.width;
      if (faceSize < minFaceSize) {
        status.textContent = 'Please move closer to the camera';
        continue;
      }

      if (detection.detection.score < detectionThreshold) {
        status.textContent = 'Please look directly at the camera';
        continue;
      }

      // Check if face is centered
      const videoCenter = video.width / 2;
      const faceCenter = detection.detection.box.x + (detection.detection.box.width / 2);
      if (Math.abs(videoCenter - faceCenter) > 100) {
        status.textContent = 'Please center your face in the camera';
        continue;
      }

      // Add some variation by requiring slight movement between captures
      if (samples.length > 0) {
        const lastDescriptor = samples[samples.length - 1];
        const distance = faceapi.euclideanDistance(lastDescriptor, detection.descriptor);
        if (distance < 0.1) {
          status.textContent = 'Please move slightly or change expression';
          continue;
        }
      }

      samples.push(detection.descriptor);
      i++;
      
      status.textContent = `Capturing face sample ${i} of ${totalSamples}...`;
      progressBar.style.width = `${(i / totalSamples) * 100}%`;
      
      // Add a visual feedback for successful capture
      const flash = document.createElement('div');
      flash.style.position = 'absolute';
      flash.style.top = '0';
      flash.style.left = '0';
      flash.style.right = '0';
      flash.style.bottom = '0';
      flash.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
      flash.style.animation = 'flash 0.5s';
      document.querySelector('.video-container').appendChild(flash);
      setTimeout(() => flash.remove(), 500);
      
    } catch (err) {
      console.error('Error during face capture:', err);
      status.textContent = 'Error during capture. Retrying...';
      continue;
    }
  }

  if (samples.length === totalSamples) {
    try {
      await storage.saveFaceData(name, samples);
      registeredFaces.set(name, samples);
      updateFaceMatcher();
      return true;
    } catch (err) {
      throw new Error(`Failed to save face data: ${err.message}`);
    }
  }
  
  throw new Error('Failed to capture enough quality samples');
}

// Modify the updateFaceMatcher function to handle empty data
function updateFaceMatcher() {
  try {
    if (!registeredFaces || registeredFaces.size === 0) {
      faceMatcher = null;
      return;
    }

    const labeledDescriptors = Array.from(registeredFaces.entries())
      .filter(([name, descriptors]) => descriptors && descriptors.length > 0)
      .map(([name, descriptors]) => {
        return new faceapi.LabeledFaceDescriptors(name, descriptors);
      });

    if (labeledDescriptors.length > 0) {
      faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
    } else {
      faceMatcher = null;
    }
  } catch (err) {
    console.error('Error updating face matcher:', err);
    faceMatcher = null;
  }
}

// Modify the markAttendance function for better accuracy
async function markAttendance() {
  if (!faceMatcher) {
    throw new Error('No faces registered yet');
  }

  // Take multiple samples for verification
  const verificationSamples = 3;
  const detections = [];
  
  status.textContent = 'Verifying face...';
  
  for (let i = 0; i < verificationSamples; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const detection = await faceapi.detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      continue;
    }
    
    detections.push(detection);
  }

  if (detections.length < verificationSamples) {
    throw new Error('Could not get enough clear face samples. Please try again.');
  }

  // Match all detections and use majority vote
  const matches = detections.map(detection => faceMatcher.findBestMatch(detection.descriptor));
  const matchCounts = new Map();
  let bestMatch = null;
  let highestCount = 0;

  matches.forEach(match => {
    const count = (matchCounts.get(match.label) || 0) + 1;
    matchCounts.set(match.label, count);
    if (count > highestCount) {
      highestCount = count;
      bestMatch = match;
    }
  });

  // Require majority agreement
  if (highestCount >= 2 && bestMatch.distance < 0.5) {
    const now = new Date();
    const record = {
      name: bestMatch.label,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      confidence: ((1 - bestMatch.distance) * 100).toFixed(2)
    };
    
    addAttendanceRecord(record);
    return record;
  } else {
    throw new Error('Face not recognized with high confidence');
  }
}

// Add attendance record to table
let currentDayRecords = [];
const dateFilter = document.getElementById('dateFilter');
const exportBtn = document.getElementById('exportBtn');
const saveRecordsBtn = document.getElementById('saveRecordsBtn');
const filterStatus = document.querySelector('.filter-status');

function addAttendanceRecord(record) {
  currentDayRecords.push(record);
  
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${record.name}</td>
    <td>${record.date}</td>
    <td>${record.time}</td>
    <td>${record.confidence}%</td>
  `;
  attendanceData.insertBefore(row, attendanceData.firstChild);
}

// Add new functions for attendance management
async function loadAttendanceRecords(date = null) {
  try {
    const records = await storage.loadAttendanceRecords(date);
    attendanceData.innerHTML = '';
    
    records.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.name}</td>
        <td>${record.date}</td>
        <td>${record.time}</td>
        <td>${record.confidence}%</td>
      `;
      attendanceData.appendChild(row);
    });
    
    filterStatus.textContent = date 
      ? `Showing records for ${new Date(date).toLocaleDateString()}`
      : 'Showing all records';
      
    return records;
  } catch (err) {
    console.error('Error loading records:', err);
    status.textContent = `Error loading records: ${err.message}`;
    status.className = 'status error';
  }
}

function exportToCSV(records) {
  const csvRows = [];
  const headers = ['Name', 'Date', 'Time', 'Confidence'];
  csvRows.push(headers.join(','));

  records.forEach(record => {
    const row = [
      record.name,
      record.date,
      record.time,
      `${record.confidence}%`
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Add event listeners
dateFilter.addEventListener('change', async () => {
  await loadAttendanceRecords(dateFilter.value);
});

exportBtn.addEventListener('click', async () => {
  const records = await storage.loadAttendanceRecords(dateFilter.value);
  exportToCSV(records);
});

saveRecordsBtn.addEventListener('click', async () => {
  try {
    if (currentDayRecords.length === 0) {
      throw new Error('No attendance records to save');
    }
    
    await storage.saveAttendanceRecord(currentDayRecords);
    status.textContent = 'Attendance records saved successfully!';
    status.className = 'status success';
    
    // Clear current day records after saving
    currentDayRecords = [];
  } catch (err) {
    status.textContent = `Error saving records: ${err.message}`;
    status.className = 'status error';
  }
});

// Modify the init function to better handle loading face data
async function init() {
  try {
    status.textContent = 'Loading face recognition models...';
    await loadModels();
    status.textContent = 'Models loaded. Initializing storage...';
    
    let storageInitialized = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!storageInitialized && retryCount < maxRetries) {
      try {
        storageInitialized = await storage.initialize();
      } catch (err) {
        retryCount++;
        if (retryCount < maxRetries) {
          status.textContent = `Storage initialization failed. Retrying... (${retryCount}/${maxRetries})`;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw err;
      }
    }

    // Load saved face data with better error handling
    status.textContent = 'Loading saved face data...';
    try {
      registeredFaces = await storage.loadAllFaceData();
      if (registeredFaces && registeredFaces.size > 0) {
        updateFaceMatcher();
        status.textContent = `Loaded ${registeredFaces.size} registered faces. Starting camera...`;
      } else {
        registeredFaces = new Map(); // Ensure it's initialized as empty Map
        status.textContent = 'No saved face data found. Starting camera...';
      }
    } catch (err) {
      console.error('Error loading face data:', err);
      registeredFaces = new Map(); // Fallback to empty Map
      status.textContent = 'Error loading face data. Starting with empty database...';
    }

    // Rest of initialization...
    await navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        return getCameras();
      })
      .then(() => startVideo(cameraSelect.value))
      .catch(err => {
        console.error('Camera permission error:', err);
        throw err;
      });

    status.textContent = 'System ready! You can now register faces or mark attendance.';
    status.className = 'status success';
    await loadAttendanceRecords();
    dateFilter.valueAsDate = new Date();
    drawDetections();
  } catch (err) {
    console.error('Initialization error:', err);
    status.textContent = `Error: ${err.message}`;
    status.className = 'status error';
    
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry Initialization';
    retryButton.style.marginTop = '10px';
    retryButton.onclick = () => {
      retryButton.remove();
      init();
    };
    status.parentNode.insertBefore(retryButton, status.nextSibling);
  }
}

// Draw face detection overlay
async function drawDetections() {
  const canvas = overlay.getContext('2d');
  canvas.clearRect(0, 0, overlay.width, overlay.height);

  const detections = await faceapi.detectAllFaces(video)
    .withFaceLandmarks();

  const resizedDetections = faceapi.resizeResults(detections, {
    width: overlay.width,
    height: overlay.height
  });

  faceapi.draw.drawDetections(overlay, resizedDetections);
  faceapi.draw.drawFaceLandmarks(overlay, resizedDetections);

  requestAnimationFrame(drawDetections);
}

// Event Listeners
registerBtn.addEventListener('click', () => {
  registerModal.style.display = 'block';
});

cancelRegister.addEventListener('click', () => {
  registerModal.style.display = 'none';
  personName.value = '';
  captureProgress.style.display = 'none';
});

captureBtn.addEventListener('click', async () => {
  const name = personName.value.trim();
  if (!name) {
    status.textContent = 'Please enter a name';
    status.className = 'status error';
    return;
  }

  try {
    status.textContent = 'Capturing face samples...';
    await registerFace(name);
    status.textContent = 'Face registered successfully!';
    status.className = 'status success';
    registerModal.style.display = 'none';
    personName.value = '';
    captureProgress.style.display = 'none';
  } catch (err) {
    status.textContent = err.message;
    status.className = 'status error';
  }
});

markAttendanceBtn.addEventListener('click', async () => {
  try {
    const record = await markAttendance();
    status.textContent = `Attendance marked for ${record.name} (Confidence: ${record.confidence}%)`;
    status.className = 'status success';
  } catch (err) {
    status.textContent = err.message;
    status.className = 'status error';
  }
});

init();