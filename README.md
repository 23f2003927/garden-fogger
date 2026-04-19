# 🌿 Garden Fogger — Control Panel

Full-stack Next.js web app to control and monitor an **ESP32-based garden fogger** with automated temperature + humidity logic.

---

## Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Next.js 14 (App Router) + React (JavaScript)  |
| Styling    | Tailwind CSS                                  |
| Backend    | Next.js API Routes (inside the same project)  |
| Database   | Supabase (PostgreSQL + Auth)                  |
| Deployment | Vercel                                        |
| Hardware   | ESP32 + DHT22 + Relay module                  |

> **JavaScript only** — no TypeScript. Uses `jsconfig.json` for path aliases.

---

## Project Structure

```
garden-fogger/
├── app/
│   ├── api/
│   │   ├── sensor-data/route.js       POST — ESP32 sends readings
│   │   └── device-command/route.js    GET  — ESP32 polls for command
│   ├── auth/
│   │   ├── login/page.js
│   │   └── signup/page.js
│   ├── dashboard/
│   │   ├── layout.js                  Protected layout + navbar
│   │   └── page.js                    Server component, fetches data
│   ├── globals.css
│   └── layout.js
├── components/
│   └── dashboard/
│       ├── DashboardClient.js         Client shell, state, auto-refresh
│       ├── SensorCard.js              Temperature + humidity display
│       ├── ControlCard.js             Manual ON/OFF + override
│       ├── ThresholdCard.js           Automation threshold settings
│       └── LogoutButton.js
├── lib/
│   ├── supabase/
│   │   ├── client.js                  Browser Supabase client
│   │   └── server.js                  Server Supabase client
│   └── automation.js                  Fogger ON/OFF logic
├── esp32/
│   └── garden_fogger.ino              Arduino sketch for ESP32
├── middleware.js                       Auth route protection
├── supabase-schema.sql                 Run this in Supabase SQL Editor
├── jsconfig.json                       Path alias (@/*)
├── tailwind.config.js
├── next.config.js
├── vercel.json
└── .env.example
```

---

## Setup Guide

### Step 1 — Clone & install

```bash
git clone <your-repo>
cd garden-fogger
npm install
```

### Step 2 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Open **SQL Editor** → paste and run `supabase-schema.sql`
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon / public` key
   - `service_role` key *(server-only, never expose to browser)*

### Step 3 — Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

ESP32_API_SECRET=any-long-random-string
```

### Step 4 — Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### Step 5 — Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all four environment variables in **Vercel Dashboard → Project → Settings → Environment Variables**.

---

## API Reference (for ESP32)

### POST `/api/sensor-data`

ESP32 sends sensor readings here every few seconds.

**Headers:**
```
Content-Type: application/json
x-api-secret: <your ESP32_API_SECRET>
```

**Body:**
```json
{
  "device_id": "garden_1",
  "temperature": 34.2,
  "humidity": 41.5
}
```

**Response:**
```json
{ "success": true, "fogger": true }
```

---

### GET `/api/device-command?device_id=garden_1`

ESP32 polls this to know whether to activate the relay.

**Response:**
```json
{ "fogger": true }
```

---

## Automation Logic

```
IF temperature > temp_threshold  OR  humidity < humidity_threshold
    → fogger ON
ELSE
    → fogger OFF
```

Manual override from the dashboard bypasses this until cleared.

---

## ESP32 Wiring

```
ESP32 GPIO 4  ──→  DHT22 DATA
ESP32 GPIO 5  ──→  Relay IN
ESP32 3.3V    ──→  DHT22 VCC  (check your module — some need 5V)
ESP32 GND     ──→  DHT22 GND + Relay GND

Relay COM ──→ Power supply +
Relay NO  ──→ Fogger +ve terminal
```

> ⚠️ Most relay modules are **active LOW**. If your fogger is always ON or always OFF, swap `RELAY_ON` and `RELAY_OFF` in the sketch.

---

## ESP32 Arduino Setup

1. Install **Arduino IDE** + [ESP32 board support](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html)
2. Install via Library Manager:
   - `DHT sensor library` (Adafruit)
   - `Adafruit Unified Sensor`
   - `ArduinoJson` (Benoit Blanchon)
3. Open `esp32/garden_fogger.ino`
4. Update these constants at the top:
   ```cpp
   const char* WIFI_SSID  = "YOUR_WIFI_NAME";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* BASE_URL   = "https://your-app.vercel.app";
   const char* API_SECRET = "your-super-secret-key-here";
   ```
5. Select **Tools → Board → ESP32 Dev Module** → Upload

---

## Database Tables

| Table | Key columns |
|---|---|
| `devices` | `id`, `name`, `device_id`, `created_at` |
| `sensor_logs` | `id`, `device_id`, `temperature`, `humidity`, `created_at` |
| `settings` | `id`, `device_id`, `temp_threshold`, `humidity_threshold`, `fogger_manual_override`, `fogger_status` |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Fogger relay stuck ON/OFF | Swap `RELAY_ON`/`RELAY_OFF` in sketch (active HIGH vs LOW) |
| ESP32 POST returns 401 | Check `API_SECRET` matches `ESP32_API_SECRET` in `.env` |
| Dashboard shows no data | Open dashboard first — it auto-creates the device + settings rows |
| Auth redirect loop | Clear cookies and try again |
| `sensor_logs` insert fails | Ensure `devices` table has a `garden_1` row (visit dashboard once) |
