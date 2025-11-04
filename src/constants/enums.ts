// src/constants/enums.ts
export const PaketStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ON_PROGRESS: 'ON_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type PaketStatusType = typeof PaketStatus[keyof typeof PaketStatus];

export const TingkatKeparahan = {
  RENDah: 'RENDAH',
  SEDANG: 'SEDANG',
  TINGGI: 'TINGGI',
  KRITIS: 'KRITIS',
} as const;

export type TingkatKeparahanType = typeof TingkatKeparahan[keyof typeof TingkatKeparahan];

export const JenisPaket = {
  PUPR: 'PUPR',
  KONSTRUKSI: 'KONSTRUKSI',
  BARANG: 'BARANG',
  JASA: 'JASA',
  // tambahkan sesuai kebutuhan
} as const;

export type JenisPaketType = typeof JenisPaket[keyof typeof JenisPaket];
