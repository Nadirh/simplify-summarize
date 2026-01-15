(function() {
  'use strict';

  // Configuration
  const WIDGET_ID = 'simplify-summarize-widget';
  const API_BASE = window.SIMPLIFY_SUMMARIZE_API || 'https://simplify-summarize.vercel.app';

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

    #${WIDGET_ID}-content strong {
      font-weight: 600;
    }

    #${WIDGET_ID}-content em {
      font-style: italic;
    }

    #${WIDGET_ID}-content u {
      text-decoration: underline;
    }

    #${WIDGET_ID}-content mark {
      background-color: #fef08a;
      padding: 0 2px;
      border-radius: 2px;
    }

    #${WIDGET_ID}-content p {
      margin-bottom: 1.5em;
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
  let panelOpenTime = null;
  let maxScrollDepth = 0;
  let keyboardNavigationDetected = false;

  // Generate or retrieve visitor ID (persisted in localStorage)
  function getVisitorId() {
    const key = 'ss_visitor_id';
    try {
      let id = localStorage.getItem(key);
      const isReturn = !!id;
      if (!id) {
        id = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem(key, id);
      }
      return { id, isReturn };
    } catch (e) {
      // localStorage not available (private browsing, etc.)
      return { id: 'v_anonymous', isReturn: false };
    }
  }

  // Generate session ID (new per page load)
  const sessionId = 's_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  const visitorData = getVisitorId();

  // Track which features used in session
  let featuresUsedInSession = new Set();

  // Detect potential screen reader or accessibility tool usage
  function detectScreenReader() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasForcedColors = window.matchMedia('(forced-colors: active)').matches;
    return prefersReducedMotion || hasForcedColors || keyboardNavigationDetected;
  }

  // Track keyboard navigation (tab key usage)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      keyboardNavigationDetected = true;
    }
  }, { once: true });

  // Setup scroll depth tracking for content element
  function setupScrollTracking(contentEl) {
    contentEl.addEventListener('scroll', function onScroll() {
      const scrollHeight = contentEl.scrollHeight - contentEl.clientHeight;
      if (scrollHeight > 0) {
        const depth = Math.round((contentEl.scrollTop / scrollHeight) * 100);
        maxScrollDepth = Math.max(maxScrollDepth, depth);
      }
    });
  }

  // Analytics tracking - fire and forget, never blocks UI
  function trackEvent(eventData) {
    fetch(`${API_BASE}/api/v1/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        ...eventData,
        page_url: window.location.href.split('#')[0].replace(/\/$/, ''),
        session_id: sessionId,
        visitor_id: visitorData.id,
        is_return_visitor: visitorData.isReturn,
        screen_reader_detected: detectScreenReader(),
      }),
    }).catch(() => {
      // Silently ignore analytics failures - never impact user experience
    });
  }

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

        // Track the click event and features used in session
        featuresUsedInSession.add(type);
        trackEvent({
          event_type: 'click',
          content_type: type,
        });

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
    // Track panel close with duration and scroll depth if panel was open
    if (panelOpenTime && activeType) {
      const durationSeconds = (Date.now() - panelOpenTime) / 1000;
      trackEvent({
        event_type: 'panel_close',
        content_type: activeType,
        duration_seconds: Math.round(durationSeconds * 100) / 100, // 2 decimal places
        scroll_depth: maxScrollDepth,
      });
    }

    panelOpenTime = null;
    activeType = null;
    maxScrollDepth = 0; // Reset for next panel open
    document.getElementById(`${WIDGET_ID}-panel`).classList.remove('open');
    document.querySelectorAll(`#${WIDGET_ID}-buttons button`).forEach(b => b.classList.remove('active'));
  }

  async function loadContent(type) {
    const panel = document.getElementById(`${WIDGET_ID}-panel`);
    const contentEl = document.getElementById(`${WIDGET_ID}-content`);
    const currentUrl = window.location.href.split('#')[0].replace(/\/$/, '');

    // Open panel and capture open time for duration tracking
    panel.classList.add('open');
    panelOpenTime = Date.now();

    // Cache disabled for now to ensure fresh content during QA
    // const cacheKey = `${type}:${currentUrl}`;
    // if (cache[cacheKey]) {
    //   contentEl.innerHTML = formatContent(cache[cacheKey]);
    //   return;
    // }

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
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const err = new Error(errorData.error || 'Failed to load content');
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      // cache[cacheKey] = data.content;

      contentEl.className = '';
      contentEl.innerHTML = formatContent(data.content);

      // Setup scroll tracking for this content
      maxScrollDepth = 0; // Reset when new content loads
      setupScrollTracking(contentEl);
    } catch (error) {
      // Track the error event
      trackEvent({
        event_type: 'error',
        content_type: type,
        error_message: error.message,
        error_code: String(error.status || 'unknown'),
      });

      contentEl.className = '';
      contentEl.innerHTML = `<div id="${WIDGET_ID}-error">${error.message}</div>`;
    }
  }

  // Allowed HTML tags for rich text content
  const ALLOWED_TAGS = ['p', 'strong', 'em', 'u', 'mark', 'span', 'br'];
  const ALLOWED_ATTRS = ['style', 'class'];
  const ALLOWED_STYLE_PROPS = ['color', 'font-size', 'font-family', 'background-color'];

  function sanitizeHtml(html) {
    // Create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Recursively sanitize nodes
    function sanitizeNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const tagName = node.tagName.toLowerCase();

      // Remove disallowed tags but keep their text content
      if (!ALLOWED_TAGS.includes(tagName)) {
        let text = '';
        node.childNodes.forEach(child => {
          text += sanitizeNode(child);
        });
        return text;
      }

      // Sanitize attributes
      let attrs = '';
      for (const attr of Array.from(node.attributes)) {
        if (ALLOWED_ATTRS.includes(attr.name.toLowerCase())) {
          if (attr.name.toLowerCase() === 'style') {
            // Filter style properties
            const sanitizedStyle = sanitizeStyle(attr.value);
            if (sanitizedStyle) {
              attrs += ` style="${sanitizedStyle}"`;
            }
          } else {
            attrs += ` ${attr.name}="${escapeHtml(attr.value)}"`;
          }
        }
      }

      // Process children
      let innerHTML = '';
      node.childNodes.forEach(child => {
        innerHTML += sanitizeNode(child);
      });

      // Self-closing tags
      if (tagName === 'br') {
        return '<br>';
      }

      return `<${tagName}${attrs}>${innerHTML}</${tagName}>`;
    }

    function sanitizeStyle(style) {
      const props = style.split(';').filter(p => p.trim());
      const sanitized = props.filter(prop => {
        const [name] = prop.split(':').map(s => s.trim());
        return ALLOWED_STYLE_PROPS.includes(name.toLowerCase());
      });
      return sanitized.join('; ');
    }

    let result = '';
    temp.childNodes.forEach(child => {
      result += sanitizeNode(child);
    });

    return result;
  }

  function isHtmlContent(content) {
    return /<[a-z][\s\S]*>/i.test(content);
  }

  function formatContent(content) {
    // If content contains HTML tags, sanitize and return
    if (isHtmlContent(content)) {
      return sanitizeHtml(content);
    }

    // Legacy plain text handling (backward compatibility)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
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
