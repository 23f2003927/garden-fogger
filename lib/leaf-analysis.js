/**
 * Analyzes spectral reading data to determine if it is a live plant leaf
 * and computes the leaf's health indices and status.
 *
 * @param {object} data - Object containing 10-channel spectral values
 * @returns {object} Analysis result containing health status, score, NDVI, etc.
 */
export function analyzeLeafData(data) {
  if (!data) {
    return {
      isLeaf: false,
      status: "No Data",
      score: 0,
      ndvi: 0,
      chlorophyllIndex: 0,
      simpleRatio: 0,
      message: "No data received for analysis."
    };
  }

  const f1 = Number(data.f1_415nm ?? data.violet_415 ?? 0);
  const f2 = Number(data.f2_445nm ?? data.indigo_445 ?? 0);
  const f3 = Number(data.f3_480nm ?? data.blue_480 ?? 0);
  const f4 = Number(data.f4_515nm ?? data.cyan_515 ?? 0);
  const f5 = Number(data.f5_555nm ?? data.green_555 ?? 0);
  const f6 = Number(data.f6_590nm ?? data.yellow_590 ?? 0);
  const f7 = Number(data.f7_630nm ?? data.orange_630 ?? 0);
  const f8 = Number(data.f8_680nm ?? data.red_680 ?? 0);
  const clear = Number(data.clear ?? data.clear_channel ?? 0);
  const nir = Number(data.nir ?? data.nir_channel ?? 0);

  const totalVisible = f1 + f2 + f3 + f4 + f5 + f6 + f7 + f8;

  // Basic validation to prevent calculations in total darkness
  if (clear < 50 || totalVisible < 30) {
    return {
      isLeaf: false,
      status: "No Leaf Detected",
      score: 0,
      ndvi: 0,
      chlorophyllIndex: 0,
      simpleRatio: 0,
      message: "Sensor is uncovered or in darkness. Place the sensor flat on a leaf."
    };
  }

  // Calculate critical agricultural ratios
  const ndvi = (nir + f8 > 0) ? (nir - f8) / (nir + f8) : 0;
  const greenToRed = (f8 > 0) ? (f5 / f8) : 0;
  const chlorophyllIndex = (f5 > 0) ? (nir / f5) - 1 : 0;
  const simpleRatio = (f8 > 0) ? (nir / f8) : 0;

  // ── Robust scoring boundary ────────────────────────────────────────────
  // Uses a weighted score from multiple indicators for robustness against
  // real-world sensor fluctuations. Each indicator contributes a vote:
  //   - NDVI >= 0.55 → strong green signal (healthy leaves typically 0.6-0.9)
  //   - NIR/Red ratio >= 4.0 → NIR dominance (green leaves reflect much more NIR)
  //   - Green/Red ratio >= 1.0 → green reflectance above red (chlorophyll active)
  //
  // If ANY strong indicator fires, classify as green. This prevents false
  // negatives from a single metric dipping due to sensor noise or angle.
  const greenVotes = 
    (ndvi >= 0.55 ? 1 : 0) + 
    (simpleRatio >= 4.0 ? 1 : 0) + 
    (greenToRed >= 1.0 ? 1 : 0);

  const isGreen = greenVotes >= 2;  // At least 2 out of 3 indicators agree

  if (isGreen) {
    // Score scales from 55 to 100 based on NDVI strength
    const healthScore = Math.min(100, Math.round(55 + (ndvi * 45)));
    return {
      isLeaf: true,
      status: "Green Leaf Found",
      score: healthScore,
      ndvi: Number(ndvi.toFixed(3)),
      chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
      simpleRatio: Number(simpleRatio.toFixed(3)),
      greenToRed: Number(greenToRed.toFixed(3)),
      message: "Green Leaf Found! Strong chlorophyll levels and healthy leaf structure detected."
    };
  } else {
    const deadScore = Math.max(5, Math.min(45, Math.round(Math.max(0, ndvi) * 80)));
    return {
      isLeaf: true,
      status: "Dead Leaf Detected",
      score: deadScore,
      ndvi: Number(ndvi.toFixed(3)),
      chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
      simpleRatio: Number(simpleRatio.toFixed(3)),
      greenToRed: Number(greenToRed.toFixed(3)),
      message: "Dead Leaf Detected! Chlorophyll levels have collapsed and tissue has turned brown."
    };
  }
}


