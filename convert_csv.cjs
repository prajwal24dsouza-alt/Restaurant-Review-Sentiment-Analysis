const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'restaurant_data.csv');
const outDir = path.join(__dirname, 'public', 'data');
const outPath = path.join(outDir, 'restaurants.json');

const raw = fs.readFileSync(csvPath, 'utf-8');
const lines = raw.trim().split('\n');
const headers = lines[0].split(',');

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const vals = lines[i].split(',');
  if (vals.length !== headers.length) continue;

  const id = parseInt(vals[0], 10);
  const name = vals[1];
  const city = vals[2];
  const cuisine = vals[3];
  const rating = vals[4] === '' ? null : parseFloat(vals[4]);
  const votes = parseInt(vals[5], 10);
  const cost = vals[6] === '' ? null : parseFloat(vals[6]);

  // Skip rows with missing rating or cost
  if (rating === null || cost === null || isNaN(rating) || isNaN(cost)) continue;
  // Clamp rating to [1, 5]
  const clampedRating = Math.max(1, Math.min(5, rating));

  rows.push({ id, name, city, cuisine, rating: clampedRating, votes, cost });
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(rows));
console.log(`Converted ${rows.length} rows → ${outPath}`);
