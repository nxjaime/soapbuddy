# 🔐 How to Push to GitHub

GitHub no longer accepts passwords for command-line access. You must use a **Personal Access Token (PAT)**.

## 1. Generate a Token
1. Log in to [GitHub.com](https://github.com).
2. Go to **Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
3. Click **Generate new token (classic)**.
4. Note: "SoapBuddy Deployment".
5. Expiration: "No expiration" (or as desired).
6. **Scopes**: Check the `repo` box (Full control of private repositories).
7. Click **Generate token**.
8. **COPY THE TOKEN** (starts with `ghp_`). You won't see it again!

## 2. Push Your Code
Go to the correct directory and push using the token as your password.

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git push -u origin main
```

**Username**: `nxjaime`
**Password**: Paste your new Token (starts with `ghp_`).

