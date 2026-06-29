import React, { useState, useRef } from "react";
import {
  FolderOpen,
  Clock,
  Sliders,
  Plus,
  Upload,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  FileCode,
  FileJson,
  FileText,
  Terminal,
  Database,
  Coffee,
  Code2,
  Check
} from "lucide-react";

const formatDate = (iso) => {
  const d = new Date(iso);
  return (
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " · " +
    d.toLocaleDateString([], { month: "short", day: "numeric" })
  );
};

const getFileIcon = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return <FileCode size={14} className="text-amber-500" />;
    case "py":
      return <Terminal size={14} className="text-blue-500" />;
    case "java":
    case "kt":
    case "kts":
      return <Coffee size={14} className="text-red-500" />;
    case "json":
      return <FileJson size={14} className="text-purple-400" />;
    case "sql":
      return <Database size={14} className="text-emerald-500" />;
    case "html":
    case "css":
      return <Code2 size={14} className="text-orange-500" />;
    case "sh":
    case "bash":
      return <Terminal size={14} className="text-sky-400" />;
    default:
      return <FileText size={14} className="text-gray-400" />;
  }
};

const PRESETS = [
  {
    value: "none",
    label: "No Preset (Standard)",
    description: "Standard code review focusing on standard bugs, quality, and improvements.",
    rules: ""
  },
  {
    value: "clean-code",
    label: "Clean Code & SOLID",
    description: "Prioritizes design patterns, naming conventions, and architectural cohesion.",
    rules: "Ensure code adheres to SOLID principles. Check for descriptive naming, modular design, low coupling, high cohesion, small functions, and clear separation of concerns."
  },
  {
    value: "security-owasp",
    label: "OWASP & Security Hardening",
    description: "Prioritizes secure programming practices and vulnerability scanning.",
    rules: "Audit strictly for security risks. Look out for SQL injection, XSS, CSRF, insecure credentials, data exposures, missing validation, and untrusted execution inputs. Keep OWASP Top 10 guidelines in mind."
  },
  {
    value: "performance-optimization",
    label: "High Performance & Big-O",
    description: "Prioritizes memory management, efficiency, and algorithmic speed.",
    rules: "Focus on execution speed and memory footprints. Identify sub-optimal algorithms, excessive looping, duplicate computations, blocking actions, leaks, and recommend profiling/indexing."
  }
];

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onUploadFiles,
  history,
  activeId,
  onSelectHistory,
  onDeleteHistory,
  onClearAllHistory,
  customRules,
  setCustomRules,
  selectedPreset,
  setSelectedPreset,
  strictness,
  setStrictness,
  restrictAIHelp,
  setRestrictAIHelp,
}) {
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName("");
      setShowNewFileInput(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      onUploadFiles(Array.from(e.target.files));
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-full flex-shrink-0 z-40 relative">
      {/* ─── ACTIVITY BAR (Vertical Strip) ─── */}
      <div className="w-14 h-full flex flex-col justify-between items-center py-4 activity-bar border-r border-gray-200 dark:border-white/[0.05] z-50">
        <div className="flex flex-col gap-5 items-center w-full">
          {/* Files Tab Button */}
          <button
            onClick={() => {
              if (activeTab === "explorer" && sidebarOpen) {
                setSidebarOpen(false);
              } else {
                setActiveTab("explorer");
                setSidebarOpen(true);
              }
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all relative group cursor-pointer ${
              activeTab === "explorer" && sidebarOpen
                ? "bg-violet-500/10 text-violet-500 dark:text-violet-400 tab-glow"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-600 dark:hover:text-gray-200"
            }`}
            title="Files Explorer"
          >
            <FolderOpen size={18} />
            <span className="absolute left-16 px-2 py-1 rounded bg-gray-900 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
              Files Explorer
            </span>
          </button>

          {/* History Tab Button */}
          <button
            onClick={() => {
              if (activeTab === "history" && sidebarOpen) {
                setSidebarOpen(false);
              } else {
                setActiveTab("history");
                setSidebarOpen(true);
              }
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all relative group cursor-pointer ${
              activeTab === "history" && sidebarOpen
                ? "bg-violet-500/10 text-violet-500 dark:text-violet-400 tab-glow"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-600 dark:hover:text-gray-200"
            }`}
            title="Review History"
          >
            <Clock size={18} />
            <span className="absolute left-16 px-2 py-1 rounded bg-gray-900 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
              Review History
            </span>
          </button>

          {/* Settings / Rules Tab Button */}
          <button
            onClick={() => {
              if (activeTab === "rules" && sidebarOpen) {
                setSidebarOpen(false);
              } else {
                setActiveTab("rules");
                setSidebarOpen(true);
              }
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all relative group cursor-pointer ${
              activeTab === "rules" && sidebarOpen
                ? "bg-violet-500/10 text-violet-500 dark:text-violet-400 tab-glow"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-600 dark:hover:text-gray-200"
            }`}
            title="Review Settings"
          >
            <Sliders size={18} />
            <span className="absolute left-16 px-2 py-1 rounded bg-gray-900 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
              Review Settings
            </span>
          </button>
        </div>

        {/* Bottom Expand / Collapse Arrow */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-450 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-600 dark:hover:text-gray-200 transition-all cursor-pointer"
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* ─── SIDEBAR CONTENT PANEL ─── */}
      <div
        className={`h-[calc(100vh-48px-28px)] bg-white/95 dark:bg-[#070514]/95 backdrop-blur-2xl border-r border-gray-200 dark:border-white/[0.05] flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-40
          lg:relative lg:top-auto lg:left-auto lg:h-full lg:shadow-none
          fixed top-12 left-14 shadow-2xl
          ${sidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none"}
        `}
      >
        {/* Active Tab: EXPLORER */}
        {activeTab === "explorer" && (
          <div
            className="flex-1 flex flex-col h-full overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onUploadFiles(Array.from(e.dataTransfer.files));
              }
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.01]">
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Workspace Files
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowNewFileInput(!showNewFileInput)}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-violet-500 hover:bg-violet-500/10 transition-all cursor-pointer"
                  title="Create new file"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={triggerUpload}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-violet-500 hover:bg-violet-500/10 transition-all cursor-pointer"
                  title="Upload local files"
                >
                  <Upload size={13} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.php,.rb,.swift,.kt,.kts,.sql,.html,.css,.sh,.bash,.txt"
                />
              </div>
            </div>

            {/* Inline New File input */}
            {showNewFileInput && (
              <form onSubmit={handleCreateSubmit} className="p-2.5 border-b border-gray-200 dark:border-white/[0.05] bg-violet-500/5 flex items-center gap-1.5 animate-[fadeIn_0.2s_ease-out]">
                <input
                  type="text"
                  placeholder="e.g. index.js, script.py"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex-1 h-7 px-2 bg-white dark:bg-black/40 border border-gray-250 dark:border-white/[0.08] rounded text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-violet-500"
                  autoFocus
                />
                <button type="submit" className="w-6 h-6 flex items-center justify-center rounded bg-violet-600 text-white hover:bg-violet-750 transition-colors">
                  <Check size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFileInput(false);
                    setNewFileName("");
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <X size={12} />
                </button>
              </form>
            )}

            {/* Files List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 border rounded-xl cursor-pointer file-card ${
                    activeFileId === file.id
                      ? "file-card-active border-violet-500/30"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-6">
                    {getFileIcon(file.name)}
                    <span className={`text-xs truncate ${
                      activeFileId === file.id
                        ? "text-violet-500 dark:text-violet-300 font-bold"
                        : "text-gray-600 dark:text-gray-400 font-medium"
                    }`}>
                      {file.name}
                    </span>
                  </div>

                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }}
                      className="absolute right-2.5 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 dark:text-gray-650 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Drag & Drop Hint */}
            <div className="p-3.5 border-t border-gray-200 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.01] text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-normal">
                Tip: You can drag & drop source files here to review multiple modules!
              </p>
            </div>
          </div>
        )}

        {/* Active Tab: HISTORY */}
        {activeTab === "history" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.01]">
              <h3 className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-widest">
                Review History
              </h3>
              {history.length > 0 && (
                <button
                  onClick={onClearAllHistory}
                  className="flex items-center gap-1 text-[9px] font-bold text-red-500/80 hover:text-red-500 px-2 py-1 rounded hover:bg-red-500/10 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <Trash2 size={11} /> Clear All
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <Inbox size={26} className="text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">No reviews yet</p>
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1 leading-relaxed">
                    Review your code and the history logs will appear here.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative px-3 py-2.5 rounded-xl cursor-pointer border transition-all duration-300 ${
                      activeId === item.id
                        ? "bg-violet-500/10 border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.05)] translate-x-0.5"
                        : "border-transparent hover:bg-gray-100/50 dark:hover:bg-white/[0.02] hover:border-gray-250 dark:hover:border-white/[0.04] hover:translate-x-0.5"
                    }`}
                    onClick={() => onSelectHistory(item)}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider">
                        {item.language}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 capitalize">
                        {item.strictness}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate pr-6">
                      {item.codeSnippet}
                    </p>
                    <p className="text-[9px] text-gray-350 dark:text-gray-600 mt-1">
                      {formatDate(item.createdAt)}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistory(item.id);
                      }}
                      className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded text-gray-350 dark:text-gray-650 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Delete from history"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Active Tab: RULES & SETTINGS */}
        {activeTab === "rules" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.01]">
              <h3 className="text-[10px] font-bold text-gray-550 dark:text-gray-400 uppercase tracking-widest">
                Review Settings
              </h3>
            </div>

            {/* Content Form wrapper */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
              {/* Strictness Selection */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Review Focus / Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {["standard", "nitpicky", "security", "performance"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setStrictness(mode)}
                      className={`px-2 py-2 border rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                        strictness === mode
                          ? "bg-violet-500/15 border-violet-500 text-violet-600 dark:text-violet-400"
                          : "border-gray-200 dark:border-white/[0.06] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/[0.12] hover:bg-white/[0.02]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Mode Lock */}
              <div className="p-3 bg-violet-500/5 dark:bg-white/[0.01] border border-violet-500/10 dark:border-white/[0.04] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                    Interviewer Mode
                  </span>
                  <span className="block text-[10px] text-gray-450 dark:text-gray-500 mt-0.5 leading-normal">
                    Restrict AI coding assistance
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restrictAIHelp}
                    onChange={(e) => setRestrictAIHelp(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-gray-200 dark:bg-white/[0.08] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              {/* Presets Selection */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Instruction Presets
                </label>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full h-9 px-3 bg-gray-100/60 dark:bg-white/[0.04] border border-gray-250 dark:border-white/[0.05] rounded-xl text-xs text-gray-700 dark:text-gray-300 font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all duration-300"
                >
                  {PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {selectedPreset !== "none" && (
                  <p className="mt-2 text-[10px] text-gray-450 dark:text-gray-500 leading-normal italic px-1 bg-white/[0.01] border-l-2 border-violet-500/50 pl-2">
                    {PRESETS.find((p) => p.value === selectedPreset)?.description}
                  </p>
                )}
              </div>

              {/* Custom Additional Guidelines */}
              <div className="flex flex-col flex-1 min-h-0">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Additional Rules (Custom)
                </label>
                <textarea
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  placeholder="e.g. Enforce ES6 arrow functions. Require JSDoc tags for all classes. Keep complexity low."
                  className="w-full flex-1 h-32 p-3 bg-gray-100/40 dark:bg-black/20 border border-gray-250 dark:border-white/[0.05] rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-sans leading-relaxed scrollbar-thin guidelines-textarea"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
