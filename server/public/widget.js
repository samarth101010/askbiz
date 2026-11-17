(function () {
  'use strict';

  // 1. Locate the widget script tag & extract configuration
  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-chatbot-id]') ||
    (function () {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  if (!currentScript) {
    console.error('[AskBiz Widget] Unable to locate script tag.');
    return;
  }

  const chatbotId = currentScript.getAttribute('data-chatbot-id');
  if (!chatbotId) {
    console.error('[AskBiz Widget] Missing data-chatbot-id attribute on script tag.');
    return;
  }

  // Derive backend base URL directly from the script source
  let serverUrl = 'http://localhost:5000';
  try {
    const scriptSrc = currentScript.getAttribute('src');
    if (scriptSrc && (scriptSrc.startsWith('http://') || scriptSrc.startsWith('https://'))) {
      serverUrl = new URL(scriptSrc).origin;
    }
  } catch (e) {
    console.warn('[AskBiz Widget] Defaulting to localhost origin.');
  }

  // Session storage key for conversation continuity
  const STORAGE_KEY = `askbiz_conv_${chatbotId}`;
  let conversationId = sessionStorage.getItem(STORAGE_KEY) || null;
  let isOpen = false;
  let botConfig = {
    name: 'AI Support',
    businessName: 'Business',
    welcomeMessage: 'Hi there! How can I help you today?',
    primaryColor: '#4F46E5',
    suggestedQuestions: []
  };

  // 2. Fetch Public Chatbot Settings
  fetch(`${serverUrl}/api/chatbots/${chatbotId}/public`)
    .then((res) => {
      if (!res.ok) throw new Error('Chatbot unavailable or paused');
      return res.json();
    })
    .then((data) => {
      if (data.success && data.chatbot) {
        botConfig = {
          name: data.chatbot.name || botConfig.name,
          businessName: data.chatbot.businessName || botConfig.businessName,
          welcomeMessage: data.chatbot.welcomeMessage || botConfig.welcomeMessage,
          primaryColor: data.chatbot.primaryColor || botConfig.primaryColor,
          suggestedQuestions: data.chatbot.suggestedQuestions || []
        };
      }
      initWidget();
    })
    .catch((err) => {
      console.warn('[AskBiz Widget] Initializing with default config:', err.message);
      initWidget();
    });

  // 3. Construct and Mount Widget DOM Elements
  function initWidget() {
    // Avoid duplicate mount
    if (document.getElementById(`askbiz-widget-${chatbotId}`)) return;

    const wrapper = document.createElement('div');
    wrapper.id = `askbiz-widget-${chatbotId}`;
    wrapper.className = 'askbiz-container';

    // Inject Scoped Styles
    const style = document.createElement('style');
    style.textContent = `
      .askbiz-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1e293b;
        line-height: 1.5;
        box-sizing: border-box;
      }
      .askbiz-container * {
        box-sizing: border-box;
      }
      .askbiz-bubble-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${botConfig.primaryColor};
        color: #ffffff;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999998;
        border: none;
        outline: none;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      }
      .askbiz-bubble-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 14px 28px -5px rgba(0, 0, 0, 0.25);
      }
      .askbiz-bubble-btn svg {
        width: 28px;
        height: 28px;
        fill: currentColor;
        transition: transform 0.2s ease;
      }
      .askbiz-window {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 380px;
        height: 560px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 20px 35px -5px rgba(15, 23, 42, 0.2), 0 10px 15px -5px rgba(15, 23, 42, 0.08);
        border: 1px solid rgba(226, 232, 240, 0.9);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 999999;
        opacity: 0;
        transform: translateY(16px) scale(0.96);
        transition: opacity 0.22s ease, transform 0.22s ease;
      }
      .askbiz-window.askbiz-open {
        display: flex;
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .askbiz-header {
        background-color: ${botConfig.primaryColor};
        color: #ffffff;
        padding: 16px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .askbiz-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .askbiz-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .askbiz-avatar svg {
        width: 20px;
        height: 20px;
        fill: #ffffff;
      }
      .askbiz-title-wrap h4 {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .askbiz-title-wrap p {
        margin: 1px 0 0;
        font-size: 11px;
        opacity: 0.85;
      }
      .askbiz-close-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.15s ease;
      }
      .askbiz-close-btn:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.15);
      }
      .askbiz-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .askbiz-msg-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        max-width: 85%;
      }
      .askbiz-msg-row.askbiz-bot {
        align-self: flex-start;
      }
      .askbiz-msg-row.askbiz-user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      .askbiz-bubble {
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 13px;
        line-height: 1.45;
        word-break: break-word;
      }
      .askbiz-bot .askbiz-bubble {
        background: #ffffff;
        color: #1e293b;
        border: 1px solid #e2e8f0;
        border-top-left-radius: 4px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      }
      .askbiz-user .askbiz-bubble {
        background-color: ${botConfig.primaryColor};
        color: #ffffff;
        border-top-right-radius: 4px;
      }
      .askbiz-chips {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .askbiz-chip-btn {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        color: #334155;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      }
      .askbiz-chip-btn:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #0f172a;
      }
      .askbiz-typing {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 10px 14px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        border-top-left-radius: 4px;
        width: fit-content;
      }
      .askbiz-dot {
        width: 6px;
        height: 6px;
        background: #94a3b8;
        border-radius: 50%;
        animation: askbizBounce 1.4s infinite ease-in-out both;
      }
      .askbiz-dot:nth-child(1) { animation-delay: -0.32s; }
      .askbiz-dot:nth-child(2) { animation-delay: -0.16s; }
      @keyframes askbizBounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      .askbiz-input-area {
        padding: 12px 14px;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .askbiz-input {
        flex: 1;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 9px 12px;
        font-size: 13px;
        outline: none;
        transition: border-color 0.15s ease;
      }
      .askbiz-input:focus {
        border-color: ${botConfig.primaryColor};
      }
      .askbiz-send-btn {
        background-color: ${botConfig.primaryColor};
        border: none;
        color: #ffffff;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: opacity 0.15s ease;
        flex-shrink: 0;
      }
      .askbiz-send-btn:hover {
        opacity: 0.9;
      }
      .askbiz-footer {
        padding: 4px 0 6px;
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
        background: #ffffff;
        border-top: 1px solid #f1f5f9;
      }
      .askbiz-footer a {
        color: #64748b;
        text-decoration: none;
        font-weight: 600;
      }
      @media (max-width: 480px) {
        .askbiz-window {
          right: 12px;
          bottom: 84px;
          width: calc(100vw - 24px);
          height: calc(100vh - 100px);
        }
      }
    `;

    document.head.appendChild(style);

    // SVG Icons
    const chatIconSvg = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`;
    const closeIconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    const botIconSvg = `<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h2a5 5 0 0 1 5 5v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5a5 5 0 0 1 5-5h2V5.72A2 2 0 0 1 10 4a2 2 0 0 1 2-2m-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-6 5h6v-1H9v1z"/></svg>`;
    const sendIconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;

    // Build Floating Button
    const bubbleBtn = document.createElement('button');
    bubbleBtn.className = 'askbiz-bubble-btn';
    bubbleBtn.setAttribute('aria-label', 'Open Customer Support Chat');
    bubbleBtn.innerHTML = chatIconSvg;

    // Build Chat Window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'askbiz-window';
    chatWindow.innerHTML = `
      <div class="askbiz-header">
        <div class="askbiz-header-left">
          <div class="askbiz-avatar">${botIconSvg}</div>
          <div class="askbiz-title-wrap">
            <h4>${botConfig.name}</h4>
            <p>${botConfig.businessName}</p>
          </div>
        </div>
        <button class="askbiz-close-btn" aria-label="Close Chat">${closeIconSvg}</button>
      </div>

      <div class="askbiz-messages" id="askbiz-msg-list">
        <!-- Initial Bot Welcome Message -->
        <div class="askbiz-msg-row askbiz-bot">
          <div class="askbiz-avatar" style="width:28px;height:28px;background:${botConfig.primaryColor};">${botIconSvg}</div>
          <div>
            <div class="askbiz-bubble">${botConfig.welcomeMessage}</div>
            ${
              botConfig.suggestedQuestions.length > 0
                ? `<div class="askbiz-chips">
                    ${botConfig.suggestedQuestions
                      .map(
                        (q) => `<button class="askbiz-chip-btn" data-question="${q}">${q}</button>`
                      )
                      .join('')}
                   </div>`
                : ''
            }
          </div>
        </div>
      </div>

      <div class="askbiz-input-area">
        <input type="text" class="askbiz-input" id="askbiz-input-field" placeholder="Ask a question..." />
        <button class="askbiz-send-btn" id="askbiz-submit-btn" aria-label="Send Message">${sendIconSvg}</button>
      </div>

      <div class="askbiz-footer">
        Powered by <a href="${serverUrl}" target="_blank" rel="noopener">AskBiz AI</a>
      </div>
    `;

    wrapper.appendChild(bubbleBtn);
    wrapper.appendChild(chatWindow);
    document.body.appendChild(wrapper);

    // Event Handlers
    const msgList = chatWindow.querySelector('#askbiz-msg-list');
    const inputField = chatWindow.querySelector('#askbiz-input-field');
    const sendBtn = chatWindow.querySelector('#askbiz-submit-btn');
    const closeBtn = chatWindow.querySelector('.askbiz-close-btn');

    function toggleChat(forceState) {
      isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
      if (isOpen) {
        chatWindow.classList.add('askbiz-open');
        bubbleBtn.innerHTML = closeIconSvg;
        setTimeout(() => inputField.focus(), 150);
      } else {
        chatWindow.classList.remove('askbiz-open');
        bubbleBtn.innerHTML = chatIconSvg;
      }
    }

    bubbleBtn.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    // Suggested Questions Click Handler
    chatWindow.addEventListener('click', function (e) {
      const chip = e.target.closest('.askbiz-chip-btn');
      if (chip) {
        const questionText = chip.getAttribute('data-question');
        if (questionText) sendMessage(questionText);
      }
    });

    // Send Message Handler
    function sendMessage(text) {
      const query = (text || inputField.value || '').trim();
      if (!query) return;

      inputField.value = '';

      // Append user bubble
      appendMessage('user', query);

      // Append typing indicator
      const typingElem = document.createElement('div');
      typingElem.className = 'askbiz-msg-row askbiz-bot';
      typingElem.id = 'askbiz-typing-indicator';
      typingElem.innerHTML = `
        <div class="askbiz-avatar" style="width:28px;height:28px;background:${botConfig.primaryColor};">${botIconSvg}</div>
        <div class="askbiz-typing">
          <div class="askbiz-dot"></div>
          <div class="askbiz-dot"></div>
          <div class="askbiz-dot"></div>
        </div>
      `;
      msgList.appendChild(typingElem);
      msgList.scrollTop = msgList.scrollHeight;

      // Call AskBiz RAG Endpoint
      fetch(`${serverUrl}/api/chat/${chatbotId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          conversationId: conversationId
        })
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch response');
          return res.json();
        })
        .then((data) => {
          removeTyping();
          if (data.success && data.answer) {
            if (data.conversationId) {
              conversationId = data.conversationId;
              sessionStorage.setItem(STORAGE_KEY, conversationId);
            }
            appendMessage('bot', data.answer);
          } else {
            appendMessage(
              'bot',
              "I'm sorry, I encountered an issue processing your request. Please try again."
            );
          }
        })
        .catch((err) => {
          removeTyping();
          console.error('[AskBiz Widget Error]:', err);
          appendMessage(
            'bot',
            "I'm sorry, I couldn't reach the support server. Please verify your connection."
          );
        });
    }

    function appendMessage(sender, text) {
      const row = document.createElement('div');
      row.className = `askbiz-msg-row askbiz-${sender}`;
      if (sender === 'bot') {
        row.innerHTML = `
          <div class="askbiz-avatar" style="width:28px;height:28px;background:${botConfig.primaryColor};">${botIconSvg}</div>
          <div class="askbiz-bubble">${escapeHtml(text)}</div>
        `;
      } else {
        row.innerHTML = `<div class="askbiz-bubble">${escapeHtml(text)}</div>`;
      }
      msgList.appendChild(row);
      msgList.scrollTop = msgList.scrollHeight;
    }

    function removeTyping() {
      const typing = document.getElementById('askbiz-typing-indicator');
      if (typing) typing.remove();
    }

    function escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    sendBtn.addEventListener('click', () => sendMessage());
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }
})();
