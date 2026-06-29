import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const runCode = async (req, res) => {
  const { code, language } = req.body;

  if (typeof code !== "string") {
    return res.status(400).json({ error: "code (string) is required in the body." });
  }

  // Create temporary directory in user's system temp dir
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-runner-"));
  
  let fileName = "";
  let runCommand = "";

  const lang = (language || "plaintext").toLowerCase();

  switch (lang) {
    case "javascript":
      fileName = "script.js";
      runCommand = `node "${fileName}"`;
      break;
    case "typescript":
      fileName = "script.ts";
      runCommand = `npx ts-node "${fileName}"`;
      break;
    case "python":
      fileName = "script.py";
      runCommand = `python "${fileName}"`;
      break;
    case "java":
      fileName = "Main.java";
      runCommand = `java "${fileName}"`;
      break;
    case "cpp":
    case "c++":
      fileName = "main.cpp";
      runCommand = `g++ "${fileName}" -o main.exe && main.exe`;
      break;
    case "c":
      fileName = "main.c";
      runCommand = `gcc "${fileName}" -o main.exe && main.exe`;
      break;
    case "go":
      fileName = "main.go";
      runCommand = `go run "${fileName}"`;
      break;
    case "rust":
      fileName = "main.rs";
      runCommand = `rustc "${fileName}" -o main.exe && main.exe`;
      break;
    case "php":
      fileName = "script.php";
      runCommand = `php "${fileName}"`;
      break;
    case "ruby":
      fileName = "script.rb";
      runCommand = `ruby "${fileName}"`;
      break;
    default:
      fileName = "script.js";
      runCommand = `node "${fileName}"`;
      break;
  }

  const filePath = path.join(tempDir, fileName);

  try {
    // Write code to temporary file
    fs.writeFileSync(filePath, code);

    // Run code with 8 seconds timeout to prevent hanging loops
    exec(runCommand, { cwd: tempDir, timeout: 8000 }, (error, stdout, stderr) => {
      // Clean up directory and files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error("Cleanup error:", err);
      }

      if (error && error.killed) {
        return res.json({
          stdout: stdout || "",
          stderr: (stderr || "") + "\nExecution Timeout: Terminated after 8 seconds (potential infinite loop).",
          exitCode: -1
        });
      }

      res.json({
        stdout: stdout || "",
        stderr: stderr || "",
        exitCode: error ? error.code : 0
      });
    });
  } catch (err) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
    res.status(500).json({ error: `Internal runner error: ${err.message}` });
  }
};

export { runCode };
