class FaceDataStorage {
  constructor() {
    this.directoryHandle = null;
  }

  async initialize() {
    try {
      if (!('showDirectoryPicker' in window)) {
        throw new Error('Your browser does not support file system access. Please use Chrome or Edge.');
      }

      // Check if we already have a directory handle
      if (this.directoryHandle) {
        // Verify we still have permission
        try {
          await this.directoryHandle.requestPermission({ mode: 'readwrite' });
          return true;
        } catch (e) {
          // Permission lost, need to request again
          this.directoryHandle = null;
        }
      }

      // Show better instructions to the user
      alert('Please select or create a folder to store attendance data.\n\nThis folder will be used to save facial recognition data permanently.');
      
      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
        id: 'attendance-data'
      });

      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Folder selection was cancelled. Please try again and select a folder.');
      } else if (err.name === 'SecurityError') {
        throw new Error('Permission denied. Please grant folder access permissions.');
      }
      throw new Error(`Storage error: ${err.message}`);
    }
  }

  async saveFaceData(name, descriptors) {
    if (!this.directoryHandle) {
      throw new Error('Storage not initialized');
    }

    try {
      // Create a file for the face data
      const fileHandle = await this.directoryHandle.getFileHandle(`facedata_${name}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      
      // Convert Float32Array to regular arrays for JSON serialization
      const serializableDescriptors = descriptors.map(d => Array.from(d));
      
      await writable.write(JSON.stringify({
        name,
        descriptors: serializableDescriptors,
        timestamp: new Date().toISOString()
      }));
      await writable.close();
    } catch (err) {
      console.error('Error saving face data:', err);
      throw err;
    }
  }

  async loadAllFaceData() {
    if (!this.directoryHandle) {
      throw new Error('Storage not initialized');
    }

    const faceData = new Map();
    
    try {
      for await (const entry of this.directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('facedata_') && entry.name.endsWith('.json')) {
          try {
            const file = await entry.getFile();
            const content = await file.text();
            const data = JSON.parse(content);
            
            // Validate data structure before processing
            if (data && data.name && Array.isArray(data.descriptors)) {
              // Convert regular arrays back to Float32Array
              const descriptors = data.descriptors.map(d => 
                Array.isArray(d) ? new Float32Array(d) : null
              ).filter(d => d !== null);  // Filter out any invalid descriptors
              
              if (descriptors.length > 0) {
                faceData.set(data.name, descriptors);
              }
            }
          } catch (parseErr) {
            console.error(`Error processing file ${entry.name}:`, parseErr);
            // Continue with next file even if one fails
            continue;
          }
        }
      }
    } catch (err) {
      console.error('Error loading face data:', err);
      throw new Error('Failed to load face data: ' + err.message);
    }

    return faceData;
  }

  async saveAttendanceRecord(records) {
    if (!this.directoryHandle) {
      throw new Error('Storage not initialized');
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const fileHandle = await this.directoryHandle.getFileHandle(
        `attendance_${today}.json`,
        { create: true }
      );
      
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(records, null, 2));
      await writable.close();
      
      return true;
    } catch (err) {
      console.error('Error saving attendance records:', err);
      throw err;
    }
  }

  async loadAttendanceRecords(date = null) {
    if (!this.directoryHandle) {
      throw new Error('Storage not initialized');
    }

    const records = [];
    
    try {
      for await (const entry of this.directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('attendance_')) {
          // If date is specified, only load records for that date
          if (date && !entry.name.includes(date)) {
            continue;
          }
          
          const file = await entry.getFile();
          const content = await file.text();
          const dayRecords = JSON.parse(content);
          records.push(...dayRecords);
        }
      }
    } catch (err) {
      console.error('Error loading attendance records:', err);
      throw err;
    }

    return records;
  }

  async saveFingerprintData(name, fingerprintData) {
    if (!this.directoryHandle) {
      throw new Error('Storage not initialized');
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(`fingerprint_${name}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      
      await writable.write(JSON.stringify({
        name,
        fingerprintData,
        timestamp: new Date().toISOString()
      }));
      await writable.close();
    } catch (err) {
      console.error('Error saving fingerprint data:', err);
      throw err;
    }
  }

  async loadAllFingerprintData() {
    if (!this.directoryHandle) {
      throw new Error('Storage not initialized');
    }

    const fingerprintData = new Map();
    
    try {
      for await (const entry of this.directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('fingerprint_') && entry.name.endsWith('.json')) {
          try {
            const file = await entry.getFile();
            const content = await file.text();
            const data = JSON.parse(content);
            
            if (data && data.name && data.fingerprintData) {
              fingerprintData.set(data.name, data.fingerprintData);
            }
          } catch (parseErr) {
            console.error(`Error processing file ${entry.name}:`, parseErr);
            continue;
          }
        }
      }
    } catch (err) {
      console.error('Error loading fingerprint data:', err);
      throw new Error('Failed to load fingerprint data: ' + err.message);
    }

    return fingerprintData;
  }
}