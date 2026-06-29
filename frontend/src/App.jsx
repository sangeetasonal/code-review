import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

import {
  Menu, Sun, Moon, Keyboard, Trash2, Square,
  Rocket, Copy, Download, Code2, Bot, Sparkles,
  ChevronDown, FileCode, AlertTriangle, Play,
  Terminal, BrainCircuit,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import ScoreRing from "./components/ScoreRing";
import ShortcutsModal from "./components/ShortcutsModal";
import { useToast } from "./components/ToastProvider";
import { detectLanguage } from "./utils/detectLanguage";

// ─── Constants ──────────────────────────────────────────────────────────────
const MAX_CHARS = 15000;
const MAX_HISTORY = 10;
const BACKEND =
  import.meta.env.VITE_BACKEND_API || "http://localhost:3000/ai/get-review";

const LANGUAGES = [
  { value: "javascript",  label: "JavaScript" },
  { value: "typescript",  label: "TypeScript" },
  { value: "python",      label: "Python" },
  { value: "java",        label: "Java" },
  { value: "cpp",         label: "C++" },
  { value: "c",           label: "C" },
  { value: "csharp",      label: "C#" },
  { value: "go",          label: "Go" },
  { value: "rust",        label: "Rust" },
  { value: "php",         label: "PHP" },
  { value: "ruby",        label: "Ruby" },
  { value: "swift",       label: "Swift" },
  { value: "kotlin",      label: "Kotlin" },
  { value: "sql",         label: "SQL" },
  { value: "html",        label: "HTML" },
  { value: "css",         label: "CSS" },
  { value: "shell",       label: "Shell" },
  { value: "plaintext",   label: "Plain Text" },
];

const MODES = [
  { value: "standard",    label: "Standard" },
  { value: "nitpicky",    label: "Nitpicky" },
  { value: "security",    label: "Security" },
  { value: "performance", label: "Performance" },
];

const DEFAULT_CODE = `// Paste your code here to start reviewing...
`;

// ─── Helpers ────────────────────────────────────────────────────────────────
const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem("cr_history") || "[]"); }
  catch { return []; }
};
const saveHistory = (h) => localStorage.setItem("cr_history", JSON.stringify(h));

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const { addToast } = useToast();

  const [dark, setDark] = useState(() => localStorage.getItem("cr_theme") !== "light");
  
  // Multi-file state
  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem("cr_files");
      return saved ? JSON.parse(saved) : [{ id: "default", name: "index.js", code: DEFAULT_CODE, language: "javascript" }];
    } catch {
      return [{ id: "default", name: "index.js", code: DEFAULT_CODE, language: "javascript" }];
    }
  });
  const [activeFileId, setActiveFileId] = useState(() => {
    return localStorage.getItem("cr_active_file") || "default";
  });
  
  // Custom rules & settings
  const [customRules, setCustomRules] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("none");
  const [activeTab, setActiveTab] = useState("explorer");
  const [restrictAIHelp, setRestrictAIHelp] = useState(false); // Interviewer mode lock

  const [autoLang, setAutoLang]     = useState(null);
  const [strictness, setStrictness] = useState("standard");
  const [review, setReview]         = useState("");
  const [streaming, setStreaming]   = useState(false);
  const [error, setError]           = useState("");
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [shortcutsOpen, setShortcutsOpen]   = useState(false);
  const [history, setHistory]               = useState(loadHistory);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const abortRef = useRef(null);

  // Console output state
  const [activeRightTab, setActiveRightTab] = useState("review"); // review or output
  const [consoleLogs, setConsoleLogs] = useState([]);



  const [aiHelpActive, setAiHelpActive] = useState(false);

  // Sync interviewer restrict state to turn off autocompletion suggestions
  useEffect(() => {
    if (restrictAIHelp) {
      setAiHelpActive(false);
    }
  }, [restrictAIHelp]);

  // Derived active file properties
  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || { id: "default", name: "index.js", code: "", language: "javascript" };
  const code = activeFile.code;
  const language = activeFile.language;

  // Persist files and active file
  useEffect(() => {
    localStorage.setItem("cr_files", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem("cr_active_file", activeFileId);
  }, [activeFileId]);

  // ─── Theme ─────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("cr_theme", dark ? "dark" : "light");
  }, [dark]);

  // ─── Auto language detection (debounced) ───────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = detectLanguage(code);
      setAutoLang(result);
      if (result.confidence === "high" || result.confidence === "medium") {
        setFiles((prev) =>
          prev.map((f) => (f.id === activeFileId ? { ...f, language: result.language } : f))
        );
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [code, activeFileId]);

  // Code editor onChange handler
  const handleCodeChange = (newCode) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, code: newCode } : f))
    );
  };

  const handleLanguageChange = (newLang) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, language: newLang } : f))
    );
  };

  // Preset rules configuration
  const PRESET_RULES = {
    "clean-code": "Ensure code adheres to SOLID principles. Check for descriptive naming, modular design, low coupling, high cohesion, small functions, and clear separation of concerns.",
    "security-owasp": "Audit strictly for security risks. Look out for SQL injection, XSS, CSRF, insecure credentials, data exposures, missing validation, and untrusted execution inputs. Keep OWASP Top 10 guidelines in mind.",
    "performance-optimization": "Focus on execution speed and memory footprints. Identify sub-optimal algorithms, excessive looping, duplicate computations, blocking actions, leaks, and recommend profiling/indexing."
  };

  // ─── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); reviewCode(); }
      if (e.ctrlKey && e.key === "l")     { e.preventDefault(); handleCodeChange(""); addToast("Editor cleared", "info"); }
      if (e.ctrlKey && e.key === "/")     { e.preventDefault(); setShortcutsOpen((v) => !v); }
      if (e.key === "Escape") {
        if (shortcutsOpen) setShortcutsOpen(false);
        else if (sidebarOpen) setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ─── SSE Streaming Review ──────────────────────────────────────────────
  const reviewCode = useCallback(async () => {
    if (streaming || !code.trim() || code.length > MAX_CHARS) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStreaming(true);
    setError("");
    setReview("");
    setActiveHistoryId(null);
    setActiveRightTab("review"); // switch back to review

    const presetRules = PRESET_RULES[selectedPreset] || "";
    const rulesToSend = `${presetRules}\n${customRules}`.trim();

    try {
      const res = await fetch(BACKEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, strictness, customRules: rulesToSend }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6).trim());
            if (parsed.done) break;
            if (parsed.chunk) { accumulated += parsed.chunk; setReview(accumulated); }
          } catch { /* skip */ }
        }
      }

      if (accumulated) {
        const entry = {
          id: Date.now(), language, strictness,
          codeSnippet: code.trim().slice(0, 80),
          review: accumulated,
          createdAt: new Date().toISOString(),
        };
        setHistory((prev) => {
          const updated = [entry, ...prev].slice(0, MAX_HISTORY);
          saveHistory(updated);
          return updated;
        });
        setActiveHistoryId(entry.id);
        addToast("Review complete!", "success");
      }
    } catch (err) {
      if (err.name !== "AbortError") { setError(err.message); addToast(err.message, "error"); }
    } finally {
      setStreaming(false);
    }
  }, [code, language, strictness, customRules, selectedPreset, streaming, addToast]);

  const stopStream = () => { abortRef.current?.abort(); setStreaming(false); };

  const copyReview = async () => {
    if (!review) return;
    await navigator.clipboard.writeText(review);
    addToast("Copied to clipboard", "success");
  };

  const exportMd = () => {
    if (!review) return;
    const blob = new Blob(
      [`# AI Code Review\n\n**Language:** ${language} | **Mode:** ${strictness}\n\n---\n\n${review}`],
      { type: "text/markdown" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `code-review-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    addToast("Exported as Markdown", "success");
  };

  const selectHistory = (item) => {
    setReview(item.review);
    setStrictness(item.strictness);
    setError("");
    setActiveHistoryId(item.id);
    setActiveRightTab("review"); // show review output
  };

  const deleteHistory = (id) => {
    setHistory((prev) => { const u = prev.filter((h) => h.id !== id); saveHistory(u); return u; });
    if (activeHistoryId === id) { setActiveHistoryId(null); setReview(""); }
    addToast("Review deleted", "info");
  };

  const clearHistory = () => {
    setHistory([]); saveHistory([]); setActiveHistoryId(null);
    addToast("History cleared", "warning");
  };

  // Interactive Code Execution Runner
  const runCode = async () => {
    setActiveRightTab("output");
    setConsoleLogs([{ type: "system", text: "Compiling and executing code... 🚀" }]);
    
    if (!code.trim()) {
      setConsoleLogs((prev) => [...prev, { type: "error", text: "Error: Code panel is empty." }]);
      return;
    }

    const isJSOrTS = ["javascript", "typescript"].includes(language);
    if (isJSOrTS) {
      const logs = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = (...args) => {
        logs.push({
          type: "log",
          text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
        });
        originalLog.apply(console, args);
      };
      console.error = (...args) => {
        logs.push({
          type: "error",
          text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
        });
        originalError.apply(console, args);
      };
      console.warn = (...args) => {
        logs.push({
          type: "warn",
          text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
        });
        originalWarn.apply(console, args);
      };

      try {
        // Shadow window.print to prevent triggering browser print dialogs
        const sandboxedCode = `var print = console.log;\n${code}`;
        const result = window.eval(sandboxedCode);
        if (result !== undefined) {
          logs.push({
            type: "system",
            text: `Returned: ${typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)}`,
          });
        }
      } catch (err) {
        logs.push({ type: "error", text: `Uncaught Exception: ${err.message}` });
      }

      // Restore consoles
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      setConsoleLogs((prev) => [...prev, ...logs]);
    } else {
      // Backend Execution for other languages!
      setConsoleLogs((prev) => [
        ...prev,
        { type: "system", text: `Running compiler backend environment for language "${language}"...\n` },
      ]);

      try {
        const runCodeUrl = BACKEND.replace("/get-review", "/run-code");
        const res = await fetch(runCodeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(body.error || `Request failed (${res.status})`);
        }

        const data = await res.json();
        const logs = [];
        if (data.stdout) {
          logs.push({ type: "log", text: data.stdout });
        }
        if (data.stderr) {
          logs.push({ type: "error", text: data.stderr });
        }
        logs.push({
          type: "system",
          text: `\nProcess finished with exit code ${data.exitCode}`,
        });

        setConsoleLogs((prev) => [...prev, ...logs]);
      } catch (err) {
        setConsoleLogs((prev) => [
          ...prev,
          { type: "error", text: `Execution failed: ${err.message}` },
        ]);
      }
    }
  };



  // Workspace file action helper definitions
  const mapExtensionToLanguage = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "py":
        return "python";
      case "java":
      case "kt":
        return "java";
      case "cpp":
      case "cc":
      case "h":
        return "cpp";
      case "c":
        return "c";
      case "cs":
        return "csharp";
      case "go":
        return "go";
      case "rs":
        return "rust";
      case "php":
        return "php";
      case "rb":
        return "ruby";
      case "swift":
        return "swift";
      case "sql":
        return "sql";
      case "html":
        return "html";
      case "css":
        return "css";
      case "sh":
      case "bash":
        return "shell";
      default:
        return "plaintext";
    }
  };

  const handleCreateFile = (name) => {
    const lang = mapExtensionToLanguage(name);
    const newFile = {
      id: String(Date.now()),
      name,
      code: `// File: ${name}\n\n`,
      language: lang,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    addToast(`Created file ${name}`, "success");
  };

  const handleDeleteFile = (id) => {
    if (files.length <= 1) return;
    const remaining = files.filter((f) => f.id !== id);
    setFiles(remaining);
    if (activeFileId === id) {
      setActiveFileId(remaining[0].id);
    }
    addToast("File removed from workspace", "info");
  };

  const handleUploadFiles = (fileObjects) => {
    fileObjects.forEach((fileObj) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const newFile = {
          id: String(Date.now() + Math.random()),
          name: fileObj.name,
          code: text,
          language: mapExtensionToLanguage(fileObj.name),
        };
        setFiles((prev) => {
          const filtered = prev.filter((f) => f.name !== newFile.name);
          return [...filtered, newFile];
        });
        setActiveFileId(newFile.id);
        addToast(`Imported ${fileObj.name}`, "success");
      };
      reader.readAsText(fileObj);
    });
  };

  const charPercent = code.length / MAX_CHARS;
  const showSkeleton = streaming && !review;

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-[#030014] dark:text-gray-100 overflow-hidden cyber-bg">
      {/* Sleek top neon accent bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 flex-shrink-0 z-[100]" />

      {/* ════════════════════════════ HEADER ════════════════════════════ */}
      <header className="h-12 flex items-center justify-between px-4 bg-white/80 dark:bg-[#080616]/75 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.05] flex-shrink-0 z-50">
        <div className="flex items-center gap-2.5">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-550 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer"
            aria-label="Toggle history"
          >
            <Menu size={18} />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20">
              <Code2 size={13} className="text-white animate-pulse" />
            </div>
            <span className="text-sm font-extrabold tracking-tight hidden sm:inline">
              AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500">Code</span> Reviewer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShortcutsOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer"
            title="Shortcuts (Ctrl+/)"
          >
            <Keyboard size={16} />
          </button>
          <button
            onClick={() => setDark((d) => !d)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer"
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ════════════════════════════ TOOLBAR ═══════════════════════════ */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white/50 dark:bg-[#070514]/30 backdrop-blur-lg border-b border-gray-200 dark:border-white/[0.05] flex-shrink-0 flex-wrap">
        {/* Language Dropdown */}
        <div className="flex items-center gap-2">
          <FileCode size={13} className="text-gray-400" />
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="h-8 pl-3 pr-8 bg-gray-100/60 dark:bg-white/[0.04] border border-gray-250 dark:border-white/[0.05] hover:border-violet-500/20 dark:hover:border-white/[0.1] rounded-xl text-xs text-gray-700 dark:text-gray-300 font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300"
            >
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {autoLang && autoLang.confidence !== "low" && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-bold animate-[fadeIn_0.3s_ease-out]">
              <Sparkles size={10} className="animate-spin [animation-duration:8s]" />
              Auto: {LANGUAGES.find((l) => l.value === autoLang.language)?.label}
            </span>
          )}
        </div>

        {/* Character Progress */}
        <div className="ml-auto flex items-center gap-2.5">
          <div className="w-16 h-1 bg-gray-200 dark:bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                charPercent > 1 ? "bg-red-500" : charPercent > 0.8 ? "bg-amber-505" : "bg-violet-500"
              }`}
              style={{ width: `${Math.min(charPercent * 100, 100)}%` }}
            />
          </div>
          <span className={`text-[10px] font-mono font-bold tabular-nums ${
            charPercent > 1 ? "text-red-400" : charPercent > 0.8 ? "text-amber-400" : "text-gray-405 dark:text-gray-500"
          }`}>
            {code.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ════════════════════════════ WORKSPACE ═════════════════════════ */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          files={files}
          activeFileId={activeFileId}
          onSelectFile={setActiveFileId}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onUploadFiles={handleUploadFiles}
          history={history}
          activeId={activeHistoryId}
          onSelectHistory={selectHistory}
          onDeleteHistory={deleteHistory}
          onClearAllHistory={clearHistory}
          customRules={customRules}
          setCustomRules={setCustomRules}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          strictness={strictness}
          setStrictness={setStrictness}
          restrictAIHelp={restrictAIHelp}
          setRestrictAIHelp={setRestrictAIHelp}
        />

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row p-3 gap-3">
          {/* ──── LEFT: Editor Panel ──── */}
          <section className="flex-1 flex flex-col border border-gray-200 dark:border-white/[0.05] rounded-2xl overflow-hidden glass-panel editor-glow min-h-0 shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50/60 dark:bg-white/[0.01] border-b border-gray-200 dark:border-white/[0.05] flex-shrink-0">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                <Code2 size={12} className="text-violet-500" /> Editor · {activeFile.name}
              </span>
              <div className="flex items-center gap-2">
                {/* AI Assist Autocomplete Toggle */}
                <button
                  onClick={() => {
                    if (restrictAIHelp) {
                      addToast("AI assistance has been restricted by your interviewer.", "error");
                    } else {
                      setAiHelpActive((active) => {
                        const next = !active;
                        addToast(`AI Assist Auto-suggestions ${next ? "enabled" : "disabled"}`, "info");
                        return next;
                      });
                    }
                  }}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer border ${
                    restrictAIHelp
                      ? "text-gray-400 dark:text-gray-655 bg-red-500/5 border-red-500/10 cursor-not-allowed"
                      : aiHelpActive
                      ? "text-white bg-gradient-to-r from-emerald-500 to-teal-600 border-transparent shadow-md shadow-emerald-500/20"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border-gray-300 dark:border-white/10"
                  }`}
                  title={restrictAIHelp ? "AI Assist (Disabled by Interviewer)" : `Toggle AI Auto-suggestions (Current: ${aiHelpActive ? "ON" : "OFF"})`}
                >
                  <BrainCircuit size={12} />
                  {aiHelpActive ? "Assist: ON" : "Assist: OFF"}
                </button>


                {/* Run code Button */}
                <button
                  onClick={runCode}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:text-emerald-600 dark:text-emerald-455 hover:bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                  title="Run Code Output"
                >
                  <Play size={12} /> Run
                </button>

                <button
                  onClick={() => { handleCodeChange(""); addToast("Editor cleared", "info"); }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-505 hover:text-red-500 dark:hover:text-red-400 px-2.5 py-1 rounded-lg hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={12} /> Clear
                </button>
                {streaming ? (
                  <button
                    onClick={stopStream}
                    className="h-8 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-650 hover:opacity-95 active:scale-95 transition-all duration-350 flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-500/10"
                  >
                    <Square size={11} /> Stop
                  </button>
                ) : (
                  <button
                    onClick={reviewCode}
                    disabled={!code.trim() || code.length > MAX_CHARS}
                    className="h-8 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 hover:opacity-95 shadow-md shadow-violet-500/10 hover:shadow-violet-500/25 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-350 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Rocket size={11} /> Review
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={language}
                value={code}
                theme={dark ? "vs-dark" : "light"}
                onChange={(val) => handleCodeChange(val || "")}
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  lineNumbers: "on",
                  minimap: { enabled: true, scale: 1 },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  renderLineHighlight: "all",
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  padding: { top: 10, bottom: 10 },
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                  tabSize: 2,
                  quickSuggestions: aiHelpActive ? { other: true, comments: true, strings: true } : false,
                  suggestOnTriggerCharacters: aiHelpActive,
                  parameterHints: { enabled: aiHelpActive },
                  wordBasedSuggestions: aiHelpActive ? "all" : "off",
                }}
              />
            </div>
          </section>

          {/* ──── RIGHT: Review & Output Panel ──── */}
          <section className="flex-1 flex flex-col border border-gray-200 dark:border-white/[0.05] rounded-2xl overflow-hidden glass-panel min-h-0 shadow-lg">
            {/* Multi-tab Selector Header */}
            <div className="flex items-center justify-between px-4 bg-gray-55/60 dark:bg-white/[0.01] border-b border-gray-200 dark:border-white/[0.05] flex-shrink-0 h-10">
              <div className="flex gap-4 h-full">
                {/* AI Review Tab */}
                <button
                  onClick={() => setActiveRightTab("review")}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer h-full px-1 ${
                    activeRightTab === "review"
                      ? "border-violet-500 text-violet-500 dark:text-violet-400"
                      : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  }`}
                >
                  <Bot size={12} /> AI Review
                </button>

                {/* Console Output Tab */}
                <button
                  onClick={() => setActiveRightTab("output")}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer h-full px-1 ${
                    activeRightTab === "output"
                      ? "border-violet-500 text-violet-500 dark:text-violet-400"
                      : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  }`}
                >
                  <Terminal size={12} /> Console Output
                </button>
              </div>

              {/* Action buttons (only show for Review tab) */}
              {activeRightTab === "review" && review && !streaming && (
                <div className="flex items-center gap-1.5">
                  <button onClick={copyReview} className="flex items-center gap-1 text-[11px] font-semibold text-gray-505 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-500/5 dark:hover:bg-violet-500/10 px-2 py-0.5 rounded transition-colors cursor-pointer">
                    <Copy size={11} /> Copy
                  </button>
                  <button onClick={exportMd} className="flex items-center gap-1 text-[11px] font-semibold text-gray-550 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-500/5 dark:hover:bg-violet-500/10 px-2 py-0.5 rounded transition-colors cursor-pointer">
                    <Download size={11} /> Export
                  </button>
                </div>
              )}

              {/* Clear logs button (only show for Output tab) */}
              {activeRightTab === "output" && consoleLogs.length > 0 && (
                <button
                  onClick={() => setConsoleLogs([])}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-505 hover:text-red-500 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Clear Console Logs"
                >
                  <Trash2 size={11} /> Clear
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth min-h-0">
              {activeRightTab === "review" ? (
                <div className="p-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* Streaming state info */}
                  {streaming && review && (
                    <div className="flex items-center gap-2 mb-4 px-3.5 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-400 font-semibold animate-pulse-glow">
                      <span className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-450 animate-pulse" />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-450 animate-pulse [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-450 animate-pulse [animation-delay:0.4s]" />
                      </span>
                      AI Reviewer analyzing...
                    </div>
                  )}

                  {/* Skeleton loading block */}
                  {showSkeleton && (
                    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                      <div className="skeleton-line h-6 w-48" />
                      <div className="skeleton-line h-4 w-full" />
                      <div className="skeleton-line h-4 w-5/6" />
                      <div className="skeleton-line h-4 w-3/4" />
                      <div className="skeleton-line h-24 w-full mt-3" />
                      <div className="skeleton-line h-4 w-2/3" />
                      <div className="skeleton-line h-4 w-full" />
                    </div>
                  )}

                  {/* Error state */}
                  {error && !streaming && (
                    <div className="flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-450">
                      <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-rose-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Review Markdown output */}
                  {review && (
                    <>
                      <ScoreRing reviewText={review} />
                      <div className="review-md">
                        <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
                      </div>
                    </>
                  )}

                  {/* Minimal empty state */}
                  {!review && !streaming && !error && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 px-6 gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
                        <Code2 size={24} className="text-violet-500" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-550 dark:text-gray-400">System Ready</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[250px] leading-relaxed font-semibold">
                        Paste any code blocks in the left pane, choose review options, then submit or press{" "}
                        <kbd className="px-1.5 py-0.5 bg-gray-150 dark:bg-white/[0.05] border border-gray-250 dark:border-white/10 rounded-md text-[10px] font-mono">Ctrl+Enter</kbd>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Terminal Outputs Panel */
                <div className="h-full flex flex-col bg-black/95 dark:bg-[#04020a]/95 text-gray-200 font-mono p-4 overflow-y-auto space-y-1.5 scrollbar-thin text-xs">
                  {consoleLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-600 gap-2 py-20">
                      <Terminal size={22} className="text-violet-500/60" />
                      <p className="font-semibold">Terminal console empty</p>
                      <p className="text-[10px] max-w-[200px] leading-relaxed">Click "Run" in the editor header to execute your code.</p>
                    </div>
                  ) : (
                    consoleLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`whitespace-pre-wrap select-text leading-relaxed tracking-wide ${
                          log.type === "error"
                            ? "text-red-450 border-l-2 border-red-500 pl-2 my-0.5"
                            : log.type === "warn"
                            ? "text-amber-400 border-l-2 border-amber-500 pl-2 my-0.5"
                            : log.type === "system"
                            ? "text-violet-400 italic"
                            : "text-emerald-400"
                        }`}
                      >
                        {log.text}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ════════════════════════════ FOOTER ════════════════════════════ */}
      <footer className="h-7 flex items-center justify-between px-3 bg-white/60 dark:bg-[#0f0f1a]/40 backdrop-blur-lg border-t border-gray-200 dark:border-white/[0.06] flex-shrink-0">
        <span className="text-[10px] text-gray-400 dark:text-gray-600">
          Built by{" "}
          <a href="https://github.com/sangeetasonal" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">Sangeeta Sonal</a>
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Gemini 2.5 Flash · Free
        </span>
      </footer>

      {/* ════════════════════════════ MODALS ════════════════════════════ */}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </div>
  );
}
