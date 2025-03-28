// Text-to-speech functionality with multi-language support
function speakText(button) {
    // Check if we're already speaking
    if (window.speechSynthesis.speaking) {
        // If speaking, stop it
        window.speechSynthesis.cancel();
        
        // Reset the icon
        const icon = button.querySelector('i');
        icon.classList.remove('fa-volume-mute');
        icon.classList.add('fa-volume-up');
        
        return;
    }
    
    // Get the text to speak (the parent element's text, excluding the button itself)
    const messageContent = button.parentElement;
    let textToSpeak = '';
    
    // Get all text nodes (excluding the button)
    for (let i = 0; i < messageContent.childNodes.length; i++) {
        const node = messageContent.childNodes[i];
        // If it's a text node or not the button
        if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node !== button)) {
            textToSpeak += node.textContent;
        }
    }
    
    // Clean up the text (optional)
    textToSpeak = textToSpeak.trim();
    
    // Check browser support
    if ('speechSynthesis' in window) {
        // Stop any ongoing speech
        window.speechSynthesis.cancel();
        
        // Create a new speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Get the selected language
        const languageSelector = document.getElementById('language-selector');
        const selectedLanguage = languageSelector ? languageSelector.value : 'en-IN'; // Default to Indian English
        
        // Set the language
        utterance.lang = selectedLanguage;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // Select the appropriate voice
        selectVoice(utterance, selectedLanguage);
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        
        // Visual feedback - change button icon while speaking
        const icon = button.querySelector('i');
        icon.classList.remove('fa-volume-up');
        icon.classList.add('fa-volume-mute');
        
        // When speech ends, restore the icon
        utterance.onend = function() {
            icon.classList.remove('fa-volume-mute');
            icon.classList.add('fa-volume-up');
        };
    } else {
        alert('Sorry, your browser does not support text-to-speech!');
    }
}

// Function to select the best voice for the utterance
function selectVoice(utterance, language) {
    const voices = window.speechSynthesis.getVoices();
    console.log(`Available voices: ${voices.length}`);
    
    if (voices.length === 0) {
        console.log('No voices available');
        return;
    }
    
    // Log all available voices for debugging
    voices.forEach((voice, i) => {
        console.log(`Voice ${i}: ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
    });
    
    // Try to find voices in this priority order:
    // 1. Female Indian English (en-IN) or Hindi (hi-IN) based on selected language
    // 2. Any Indian English/Hindi voice
    // 3. Any female voice for the selected language
    // 4. Any voice for the selected language
    // 5. Default voice
    
    const langPrefix = language.split('-')[0]; // Get language code without region (e.g., 'en', 'hi')
    
    // First, try to find a female voice with exact match for Indian English/Hindi
    const femaleIndianVoice = voices.find(voice => 
        voice.lang === language && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') ||
         voice.name.toLowerCase().includes('girl'))
    );
    
    if (femaleIndianVoice) {
        console.log(`Using female ${language} voice: ${femaleIndianVoice.name}`);
        utterance.voice = femaleIndianVoice;
        return;
    }
    
    // Second, try any Indian English/Hindi voice
    const anyIndianVoice = voices.find(voice => voice.lang === language);
    if (anyIndianVoice) {
        console.log(`Using ${language} voice: ${anyIndianVoice.name}`);
        utterance.voice = anyIndianVoice;
        return;
    }
    
    // Third, try any female voice for the language prefix (e.g., any 'en' or 'hi' voice)
    const femaleLangVoice = voices.find(voice => 
        voice.lang.startsWith(langPrefix) && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') ||
         voice.name.toLowerCase().includes('girl'))
    );
    
    if (femaleLangVoice) {
        console.log(`Using female ${langPrefix} voice: ${femaleLangVoice.name}`);
        utterance.voice = femaleLangVoice;
        return;
    }
    
    // Fourth, try any voice for the language prefix
    const anyLangVoice = voices.find(voice => voice.lang.startsWith(langPrefix));
    if (anyLangVoice) {
        console.log(`Using ${langPrefix} voice: ${anyLangVoice.name}`);
        utterance.voice = anyLangVoice;
        return;
    }
    
    // Fifth, try any female voice
    const anyFemaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('girl')
    );
    
    if (anyFemaleVoice) {
        console.log(`Using any female voice: ${anyFemaleVoice.name}`);
        utterance.voice = anyFemaleVoice;
        return;
    }
    
    // If all else fails, use the first available voice
    console.log(`No matching voice found, using default: ${voices[0].name}`);
}

// Function to populate available voices
function populateVoiceList() {
    const voices = window.speechSynthesis.getVoices();
    const languageSelector = document.getElementById('language-selector');
    
    if (!languageSelector) return;
    
    // Clear previous options
    languageSelector.innerHTML = '';
    
    // Add default options for Indian languages
    const indianLanguages = [
        { code: 'en-IN', name: 'English (India)' },
        { code: 'hi-IN', name: 'Hindi' },
        { code: 'ta-IN', name: 'Tamil' },
        { code: 'te-IN', name: 'Telugu' },
        { code: 'bn-IN', name: 'Bengali' },
        { code: 'mr-IN', name: 'Marathi' },
        { code: 'gu-IN', name: 'Gujarati' },
        { code: 'kn-IN', name: 'Kannada' },
        { code: 'ml-IN', name: 'Malayalam' }
    ];
    
    // Create option elements
    indianLanguages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        
        // Check if there's a matching voice available
        const hasVoice = voices.some(voice => voice.lang.startsWith(lang.code.split('-')[0]));
        
        // Add a note if no voice is available
        if (!hasVoice) {
            option.textContent += ' (may use fallback voice)';
        }
        
        languageSelector.appendChild(option);
    });
    
    // Set default to Hindi if available, otherwise English (India)
    if (languageSelector.querySelector('option[value="hi-IN"]')) {
        languageSelector.value = 'hi-IN';
    } else {
        languageSelector.value = 'en-IN';
    }
    
    console.log(`Populated ${indianLanguages.length} language options, default: ${languageSelector.value}`);
}

// Update voice input recognition language when text-to-speech language changes
function updateVoiceRecognitionLanguage() {
    const languageSelector = document.getElementById('language-selector');
    if (!languageSelector) return;
    
    languageSelector.addEventListener('change', function() {
        const selectedLanguage = this.value;
        
        // Try to update the speech recognition language if it's active
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            // This is a signal for the voice-input.js script
            window.selectedRecognitionLanguage = selectedLanguage;
            console.log(`Set recognition language to: ${selectedLanguage}`);
        }
    });
}

// Initialize voices when the page loads
if ('speechSynthesis' in window) {
    // For Chrome
    window.speechSynthesis.onvoiceschanged = function() {
        populateVoiceList();
        updateVoiceRecognitionLanguage();
    };
    
    // For Firefox/Safari
    setTimeout(function() {
        if (window.speechSynthesis.getVoices().length > 0) {
            populateVoiceList();
            updateVoiceRecognitionLanguage();
        }
    }, 1000);
}

// Initialize the language selector when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create and add the language selector if it doesn't exist
    if (!document.getElementById('language-selector')) {
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            const languageContainer = document.createElement('div');
            languageContainer.className = 'language-selector-container';
            
            const label = document.createElement('label');
            label.htmlFor = 'language-selector';
            label.textContent = 'Language: ';
            
            const select = document.createElement('select');
            select.id = 'language-selector';
            select.name = 'language-selector';
            
            languageContainer.appendChild(label);
            languageContainer.appendChild(select);
            
            // Insert before the reset button
            const resetForm = chatHeader.querySelector('.reset-form');
            chatHeader.insertBefore(languageContainer, resetForm);
            
            // Try to populate the list immediately
            if (window.speechSynthesis.getVoices().length > 0) {
                populateVoiceList();
                updateVoiceRecognitionLanguage();
            }
        }
    }
}); 