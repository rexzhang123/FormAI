    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('newSessionBtn').addEventListener('click', createNewSession);
        createNewSession();  // Initialize the first session
    });

    let currentSessionId = 0;
    let sessions = {};
    const originalTemplate = document.querySelector('.session-template').cloneNode(true);  // Save a pristine copy of the template
    const keypoints = [
        "Nose", "Left Eye", "Right Eye", "Left Ear", "Right Ear",
        "Left Shoulder", "Right Shoulder", "Left Elbow", "Right Elbow",
        "Left Wrist", "Right Wrist", "Left Hip", "Right Hip",
        "Left Knee", "Right Knee", "Left Ankle", "Right Ankle"
    ];

    function createNewSession() {
        currentSessionId++;
        const sessionId = currentSessionId;
        const sessionTab = document.createElement('li');
        
        Object.values(sessions).forEach(function(session) {
            session.content.style.display = 'none'; // Hide the content
        });


        sessionTab.textContent = 'Session #' + sessionId;
        sessionTab.onclick = () => switchSession(sessionId);
        document.getElementById('sessionList').appendChild(sessionTab);

        const sessionTemplate = originalTemplate.cloneNode(true);
        sessionTemplate.style.display = 'block'; // Ensure it's visible
        sessionTemplate.id = 'session' + sessionId;
        document.getElementById('currentSession').appendChild(sessionTemplate);

        const suggestionsBox = document.createElement('div');
        suggestionsBox.id = 'suggestionsContent' + sessionId;  // Unique ID
        suggestionsBox.style.marginTop = '10px';
        suggestionsBox.style.border = '1px solid #ccc';
        suggestionsBox.style.padding = '10px';
        suggestionsBox.textContent = 'Suggestions will appear here...';
        sessionTemplate.appendChild(suggestionsBox);  // Append to the session container

        const generateSuggestionsButton = document.createElement('button');
        generateSuggestionsButton.textContent = 'Create Suggestions for Me';
        generateSuggestionsButton.onclick = () => fetchSuggestions(sessionId);
        sessionTemplate.appendChild(generateSuggestionsButton);  // Append to the session container


        resetSessionTemplate(sessionTemplate);  // Reset the template to its default state

        sessions[sessionId] = {
            tab: sessionTab,
            content: sessionTemplate,
            videoElements: sessionTemplate.querySelectorAll('video'),
            keypointsDataUser: [],
            keypointsIndexUser: 0,
            keypointsDataReference: [],
            keypointsIndexReference: 0,
            allKeypointsUser: [],
            allKeypointsReference: [],
            suggestionsBox: suggestionsBox,
            generateSuggestionsButton: generateSuggestionsButton  // Store the reference to the button
        };

        initSessionControls(sessionTemplate, sessionId);
        setupVideoControls(sessionTemplate);  // Setup drag and zoom for this specific session
        populateKeypointSelectors(sessionTemplate);  // Populate the keypoint selectors for this session
        if (currentSessionId === 1) {
            switchSession(sessionId);  // Automatically switch to the first session created
        }
    }

    function populateKeypointSelectors(sessionTemplate) {
        const userSelector = sessionTemplate.querySelector('.user-side .keypoint-selector');
        const referenceSelector = sessionTemplate.querySelector('.reference-side .keypoint-selector');
        keypoints.forEach(kp => {
            let option = new Option(kp, kp);
            userSelector.add(option.cloneNode(true));
            referenceSelector.add(option.cloneNode(true));
        });
    }

    function setupVideoControls(sessionTemplate) {
        // Apply the drag and zoom functionality to both user and reference videos within the session
        const userVideo = sessionTemplate.querySelector('.userVideoPreview');
        const userZoomSlider = sessionTemplate.querySelector('.user-side .zoom-slider');
        const referenceVideo = sessionTemplate.querySelector('.referenceVideoPreview');
        const referenceZoomSlider = sessionTemplate.querySelector('.reference-side .zoom-slider');
        
        if (userVideo && userZoomSlider) {
            initDragAndZoom(userVideo, userZoomSlider);
        }
        if (referenceVideo && referenceZoomSlider) {
            initDragAndZoom(referenceVideo, referenceZoomSlider);
        }
    }

    function initDragAndZoom(video, zoomSlider) {
        let startPos = { x: 0, y: 0 };
        let currentScale = 1;  // Initial scale factor
        let offsetX = 0, offsetY = 0;  // Keep track of cumulative offsets

        const mouseDownHandler = function(e) {
            e.preventDefault();
            startPos = {
                x: e.clientX,
                y: e.clientY
            };

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', function() {
                document.removeEventListener('mousemove', mouseMoveHandler);
                video.style.cursor = 'grab';
            });
            video.style.cursor = 'grabbing';
        };

        const mouseMoveHandler = function(e) {
            const dx = e.clientX - startPos.x;
            const dy = e.clientY - startPos.y;
            offsetX += dx;
            offsetY += dy;
            startPos = { x: e.clientX, y: e.clientY }; // Update start position for next move
            applyTransform(video, currentScale, offsetX, offsetY);
        };

        video.addEventListener('mousedown', mouseDownHandler);

        zoomSlider.addEventListener('input', function() {
            currentScale = parseFloat(this.value);
            applyTransform(video, currentScale, offsetX, offsetY);
        });
    }

    function applyTransform(video, scale, x, y) {
        video.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        video.style.transformOrigin = 'center center'; // Ensure scaling occurs from the center
    }


    function applyTransform(video, scale, x, y) {
        video.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }


    function resetSessionTemplate(template) {
        const videos = template.querySelectorAll('video');
        videos.forEach(video => {
            video.removeAttribute('src');
            video.load();
        });
        const inputs = template.querySelectorAll('input[type="file"]');
        inputs.forEach(input => input.value = '');
    }

    function switchSession(sessionId) {
        Object.values(sessions).forEach(session => {
            session.content.style.display = 'none';
            session.tab.classList.remove('active');
        });
        const session = sessions[sessionId];
        session.content.style.display = 'block';
        session.tab.classList.add('active');
    }

    function initSessionControls(container, sessionId) {
        const videoFileInputs = container.querySelectorAll('input[type="file"]');
        const uploadButtons = container.querySelectorAll('.upload-button');
        const playPauseButtons = container.querySelectorAll('.playPauseUserBtn, .playPauseReferenceBtn');
        const frameScrubbers = container.querySelectorAll('.frameScrubberUser, .frameScrubberReference');
        const captureFrameButtons = container.querySelectorAll('.captureFrameUser, .captureFrameReference');

        uploadButtons.forEach((button, index) => {
            button.addEventListener('click', () => videoFileInputs[index].click());
        });

        videoFileInputs.forEach((input, index) => {
            input.addEventListener('change', (event) => {
                const file = event.target.files[0];
                const videoElement = sessions[sessionId].videoElements[index];
                loadVideo(file, videoElement, container);
            });
        });

        playPauseButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                togglePlayPause(sessions[sessionId].videoElements[index], button);
            });
        });

        frameScrubbers.forEach((scrubber, index) => {
            scrubber.addEventListener('input', () => {
                adjustVideoFrame(sessions[sessionId].videoElements[index], scrubber);
            });
        });

        captureFrameButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                captureFrameToCanvas(sessions[sessionId].videoElements[index], container.querySelectorAll('canvas')[index], sessionId, index === 0);
            });
        });
    }

    function loadVideo(file, videoElement, container) {
        if (file) {
            const url = URL.createObjectURL(file);
            videoElement.src = url;
            videoElement.hidden = false;
            videoElement.onloadedmetadata = () => {
                enableVideoControls(videoElement);
                const userZoomSlider = container.querySelector('.user-side .zoom-slider');
                const referenceZoomSlider = container.querySelector('.reference-side .zoom-slider');
                const zoomScrub = container.querySelector('#zoomScrub');
                const frameScrub = container.querySelector('#frameScrub');
                // Display the zoom slider label
                zoomScrub.style.display = 'block';
                frameScrub.style.display = 'block';
                userZoomSlider.style.display = 'block';
                referenceZoomSlider.style.display = 'block';
            };
        }
    }

    function enableVideoControls(videoElement) {
        const playPauseButton = videoElement.parentNode.parentNode.querySelector('.playPauseUserBtn, .playPauseReferenceBtn');
        const frameScrubber = videoElement.parentNode.parentNode.querySelector('.frameScrubberUser, .frameScrubberReference');
        const captureFrameButton = videoElement.parentNode.parentNode.querySelector('.captureFrameUser, .captureFrameReference');

        playPauseButton.style.display = 'block';
        frameScrubber.style.display = 'block';
        frameScrubber.max = Math.floor(videoElement.duration * 30); // Assuming 30 fps
        frameScrubber.value = 0;
        captureFrameButton.style.display = 'block';
    }

    function togglePlayPause(videoElement, button) {
        if (videoElement.paused) {
            videoElement.play();
            button.textContent = 'Pause';
        } else {
            videoElement.pause();
            button.textContent = 'Play';
        }
    }

    function adjustVideoFrame(videoElement, scrubber) {
        videoElement.currentTime = scrubber.value / 30; // Assuming 30 fps
    }

    function captureFrameToCanvas(videoElement, canvas, sessionId, isUserSide) {
        const ctx = canvas.getContext('2d');
        const transform = new WebKitCSSMatrix(getComputedStyle(videoElement).transform);
        const scaleAdjustmentFactor = 296 / Math.max(videoElement.videoWidth, videoElement.videoHeight);
        const scale = transform.a * scaleAdjustmentFactor;
        const xOffset = transform.m41;
        const yOffset = transform.m42;
        const scaledWidth = videoElement.videoWidth * scale;
        const scaledHeight = videoElement.videoHeight * scale;
        const centeredX = (canvas.width - scaledWidth) / 2 + xOffset;
        const centeredY = (canvas.height - scaledHeight) / 2 + yOffset;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(centeredX + scaledWidth / 2, centeredY + scaledHeight / 2);
        ctx.drawImage(videoElement, -videoElement.videoWidth / 2 * scale, -videoElement.videoHeight / 2 * scale, scaledWidth, scaledHeight);
        ctx.restore();
        canvas.hidden = true;

        const imageData = canvas.toDataURL("image/png");
        const sideContainer = isUserSide ? canvas.closest('.session-template').querySelector('.user-side') :
        canvas.closest('.session-template').querySelector('.reference-side');
        // Send the image data to the server
        sendDataToServer(imageData, sessionId, isUserSide);s
    }

    function sendDataToServer(imageData, sessionId, isUserSide) {
        const payload = { imageBase64: imageData };

        fetch('/process-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Processed image data received:', data);
            displayResults(data.processedImage, data.keypoints, isUserSide);
        })
        .catch(error => console.error('Error:', error));
    }

    function displayResults(imageData, keypoints, isUserSide) {
        // Determine the correct side to display results
        const sideSelector = isUserSide ? '.user-side' : '.reference-side';
        const sideContainer = document.querySelector(sideSelector);
    
        // Ensure the side container is available
        if (!sideContainer) {
            console.error("Error: Unable to find the side container for", sideSelector);
            return; // Exit if no side container is found
        }
    
        // Find or create the processed image container within the side-specific container
        let processedImageContainer = sideContainer.querySelector('#processed-image');
        if (!processedImageContainer) {
            processedImageContainer = document.createElement('img');
            processedImageContainer.id = 'processed-image';
            processedImageContainer.style.border = "2px solid #000";
            processedImageContainer.alt = "Processed Image";
            sideContainer.appendChild(processedImageContainer);  // Append directly to the side container
        }
    
        // Set the image data and update UI
        processedImageContainer.src = imageData;
    
        // Hide all controls and display the save keypoints button
        hideControls(sideContainer, isUserSide);
        showSaveButton(sideContainer, keypoints, getCurrentSessionId(), isUserSide);
    }
 
    function hideControls(container, isUserSide) {
        // Define selectors to hide based on the side
        let controlSelectors = [
            '.playPauseUserBtn', '.playPauseReferenceBtn',
            '.frameScrubberUser', '.frameScrubberReference',
            '.zoom-slider', '.captureFrameUser', '.captureFrameReference',
            '.controls', '.video-wrapper', '.upload-button'
        ];
    
        // Hide controls in the specified side container
        controlSelectors.forEach(selector => {
            const controls = container.querySelectorAll(selector);
            controls.forEach(control => {
                control.style.display = 'none';
            });
        });
    }

    function showSaveButton(container, keypointData, sessionId, isUserSide) {
        // Determine the correct side to display the save button
        const sideSelector = isUserSide ? '.user-side' : '.reference-side';
        const sideContainer = container.closest('.session-template').querySelector(sideSelector);
    
        // Ensure the side container is available
        if (!sideContainer) {
            console.error("Error: Unable to find the side container for", sideSelector);
            return; // Exit if no side container is found
        }
    
        // Create the save button in the side-specific container
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save Keypoints';
        saveButton.className = 'saveKeypointsBtn'; // Adding a class for easier selection
        saveButton.onclick = function() {
            saveKeypoints(sideContainer, keypointData, sessionId, isUserSide);
        };
    
        // Append the save button to the side-specific container
        sideContainer.appendChild(saveButton);
    }


    function saveKeypoints(container, keypointData, sessionId, isUserSide) {
        const session = sessions[sessionId];
        
        // Prepare an array to store formatted keypoints data for the current frame
        const formattedKeypoints = [];
    
        // Iterate over the keypoints data object and format it
        for (const [keypoint, coordinates] of Object.entries(keypointData)) {
            formattedKeypoints.push({
                keypoint: keypoint,
                x: coordinates[0],  // Normalized x coordinate
                y: coordinates[1]   // Normalized y coordinate
            });
        }
    
        // Determine which array to push the keypoints data based on whether it's user or reference side
        const keypointsArray = isUserSide ? session.allKeypointsUser : session.allKeypointsReference;
        keypointsArray.push(formattedKeypoints);  // Push the current frame's keypoints
    
        console.log("Keypoints for session", sessionId, "saved:", formattedKeypoints);
        console.log(session.allKeypointsUser);
        console.log(session.allKeypointsReference);
    
        // UI cleanup: Remove the processed image and save button
        const processedImageContainer = container.querySelector('#processed-image');
        if (processedImageContainer) {
            processedImageContainer.parentNode.removeChild(processedImageContainer);
        }
    
        const saveButton = container.querySelector('.saveKeypointsBtn');
        if (saveButton) {
            saveButton.parentNode.removeChild(saveButton);
        } else {
            console.error("Save button not found.");
        }
    
        alert('Keypoints saved!');
        exitKeypointsMode(container, sessionId, isUserSide);  // Switch back to video controls
    }


    function exitKeypointsMode(container, sessionId, isUserSide) {
        // Re-enable the video controls
        const videoControls = container.querySelectorAll('.playPauseUserBtn, .playPauseReferenceBtn, .frameScrubberUser, .frameScrubberReference, .zoom-slider, .captureFrameUser, .captureFrameReference');
        videoControls.forEach(control => control.style.display = 'block');

        const controls = container.querySelectorAll('.controls, .video-wrapper, .upload-button');
        controls.forEach(control => control.style.display = 'block');

        //hide the saveKeypointsBtn
        const saveKeypointsBtn = container.querySelector('.saveKeypointsBtn');
        saveKeypointsBtn.style.display = 'none';

        // Ensure the canvas is hidden after leaving keypoints mode
        const userCanvas = container.querySelector('.userCanvas');
        const referenceCanvas = container.querySelector('.referenceCanvas');
        if (userCanvas) {
            userCanvas.style.display = 'none';
        }
        if (referenceCanvas) {
            referenceCanvas.style.display = 'none';
        }

        console.log(isUserSide ? "User side" : "Reference side", "exited keypoints mode");
        // Resetting the keypoints index to allow for new keypoints to be added in future
        if (isUserSide) {
            sessions[sessionId].keypointsIndexUser = 0;
            sessions[sessionId].keypointsDataUser = [];
        } else {
            sessions[sessionId].keypointsIndexReference = 0;
            sessions[sessionId].keypointsDataReference = [];
        }
    }

    function getCurrentSessionKeypoints(sessionId) {
        const session = sessions[sessionId];
        const keypointsData = {
            userKeypoints: session.allKeypointsUser,
            referenceKeypoints: session.allKeypointsReference
        };
        if (!session) {
            console.error('Session not found:', sessionId);
            return null;  // Ensure to handle this case in your calling function
        }
        console.log('Keypoints data retrieved:', keypointsData);
        return {
            userKeypoints: session.allKeypointsUser,
            referenceKeypoints: session.allKeypointsReference
        };

    }

    function getCurrentSessionId() {
        return currentSessionId;
    }