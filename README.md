# Binaire Freznel Assessment

A multi-user CSV queueing system. Clients upload CSV files containing numbers. The server queues those files by HIGH or LOW priority, processes them on Node.js Worker Threads, reduces every numeric value to a single sum, and broadcasts live status to every connected browser.

This is an assessment-scale project: in-memory queues, two concurrent workers, and no database. It is designed to be easy to run, easy to explain, and honest about its limits.

## Features

- CSV uploads from the browser (drag and drop or file picker)
- Integers and floating-point values
- Multiple clients (browser tabs) without authentication
- Multiple files per client
- HIGH / LOW priority
- FIFO order within the same priority
- Anti-starvation so LOW jobs are not blocked forever
- Node.js Worker Threads for CSV summing
- At most 2 workers at a time
- Row-based progress
- COMPLETED result or FAILED error
- Socket.IO live updates on a shared dashboard
- REST endpoints for health, upload, queue, and job status

## Architecture

```
Client (React dashboard)
  ↓  POST /api/upload  (multipart CSV)
Express + Multer
  ↓
Job
  ↓
QueueManager  (HIGH array + LOW array)
  ↓
WorkerManager  (max 2 active workers)
  ↓
Worker Thread  (csvWorker.js)
  ↓
CSV sum
  ↓
Job status updated
  ↓
Socket.IO broadcast
  ↓
All connected clients
```

REST remains available for debugging:

- `GET /api/health`
- `GET /api/queue` (jobs still WAITING, in processing order)
- `GET /api/jobs/:jobId` (any known job)

## Queue Design

`QueueManager` keeps two arrays:

- `highPriorityQueue`
- `lowPriorityQueue`

Jobs are added with `push()` and taken with `shift()`, so each priority is FIFO.

Normal selection:

1. Take HIGH if a HIGH job is waiting
2. Take LOW if no HIGH job is waiting

Fairness rule (anti-starvation):

After **3 consecutive HIGH jobs**, if a LOW job is waiting, take **one LOW job**, then reset the HIGH streak.

That keeps HIGH ahead most of the time, but a continuous stream of HIGH uploads cannot block LOW jobs forever. `WorkerManager` never duplicates this logic. It only calls `getNextJob()`.

Example mix:

`LOW A, LOW B, HIGH C, HIGH D, HIGH E, LOW F, HIGH G, LOW H`

Processing order:

`C, D, E, A, G, B, F, H`

HIGH FIFO is `C, D, E, G`. LOW FIFO is `A, B, F, H`. After three HIGH jobs (`C, D, E`), LOW `A` runs before HIGH `G`.

## Worker Design

CSV summing is CPU work. Doing it on the Express thread would stall uploads and Socket.IO. Each job runs in a Worker Thread.

`csvWorker.js` only:

- reads the file
- splits rows and cells
- adds every finite number
- sends `{ type: "progress" }`, `{ type: "completed" }`, or `{ type: "failed" }` through `parentPort`

It does not know about HTTP, queues, or Socket.IO.

`WorkerManager`:

- starts at most `MAX_CONCURRENT_JOBS` (default **2**) workers
- stores `worker.threadId` on the job as `workerId` (this is **not** `process.pid`)
- applies a timeout (default **30 seconds**)
- always releases the slot on success, failure, error, timeout, or unexpected exit
- then starts the next queued job

A small per-row delay (`CSV_ROW_DELAY_MS`, default 20) makes progress and the 2-worker cap easy to see in the dashboard. Set it to `0` for faster processing.

## Deadlock / Stuck Job Prevention

There is **no** formal deadlock detector (no wait-for graph, no cycle analysis). The practical stuck states the assessment cares about are prevented with simple rules:

| Scenario | What happens |
|---|---|
| Worker crash / `error` event | Job → `FAILED`, timeout cleared, removed from `activeWorkers`, next job starts |
| Worker timeout | Job → `FAILED`, `worker.terminate()`, slot released, queue continues |
| Exit without a result | If the job is still in `activeWorkers`, it is marked `FAILED` and the slot is released |
| Too many workers | `MAX_CONCURRENT_JOBS` caps active threads at 2. Extra jobs stay `WAITING` |
| One bad job | Failure always calls `startAvailableJobs()`. Later jobs are not blocked |
| LOW starvation | After 3 HIGH jobs, one waiting LOW job is selected |

If `new Worker()` throws, the job is marked `FAILED` immediately so it cannot sit in `PROCESSING` without a tracked worker.

Cleanup is centralized in `releaseWorkerSlot()`. A second completion/failure for the same job is ignored.

## Job Lifecycle

```
UPLOADING     (browser only, while the HTTP upload is in flight)
    ↓
UPLOADED      (Job created on the server)
    ↓
QUEUED        (accepted by QueueManager)
    ↓
WAITING       (sitting in a HIGH or LOW array)
    ↓
PROCESSING    (Worker Thread running)
    ↓
COMPLETED     (sum stored in result, progress 100)
```

or

```
PROCESSING → FAILED
```

`GET /api/queue` only lists `WAITING` jobs. The dashboard and `GET /api/jobs/:jobId` show every job the server still has in memory.

## CSV behaviour

Expected input: numeric cells separated by commas.

- Integers and decimals are supported
- Rows and columns may have different lengths
- Blank lines are ignored
- Empty cells (`1,2,,4`) are skipped and do not change the sum (here: 7)
- A UTF-8 BOM at the start of the file is stripped
- Trailing newlines are fine
- Non-numeric values such as `hello` fail the job with `CSV contains a non-numeric value.`
- An empty file completes with result `0`

Quoted CSV, headers, and locale decimals (e.g. `1,5` meaning one-and-a-half) are not supported.

JavaScript numbers are IEEE 754. `0.1 + 0.2 + 0.3` may not be the exact decimal `0.6`. That is documented, not hidden.

## Real-Time Updates

Socket.IO is attached to the same HTTP server as Express.

On connect, the server sends `queue:state` with every public job. After that it broadcasts:

- `job:created`
- `job:waiting`
- `job:processing`
- `job:progress`
- `job:completed`
- `job:failed`

Each event carries `job.toPublicStatus()`. File paths are never sent.

The React app upserts by `jobId`, so the same job is not shown twice. A new tab or a reconnect gets `queue:state` again.

Each browser tab stores its own `clientId` in `sessionStorage`. All tabs still see the full queue.

## API

### `GET /api/health`

```json
{ "status": "ok" }
```

### `POST /api/upload`

`multipart/form-data` fields:

- `csvFile` (required, `.csv`, max 5 MB)
- `priority` (required: `high` or `low`)
- `clientId` (optional; generated if missing)

Example:

```bash
curl -X POST http://localhost:5000/api/upload ^
  -F "csvFile=@samples/sum21.csv" ^
  -F "priority=high" ^
  -F "clientId=demo"
```

Success (`201`):

```json
{
  "success": true,
  "jobId": "...",
  "originalFileName": "sum21.csv",
  "clientId": "demo",
  "priority": "HIGH",
  "status": "WAITING",
  "createdAt": "..."
}
```

`status` may already be `PROCESSING` if a worker slot was free.

### `GET /api/queue`

WAITING jobs in the order they would be processed (including the fairness rule). Does not include `filePath`.

### `GET /api/jobs/:jobId`

Public job status, including `progress`, `workerId` (`worker.threadId`), `result`, and `error`. Missing ids return `404`.

## Running Locally

Use two terminals.

**Server**

```bash
cd server
npm install
npm run dev
```

Default: `http://localhost:5000`

**Client**

```bash
cd client
npm install
npm run dev
```

Default: `http://localhost:5173`

Copy `client/.env.example` to `client/.env` if needed:

```
VITE_API_URL=http://localhost:5000
```

Backend env vars are optional. Defaults work for local development. See `server/.env.example`.

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `5000` | API / Socket.IO port |
| `FRONTEND_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed browser origins (comma-separated) |
| `MAX_CONCURRENT_JOBS` | `2` | Active Worker Threads |
| `WORKER_TIMEOUT_MS` | `30000` | Worker timeout |
| `CSV_ROW_DELAY_MS` | `20` | Demo delay per CSV row (`0` for speed) |
| `VITE_API_URL` | dev: `http://localhost:5000`; production build: same origin | Frontend API / Socket.IO URL |

## Production build

Frontend:

```bash
cd client
npm install
npm run build
```

This writes static files to `client/dist`. Set `VITE_API_URL` **at build time** if the API is on another origin.

Backend:

```bash
cd server
npm install
npm start
```

Set `PORT` and `FRONTEND_ORIGIN` on the host. Example: frontend at `https://app.example.com` needs `FRONTEND_ORIGIN=https://app.example.com`.

A typical setup is:

- static `client/dist` on a CDN or nginx
- Node API on a host with `PORT` and `FRONTEND_ORIGIN`
- or one reverse proxy: `/` → frontend, `/api` and Socket.IO → Node, with `VITE_API_URL` empty so the browser uses the same origin

Uploaded files stay on local disk under `server/uploads/`. They are not deleted automatically.

## Testing

These checks were run against the local server and (where noted) a second process on port 5001.

REST and CSV processing:

- `GET /api/health` returned `{ "status": "ok" }`
- Sums: `sum21.csv` → 21, `sum12.csv` → 12, `grid.csv` → 36, `row.csv` → 15
- Empty cells `1,2,,4` → 7; empty file → 0; single column → 6; ragged rows → 45
- Negatives and zeros → -2.5; blank lines still summed to 21
- `0.1,0.2,0.3` completed with JavaScript's IEEE value `0.6000000000000001`
- UTF-8 BOM file summed to 21
- `non-numeric.csv` → `FAILED` with `CSV contains a non-numeric value.`
- A valid job after that failure completed (queue was not stuck)
- Missing file, non-`.csv` upload, and missing priority each returned HTTP 400
- Missing `clientId` was generated on the server
- Unknown job id returned 404
- `GET /api/queue` and `GET /api/jobs/:jobId` did not include `filePath`

Queue fairness (in-process `QueueManager`, no HTTP):

`LOW A, LOW B, HIGH C, HIGH D, HIGH E, LOW F, HIGH G, LOW H`
→ `C, D, E, A, G, B, F, H`

Concurrency:

Five overlapping `medium.csv` uploads showed 2 `PROCESSING` and 3 `WAITING`, then all completed with result 240.

Timeout (separate server, `PORT=5001`, `WORKER_TIMEOUT_MS=80`, `CSV_ROW_DELAY_MS=40`):

- `medium.csv` → `FAILED`, `Worker timed out after 80ms.`
- A following `row.csv` job completed with 15

Socket.IO (Node clients, not browser tabs):

- Two clients received `job:completed` for the same upload
- A client that connected after an upload received that job in `queue:state` (status `PROCESSING` at connect time)
- Payloads did not include `filePath`

Frontend:

- `cd client && npm run build` succeeded (Vite production bundle in `client/dist`)

Not automated here: clicking the dashboard in a real browser, or opening three Chrome tabs. That should be checked locally at `http://localhost:5173`.


## Deployment

- No Docker, Redis, or database is required
- Job state is **in memory**. A process restart empties the queue
- `FRONTEND_ORIGIN` must include the real browser origin or Socket.IO / CORS will fail
- `VITE_API_URL` is compiled into the frontend; rebuild after changing it
- Do not commit `.env` files with real secrets (this project has none)

## Limitations

- In-memory jobs only. Restarting the server drops the queue and dashboard history
- No persistent queue, no authentication, no user accounts
- Simple comma-separated numeric CSV only
- At most 2 workers; this is an assessment demo, not a production job platform
- `Array.shift()` is O(n); fine for this size
- Per-row progress messages and the optional row delay are for visibility, not throughput

## Project layout

```
Binaire_Freznel_Assessment/
  client/                 React dashboard (Vite)
  server/                 Express + workers
    src/classes/          Job, QueueManager, WorkerManager
    src/workers/          csvWorker.js
    src/realtime/         Socket.IO hub
    uploads/              temporary CSV files
  samples/                small test CSV files
```
