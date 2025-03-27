document.addEventListener('DOMContentLoaded', function() {
    // Check if browser supports the Web Speech API
    if ('speechSynthesis' in window) {
        // Get all available voices
        let voices = [];
        
        function populateVoices() {
            voices = window.speechSynthesis.getVoices();
        }
        
        populateVoices();
        
        // Chrome needs a callback for voices
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoices;
        }
        
        // Function to find the most natural sounding voice
        function getBestVoice() {
            // First try to find a high-quality English voice
            let preferredVoices = voices.filter(voice => 
                voice.lang.includes('en') && 
                (voice.name.includes('Natural') || 
                 voice.name.includes('Neural') || 
                 voice.name.includes('Premium') ||
                 voice.name.includes('Wavenet'))
            );
            
            // If we found any preferred voices, return the first one
            if (preferredVoices.length > 0) {
                return preferredVoices[0];
            }
            
            // Otherwise, just find any English voice
            let englishVoices = voices.filter(voice => voice.lang.includes('en'));
            if (englishVoices.length > 0) {
                return englishVoices[0];
            }
            
            // If no English voice, return null and use default
            return null;
        }
        
        // Get all speak buttons
        const speakButtons = document.querySelectorAll('.speak-btn');
        
        // Add click event to each button
        speakButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get the text content from the parent message
                const messageContent = this.closest('.message-content');
                const textToSpeak = messageContent.textContent.replace('Listen to this response', '').trim();
                
                // Stop any ongoing speech
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                    
                    // Remove speaking class from all buttons
                    document.querySelectorAll('.speak-btn').forEach(btn => {
                        btn.classList.remove('speaking');
                    });
                    
                    // If the button that was clicked is the one that's speaking, just stop and return
                    if (this.classList.contains('speaking')) {
                        this.classList.remove('speaking');
                        return;
                    }
                }
                
                // Add speaking class to the button
                this.classList.add('speaking');
                
                const currentLanguage = 'en-IN';
                
                // Create a new speech synthesis utterance
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                
                // Choose the best available voice for the selected language
                const bestVoice = getBestVoiceForLanguage(currentLanguage);
                if (bestVoice) {
                    utterance.voice = bestVoice;
                }
                
                // Set properties for more natural speech
                utterance.lang = currentLanguage;
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                
                // Add natural pauses with commas and periods
               // utterance.text = textToSpeak.replace(/\./g, '.<break time="0.7s"/>').replace(/,/g, ',<break time="0.3s"/>');
                
                // Event when speech is done
                utterance.onend = () => {
                    this.classList.remove('speaking');
                };
                
                // Event for speech errors
                utterance.onerror = () => {
                    this.classList.remove('speaking');
                    console.error('Speech synthesis error');
                };
                
                // Speak!
                window.speechSynthesis.speak(utterance);
            });
        });
    } else {
        console.warn('Text-to-speech not supported in this browser');
        
        // Hide all speak buttons
        document.querySelectorAll('.speak-btn').forEach(button => {
            button.style.display = 'none';
        });
    }
    
    // Add event listeners for newly added messages
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const newButtons = mutation.target.querySelectorAll('.speak-btn:not([data-initialized])');
                newButtons.forEach(button => {
                    button.setAttribute('data-initialized', 'true');
                    
                    button.addEventListener('click', function() {
                        const messageContent = this.closest('.message-content');
                        const textToSpeak = messageContent.textContent.replace('Listen to this response', '').trim();
                        
                        if (window.speechSynthesis.speaking) {
                            window.speechSynthesis.cancel();
                            document.querySelectorAll('.speak-btn').forEach(btn => {
                                btn.classList.remove('speaking');
                            });
                            
                            if (this.classList.contains('speaking')) {
                                this.classList.remove('speaking');
                                return;
                            }
                        }
                        
                        this.classList.add('speaking');
                        const utterance = new SpeechSynthesisUtterance(textToSpeak);
                        
                        // Get best voice for dynamically added buttons too
                        const bestVoice = window.speechSynthesis.getVoices().find(voice => 
                            voice.lang.includes('en') && 
                            (voice.name.includes('Natural') || 
                             voice.name.includes('Neural') || 
                             voice.name.includes('Premium') ||
                             voice.name.includes('Wavenet'))
                        );
                        
                        if (bestVoice) {
                            utterance.voice = bestVoice;
                        }
                        
                        utterance.lang = 'en-US';
                        utterance.rate = 1.0;
                        utterance.pitch = 1.0;
                        
                        utterance.onend = () => this.classList.remove('speaking');
                        utterance.onerror = () => {
                            this.classList.remove('speaking');
                            console.error('Speech synthesis error');
                        };
                        
                        window.speechSynthesis.speak(utterance);
                    });
                });
            }
        });
    });
    
    observer.observe(document.getElementById('chat-messages'), { childList: true, subtree: true });
}); 

// Add this function to the speech.js file (near the getBestVoice function)
function getBestVoiceForLanguage(languageCode) {
    // Get all available voices
    const allVoices = window.speechSynthesis.getVoices();
    
    // Try to find a voice that exactly matches the language code
    let matchingVoices = allVoices.filter(voice => voice.lang === languageCode);
    
    // If we found matching voices, prioritize ones with "natural" or "premium" in their name
    if (matchingVoices.length > 0) {
        const naturalVoice = matchingVoices.find(voice => 
            voice.name.includes('Natural') || 
            voice.name.includes('Neural') || 
            voice.name.includes('Premium') ||
            voice.name.includes('Wavenet')
        );
        
        if (naturalVoice) return naturalVoice;
        return matchingVoices[0];
    }
    
    // If no exact match, try to find a voice that matches the language part (e.g., 'hi' from 'hi-IN')
    const languageBase = languageCode.split('-')[0];
    matchingVoices = allVoices.filter(voice => voice.lang.startsWith(languageBase + '-'));
    
    if (matchingVoices.length > 0) return matchingVoices[0];
    
    // Fallback to any available voice for the region (e.g., 'en-IN' if available)
    const regionVoices = allVoices.filter(voice => voice.lang.endsWith('-IN'));
    if (regionVoices.length > 0) return regionVoices[0];
    
    // Last resort: return null and let the browser choose
    return null;
} 