"use client";

import { useState } from "react";

export default function TestWidgetPage() {
  const [apiKey, setApiKey] = useState("sk_7c7aab3ca2264d018304c8e514b0b537");
  const [testUrl, setTestUrl] = useState("https://avidtrak.com");
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  // Load widget when URL is selected
  const loadWidget = () => {
    // Remove existing widget if any
    const existingWidget = document.getElementById("simplify-summarize-widget");
    if (existingWidget) existingWidget.remove();
    const existingScript = document.getElementById("ss-widget-script");
    if (existingScript) existingScript.remove();
    const existingStyle = document.querySelector("style[data-ss-widget]");
    if (existingStyle) existingStyle.remove();

    // Set test URL globally for the widget
    (window as unknown as Record<string, string>).SIMPLIFY_SUMMARIZE_TEST_URL = testUrl;

    // Create and load widget script
    const script = document.createElement("script");
    script.id = "ss-widget-script";
    script.src = "/widget-test.js";
    script.setAttribute("data-api-key", apiKey);
    document.body.appendChild(script);

    setWidgetLoaded(true);
  };

  // Sample URLs that were crawled
  const sampleUrls = [
    "https://avidtrak.com",
    "https://avidtrak.com/call-tracking",
    "https://avidtrak.com/call-tracking-pricing",
    "https://avidtrak.com/contactus",
    "https://avidtrak.com/types-of-call-tracking-reports",
    "https://avidtrak.com/types-of-media-tracking",
  ];

  return (
    <div className="min-h-screen bg-zinc-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-zinc-900">Widget Test Page</h1>
        <p className="mb-8 text-zinc-600">
          Test the Simplify & Summarize widget without installing it on your site.
        </p>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Page URL to Test
            </label>
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://avidtrak.com"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {sampleUrls.map((url) => (
                <button
                  key={url}
                  onClick={() => setTestUrl(url)}
                  className={`rounded px-2 py-1 text-xs ${
                    testUrl === url
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {url.replace("https://avidtrak.com", "") || "/"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={loadWidget}
            disabled={!testUrl || !apiKey}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Load Widget
          </button>

          {widgetLoaded && (
            <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
              Widget loaded! Look for the floating button in the bottom-right corner.
              <br />
              Click it, then select &quot;Simplify&quot; or &quot;Summarize&quot; to test.
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Simulated Page Content
          </h2>
          <p className="text-zinc-600">
            Testing widget for: <strong>{testUrl}</strong>
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            The widget will fetch content as if you were on this page.
          </p>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h3 className="mb-2 font-semibold text-zinc-900">How to test:</h3>
          <ol className="list-inside list-decimal space-y-1 text-sm text-zinc-600">
            <li>Select a URL from the quick links or enter one manually</li>
            <li>Click &quot;Load Widget&quot;</li>
            <li>Click the floating button (bottom-right)</li>
            <li>Click &quot;Simplify&quot; or &quot;Summarize&quot;</li>
            <li>Content should appear (if approved in dashboard)</li>
          </ol>
          <p className="mt-4 text-sm text-amber-700">
            Note: Only pages you&apos;ve approved in the dashboard will show content.
          </p>
        </div>
      </div>
    </div>
  );
}
