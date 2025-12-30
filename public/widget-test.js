(function() {
  'use strict';

  // Configuration
  const WIDGET_ID = 'simplify-summarize-widget';
  const API_BASE = window.location.origin;

  // Get API key from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-api-key]');
  const API_KEY = scriptTag?.getAttribute('data-api-key') || '';

  if (!API_KEY) {
    console.error('Simplify & Summarize: Missing data-api-key attribute');
    return;
  }

  // Styles
  const styles = `
    #${WIDGET_ID} {
      --ss-primary: #18181b;
      --ss-primary-hover: #27272a;
      --ss-bg: #ffffff;
      --ss-text: #18181b;
      --ss-text-secondary: #71717a;
      --ss-border: #e4e4e7;
      --ss-shadow: 0 10px 40px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.5;
    }

    #${WIDGET_ID} * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    #${WIDGET_ID}-buttons {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 999998;
    }

    #${WIDGET_ID}-buttons button {
      padding: 12px 20px;
      border-radius: 8px;
      background: var(--ss-primary);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: var(--ss-shadow);
      font-size: 14px;
      font-weight: 500;
      transition: transform 0.2s, background 0.2s;
      white-space: nowrap;
    }

    #${WIDGET_ID}-buttons button:hover {
      background: var(--ss-primary-hover);
      transform: scale(1.02);
    }

    #${WIDGET_ID}-buttons button.active {
      background: #2563eb;
    }

    #${WIDGET_ID}-panel {
      position: fixed;
      bottom: 24px;
      right: 180px;
      width: 700px;
      max-width: calc(100vw - 220px);
      max-height: calc(100vh - 48px);
      background: var(--ss-bg);
      border-radius: 16px;
      box-shadow: var(--ss-shadow);
      z-index: 999999;
      display: none;
      flex-direction: column;
      overflow: hidden;
    }

    #${WIDGET_ID}-panel.open {
      display: flex;
    }

    #${WIDGET_ID}-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--ss-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    #${WIDGET_ID}-title {
      font-weight: 600;
      color: var(--ss-text);
    }

    #${WIDGET_ID}-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: var(--ss-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #${WIDGET_ID}-close:hover {
      color: var(--ss-text);
    }

    #${WIDGET_ID}-content {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
      color: var(--ss-text);
      max-height: 700px;
      font-size: 17px;
      line-height: 1.7;
    }

    #${WIDGET_ID}-content.loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }

    #${WIDGET_ID}-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--ss-border);
      border-top-color: var(--ss-primary);
      border-radius: 50%;
      animation: ss-spin 0.8s linear infinite;
    }

    @keyframes ss-spin {
      to { transform: rotate(360deg); }
    }

    #${WIDGET_ID}-error {
      color: #dc2626;
      text-align: center;
      padding: 20px;
    }

    @media (max-width: 640px) {
      #${WIDGET_ID}-panel {
        bottom: 120px;
        right: 16px;
        left: 16px;
        width: auto;
        max-width: 100%;
        max-height: calc(100vh - 140px);
      }

      #${WIDGET_ID}-buttons {
        bottom: 16px;
        right: 16px;
      }
    }
  `;

  // Icons
  const icons = {
    close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
  };

  // State
  let activeType = null;
  let cache = {};

  // Create widget HTML
  function createWidget() {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Create container
    const container = document.createElement('div');
    container.id = WIDGET_ID;
    container.innerHTML = `
      <div id="${WIDGET_ID}-buttons">
        <button data-type="simplify">Simplify this page</button>
        <button data-type="summarize">Summarize this page</button>
      </div>
      <div id="${WIDGET_ID}-panel" role="dialog" aria-labelledby="${WIDGET_ID}-title">
        <div id="${WIDGET_ID}-header">
          <span id="${WIDGET_ID}-title">Simplified Content</span>
          <button id="${WIDGET_ID}-close" aria-label="Close">${icons.close}</button>
        </div>
        <div id="${WIDGET_ID}-content"></div>
      </div>
    `;
    document.body.appendChild(container);

    // Bind events
    document.getElementById(`${WIDGET_ID}-close`).addEventListener('click', closePanel);

    const actionButtons = container.querySelectorAll(`#${WIDGET_ID}-buttons button`);
    actionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');

        // Toggle off if clicking same button
        if (activeType === type) {
          closePanel();
          return;
        }

        loadContent(type);

        // Update active state
        actionButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeType = type;

        // Update panel title
        document.getElementById(`${WIDGET_ID}-title`).textContent =
          type === 'simplify' ? 'Simplified Content' : 'Summary';
      });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeType) {
        closePanel();
      }
    });
  }

  function closePanel() {
    activeType = null;
    document.getElementById(`${WIDGET_ID}-panel`).classList.remove('open');
    document.querySelectorAll(`#${WIDGET_ID}-buttons button`).forEach(b => b.classList.remove('active'));
  }

  async function loadContent(type) {
    const panel = document.getElementById(`${WIDGET_ID}-panel`);
    const contentEl = document.getElementById(`${WIDGET_ID}-content`);

    // Use test URL if available, otherwise use actual URL
    const currentUrl = window.SIMPLIFY_SUMMARIZE_TEST_URL ||
                       window.location.href.split('#')[0].replace(/\/$/, '');

    console.log('Fetching content for URL:', currentUrl);

    // Open panel
    panel.classList.add('open');

    // Check cache
    const cacheKey = `${type}:${currentUrl}`;
    if (cache[cacheKey]) {
      contentEl.innerHTML = formatContent(cache[cacheKey]);
      return;
    }

    // Show loading
    contentEl.className = 'loading';
    contentEl.innerHTML = `<div id="${WIDGET_ID}-spinner"></div>`;

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/content?url=${encodeURIComponent(currentUrl)}&type=${type}`,
        {
          headers: {
            'X-API-Key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load content');
      }

      const data = await response.json();
      cache[cacheKey] = data.content;

      contentEl.className = '';
      contentEl.innerHTML = formatContent(data.content);
    } catch (error) {
      contentEl.className = '';
      contentEl.innerHTML = `<div id="${WIDGET_ID}-error">${error.message}</div>`;
    }
  }

  function formatContent(content) {
    // Convert line breaks to paragraphs
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    return paragraphs.map(p => `<p style="margin-bottom: 1em;">${escapeHtml(p)}</p>`).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
