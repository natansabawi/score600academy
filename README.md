# Score600Academy - Telegram Mini App & Secure Study Companion

Score600Academy is an educational study companion and exam prep platform engineered specifically for **Telegram Mini Apps (TMA)** and deployed on **Vercel**. 

It dynamically ingests, renders, and secures PDF study materials and exams stored in public **Google Drive folders**, covering **Grades 9 to 12** across Mathematics, Physics, Chemistry, Biology, National Mock Exams, and High-Yield Formula Sheets.

---

## 🌟 Key Architecture & Features

1. **Google Drive Link Ingestion & Preview Converter**:
   - Ingests standard Google Drive sharing links (`https://drive.google.com/file/d/FILE_ID/view?usp=sharing`), folder references, or raw File IDs.
   - Automatically converts links into secure preview URLs (`https://drive.google.com/file/d/FILE_ID/preview`).
   - Dynamic Ingestion Tool: Users and admins can click **"☁️ Ingest Drive Link"** in the UI to paste any shared Google Drive file link and instantly preview it inside the secure reader.

2. **Secure In-App Reader (Anti-Download & Anti-Copy DRM)**:
   - **Clean "Read Securely" Buttons**: Every card triggers the secure modal reader without opening external browser windows.
   - **Anti-Popout Shield**: A non-intrusive container mask physically and visually covers the top-right region of the Google Drive iframe where Google's "Pop-out (Open in New Tab)" button is located. This prevents students from escaping into a standalone browser window where Google Drive exposes download buttons.
   - **Dynamic Forensic Watermark Grid**: Overlays repeated semi-transparent watermarks stamping `Telegram UID: [ID]`, `@username`, `Score600 DRM`, and the current timestamp across the entire viewer.
   - **Sandbox Controls**: The iframe utilizes strict sandboxing (`sandbox="allow-scripts allow-same-origin allow-forms"`, omitting `allow-popups` to block escape tabs).
   - **Keyboard & Event Interceptors**: Blocks `contextmenu` (right click), `copy`, `cut`, `Ctrl+S`, `Cmd+S`, `Ctrl+P`, `Cmd+P`, and `F12`.
   - **Print Protection**: `@media print` rules blank out the screen if printing is triggered.

3. **Grades 9 to 12 Responsive Navigation**:
   - Dedicated Grade Selector tabs (`Grade 9`, `Grade 10`, `Grade 11`, `Grade 12`, `All Grades`).
   - Subject pills: Mathematics, Physics, Chemistry, National Mock Exams, Formula Sheets, and Saved Bookmarks.
   - Search bar filtering by subject, topic name, or Google Drive File ID.

4. **Telegram WebApp SDK Integration**:
   - `Telegram.WebApp.ready()`, `expand()`, `enableClosingConfirmation()`.
   - Native Telegram `BackButton`: Automatically appears when the reader modal opens and returns to the catalogue when tapped.
   - Haptic feedback on selection, button clicks, and security violations.
   - Dynamic Telegram user metadata extraction for student profile and watermarking.

5. **Client-Side Cache Mitigation**:
   - `vercel.json` provides `Cache-Control: no-cache, no-store, must-revalidate` for `index.html` to eliminate Telegram WebView stale caching.
   - Static assets use version query strings (`style.css?v=2.1.0`, `app.js?v=2.1.0`).

---

## 📁 File Structure

```
telegram-study-companion/
├── index.html            # Score600Academy UI, Grade selector, Ingestion modal & Secure Drive Viewer
├── style.css             # Glassmorphic UI design system, Drive DRM styles & anti-popout shield
├── app.js                # Core controller: Drive link parser, Telegram SDK, DRM & viewer engine
├── materials-data.js     # Registry for Grades 9-12 with Google Drive File IDs & preview links
├── pdf-generator.js      # Pure JS PDF binary generator (for high-fidelity canvas fallback)
├── vercel.json           # Vercel deployment config, Google Drive CSP frame-src & cache headers
├── package.json          # Dev server scripts
├── server.js             # Local testing HTTP server
└── README.md             # Complete documentation and setup guide
```

---

## 🔗 How to Link Google Drive Files & Folders

### 1. Set Google Drive File / Folder Permissions to Public
1. In [Google Drive](https://drive.google.com), right-click your study PDF or curriculum folder.
2. Click **Share** ➔ **Share**.
3. Under *General access*, change the setting from *Restricted* to **"Anyone with the link"**.
4. Ensure the role is set to **Viewer**.
5. Click **Copy link**.

### 2. Extracting Google Drive File IDs
Google Drive sharing links take one of these formats:
* Format A: `https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e10U/view?usp=sharing`
  ➔ **File ID**: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e10U`
* Format B: `https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e10U`
  ➔ **File ID**: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2e10U`

### 3. Adding Materials to [`materials-data.js`](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/telegram-study-companion/materials-data.js)
Simply add or edit entries in the `window.SCORE600_MATERIALS` array:

```javascript
{
  id: "g12-exam-2026",
  grade: 12,
  title: "Grade 12 National Mock Exam 2026: Physics & Math",
  subject: "Exams",
  category: "exams",
  badge: "Official Mock",
  driveFileId: "PASTE_YOUR_GOOGLE_DRIVE_FILE_ID_HERE",
  pagesCount: 4,
  estimatedTime: "60 min test",
  rating: "5.0",
  readCount: "3.4k attempts",
  description: "Official timed national mock paper hosted on Google Drive with Score600 DRM protection."
}
```

### 4. Dynamic In-App Ingestion
Students and instructors can also click the **"☁️ Ingest Drive Link"** button in the app header and paste any Google Drive link directly. The app will extract the ID and launch the secure viewer immediately.

---

## 🚀 Deployment to Vercel

EduGram / Score600Academy requires zero build steps and is ready for static deployment on Vercel.

### Deploy via Vercel CLI
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy directory
cd telegram-study-companion
vercel --prod
```

### Deploy via GitHub
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: Score600Academy Telegram Mini App with Google Drive DRM"
   git remote add origin https://github.com/YOUR_USERNAME/score600-mini-app.git
   git push -u origin main
   ```
2. In [Vercel Dashboard](https://vercel.com), import the repository and click **Deploy**.
3. Vercel will output your HTTPS production domain (e.g. `https://score600-academy.vercel.app`).

---

## 🤖 Configuring in Telegram via @BotFather

1. Open Telegram and message [@BotFather](https://t.me/BotFather).
2. Create your bot (if new):
   - Send `/newbot`
   - Name: `Score600 Academy`
   - Username: `score600_prep_bot`
3. Create the Mini App:
   - Send `/newapp` to @BotFather.
   - Select `@score600_prep_bot`.
   - Title: `Score600 Academy`
   - Description: `Grades 9 to 12 Study Companion, Formula Sheets, and Board Mock Exams.`
   - Upload app icon (640x360).
   - Web App URL: Enter your **Vercel HTTPS URL** (e.g. `https://score600-academy.vercel.app`).
   - Short Name: `app` (Yields link: `https://t.me/score600_prep_bot/app`).
4. Set the Menu Button:
   - Send `/setmenubutton` to @BotFather.
   - Select `@score600_prep_bot`.
   - Title: `Open Academy`
   - URL: `https://score600-academy.vercel.app`.
5. Open your bot in Telegram on mobile or desktop to test.
