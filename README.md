# Focus Session Timer

A clean, professional web app for timed study sessions with a persistent study log.

## Features

- Start, pause, and reset focus sessions
- Interactive analog clock for selecting session length (1 to 60 minutes)
- Session topic field for quick context
- Automatic study log entry when a session completes
- Study log saved in browser local storage
- Mobile-friendly responsive UI

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript

## Run Locally

Open `index.html` directly in your browser.

## Deploy to Netlify

1. Push this repository to GitHub.
2. In Netlify, choose **Add new site** -> **Import an existing project**.
3. Connect your GitHub repo and select this project.
4. Use these settings:
   - Build command: *(leave empty)*
   - Publish directory: `.`
5. Deploy.

## Project Structure

- `index.html` - App layout and structure
- `styles.css` - UI styling
- `app.js` - Timer logic and study log handling
- `netlify.toml` - Netlify static hosting config
