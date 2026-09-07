# Yajur Fibres Limited - Task Management System (YFL TaskMS)

Plant Operations & Preventive Maintenance Checklist Management System for the Yarn Division.

---

## 🚀 How to Run & Deploy on GitHub Pages

If you see a blank page or `404 main.tsx` on GitHub Pages (`https://mis-yajur.github.io/Yarn-Check-List/`), it is because GitHub Pages is currently configured to serve the raw source files instead of building the Vite project.

### 1-Minute Fix in GitHub Settings:

1. Open your GitHub Repository: `https://github.com/mis-yajur/Yarn-Check-List`
2. Click **Settings** (top tab) ➔ **Pages** (in the left sidebar)
3. Under **Build and deployment**:
   - Change **Source** from *"Deploy from a branch"* to **`GitHub Actions`**
4. Click the **Actions** tab at the top of your repository.
5. You will see the **Deploy to GitHub Pages** workflow run automatically.
6. Once green (10-20 seconds), your live app at `https://mis-yajur.github.io/Yarn-Check-List/` will load immediately!

---

## 🛠 Local Development & Manual Build

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build
npm run preview
```
