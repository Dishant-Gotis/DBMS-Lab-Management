// Shared lab & PC data helpers — used by LabsPage and Student views

export interface DemoLab {
  id: string;
  labNo: string;
  name: string;
  capacity: number;
  description: string;
}

export interface DemoPC {
  id: string;
  pcNo: string;
  os: string;
  processor: string;
  ram: string;
  storage: string;
  gpu: string;
  status: 'active' | 'inactive' | 'maintenance';
}

// --- Lab Assistants (cycled across all 60 labs) ---
const LAB_ASSISTANTS = [
  'Raj Patel',
  'Priya Sharma',
  'Vikram Singh',
  'Ananya Joshi',
  'Rohan Mehta',
  'Sneha Kulkarni',
];

/** Returns a consistent assistant name for a given lab number */
export const getLabAssistant = (labNo: string): string => {
  const idx = parseInt(labNo, 10) % LAB_ASSISTANTS.length;
  return LAB_ASSISTANTS[idx];
};

// --- Lab Building ---
const BLOCKS = ['61', '62', '63', '64', '65'];

export const buildLabIds = (): string[] => {
  const ids: string[] = [];
  BLOCKS.forEach(block => {
    for (let i = 1; i <= 12; i++) {
      ids.push(`${block}${String(i).padStart(2, '0')}`);
    }
  });
  return ids;
};

export const getAllLabs = (): DemoLab[] =>
  buildLabIds().map((labNo, idx) => ({
    id: `lab-${labNo}`,
    labNo,
    name: `Computer Lab ${labNo}`,
    capacity: 30 + (idx % 4) * 5,
    description: `Specialized practical lab for batch ${labNo.slice(0, 2)} with modern systems.`,
  }));

// --- PC Building ---
const SPEC_SET = [
  { os: 'Windows 11 Pro',   processor: 'Intel Core i7-12700', ram: '16GB DDR4', storage: '512GB NVMe SSD', gpu: 'Intel UHD 770' },
  { os: 'Ubuntu 22.04 LTS', processor: 'AMD Ryzen 7 5800X',   ram: '32GB DDR4', storage: '1TB NVMe SSD',   gpu: 'NVIDIA RTX 3060' },
  { os: 'Windows 10 Pro',   processor: 'Intel Core i5-12400', ram: '16GB DDR4', storage: '512GB SSD',       gpu: 'Intel UHD 730' },
];

// 15 PCs per lab — 13 active, 1 maintenance, 1 inactive
const STATUS_POOL: DemoPC['status'][] = [
  'active', 'active', 'active', 'active', 'active',
  'active', 'active', 'active', 'active', 'active',
  'active', 'active', 'active', 'maintenance', 'inactive',
];

export const buildDemoPCs = (labNo: string): DemoPC[] =>
  Array.from({ length: 15 }, (_, i) => ({
    id: `${labNo}-pc-${i + 1}`,
    pcNo: `${labNo}-PC-${String(i + 1).padStart(2, '0')}`,
    status: STATUS_POOL[i],
    ...SPEC_SET[i % SPEC_SET.length],
  }));
