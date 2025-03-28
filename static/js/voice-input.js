// Voice input functionality
document.addEventListener('DOMContentLoaded', function() {
    const voiceInputButton = document.getElementById('voice-input-button');
    const userMessageInput = document.getElementById('user-message');
    const messageForm = document.getElementById('message-form');
    const languageSelector = document.getElementById('language-selector');
    
    // Check browser support for Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        // Configure the recognition
        recognition.continuous = true;
        // Set language from selector if available, default to Indian English
        recognition.lang = languageSelector ? languageSelector.value : 'en-IN';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        
        let isListening = false;
        let finalTranscript = '';
        
        // Listen for language changes
        if (languageSelector) {
            languageSelector.addEventListener('change', function() {
                recognition.lang = this.value;
                console.log(`Voice recognition language set to: ${this.value}`);
            });
        }
        
        // Also check for a signal from the speech.js file
        const checkForLanguageChange = setInterval(function() {
            if (window.selectedRecognitionLanguage) {
                recognition.lang = window.selectedRecognitionLanguage;
                console.log(`Voice recognition updated to: ${window.selectedRecognitionLanguage}`);
                window.selectedRecognitionLanguage = null; // Clear the signal
            }
        }, 1000);
        
        // Start listening when button is clicked
        voiceInputButton.addEventListener('click', function() {
            if (!isListening) {
                // Start listening
                finalTranscript = '';
                
                // Update language from selector if it changed
                if (languageSelector) {
                    recognition.lang = languageSelector.value;
                    console.log(`Voice recognition language: ${languageSelector.value}`);
                }
                
                recognition.start();
                isListening = true;
                
                // Update button visual state
                voiceInputButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                voiceInputButton.classList.add('listening');
            } else {
                // Stop listening
                recognition.stop();
                isListening = false;
                
                // Update button visual state
                voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceInputButton.classList.remove('listening');
            }
        });
        
        // Process the result
        recognition.onresult = function(event) {
            let interimTranscript = '';
            
            // Process results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update input field with the current transcription
            userMessageInput.value = finalTranscript + interimTranscript;
        };
        
        // Handle errors
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            
            if (event.error === 'no-speech') {
                console.log('No speech was detected. Still listening...');
                // Don't stop listening or show alerts for no-speech in continuous mode
            } else if (event.error === 'audio-capture') {
                alert('No microphone was found. Ensure that a microphone is installed and the microphone settings are configured correctly.');
                resetRecognition();
            } else if (event.error === 'not-allowed') {
                alert('Permission to use microphone is blocked. Please allow microphone access in your browser settings.');
                resetRecognition();
            } else if (event.error === 'aborted') {
                // Do nothing, this is expected when stopping manually
            } else {
                alert('Speech recognition error occurred. Please try again.');
                resetRecognition();
            }
        };
        
        // Restart recognition when it ends (unless manually stopped)
        recognition.onend = function() {
            if (isListening) {
                // If we're still supposed to be listening, restart
                recognition.start();
            } else {
                resetRecognition();
            }
        };
        
        // Helper function to reset the recognition state
        function resetRecognition() {
            isListening = false;
            voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceInputButton.classList.remove('listening');
        }
        
        // Clean up when page unloads
        window.addEventListener('beforeunload', function() {
            clearInterval(checkForLanguageChange);
        });
    } else {
        // Hide the button if speech recognition is not supported
        voiceInputButton.style.display = 'none';
        console.warn("This browser doesn't support speech recognition");
    }
    
    // Add some CSS for the listening state
    const style = document.createElement('style');
    style.innerHTML = `
        #voice-input-button.listening {
            color: #e74c3c;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}); 