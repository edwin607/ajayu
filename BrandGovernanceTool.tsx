/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'architecture' | 'files' | 'governance' | 'dashboard';
type FolderType = 'final' | 'ongoing';
type AssetType = 'logo' | 'color' | 'typography' | 'imagery' | 'copy' | 'layout' | 'motion';
type Result = 'PASS' | 'FAIL' | 'WARN';
type Filter = 'ALL' | 'FINAL' | 'ONGOING' | 'PASS' | 'FAIL' | 'WARN';
type Source = 'none' | 'gdrive' | 'dropbox' | 'demo';

interface BrandAsset {
  id: string;
  name: string;
  type: AssetType;
  folder: string;
  folderType: FolderType;
  brand: string;
  brandTier: 'master' | 'sub' | 'product';
  se: number;   // Surprise Engineering 0–100
  ci: number;   // Connection Infrastructure 0–100
  he: number;   // Honest Execution 0–100
  os: number;   // Operational Separation 0–100
  alwaysSunny: boolean;
  result: Result;
}

interface BrandNode {
  id: string;
  name: string;
  tier: 'master' | 'sub' | 'product';
  assetCount: number;
  children: BrandNode[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

function calcResult(asset: Omit<BrandAsset, 'result'>): Result {
  const passes = asset.se >= 80 && asset.ci >= 75 && asset.he >= 78 && asset.os >= 72 && asset.alwaysSunny;
  if (passes) return 'PASS';
  if (asset.folderType === 'ongoing') return 'WARN';
  return 'FAIL';
}

const RAW_ASSETS: Omit<BrandAsset, 'result'>[] = [
  // ── MASTER BRAND / FINAL ──────────────────────────────────────────────────
  { id: 'a01', name: 'primary-logo-v4.svg',         type: 'logo',       folder: '/master/final/',       folderType: 'final',   brand: 'AJAYU MASTER', brandTier: 'master',  se: 88, ci: 90, he: 85, os: 82, alwaysSunny: true  },
  { id: 'a02', name: 'brand-color-palette.ase',      type: 'color',      folder: '/master/final/',       folderType: 'final',   brand: 'AJAYU MASTER', brandTier: 'master',  se: 82, ci: 88, he: 80, os: 79, alwaysSunny: true  },
  { id: 'a03', name: 'type-system-guide.pdf',        type: 'typography', folder: '/master/final/',       folderType: 'final',   brand: 'AJAYU MASTER', brandTier: 'master',  se: 76, ci: 85, he: 90, os: 84, alwaysSunny: true  },
  { id: 'a04', name: 'brand-voice-manifesto.docx',   type: 'copy',       folder: '/master/final/',       folderType: 'final',   brand: 'AJAYU MASTER', brandTier: 'master',  se: 91, ci: 78, he: 88, os: 70, alwaysSunny: true  },
  // ── MASTER BRAND / ONGOING ────────────────────────────────────────────────
  { id: 'a05', name: 'logo-v5-exploration.ai',       type: 'logo',       folder: '/master/ongoing/',     folderType: 'ongoing', brand: 'AJAYU MASTER', brandTier: 'master',  se: 94, ci: 60, he: 72, os: 55, alwaysSunny: true  },
  { id: 'a06', name: 'motion-identity-draft.mp4',    type: 'motion',     folder: '/master/ongoing/',     folderType: 'ongoing', brand: 'AJAYU MASTER', brandTier: 'master',  se: 87, ci: 68, he: 65, os: 61, alwaysSunny: true  },
  // ── SUB-BRAND A / FINAL ───────────────────────────────────────────────────
  { id: 'b01', name: 'chacha-campaign-hero.jpg',     type: 'imagery',    folder: '/chacha/final/',       folderType: 'final',   brand: 'CHACHA (SUN)', brandTier: 'sub',     se: 85, ci: 80, he: 82, os: 77, alwaysSunny: true  },
  { id: 'b02', name: 'chacha-tagline-copy.txt',      type: 'copy',       folder: '/chacha/final/',       folderType: 'final',   brand: 'CHACHA (SUN)', brandTier: 'sub',     se: 92, ci: 76, he: 79, os: 75, alwaysSunny: true  },
  { id: 'b03', name: 'chacha-logo-lockup.eps',       type: 'logo',       folder: '/chacha/final/',       folderType: 'final',   brand: 'CHACHA (SUN)', brandTier: 'sub',     se: 78, ci: 82, he: 75, os: 80, alwaysSunny: false },
  { id: 'b04', name: 'chacha-color-spec.pdf',        type: 'color',      folder: '/chacha/final/',       folderType: 'final',   brand: 'CHACHA (SUN)', brandTier: 'sub',     se: 80, ci: 77, he: 84, os: 74, alwaysSunny: true  },
  // ── SUB-BRAND A / ONGOING ─────────────────────────────────────────────────
  { id: 'b05', name: 'chacha-social-kit-wip.psd',    type: 'layout',     folder: '/chacha/ongoing/',     folderType: 'ongoing', brand: 'CHACHA (SUN)', brandTier: 'sub',     se: 70, ci: 55, he: 60, os: 58, alwaysSunny: true  },
  { id: 'b06', name: 'chacha-OOH-draft.ai',          type: 'layout',     folder: '/chacha/ongoing/',     folderType: 'ongoing', brand: 'CHACHA (SUN)', brandTier: 'sub',     se: 88, ci: 64, he: 70, os: 66, alwaysSunny: true  },
  // ── SUB-BRAND B / FINAL ───────────────────────────────────────────────────
  { id: 'c01', name: 'warmi-hero-image.jpg',         type: 'imagery',    folder: '/warmi/final/',        folderType: 'final',   brand: 'WARMI (MOON)', brandTier: 'sub',     se: 83, ci: 79, he: 81, os: 76, alwaysSunny: true  },
  { id: 'c02', name: 'warmi-type-treatment.pdf',     type: 'typography', folder: '/warmi/final/',        folderType: 'final',   brand: 'WARMI (MOON)', brandTier: 'sub',     se: 77, ci: 83, he: 86, os: 80, alwaysSunny: true  },
  { id: 'c03', name: 'warmi-logo-v3.svg',            type: 'logo',       folder: '/warmi/final/',        folderType: 'final',   brand: 'WARMI (MOON)', brandTier: 'sub',     se: 70, ci: 74, he: 78, os: 65, alwaysSunny: false },
  { id: 'c04', name: 'warmi-copy-deck.docx',         type: 'copy',       folder: '/warmi/final/',        folderType: 'final',   brand: 'WARMI (MOON)', brandTier: 'sub',     se: 89, ci: 80, he: 84, os: 78, alwaysSunny: true  },
  // ── SUB-BRAND B / ONGOING ─────────────────────────────────────────────────
  { id: 'c05', name: 'warmi-motion-test.mov',        type: 'motion',     folder: '/warmi/ongoing/',      folderType: 'ongoing', brand: 'WARMI (MOON)', brandTier: 'sub',     se: 75, ci: 58, he: 63, os: 59, alwaysSunny: true  },
  // ── PRODUCT / FINAL ───────────────────────────────────────────────────────
  { id: 'd01', name: 'product-alpha-pack.ai',        type: 'layout',     folder: '/products/alpha/final/', folderType: 'final', brand: 'PRODUCT ALPHA', brandTier: 'product', se: 81, ci: 76, he: 80, os: 73, alwaysSunny: true  },
  { id: 'd02', name: 'product-beta-icon.svg',        type: 'logo',       folder: '/products/beta/final/',  folderType: 'final', brand: 'PRODUCT BETA',  brandTier: 'product', se: 68, ci: 71, he: 75, os: 69, alwaysSunny: false },
  { id: 'd03', name: 'product-beta-copy.txt',        type: 'copy',       folder: '/products/beta/final/',  folderType: 'final', brand: 'PRODUCT BETA',  brandTier: 'product', se: 84, ci: 77, he: 83, os: 76, alwaysSunny: true  },
  // ── PRODUCT / ONGOING ─────────────────────────────────────────────────────
  { id: 'd04', name: 'product-gamma-concept.psd',   type: 'imagery',    folder: '/products/gamma/ongoing/', folderType: 'ongoing', brand: 'PRODUCT GAMMA', brandTier: 'product', se: 90, ci: 62, he: 66, os: 60, alwaysSunny: true  },
  { id: 'd05', name: 'product-gamma-layout.ai',     type: 'layout',     folder: '/products/gamma/ongoing/', folderType: 'ongoing', brand: 'PRODUCT GAMMA', brandTier: 'product', se: 73, ci: 55, he: 58, os: 52, alwaysSunny: false },
];

const ASSETS: BrandAsset[] = RAW_ASSETS.map(a => ({ ...a, result: calcResult(a) }));

const BRAND_TREE: BrandNode[] = [
  {
    id: 'master', name: 'AJAYU MASTER', tier: 'master', assetCount: 6,
    children: [
      {
        id: 'chacha', name: 'CHACHA (SUN)', tier: 'sub', assetCount: 6,
        children: [
          { id: 'prod-alpha', name: 'PRODUCT ALPHA', tier: 'product', assetCount: 1, children: [] },
        ]
      },
      {
        id: 'warmi', name: 'WARMI (MOON)', tier: 'sub', assetCount: 5,
        children: [
          { id: 'prod-beta',  name: 'PRODUCT BETA',  tier: 'product', assetCount: 2, children: [] },
          { id: 'prod-gamma', name: 'PRODUCT GAMMA', tier: 'product', assetCount: 2, children: [] },
        ]
      },
    ]
  }
];

const MOCK_FOLDERS = [
  { path: '/master/final/',            type: 'final'   as FolderType, count: 4 },
  { path: '/master/ongoing/',          type: 'ongoing' as FolderType, count: 2 },
  { path: '/chacha/final/',            type: 'final'   as FolderType, count: 4 },
  { path: '/chacha/ongoing/',          type: 'ongoing' as FolderType, count: 2 },
  { path: '/warmi/final/',             type: 'final'   as FolderType, count: 4 },
  { path: '/warmi/ongoing/',           type: 'ongoing' as FolderType, count: 1 },
  { path: '/products/alpha/final/',    type: 'final'   as FolderType, count: 1 },
  { path: '/products/beta/final/',     type: 'final'   as FolderType, count: 2 },
  { path: '/products/gamma/ongoing/',  type: 'ongoing' as FolderType, count: 2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function scoreBar(score: number, width = 10): string {
  const filled = Math.round((score / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  root: {
    width: '100%', height: '100%', background: '#000', color: '#ccc',
    fontFamily: "'Courier New', Courier, monospace", fontSize: '13px',
    display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
  },
  topBar: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px', borderBottom: '1px solid #333',
  },
  tabBtn: (active: boolean) => ({
    background: active ? '#ccc' : '#000',
    color: active ? '#000' : '#ccc',
    border: '1px solid #444', padding: '4px 10px', fontSize: '12px',
    cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' as const,
    outline: 'none',
    boxShadow: active ? 'none' : '2px 2px 0px #222',
    transform: active ? 'translate(1px,1px)' : 'none',
  }),
  body: {
    flex: 1, overflow: 'auto', padding: '16px',
  },
  panel: {
    border: '1px solid #333', padding: '12px', marginBottom: '12px',
    background: '#050505',
  },
  panelHead: {
    fontSize: '11px', color: '#666', marginBottom: '8px', letterSpacing: '1px',
    textTransform: 'uppercase' as const, borderBottom: '1px dashed #2a2a2a', paddingBottom: '4px',
  },
  badge: (r: Result | 'FINAL' | 'ONGOING' | string) => {
    const map: Record<string, string> = {
      PASS: '#00FF41', FAIL: '#FF4500', WARN: '#FFD700',
      FINAL: '#1E90FF', ONGOING: '#888',
      MASTER: '#fff', SUB: '#ccc', PRODUCT: '#888',
    };
    return {
      color: map[r] || '#ccc', border: `1px solid ${map[r] || '#444'}`,
      padding: '1px 5px', fontSize: '11px', display: 'inline-block',
      background: '#000', whiteSpace: 'nowrap' as const,
    };
  },
  principleSymbol: {
    display: 'inline-block', width: '36px', textAlign: 'center' as const,
    color: '#fff', letterSpacing: '1px',
  },
  row: (hover: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 6px',
    borderBottom: '1px solid #1a1a1a', fontSize: '12px',
    background: hover ? '#111' : 'transparent', cursor: 'default',
  }),
  filterBtn: (active: boolean) => ({
    background: active ? '#222' : '#000', color: active ? '#fff' : '#555',
    border: `1px solid ${active ? '#555' : '#2a2a2a'}`, padding: '2px 8px',
    fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
    textTransform: 'uppercase' as const, outline: 'none',
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBar({ score, label, symbol }: { score: number; label: string; symbol: string }) {
  const color = score >= 80 ? '#00FF41' : score >= 65 ? '#FFD700' : '#FF4500';
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span>
          <span style={S.principleSymbol}>{symbol}</span>
          <span style={{ color: '#aaa' }}>{label}</span>
        </span>
        <span style={{ color, fontWeight: 'bold' }}>{score}</span>
      </div>
      <div style={{ fontFamily: 'monospace', color, fontSize: '14px', letterSpacing: '1px' }}>
        [{scoreBar(score)}]
      </div>
    </div>
  );
}

function BrandTreeNode({ node, depth }: { node: BrandNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const prefix = depth === 0 ? '' : '  '.repeat(depth - 1) + (depth > 0 ? '├── ' : '');
  const tierColor: Record<string, string> = { master: '#fff', sub: '#aaa', product: '#666' };
  return (
    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
      <div
        style={{ padding: '4px 0', cursor: node.children.length ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', gap: '8px' }}
        onClick={() => node.children.length && setOpen(o => !o)}
      >
        <span style={{ color: '#444', whiteSpace: 'pre' }}>{prefix}</span>
        <span style={{ color: node.children.length ? '#888' : '#555' }}>
          {node.children.length ? (open ? '▾' : '▸') : '·'}
        </span>
        <span style={{ color: tierColor[node.tier] }}>{node.name}</span>
        <span style={S.badge(node.tier.toUpperCase())}>{node.tier}</span>
        <span style={{ color: '#555', fontSize: '11px' }}>{node.assetCount} assets</span>
      </div>
      {open && node.children.map(child => (
        <BrandTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────────────

function ArchitectureTab() {
  return (
    <div>
      <div style={S.panel}>
        <div style={S.panelHead}>:: BRAND ARCHITECTURE — PLAYBOOK HIERARCHY ::</div>
        <div style={{ color: '#555', fontSize: '11px', marginBottom: '12px' }}>
          Master Brand → Sub-Brands → Products. Governance rules cascade downward.<br />
          Click any tier to expand / collapse its branches.
        </div>
        {BRAND_TREE.map(n => <BrandTreeNode key={n.id} node={n} depth={0} />)}
      </div>

      <div style={S.panel}>
        <div style={S.panelHead}>:: GOVERNANCE PRINCIPLES ::</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { sym: '!@!', name: 'SURPRISE ENGINEERING',     abbr: 'SE', desc: 'Creative delight beyond expectation while staying on-brand.' },
            { sym: '>#<', name: 'CONNECTION INFRASTRUCTURE', abbr: 'CI', desc: 'Building relational infrastructure — trust, familiarity, resonance.' },
            { sym: '**',  name: 'HONEST EXECUTION',          abbr: 'HE', desc: 'Authentic, transparent delivery; no misleading brand claims.' },
            { sym: '|-|', name: 'OPERATIONAL SEPARATION',    abbr: 'OS', desc: 'Clear delineation between brand tiers; no identity bleed.' },
          ].map(p => (
            <div key={p.abbr} style={{ border: '1px solid #2a2a2a', padding: '10px', background: '#030303' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#fff', fontSize: '16px', letterSpacing: '2px' }}>{p.sym}</span>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}>{p.abbr}</span>
                <span style={{ color: '#666', fontSize: '11px' }}>{p.name}</span>
              </div>
              <div style={{ color: '#555', fontSize: '11px', lineHeight: '1.5' }}>{p.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '12px', border: '1px solid #2a2a2a', padding: '10px', background: '#030303' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ color: '#FFD700', fontSize: '16px' }}>☀</span>
            <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '11px' }}>ALWAYS SUNNY PRINCIPLE</span>
          </div>
          <div style={{ color: '#555', fontSize: '11px', lineHeight: '1.5' }}>
            Overlay principle applied to ALL assets. Every brand expression must present a positive,
            aspirational, unambiguous face. Hard FAIL for Final Work if violated.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: FILES
// ─────────────────────────────────────────────────────────────────────────────

function FilesTab({ source, setSource }: { source: Source; setSource: (s: Source) => void }) {
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

  return (
    <div>
      <div style={S.panel}>
        <div style={S.panelHead}>:: FILE SOURCE CONNECTION ::</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(['demo', 'gdrive', 'dropbox'] as Source[]).map(s => (
            <button
              key={s}
              style={S.tabBtn(source === s)}
              onClick={() => setSource(s)}
            >
              {s === 'demo' ? '[ DEMO DATA ]' : s === 'gdrive' ? '[ GOOGLE DRIVE ]' : '[ DROPBOX ]'}
            </button>
          ))}
        </div>

        {source === 'none' && (
          <div style={{ color: '#555', fontSize: '12px' }}>Select a source to load asset folders.</div>
        )}

        {(source === 'gdrive' || source === 'dropbox') && (
          <div style={{ border: '1px dashed #333', padding: '20px', textAlign: 'center', color: '#555' }}>
            <div style={{ fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {source === 'gdrive' ? 'Google Drive OAuth' : 'Dropbox OAuth'} — Connect to load live folder data
            </div>
            <button
              style={{ ...S.tabBtn(false), padding: '8px 24px' }}
              onClick={() => alert(`${source === 'gdrive' ? 'Google Drive' : 'Dropbox'} OAuth integration requires backend credentials.\nSwitch to [ DEMO DATA ] to explore full governance features.`)}
            >
              [ AUTHENTICATE ]
            </button>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#444' }}>
              Requires API key + OAuth 2.0 redirect URI
            </div>
          </div>
        )}

        {source === 'demo' && (
          <div>
            <div style={{ color: '#555', fontSize: '11px', marginBottom: '10px' }}>
              DEMO MODE — Simulated brand asset folder structure. Click any folder to expand.
            </div>
            {MOCK_FOLDERS.map(f => {
              const isExpanded = expandedFolder === f.path;
              const folderAssets = ASSETS.filter(a => a.folder === f.path);
              return (
                <div key={f.path} style={{ marginBottom: '4px' }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px',
                      border: '1px solid #1a1a1a', cursor: 'pointer', background: isExpanded ? '#111' : '#050505',
                    }}
                    onClick={() => setExpandedFolder(isExpanded ? null : f.path)}
                  >
                    <span style={{ color: '#888' }}>{isExpanded ? '▾' : '▸'}</span>
                    <span style={{ color: '#ccc', fontSize: '12px', fontFamily: 'monospace' }}>📁 {f.path}</span>
                    <span style={S.badge(f.type === 'final' ? 'FINAL' : 'ONGOING')}>
                      [{f.type.toUpperCase()}]
                    </span>
                    <span style={{ color: '#555', fontSize: '11px', marginLeft: 'auto' }}>{f.count} files</span>
                  </div>
                  {isExpanded && folderAssets.map(a => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '4px 8px 4px 24px', borderBottom: '1px solid #111',
                        fontSize: '11px', background: '#070707',
                      }}
                    >
                      <span style={{ color: '#555', width: '12px' }}>·</span>
                      <span style={{ color: '#aaa', flex: 1 }}>{a.name}</span>
                      <span style={{ color: '#555' }}>{a.type.toUpperCase()}</span>
                      <span style={{ color: '#444' }}>{a.brand}</span>
                      <span style={S.badge(a.result)}>[{a.result}]</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: GOVERNANCE
// ─────────────────────────────────────────────────────────────────────────────

function GovernanceTab() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return ASSETS.filter(a => {
      if (filter === 'ALL') return true;
      if (filter === 'FINAL') return a.folderType === 'final';
      if (filter === 'ONGOING') return a.folderType === 'ongoing';
      return a.result === filter;
    });
  }, [filter]);

  const filters: Filter[] = ['ALL', 'FINAL', 'ONGOING', 'PASS', 'FAIL', 'WARN'];

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
        <span style={{ color: '#555', fontSize: '11px', alignSelf: 'center', marginRight: '4px' }}>FILTER:</span>
        {filters.map(f => (
          <button key={f} style={S.filterBtn(filter === f)} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
        <span style={{ color: '#444', fontSize: '11px', alignSelf: 'center', marginLeft: '8px' }}>
          {filtered.length} / {ASSETS.length} assets
        </span>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.4fr 1.2fr 70px 70px 70px 70px 80px 70px',
        gap: '4px', padding: '4px 6px', borderBottom: '1px solid #333',
        fontSize: '10px', color: '#555', textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        <span>Asset</span>
        <span>Brand</span>
        <span>Folder</span>
        <span>!@! SE</span>
        <span>{'>#<'} CI</span>
        <span>** HE</span>
        <span>|-| OS</span>
        <span>☀ SUNNY</span>
        <span>Result</span>
      </div>

      {/* Rows */}
      {filtered.map(a => (
        <div
          key={a.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.4fr 1.2fr 70px 70px 70px 70px 80px 70px',
            gap: '4px', padding: '5px 6px', borderBottom: '1px solid #111',
            fontSize: '11px', background: hovered === a.id ? '#0d0d0d' : 'transparent',
            cursor: 'default',
          }}
          onMouseEnter={() => setHovered(a.id)}
          onMouseLeave={() => setHovered(null)}
        >
          <span style={{ color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {a.name}
          </span>
          <span style={{ color: '#666', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {a.brand}
          </span>
          <span style={S.badge(a.folderType === 'final' ? 'FINAL' : 'ONGOING')}>
            [{a.folderType.toUpperCase()}]
          </span>
          {([
            { val: a.se, pass: a.se >= 80 },
            { val: a.ci, pass: a.ci >= 75 },
            { val: a.he, pass: a.he >= 78 },
            { val: a.os, pass: a.os >= 72 },
          ] as {val:number; pass:boolean}[]).map((p, i) => (
            <span key={i} style={{ color: p.pass ? '#00FF41' : '#FF4500', fontWeight: 'bold' }}>
              {p.val}
            </span>
          ))}
          <span style={{ color: a.alwaysSunny ? '#FFD700' : '#FF4500' }}>
            {a.alwaysSunny ? '[✓]' : '[✗]'}
          </span>
          <span style={S.badge(a.result)}>[{a.result}]</span>
        </div>
      ))}

      {/* Thresholds */}
      <div style={{ marginTop: '12px', border: '1px dashed #2a2a2a', padding: '8px', fontSize: '11px', color: '#444' }}>
        PASS THRESHOLDS — SE≥80 · CI≥75 · HE≥78 · OS≥72 · ☀SUNNY=true
        &nbsp;&nbsp;|&nbsp;&nbsp;
        FINAL: hard PASS/FAIL &nbsp;&nbsp;·&nbsp;&nbsp; ONGOING: advisory PASS/WARN
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function DashboardTab() {
  const finalAssets   = ASSETS.filter(a => a.folderType === 'final');
  const ongoingAssets = ASSETS.filter(a => a.folderType === 'ongoing');

  const fPass = finalAssets.filter(a => a.result === 'PASS').length;
  const fFail = finalAssets.filter(a => a.result === 'FAIL').length;
  const oPass = ongoingAssets.filter(a => a.result === 'PASS').length;
  const oWarn = ongoingAssets.filter(a => a.result === 'WARN').length;

  const seAvg = avg(ASSETS.map(a => a.se));
  const ciAvg = avg(ASSETS.map(a => a.ci));
  const heAvg = avg(ASSETS.map(a => a.he));
  const osAvg = avg(ASSETS.map(a => a.os));
  const sunnyCount = ASSETS.filter(a => a.alwaysSunny).length;
  const healthScore = Math.round((seAvg + ciAvg + heAvg + osAvg) / 4);

  const healthColor = healthScore >= 80 ? '#00FF41' : healthScore >= 65 ? '#FFD700' : '#FF4500';

  return (
    <div>
      {/* Health banner */}
      <div style={{ ...S.panel, border: `1px solid ${healthColor}33`, marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: '#888', fontSize: '11px', letterSpacing: '1px' }}>:: BRAND GOVERNANCE REPORT ::</span>
          <span style={{ color: '#555', fontSize: '11px' }}>AJAYU MASTER BRAND — ALL TIERS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '48px', color: healthColor, fontWeight: 'bold', lineHeight: 1 }}>
            {healthScore}
          </span>
          <div>
            <div style={{ color: healthColor, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' as const }}>
              OVERALL BRAND HEALTH
            </div>
            <div style={{ color: '#555', fontSize: '11px' }}>/100 — weighted avg of all principles</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' as const }}>
            <div style={{ color: '#00FF41', fontSize: '13px' }}>{ASSETS.filter(a => a.result === 'PASS').length} PASS</div>
            <div style={{ color: '#FF4500', fontSize: '13px' }}>{ASSETS.filter(a => a.result === 'FAIL').length} FAIL</div>
            <div style={{ color: '#FFD700', fontSize: '13px' }}>{ASSETS.filter(a => a.result === 'WARN').length} WARN</div>
          </div>
        </div>
      </div>

      {/* Final vs Ongoing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div style={S.panel}>
          <div style={S.panelHead}>FINAL WORK</div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
            {finalAssets.length} assets — strict governance
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ color: '#00FF41', fontSize: '20px', fontWeight: 'bold' }}>{fPass} <span style={{ fontSize: '11px' }}>PASS</span></span>
            <span style={{ color: '#FF4500', fontSize: '20px', fontWeight: 'bold' }}>{fFail} <span style={{ fontSize: '11px' }}>FAIL</span></span>
          </div>
          <div style={{ marginTop: '8px', height: '6px', background: '#111', position: 'relative' as const }}>
            <div style={{ height: '100%', width: `${(fPass / finalAssets.length) * 100}%`, background: '#00FF41' }} />
          </div>
        </div>
        <div style={S.panel}>
          <div style={S.panelHead}>ONGOING WORK</div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
            {ongoingAssets.length} assets — advisory governance
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ color: '#00FF41', fontSize: '20px', fontWeight: 'bold' }}>{oPass} <span style={{ fontSize: '11px' }}>PASS</span></span>
            <span style={{ color: '#FFD700', fontSize: '20px', fontWeight: 'bold' }}>{oWarn} <span style={{ fontSize: '11px' }}>WARN</span></span>
          </div>
          <div style={{ marginTop: '8px', height: '6px', background: '#111', position: 'relative' as const }}>
            <div style={{ height: '100%', width: `${(oPass / ongoingAssets.length) * 100}%`, background: '#FFD700' }} />
          </div>
        </div>
      </div>

      {/* Principle scores */}
      <div style={S.panel}>
        <div style={S.panelHead}>:: PRINCIPLE SCORES — AGGREGATE ::</div>
        <ScoreBar score={seAvg} symbol="!@!" label="SURPRISE ENGINEERING (SE)" />
        <ScoreBar score={ciAvg} symbol=">#<" label="CONNECTION INFRASTRUCTURE (CI)" />
        <ScoreBar score={heAvg} symbol="**"  label="HONEST EXECUTION (HE)" />
        <ScoreBar score={osAvg} symbol="|-|" label="OPERATIONAL SEPARATION (OS)" />
        <div style={{ borderTop: '1px dashed #2a2a2a', paddingTop: '10px', marginTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <span style={{ color: '#FFD700', marginRight: '8px' }}>☀</span>
              <span style={{ color: '#888' }}>ALWAYS SUNNY PRINCIPLE</span>
            </span>
            <span style={{ color: sunnyCount >= ASSETS.length * 0.8 ? '#FFD700' : '#FF4500', fontWeight: 'bold' }}>
              {sunnyCount} / {ASSETS.length} assets PASS
            </span>
          </div>
          <div style={{ marginTop: '4px', fontFamily: 'monospace', color: '#FFD700', fontSize: '14px', letterSpacing: '1px' }}>
            [{scoreBar(Math.round((sunnyCount / ASSETS.length) * 100))}]
          </div>
        </div>
      </div>

      {/* Per-brand summary */}
      <div style={S.panel}>
        <div style={S.panelHead}>:: BY BRAND TIER ::</div>
        {(['master', 'sub', 'product'] as const).map(tier => {
          const tierAssets = ASSETS.filter(a => a.brandTier === tier);
          const tierPass = tierAssets.filter(a => a.result === 'PASS').length;
          const tierFail = tierAssets.filter(a => a.result === 'FAIL').length;
          const tierWarn = tierAssets.filter(a => a.result === 'WARN').length;
          const tierSe = avg(tierAssets.map(a => a.se));
          const tierHealth = avg([tierSe, avg(tierAssets.map(a => a.ci)), avg(tierAssets.map(a => a.he)), avg(tierAssets.map(a => a.os))]);
          const tc = tierHealth >= 80 ? '#00FF41' : tierHealth >= 65 ? '#FFD700' : '#FF4500';
          return (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: '1px solid #111' }}>
              <span style={S.badge(tier.toUpperCase())}>[{tier.toUpperCase()}]</span>
              <span style={{ color: '#777', fontSize: '11px', width: '80px' }}>{tierAssets.length} assets</span>
              <span style={{ color: '#00FF41', fontSize: '11px', width: '50px' }}>{tierPass} pass</span>
              <span style={{ color: '#FF4500', fontSize: '11px', width: '50px' }}>{tierFail} fail</span>
              <span style={{ color: '#FFD700', fontSize: '11px', width: '50px' }}>{tierWarn} warn</span>
              <span style={{ flex: 1, fontFamily: 'monospace', color: tc, fontSize: '12px', letterSpacing: '1px' }}>
                [{scoreBar(tierHealth, 8)}] {tierHealth}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function BrandGovernanceTool() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [source, setSource] = useState<Source>('demo');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'architecture', label: '[ ARCHITECTURE ]' },
    { key: 'files',        label: '[ FILES ]'        },
    { key: 'governance',   label: '[ GOVERNANCE ]'   },
    { key: 'dashboard',    label: '[ DASHBOARD ]'    },
  ];

  return (
    <div style={S.root}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        ::-webkit-scrollbar { width: 6px; background: #000; }
        ::-webkit-scrollbar-thumb { background: #222; border: 1px solid #333; }
      `}</style>

      {/* Tab bar */}
      <div style={S.topBar}>
        <span style={{ color: '#555', fontSize: '11px', letterSpacing: '2px', marginRight: '8px' }}>
          BRAND GOVERNANCE
        </span>
        {tabs.map(t => (
          <button key={t.key} style={S.tabBtn(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: '#333', fontSize: '11px', animation: 'blink 2s step-end infinite' }}>
          ● LIVE
        </span>
      </div>

      {/* Body */}
      <div style={S.body}>
        {activeTab === 'architecture' && <ArchitectureTab />}
        {activeTab === 'files'        && <FilesTab source={source} setSource={setSource} />}
        {activeTab === 'governance'   && <GovernanceTab />}
        {activeTab === 'dashboard'    && <DashboardTab />}
      </div>
    </div>
  );
}
