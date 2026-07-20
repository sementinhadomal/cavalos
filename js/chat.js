document.addEventListener('DOMContentLoaded', () => {
    const chatBubble = document.getElementById('aiChatBubble');
    const chatNotification = document.getElementById('aiChatNotification');
    const chatBox = document.getElementById('aiChatBox');
    const chatClose = document.getElementById('aiChatClose');
    const chatMessages = document.getElementById('aiChatMessages');
    const chatInput = document.getElementById('aiChatInput');
    const chatSend = document.getElementById('aiChatSend');

    // Conversation state
    let messages = [];
    let welcomeSent = false;

    // Toggle Chatbox
    chatBubble.addEventListener('click', () => {
        if (chatBox.style.display === 'none' || chatBox.style.display === '') {
            chatBox.style.display = 'flex';
            setTimeout(() => {
                chatBox.style.opacity = '1';
                chatBox.style.transform = 'translateY(0)';
            }, 10);
            
            // Hide notification badge
            if (chatNotification) {
                chatNotification.style.display = 'none';
            }

            // Trigger welcome message once
            if (!welcomeSent) {
                sendWelcomeMessage();
            }
        } else {
            closeChat();
        }
    });

    chatClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeChat();
    });

    function closeChat() {
        chatBox.style.opacity = '0';
        chatBox.style.transform = 'translateY(20px)';
        setTimeout(() => {
            chatBox.style.display = 'none';
        }, 300);
    }

    // Append Message to UI
    function appendMessage(role, text) {
        const bubble = document.createElement('div');
        bubble.style.maxWidth = '80%';
        bubble.style.padding = '0.65rem 0.95rem';
        bubble.style.fontSize = '0.88rem';
        bubble.style.lineHeight = '1.4';
        bubble.style.wordBreak = 'break-word';
        
        if (role === 'user') {
            bubble.style.alignSelf = 'flex-end';
            bubble.style.background = 'var(--color-primary)';
            bubble.style.color = 'var(--color-white)';
            bubble.style.borderRadius = '14px 14px 0 14px';
            bubble.style.boxShadow = '0 2px 6px rgba(18,58,114,0.15)';
        } else {
            bubble.style.alignSelf = 'flex-start';
            bubble.style.background = '#e2e8f0';
            bubble.style.color = 'var(--color-text-dark)';
            bubble.style.borderRadius = '14px 14px 14px 0';
            bubble.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
        }

        // Format bold markdown (**text** to <strong>text</strong>)
        bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        chatMessages.appendChild(bubble);
        scrollToBottom();
    }

    // Scroll chat area
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Typing Indicator functions
    let typingBubble = null;
    function showTypingIndicator() {
        if (typingBubble) return;
        
        typingBubble = document.createElement('div');
        typingBubble.style.alignSelf = 'flex-start';
        typingBubble.style.background = '#e2e8f0';
        typingBubble.style.color = 'var(--color-text-dark)';
        typingBubble.style.padding = '0.65rem 0.95rem';
        typingBubble.style.borderRadius = '14px 14px 14px 0';
        typingBubble.style.display = 'flex';
        typingBubble.style.alignItems = 'center';
        typingBubble.style.gap = '0.25rem';
        typingBubble.style.fontSize = '0.88rem';
        
        typingBubble.innerHTML = `
            <style>
                @keyframes typingBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .dot {
                    animation: typingBounce 1.2s infinite;
                    display: inline-block;
                }
            </style>
            <span class="dot">•</span>
            <span class="dot" style="animation-delay: 0.2s;">•</span>
            <span class="dot" style="animation-delay: 0.4s;">•</span>
        `;
        
        chatMessages.appendChild(typingBubble);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        if (typingBubble) {
            typingBubble.remove();
            typingBubble = null;
        }
    }

    // Welcome Message flow
    function sendWelcomeMessage() {
        welcomeSent = true;
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            const welcomeText = "Olá, eu sou o Ali! 🐴 Dedico a minha vida a resgatar e alimentar cavalos abandonados e machucados nas ruas. Todo o nosso sustento vem de doações de pessoas generosas. Como posso ajudar você hoje?";
            appendMessage('assistant', welcomeText);
            messages.push({ role: 'assistant', content: welcomeText });
        }, 1200);
    }

    // Send Message Trigger
    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        appendMessage('user', text);
        messages.push({ role: 'user', content: text });

        showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });

            const data = await response.json();
            removeTypingIndicator();

            if (response.ok && data.reply) {
                appendMessage('assistant', data.reply);
                messages.push({ role: 'assistant', content: data.reply });
            } else {
                appendMessage('assistant', "Desculpe, tive um probleminha para processar a sua mensagem. Você pode doar clicando no botão 'QUERO AJUDAR AGORA' no topo do site!");
            }
        } catch (e) {
            removeTypingIndicator();
            appendMessage('assistant', "Houve um erro de rede. Se quiser doar agora, use o botão dourado 'QUERO AJUDAR AGORA' no site! 🙏");
        }
    }

    // Event Listeners for inputs
    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });
});
