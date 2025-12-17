document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user.username;
  const position = user.position;

  // ===============================
  // AUTHENTICATION / RESTRICTION
  // ===============================
  if (!username) {
    Swal.fire({
      icon: "warning",
      title: "Unauthorized",
    }).then(() => window.location.href = "login.html");
    return;
  }

  if (position !== "admin") {
    Swal.fire({
      icon: "info",
      title: "Access Restricted",
      text: "Only admin can view user list.",
      showConfirmButton: false,
      timer: 2000,
    }).then(() => window.location.href = "splash.html");
    return;
  }

  const tbody = document.querySelector("#usersTable tbody");
  const logoutBtn = document.getElementById("logoutBtn");

  // ============================================
  // LOAD USERS FROM BACKEND
  // ============================================
  async function loadUsers() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      tbody.innerHTML = "";

      if (!result.success || !result.users || !result.users.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="empty-state">
                <i class="fa-solid fa-users"></i>
                <p>No users found</p>
              </div>
            </td>
          </tr>`;
        document.getElementById('userCount').textContent = '0';
        return;
      }

      // Update user count
      document.getElementById('userCount').textContent = result.users.length;

      result.users.forEach((u, index) => {
        const hasFingerprint = u.hasFingerprint || u.fingerprintTemplate;
        const fingerprintStatus = hasFingerprint
          ? `<span class="badge badge-success"><i class="fa-solid fa-fingerprint"></i> Enrolled</span>`
          : `<span class="badge badge-warning"><i class="fa-solid fa-fingerprint"></i> Not Set</span>`;

        const positionBadge = {
          'admin': 'badge-info',
          'official': 'badge-neutral',
          'staff': 'badge-neutral'
        }[u.position] || 'badge-neutral';

        const fingerprintAction = hasFingerprint
          ? `<button class="action-btn update" data-id="${u.id}" data-username="${u.username}" title="Update Fingerprint">
               <i class="fa-solid fa-sync"></i> Update
             </button>`
          : `<button class="action-btn enroll" data-id="${u.id}" data-username="${u.username}" title="Enroll Fingerprint">
               <i class="fa-solid fa-fingerprint"></i> Enroll
             </button>`;

        const row = `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.gender || "—"}</td>
            <td><span class="badge ${positionBadge}">${u.position}</span></td>
            <td>${fingerprintStatus}</td>
            <td class="action-btns">
              ${fingerprintAction}
              <button class="action-btn delete" data-id="${u.id}" title="Delete User">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </td>
          </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
      });

      attachDeleteEvents();
      attachFingerprintEvents();
    } catch (error) {
      console.error("Load users error:", error);
      Swal.fire("Error", "Failed to load users.", "error");
    }
  }

  // ============================================
  // FINGERPRINT ENROLLMENT/UPDATE
  // ============================================
  function attachFingerprintEvents() {
    const enrollButtons = document.querySelectorAll(".action-btn.enroll, .action-btn.update");

    enrollButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = btn.dataset.id;
        const username = btn.dataset.username;
        const isUpdate = btn.classList.contains("update");

        // Check scanner status first
        let scannerStatus = {
          api: false,
          sdk: false,
          device: false
        };

        try {
          const healthResponse = await fetch(`${API_BASE_URL}/scanner/health`);
          const healthData = await healthResponse.json();
          scannerStatus.api = true;
          scannerStatus.sdk = healthData.scanner?.sdkInitialized || false;
          scannerStatus.device = healthData.scanner?.deviceConnected || false;
        } catch (error) {
          console.log('Scanner status check failed:', error);
        }

        // Show enrollment dialog with status
        const confirmResult = await Swal.fire({
          title: isUpdate ? `Update Fingerprint` : `Enroll Fingerprint`,
          html: `
            <div style="text-align: left; padding: 10px;">
              <!-- Scanner Status -->
              <div style="margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${scannerStatus.api && scannerStatus.sdk ? '#28a745' : '#ffc107'};">
                <div style="font-weight: bold; margin-bottom: 8px; color: #495057;">
                  <i class="fa-solid fa-fingerprint"></i> Scanner Status
                </div>
                <div style="font-size: 12px; color: #6c757d;">
                  <div style="margin-bottom: 4px;">
                    <i class="fa-solid fa-circle" style="color: ${scannerStatus.api ? '#28a745' : '#dc3545'}; font-size: 8px;"></i>
                    API: <strong>${scannerStatus.api ? 'Online' : 'Offline'}</strong>
                  </div>
                  <div style="margin-bottom: 4px;">
                    <i class="fa-solid fa-circle" style="color: ${scannerStatus.sdk ? '#28a745' : '#dc3545'}; font-size: 8px;"></i>
                    SDK: <strong>${scannerStatus.sdk ? 'Initialized' : 'Not Initialized'}</strong>
                  </div>
                  <div>
                    <i class="fa-solid fa-circle" style="color: ${scannerStatus.device ? '#28a745' : '#ffc107'}; font-size: 8px;"></i>
                    Device: <strong>${scannerStatus.device ? 'Connected' : 'Not Connected'}</strong>
                  </div>
                </div>
              </div>

              <!-- User Info -->
              <div id="enrollContent" style="text-align: center; padding: 10px;">
                <i class="fa-solid fa-fingerprint" style="font-size: 64px; color: #2b426b; margin-bottom: 15px;"></i>
                <p style="font-size: 16px; margin-bottom: 10px;">
                  <strong>${username}</strong>
                </p>
                <p style="color: #666; font-size: 14px;">
                  ${isUpdate ? 'Ready to update fingerprint. Click "Scan" to capture new fingerprint.' : 'Click "Scan" to enroll fingerprint for this user.'}
                </p>
              </div>

              <!-- Progress Area (hidden initially) -->
              <div id="scanProgress" style="display: none; text-align: center; padding: 20px;">
                <div style="margin-bottom: 15px;">
                  <i class="fa-solid fa-fingerprint fa-beat" style="font-size: 64px; color: #2b426b;"></i>
                </div>
                <div style="margin-bottom: 15px;">
                  <div style="width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                    <div id="scanProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #2b426b, #5a7fb8); transition: width 0.3s;"></div>
                  </div>
                </div>
                <p style="font-size: 14px; color: #666; margin: 10px 0;" id="scanStatus">Initializing scanner...</p>
                <div style="font-size: 12px; color: #999; margin-top: 10px;">
                  <i class="fa-solid fa-lightbulb"></i> Keep your finger steady and press firmly
                </div>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: scannerStatus.sdk ? '<i class="fa-solid fa-fingerprint"></i> Scan Fingerprint' : '<i class="fa-solid fa-exclamation-triangle"></i> Scanner Not Ready',
          cancelButtonText: 'Cancel',
          confirmButtonColor: scannerStatus.sdk ? '#2b426b' : '#6c757d',
          cancelButtonColor: '#6c757d',
          allowOutsideClick: false,
          width: '550px',
          preConfirm: async () => {
            // This runs when "Scan Fingerprint" is clicked
            const enrollContent = document.getElementById('enrollContent');
            const scanProgress = document.getElementById('scanProgress');
            const scanProgressBar = document.getElementById('scanProgressBar');
            const scanStatus = document.getElementById('scanStatus');

            // Hide the initial content, show progress
            enrollContent.style.display = 'none';
            scanProgress.style.display = 'block';

            // Disable the buttons during scan
            Swal.disableButtons();

            try {
              // Check if fingerprint reader is available via API
              scanStatus.textContent = 'Checking scanner availability...';
              
              const statusResponse = await fetch(`${API_BASE_URL}/scanner/status`);
              const statusData = await statusResponse.json();
              
              if (!statusData.sdk?.initialized || !statusData.devices?.connected) {
                throw new Error('Scanner not connected. Please check scanner status.');
              }

              scanProgressBar.style.width = '5%';

              // Capture 3 fingerprints with progress indication
              const captures = [];
              const totalCaptures = 3;

              for (let i = 1; i <= totalCaptures; i++) {
                let captureSuccess = false;
                let retryCount = 0;
                const maxRetries = 10; // Allow multiple attempts per capture
                
                while (!captureSuccess && retryCount < maxRetries) {
                  try {
                    // Update status for current capture
                    scanStatus.innerHTML = `<strong>Capture ${i} of ${totalCaptures}</strong><br>Place your finger on the scanner...${retryCount > 0 ? ` (Attempt ${retryCount + 1})` : ''}`;
                    scanProgressBar.style.width = `${(i - 1) * 30 + 10 + (retryCount * 2)}%`;

                    // Capture fingerprint with a reasonable timeout
                    const captureResponse = await fetch(`${API_BASE_URL}/scanner/capture`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });

                    const captureData = await captureResponse.json();

                    if (captureData.success && captureData.template) {
                      // Success!
                      captures.push(captureData.template);
                      captureSuccess = true;

                      // Show success for this capture
                      scanProgressBar.style.width = `${i * 30}%`;
                      scanStatus.innerHTML = `<strong style="color: #28a745;">✓ Capture ${i} of ${totalCaptures} successful!</strong><br>${i < totalCaptures ? 'Lift your finger and prepare for next capture...' : 'All captures complete!'}`;
                      
                      // Wait a moment before next capture (except after last one)
                      if (i < totalCaptures) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                      }
                    } else {
                      // No fingerprint detected, retry
                      retryCount++;
                      if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 500)); // Short delay before retry
                      }
                    }
                  } catch (error) {
                    retryCount++;
                    if (retryCount < maxRetries) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                    }
                  }
                }

                if (!captureSuccess) {
                  throw new Error(`Capture ${i} failed: Unable to detect fingerprint after ${maxRetries} attempts. Please ensure finger is placed correctly on the scanner.`);
                }
              }

              // All captures done, now merge them
              scanStatus.innerHTML = '<strong>Merging fingerprints...</strong><br>Creating final template...';
              scanProgressBar.style.width = '95%';

              // Send all 3 templates to merge endpoint
              const mergeResponse = await fetch(`${API_BASE_URL}/scanner/merge-templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templates: captures })
              });

              let template;
              if (mergeResponse.ok) {
                const mergeData = await mergeResponse.json();
                template = mergeData.mergedTemplate || captures[0]; // Use merged or fallback to first capture
              } else {
                // If merge endpoint doesn't exist, use the first capture as fallback
                template = captures[0];
              }

              if (!template) {
                throw new Error("No fingerprint data captured");
              }

              // Show processing
              scanProgressBar.style.width = '95%';
              scanStatus.textContent = 'Processing fingerprint data...';
              await new Promise(resolve => setTimeout(resolve, 500));

              // Send to server
              scanProgressBar.style.width = '100%';
              scanStatus.textContent = 'Saving to database...';

              const token = localStorage.getItem('token');
              const response = await fetch(`${API_BASE_URL}/users/${userId}/fingerprint`, {
                method: "POST",
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  fingerprintTemplate: template,
                  userId: parseInt(userId)
                })
              });

              const data = await response.json();

              if (!data.success) {
                throw new Error(data.message || "Failed to save fingerprint");
              }

              return { success: true, data };

            } catch (error) {
              // Show error in the same dialog
              scanProgress.style.display = 'none';
              enrollContent.style.display = 'block';
              enrollContent.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                  <i class="fa-solid fa-exclamation-circle" style="font-size: 64px; color: #dc3545; margin-bottom: 15px;"></i>
                  <p style="font-size: 16px; margin-bottom: 10px; color: #dc3545;">
                    <strong>Enrollment Failed</strong>
                  </p>
                  <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                    ${error.message}
                  </p>
                  <div style="text-align: left; padding: 12px; background: #f8d7da; border-radius: 5px; border-left: 4px solid #dc3545;">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #721c24;">
                      <i class="fa-solid fa-lightbulb"></i> Troubleshooting Tips:
                    </div>
                    <ul style="font-size: 12px; color: #721c24; margin: 0; padding-left: 20px;">
                      <li>Ensure your finger is clean and dry</li>
                      <li>Press firmly but gently on the scanner</li>
                      <li>Try using a different finger</li>
                      <li>Clean the scanner surface with a soft cloth</li>
                      <li>Check if scanner device is connected</li>
                    </ul>
                  </div>
                </div>
              `;
              Swal.enableButtons();
              Swal.getConfirmButton().textContent = 'Try Again';
              return false; // Prevent dialog from closing
            }
          }
        });

        if (!confirmResult.isConfirmed || !confirmResult.value) return;

        // Check if scanner is ready
        if (!scannerStatus.sdk) {
          Swal.fire({
            icon: "error",
            title: "Scanner Not Ready",
            html: `<strong>SDK is not initialized.</strong><br><br>
                   <div style="text-align: left; font-size: 12px; color: #6c757d;">
                     <strong>Troubleshooting:</strong><br>
                     • Go to Dashboard and click "Init SDK"<br>
                     • Ensure scanner device is connected via USB<br>
                     • Check scanner status in Dashboard
                   </div>`,
            confirmButtonColor: "#2b426b"
          });
          return;
        }

        // Success - show final confirmation
        if (confirmResult.value && confirmResult.value.success) {
          Swal.fire({
            icon: "success",
            title: isUpdate ? "✅ Fingerprint Updated!" : "✅ Fingerprint Enrolled!",
            html: `
              <div style="text-align: center; padding: 10px;">
                <div style="margin: 20px 0;">
                  <i class="fa-solid fa-fingerprint" style="font-size: 64px; color: #28a745;"></i>
                </div>
                <p style="font-size: 16px; margin-bottom: 10px;">
                  Fingerprint has been successfully ${isUpdate ? 'updated' : 'enrolled'} for <strong>${username}</strong>.
                </p>
                <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 5px; font-size: 12px; color: #155724;">
                  <i class="fa-solid fa-check-circle"></i> User can now use fingerprint for attendance
                </div>
              </div>
            `,
            confirmButtonColor: "#2b426b",
            confirmButtonText: 'OK'
          });
          loadUsers(); // Refresh the list
        }
      });
    });
  }

  // ============================================
  // DELETE USER
  // ============================================
  function attachDeleteEvents() {
    const deleteButtons = document.querySelectorAll(".action-btn.delete");

    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;

        const confirmDelete = await Swal.fire({
          icon: "warning",
          title: "Delete User?",
          text: "This action cannot be undone.",
          showCancelButton: true,
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
        });

        if (!confirmDelete.isConfirmed) return;

        try {
          // FIXED ROUTE HERE ⬇⬇⬇
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: "DELETE",
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await res.json();

          if (data.success) {
            Swal.fire("Deleted", "User has been removed.", "success");
            loadUsers();
          } else {
            Swal.fire("Error", data.message || "Failed to delete user.", "error");
          }
        } catch (err) {
          Swal.fire("Error", "Server request failed.", "error");
        }
      });
    });
  }

  // ============================================
  // LOGOUT
  // ============================================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  // ============================================
  // NEW EMPLOYEE CREATION
  // ============================================
  const newEmployeeBtn = document.getElementById("newEmployeeBtn");
  let enrolledFingerprint = null;

  if (newEmployeeBtn) {
    newEmployeeBtn.addEventListener("click", async () => {
      // Check scanner status first
      let scannerStatus = {
        api: false,
        sdk: false,
        device: false
      };

      try {
        const healthResponse = await fetch(`${API_BASE_URL}/scanner/health`);
        const healthData = await healthResponse.json();
        scannerStatus.api = true;
        scannerStatus.sdk = healthData.scanner?.sdkInitialized || false;
        scannerStatus.device = healthData.scanner?.deviceConnected || false;
      } catch (error) {
        console.log('Scanner status check failed:', error);
      }

      const { value: formValues } = await Swal.fire({
        title: "Create New Employee",
        html: `
          <div style="text-align: left;">
            <!-- Scanner Status -->
            <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${scannerStatus.api && scannerStatus.sdk ? '#28a745' : '#ffc107'};">
              <div style="font-weight: bold; margin-bottom: 8px; color: #495057;">
                <i class="fa-solid fa-fingerprint"></i> Scanner Status
              </div>
              <div style="font-size: 12px; color: #6c757d;">
                <div style="margin-bottom: 4px;">
                  <i class="fa-solid fa-circle" style="color: ${scannerStatus.api ? '#28a745' : '#dc3545'}; font-size: 8px;"></i>
                  API: <strong>${scannerStatus.api ? 'Online' : 'Offline'}</strong>
                </div>
                <div style="margin-bottom: 4px;">
                  <i class="fa-solid fa-circle" style="color: ${scannerStatus.sdk ? '#28a745' : '#dc3545'}; font-size: 8px;"></i>
                  SDK: <strong>${scannerStatus.sdk ? 'Initialized' : 'Not Initialized'}</strong>
                </div>
                <div>
                  <i class="fa-solid fa-circle" style="color: ${scannerStatus.device ? '#28a745' : '#ffc107'}; font-size: 8px;"></i>
                  Device: <strong>${scannerStatus.device ? 'Connected' : 'Not Connected'}</strong>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Username:</label>
              <input type="text" id="newUsername" class="swal2-input" placeholder="Username" style="width: 100%;">
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Password:</label>
              <input type="password" id="newPassword" class="swal2-input" placeholder="Password" style="width: 100%;">
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Gender:</label>
              <select id="newGender" class="swal2-input" style="width: 100%;">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Position:</label>
              <select id="newPosition" class="swal2-input" style="width: 100%;">
                <option value="">Select Position</option>
                <option value="admin">Admin</option>
                <option value="official">Official</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div style="margin-bottom: 15px;">
              <button id="enrollFpBtn" ${!scannerStatus.sdk ? 'disabled' : ''} style="width: 100%; padding: 10px; background-color: ${!scannerStatus.sdk ? '#6c757d' : '#2b426b'}; color: white; border: none; border-radius: 5px; cursor: ${!scannerStatus.sdk ? 'not-allowed' : 'pointer'}; font-weight: bold;">
                <i class="fa-solid fa-fingerprint"></i> Enroll Fingerprint (Optional)
              </button>
              ${!scannerStatus.sdk ? '<div style="margin-top: 5px; font-size: 11px; color: #dc3545;"><i class="fa-solid fa-exclamation-circle"></i> Scanner not ready. Initialize SDK first.</div>' : ''}
              <div id="fpStatus" style="margin-top: 10px; padding: 10px; background-color: #f0f0f0; border-radius: 5px; display: none;">
                <i class="fa-solid fa-check-circle" style="color: #28a745;"></i> Fingerprint Enrolled
              </div>
              <div id="fpProgress" style="margin-top: 10px; padding: 10px; background-color: #fff3cd; border-radius: 5px; display: none; border-left: 4px solid #ffc107;">
                <div style="margin-bottom: 5px;"><i class="fa-solid fa-spinner fa-spin"></i> <strong>Scanning...</strong></div>
                <div style="font-size: 11px; color: #856404;">Place your finger on the scanner</div>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Create Employee",
        confirmButtonColor: "#2b426b",
        width: '600px',
        didOpen: async () => {
          const enrollFpBtn = document.getElementById("enrollFpBtn");
          const fpStatus = document.getElementById("fpStatus");
          const fpProgress = document.getElementById("fpProgress");

          enrollFpBtn.addEventListener("click", async () => {
            try {
              // Show progress immediately
              fpProgress.style.display = "block";
              enrollFpBtn.disabled = true;
              enrollFpBtn.style.opacity = '0.6';

              // Check scanner status via API
              const statusResponse = await fetch(`${API_BASE_URL}/scanner/status`);
              const statusData = await statusResponse.json();
              
              if (!statusData.sdk?.initialized || !statusData.devices?.connected) {
                fpProgress.style.display = "none";
                enrollFpBtn.disabled = false;
                enrollFpBtn.style.opacity = '1';
                Swal.fire({
                  icon: "warning",
                  title: "Scanner Not Available",
                  text: "Scanner is not connected. You can skip this step.",
                  confirmButtonColor: "#2b426b"
                });
                return;
              }

              // Capture 3 fingerprints with progress indication
              const captures = [];
              const totalCaptures = 3;

              for (let i = 1; i <= totalCaptures; i++) {
                let captureSuccess = false;
                let retryCount = 0;
                const maxRetries = 10; // Allow multiple attempts per capture

                while (!captureSuccess && retryCount < maxRetries) {
                  try {
                    // Update progress message
                    fpProgress.innerHTML = `<div style="margin-bottom: 5px;"><i class="fa-solid fa-fingerprint fa-beat" style="color: #ffc107; font-size: 20px;"></i> <strong>Capture ${i} of ${totalCaptures}</strong></div><div style="font-size: 11px; color: #856404;">Place your finger on the scanner${retryCount > 0 ? ` (Attempt ${retryCount + 1})` : ''}</div>`;

                    // Capture fingerprint
                    const captureResponse = await fetch(`${API_BASE_URL}/scanner/capture`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });

                    const captureData = await captureResponse.json();

                    if (captureData.success && captureData.template) {
                      // Success!
                      captures.push(captureData.template);
                      captureSuccess = true;

                      // Show success for this capture
                      fpProgress.innerHTML = `<div style="margin-bottom: 5px;"><i class="fa-solid fa-check-circle" style="color: #28a745; font-size: 20px;"></i> <strong style="color: #28a745;">Capture ${i} of ${totalCaptures} successful!</strong></div><div style="font-size: 11px; color: #155724;">${i < totalCaptures ? 'Lift your finger and prepare for next capture...' : 'All captures complete!'}</div>`;
                      
                      // Wait a moment before next capture
                      if (i < totalCaptures) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                      }
                    } else {
                      // No fingerprint detected, retry
                      retryCount++;
                      if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 500)); // Short delay before retry
                      }
                    }
                  } catch (error) {
                    retryCount++;
                    if (retryCount < maxRetries) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                    }
                  }
                }

                if (!captureSuccess) {
                  throw new Error(`Capture ${i} failed: Unable to detect fingerprint after ${maxRetries} attempts. Please ensure finger is placed correctly.`);
                }
              }

              // Merge the captures
              fpProgress.innerHTML = '<div style="margin-bottom: 5px;"><i class="fa-solid fa-spinner fa-spin" style="color: #ffc107; font-size: 20px;"></i> <strong>Merging fingerprints...</strong></div><div style="font-size: 11px; color: #856404;">Creating final template</div>';

              // Try to merge templates, fallback to first capture if merge endpoint doesn't exist
              let mergedTemplate;
              try {
                const mergeResponse = await fetch(`${API_BASE_URL}/scanner/merge-templates`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ templates: captures })
                });

                if (mergeResponse.ok) {
                  const mergeData = await mergeResponse.json();
                  mergedTemplate = mergeData.mergedTemplate || captures[0];
                } else {
                  mergedTemplate = captures[0]; // Fallback
                }
              } catch (err) {
                mergedTemplate = captures[0]; // Fallback if endpoint doesn't exist
              }

              enrolledFingerprint = mergedTemplate;

              if (enrolledFingerprint) {
                fpProgress.style.display = "none";
                fpStatus.style.display = "block";
                enrollFpBtn.innerHTML = '<i class="fa-solid fa-check"></i> Fingerprint Enrolled Successfully';
                enrollFpBtn.style.backgroundColor = '#28a745';
              } else {
                throw new Error("No fingerprint data captured");
              }
            } catch (error) {
              fpProgress.style.display = "none";
              enrollFpBtn.disabled = false;
              enrollFpBtn.style.opacity = '1';
              Swal.fire({
                icon: "error",
                title: "Enrollment Failed",
                html: `<strong>Error:</strong> ${error.message}<br><br>
                       <div style="text-align: left; font-size: 12px; color: #6c757d;">
                         <strong>Troubleshooting:</strong><br>
                         • Ensure scanner is connected<br>
                         • Check if SDK is initialized<br>
                         • Try scanning again with clean, dry finger<br>
                         • Press firmly but gently on the scanner
                       </div>`,
                confirmButtonColor: "#2b426b"
              });
              enrolledFingerprint = null;
            }
          });
        },
        preConfirm: () => {
          const username = document.getElementById("newUsername").value.trim();
          const password = document.getElementById("newPassword").value.trim();
          const gender = document.getElementById("newGender").value;
          const position = document.getElementById("newPosition").value;

          if (!username || !password || !gender || !position) {
            Swal.showValidationMessage("Please fill in all required fields");
            return false;
          }

          return { username, password, gender, position };
        }
      });

      if (formValues) {
        await createNewEmployee(formValues, enrolledFingerprint);
        enrolledFingerprint = null; // Reset
      }
    });
  }

  // Create new employee function
  async function createNewEmployee(data, fingerprintTemplate) {
    try {
      Swal.fire({
        title: "Creating Employee...",
        html: '<i class="fa-solid fa-spinner fa-spin" style="font-size: 32px;"></i>',
        allowOutsideClick: false,
        showConfirmButton: false,
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          gender: data.gender,
          position: data.position,
          fingerprintTemplate: fingerprintTemplate || null
        })
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Employee Created!",
          text: `${data.username} has been added successfully.`,
          confirmButtonColor: "#2b426b"
        });
        loadUsers(); // Refresh the list
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: result.message || "Failed to create employee.",
          confirmButtonColor: "#2b426b"
        });
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create employee: " + error.message,
        confirmButtonColor: "#2b426b"
      });
    }
  }

  // INITIAL LOAD
  loadUsers();
});
