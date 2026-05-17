const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Array to store the conversation history
let conversationHistory = JSON.parse(localStorage.getItem('chat_history')) || [];

// Fungsi untuk menyimpan riwayat ke localStorage
const saveHistory = () => localStorage.setItem('chat_history', JSON.stringify(conversationHistory));

// Tampilkan riwayat yang tersimpan saat halaman dimuat
conversationHistory.forEach(msg => {
  const displaySender = msg.role === 'model' ? 'bot' : 'user';
  const msgElement = appendMessage(displaySender, msg.text, false);
  // Terapkan formatting (seperti bold) jika itu pesan dari bot
  if (displaySender === 'bot') renderFormattedText(msgElement, msg.text);
});

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage, true); // Add user message to history
  input.value = '';

  // Add a temporary "Thinking..." message from the bot
  const thinkingMessageElement = appendMessage('bot', 'Gemini is thinking...', false); // Don't add to history yet

  // Send the conversation to the backend
  sendConversationToBackend(thinkingMessageElement);
});

async function sendConversationToBackend(thinkingMessageElement) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation: conversationHistory }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.result) {
      // Replace "Thinking..." message with the formatted actual AI response
      renderFormattedText(thinkingMessageElement, data.result);
      // Add the AI response to the conversation history
      conversationHistory.push({ role: 'model', text: data.result });
      saveHistory();
    } else {
      thinkingMessageElement.textContent = 'Sorry, no response received.';
      conversationHistory.push({ role: 'model', text: 'Sorry, no response received.' });
      saveHistory();
    }
  } catch (error) {
    console.error('Error sending message to backend:', error);
    thinkingMessageElement.textContent = 'Failed to get response from server.';
    conversationHistory.push({ role: 'model', text: 'Failed to get response from server.' });
    saveHistory();
    console.log(error);
  }
}

function renderFormattedText(element, text) {
  // Convert **text** to <b>text</b> and handle newlines
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  element.innerHTML = formatted;
}

function appendMessage(sender, text, addToHistory = true) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.style.display = 'block'; // Ensure messages are not side-by-side
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (addToHistory) {
    conversationHistory.push({ role: sender, text: text });
    saveHistory();
  }
  return msg; // Return the message element for later modification (e.g., "Thinking...")
}
