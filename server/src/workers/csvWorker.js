const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');

function wait(ms) {
  if (ms <= 0) {
    return;
  }

  const endTime = Date.now() + ms;
  while (Date.now() < endTime) {}
}

function processCsv(filePath, rowDelayMs) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const lines = content.split(/\r?\n/);
  const rows = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '') {
      rows.push(lines[i]);
    }
  }

  if (rows.length === 0) {
    parentPort.postMessage({ type: 'progress', progress: 100 });
    parentPort.postMessage({ type: 'completed', result: 0 });
    return;
  }

  let total = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cells = rows[rowIndex].split(',');

    for (let columnIndex = 0; columnIndex < cells.length; columnIndex++) {
      const cell = cells[columnIndex].trim();

      // Empty cells are skipped and do not change the sum.
      if (cell === '') {
        continue;
      }

      const value = Number(cell);

      if (!Number.isFinite(value)) {
        throw new Error('CSV contains a non-numeric value.');
      }

      total += value;
    }

    wait(rowDelayMs);

    const progress = Math.round(((rowIndex + 1) / rows.length) * 100);
    parentPort.postMessage({
      type: 'progress',
      progress: Math.min(100, progress)
    });
  }

  parentPort.postMessage({
    type: 'completed',
    result: total
  });
}

try {
  const rowDelayMs = Number(workerData.rowDelayMs);
  processCsv(workerData.filePath, Number.isFinite(rowDelayMs) ? rowDelayMs : 20);
} catch (error) {
  parentPort.postMessage({
    type: 'failed',
    error: error.message
  });
}
