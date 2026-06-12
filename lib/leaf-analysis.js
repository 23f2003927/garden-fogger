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

  // Check if sensor is uncovered or in total darkness
  if (clear < 80 || totalVisible < 50) {
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

  // 1. GREEN LEAF DETECTED:
  // - Reflects NIR strongly (simpleRatio >= 1.3)
  // - Absorbs Red (chlorophyll), meaning Green reflectance is higher than Red (greenToRed > 1.0)
  // - High NDVI (typically > 0.45)
  if (ndvi >= 0.45 && greenToRed >= 1.0 && simpleRatio >= 1.30) {
    return {
      isLeaf: true,
      status: "Green Leaf Found",
      score: Math.min(100, Math.round(70 + (ndvi - 0.45) * 60)), // 70 to 100
      ndvi: Number(ndvi.toFixed(3)),
      chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
      simpleRatio: Number(simpleRatio.toFixed(3)),
      message: "Green Leaf Found! Strong chlorophyll levels and healthy leaf structure detected."
    };
  }

  // 2. DEAD / BROWN LEAF DETECTED:
  // - Chlorophyll is gone, so Red reflectance is equal to or higher than Green reflectance (greenToRed < 1.0)
  // - Cell structure is dry, so NIR is lower (simpleRatio is lower, but still distinct from non-organic objects)
  // - NDVI is low (typically between 0.05 and 0.45)
  if (ndvi > 0.05 && ndvi < 0.45 && greenToRed < 1.0) {
    return {
      isLeaf: true,
      status: "Dead Leaf Detected",
      score: Math.max(5, Math.round((ndvi / 0.45) * 45)), // 5 to 45%
      ndvi: Number(ndvi.toFixed(3)),
      chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
      simpleRatio: Number(simpleRatio.toFixed(3)),
      message: "Dead Leaf Detected! Chlorophyll levels have collapsed and tissue has turned brown."
    };
  }

  // 3. AMBIGUOUS / STRESSED LEAF:
  // If it's a leaf, but doesn't fit the clear "healthy green" or "completely dead brown" profile
  if (simpleRatio >= 1.2 && (nir / clear) > 0.07) {
    return {
      isLeaf: true,
      status: "Stressed Leaf Found",
      score: Math.round(45 + ((ndvi - 0.15) / 0.30) * 25), // 45 to 70%
      ndvi: Number(ndvi.toFixed(3)),
      chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
      simpleRatio: Number(simpleRatio.toFixed(3)),
      message: "Stressed or yellowing leaf detected. Check for dehydration or nutrient deficiency."
    };
  }

  // 4. NOT A LEAF (ambient light, plastic, paper, or hand):
  return {
    isLeaf: false,
    status: "Not a Leaf",
    score: 0,
    ndvi: Number(ndvi.toFixed(3)),
    chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
    simpleRatio: Number(simpleRatio.toFixed(3)),
    message: "The spectral signature does not match a plant leaf. Place sensor flat against a leaf."
  };
}

