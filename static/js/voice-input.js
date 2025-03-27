document.addEventListener('DOMContentLoaded', function() {
    const micButton = document.getElementById('mic-btn');
    const userInput = document.getElementById('user-input');
    
    // Set default language to English (India)
    const currentLanguage = 'en-IN';
    
    // Check if browser supports the Web Speech API for speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Create a speech recognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Configure the speech recognition
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLanguage;
        
        // Set the document language for accessibility
        document.documentElement.lang = currentLanguage.split('-')[0];
        
        // Set placeholder text
        userInput.placeholder = 'Describe your symptoms or ask a health question...';
        
        // Variables to track recording state
        let isRecording = false;
        let finalTranscript = '';
        
        // Function to start/stop recording
        micButton.addEventListener('click', function() {
            if (!isRecording) {
                // Start recording
                finalTranscript = '';
                recognition.start();
                micButton.classList.add('recording');
                
                // Show a brief message in the text area
                const originalText = userInput.value;
                const originalPlaceholder = userInput.placeholder;
                userInput.placeholder = 'Listening... (click mic again to stop)';
                
                // Store the original values to restore later
                userInput.dataset.originalPlaceholder = originalPlaceholder;
                userInput.dataset.originalText = originalText;
            } else {
                // Stop recording
                recognition.stop();
                micButton.classList.remove('recording');
                
                // Restore the original placeholder
                if (userInput.dataset.originalPlaceholder) {
                    userInput.placeholder = userInput.dataset.originalPlaceholder;
                }
            }
        });
        
        // Handle the results of speech recognition
        recognition.onresult = function(event) {
            let interimTranscript = '';
            
            // Loop through the results
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                // Get the transcript
                const transcript = event.results[i][0].transcript;
                
                // Check if the result is final
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update the text area with recognized speech
            userInput.value = finalTranscript + interimTranscript;
            
            // Auto-resize the textarea if needed
            userInput.style.height = 'auto';
            userInput.style.height = (userInput.scrollHeight) + 'px';
        };
        
        // Handle the end of speech recognition
        recognition.onend = function() {
            if (isRecording) {
                try {
                    // Try to restart if we were still recording
                    recognition.start();
                } catch (e) {
                    console.error('Failed to restart speech recognition:', e);
                    isRecording = false;
                    micButton.classList.remove('recording');
                    
                    if (userInput.dataset.originalPlaceholder) {
                        userInput.placeholder = userInput.dataset.originalPlaceholder;
                    }
                }
            }
        };
        
        // Handle starting of speech recognition
        recognition.onstart = function() {
            isRecording = true;
        };
        
        // Handle errors
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            
            // Show error message
            if (event.error !== 'aborted') {
                userInput.placeholder = 'Error: ' + event.error + '. Try again.';
                
                setTimeout(() => {
                    if (userInput.dataset.originalPlaceholder) {
                        userInput.placeholder = userInput.dataset.originalPlaceholder;
                    }
                }, 3000);
            }
            
            isRecording = false;
            micButton.classList.remove('recording');
        };
        
        // Stop recording if page is hidden
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && isRecording) {
                recognition.stop();
                isRecording = false;
                micButton.classList.remove('recording');
            }
        });
        
    } else {
        // Browser doesn't support speech recognition
        console.warn('Speech recognition not supported in this browser');
        micButton.style.display = 'none';
    }
}); 