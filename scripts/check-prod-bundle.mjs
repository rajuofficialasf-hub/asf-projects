// প্রোডাকশন বিল্ডে মক ব্যাকএন্ড (হার্ড-কোডেড টেস্ট অ্যাডমিনসহ) থাকে না — VITE_HOUSING_BACKEND=mock সেট করেও;
// আর কোনো Supabase কোডও থাকে না (ST-06)। পাবলিক সাইটের কোনো চাংকে MUI/Emotion (এডমিনের UI টেমপ্লেট) থাকে না:
// এন্ট্রি থেকে স্ট্যাটিক ও লেজি ইমপোর্ট ধরে হাঁটা হয়, শুধু এডমিনের লেজি পাতাগুলো বাদ।
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'housing-prod-bundle-'))
const r = spawnSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir', '--manifest'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_HOUSING_BACKEND: 'mock' },
})
if (r.status !== 0) process.exit(r.status ?? 1)

const MARKERS = ['housing_mock_state', '__housingMock', 'admin@example.test', '__mock-photos']
// কেস না মেনে: supabase-js, তার URL ও env নাম যে রূপেই থাকুক
const FORBIDDEN = /supabase/i
const hits = []
const walk = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (/\.(js|css|html|json)$/.test(f)) {
      const text = fs.readFileSync(p, 'utf8')
      for (const m of MARKERS) if (text.includes(m)) hits.push(`${m} in ${path.relative(out, p)}`)
      if (FORBIDDEN.test(text)) hits.push(`supabase in ${path.relative(out, p)}`)
    }
  }
}
walk(out)

// এডমিনের লেজি এন্ট্রি (এরা ও এদের পেছনের সব চাংক MUI নিতে পারে)
const ADMIN_ENTRY = /^src\/(features\/admin\/|features\/housing\/pages\/HousingLoginPage\.tsx$)/
const MUI = /Mui[A-Z][A-Za-z]+-root|@emotion\/|simplebar-scrollbar/
const manifest = JSON.parse(fs.readFileSync(path.join(out, '.vite', 'manifest.json'), 'utf8'))
const seen = new Set()
const visit = (key) => {
  if (seen.has(key) || !manifest[key]) return
  seen.add(key)
  const c = manifest[key]
  for (const f of [c.file, ...(c.css ?? [])]) {
    if (/\.(js|css)$/.test(f) && MUI.test(fs.readFileSync(path.join(out, f), 'utf8'))) hits.push(`MUI/Emotion in public chunk ${f} (${key})`)
  }
  for (const k of c.imports ?? []) visit(k)
  for (const k of c.dynamicImports ?? []) if (!ADMIN_ENTRY.test(k)) visit(k)
}
for (const [k, c] of Object.entries(manifest)) if (c.isEntry) visit(k)
if (seen.size === 0) hits.push('no entry chunk found in the Vite manifest')

fs.rmSync(out, { recursive: true, force: true })
if (hits.length) {
  console.error('✗ production bundle contains mock backend, Supabase or public-side MUI code:\n  ' + hits.join('\n  '))
  process.exit(1)
}
console.log('✓ production bundle contains no mock backend or Supabase code, and the public chunks no MUI')
