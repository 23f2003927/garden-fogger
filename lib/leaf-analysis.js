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

  // ── Calibrated decision boundary ──────────────────────────────────────
  // Based on real sensor readings from this specific AS7341 unit:
  //   Dead brown leaf: NDVI=0.54, NIR/Red=3.3, ChlorophyllIdx=9.03
  //   Green fresh leaf: NDVI=0.78, NIR/Red=8.48, ChlorophyllIdx=8.79
  //
  // The strongest separators are NDVI (midpoint ~0.65) and NIR/Red ratio
  // (midpoint ~5.5). We require BOTH conditions to avoid false positives.
  const isGreen = ndvi >= 0.65 && simpleRatio >= 5.5;

  if (isGreen) {
    return {
      isLeaf: true,
      status: "Green Leaf Found",
      score: Math.min(100, Math.round(60 + ((ndvi - 0.65) / 0.35) * 40)), // 60-100%
      ndvi: Number(ndvi.toFixed(3)),
      chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
      simpleRatio: Number(simpleRatio.toFixed(3)),
      message: "Green Leaf Found! Strong chlorophyll levels and healthy leaf structure detected."
    };
  } else {
    return {
      isLeaf: true,
      status: "Dead Leaf Detected",
      score: Math.max(5, Math.min(45, Math.round(ndvi * 70))), // 5-45%
      ndvi: Number(ndvi.toFixed(3)),
      chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
      simpleRatio: Number(simpleRatio.toFixed(3)),
      message: "Dead Leaf Detected! Chlorophyll levels have collapsed and tissue has turned brown."
    };
  }
}


