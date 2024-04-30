

function fetchSuggestions(sessionId) {
    console.log('Fetching suggestions for session ID:', sessionId);

    const keypointsData = getCurrentSessionKeypoints(sessionId);
    if (!keypointsData) {
        console.error('Failed to retrieve keypoints data for session:', sessionId);
        updateSuggestionsBox('Error: Keypoints data is unavailable.', sessionId);
        return;
    }

    console.log('Keypoints data retrieved:', keypointsData);
    const formattedData = formatDataForDisplay(keypointsData);
    console.log('Formatted data:', formattedData);
    updateSuggestionsBox('Fetching suggestions... Please wait.', sessionId);

    fetch('/get-suggestions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({keypoints: formattedData})  // Send structured data
    }).then(response => response.json())
      .then(data => {
          console.log('Suggestions received:', data.suggestions);
          updateSuggestionsBox(data.suggestions, sessionId);
      })
      .catch(error => {
          console.error('Error fetching suggestions:', error);
          updateSuggestionsBox('Failed to fetch suggestions.', sessionId);
      });
}
    

function updateSuggestionsBox(message, sessionId) {
    // Convert markdown bold syntax (double asterisks) to HTML bold tags (<strong>)
    message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace newlines with HTML line breaks to maintain text structure
    message = message.replace(/\n/g, '<br>');

    // Replace numbered list formatting with HTML ordered list tags
    message = message.replace(/(\d+\.)\s/g, '</li><li><span class="numbered">$1</span> ');

    // Wrap the content in appropriate HTML tags
    message = `<div class="feedback-content"><ol><li>${message}</li></ol></div>`;

    let buttonsHtml = `
        <div class="feedback-ratings">
            <button class="thumb-btn" id="thumbsUpBtn" aria-label="Thumbs Up">&#128077;</button>
            <button class="thumb-btn" id="thumbsDownBtn" aria-label="Thumbs Down">&#128078;</button>
        </div>
    `;

    let finalHtml = buttonsHtml + message
    const suggestionsBox = sessions[sessionId].suggestionsBox;
    suggestionsBox.innerHTML = finalHtml;


     // Add event listeners for the buttons
    document.getElementById("thumbsUpBtn").onclick = function() {
        console.log("User gave a thumbs up!");
        this.style.display = 'none';
        document.getElementById("thumbsDownBtn").style.display = 'none';
    };
    document.getElementById("thumbsDownBtn").onclick = function() {
        console.log("User gave a thumbs down!");
        this.style.display = 'none';
        document.getElementById("thumbsUpBtn").style.display = 'none';
    };
}


function formatDataForDisplay(keypointsData) {
    // Assume the data is an array of arrays of keypoints for multiple frames
    const userKeypointsFormatted = keypointsData.userKeypoints.map(frame => 
        frame.reduce((acc, kp) => {
            acc[kp.keypoint] = {x: kp.x, y: kp.y};
            return acc;
        }, {})
    );

    const referenceKeypointsFormatted = keypointsData.referenceKeypoints.map(frame => 
        frame.reduce((acc, kp) => {
            acc[kp.keypoint] = {x: kp.x, y: kp.y};
            return acc;
        }, {})
    );

    // Return combined data as an object with user and reference arrays of frames
    console.log('Formatted user keypoints:', userKeypointsFormatted);
    console.log('Formatted reference keypoints:', referenceKeypointsFormatted);
    return {user: userKeypointsFormatted, reference: referenceKeypointsFormatted};
}
