# 🚀 Project Portability: "The Superpowers Sync"

This guide ensures that the advanced agentic setup of the **SoapBuddy** ecosystem can be replicated perfectly in any new environment. By following these steps, you will sync the **Agent Teams**, **240+ Specialized Skills**, and **MCP Servers** (Supabase, Vercel, NotebookLM).

---

## 🏗️ 1. Core MCP Infrastructure
The `mcp_config.json` in this directory is the "Source of Truth" for your server integrations.

### **Installation (New Machine)**
1.  **Locate Claude Config**: Typically at `~/.config/Claude/claude_desktop_config.json`.
2.  **Inject Master Config**: Merge the contents of `/mcp_config.json` into the `mcpServers` block.
3.  **Authenticate NotebookLM**: 
    ```bash
    pipx install notebooklm-mcp-server
    notebooklm-mcp-auth
    ```

---

## 👥 2. Agent Teams & Orchestration
The workspace is configured for autonomous parallel execution.

### **Activation**
1.  **Enable Environment Variable**: Add this to your `.bashrc` or `.zshrc`:
    ```bash
    export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
    ```
2.  **Verify Patterns**: Reference `AGENT_TEAMS.md` for coordination protocols between Lead and Teammate agents.

---

## 🧙‍♂️ 3. Master Skills Sync
The project utilizes a library of ~240 AI skills for UI excellence, security auditing, and full-stack development.

### **Global Setup**
Run the global installation script to ensure the new environment has all "Superpowers" active:
```bash
~/install_global_skills.sh
```
*Reference `MASTER_SKILLS.md` for the full capability index.*

---

## 🗝️ 4. Secret Management
Ensure the following variables are present in your session or `.env` files:

| Service | Token Type | Source |
| :--- | :--- | :--- |
| **Supabase** | `sbp_...` | Dashboard > Account Tokens |
| **Vercel** | `vcp_...` | Dashboard > Settings > Tokens |
| **NotebookLM** | Browser Cookies | Automated via `notebooklm-mcp-auth` |

---

## 📊 5. Knowledge ingestion
After syncing, the most critical step is ensuring the AI's "Long-Term Memory" is updated:
1.  Open the **NotebookLM** Dashboard.
2.  Select the **SoapBuddy Development** notebook.
3.  Upload the latest `EXECUTION_JOURNAL.md` and `mcp_config.json`.

---

**SoapBuddy Stack Status: READY FOR AGENTIC DEPLOYMENT**
