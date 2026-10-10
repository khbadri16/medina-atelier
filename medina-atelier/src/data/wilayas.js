// Algerian wilayas (provinces) with a delivery zone used to price shipping.
// Zone 1: near the Annaba workshop · 2: north · 3: high plateaus & northern Sahara · 4: far south.

export const WILAYAS = [
  [1, 'Adrar', 4], [2, 'Chlef', 2], [3, 'Laghouat', 3], [4, 'Oum El Bouaghi', 2],
  [5, 'Batna', 2], [6, 'Béjaïa', 2], [7, 'Biskra', 3], [8, 'Béchar', 4],
  [9, 'Blida', 2], [10, 'Bouira', 2], [11, 'Tamanrasset', 4], [12, 'Tébessa', 2],
  [13, 'Tlemcen', 2], [14, 'Tiaret', 2], [15, 'Tizi Ouzou', 2], [16, 'Alger', 2],
  [17, 'Djelfa', 3], [18, 'Jijel', 2], [19, 'Sétif', 2], [20, 'Saïda', 3],
  [21, 'Skikda', 1], [22, 'Sidi Bel Abbès', 2], [23, 'Annaba', 1], [24, 'Guelma', 1],
  [25, 'Constantine', 1], [26, 'Médéa', 2], [27, 'Mostaganem', 2], [28, "M'Sila", 3],
  [29, 'Mascara', 2], [30, 'Ouargla', 3], [31, 'Oran', 2], [32, 'El Bayadh', 3],
  [33, 'Illizi', 4], [34, 'Bordj Bou Arréridj', 2], [35, 'Boumerdès', 2], [36, 'El Tarf', 1],
  [37, 'Tindouf', 4], [38, 'Tissemsilt', 2], [39, 'El Oued', 3], [40, 'Khenchela', 2],
  [41, 'Souk Ahras', 1], [42, 'Tipaza', 2], [43, 'Mila', 2], [44, 'Aïn Defla', 2],
  [45, 'Naâma', 3], [46, 'Aïn Témouchent', 2], [47, 'Ghardaïa', 3], [48, 'Relizane', 2],
  [49, 'Timimoun', 4], [50, 'Bordj Badji Mokhtar', 4], [51, 'Ouled Djellal', 3], [52, 'Béni Abbès', 4],
  [53, 'In Salah', 4], [54, 'In Guezzam', 4], [55, 'Touggourt', 3], [56, 'Djanet', 4],
  [57, "El M'Ghair", 3], [58, 'El Meniaa', 3],
].map(([code, name, zone]) => ({ code, name, zone }));

export function findWilaya(code) {
  return WILAYAS.find((w) => w.code === Number(code)) || null;
}
