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

  // 1. Validation - Ensure sensor is not in total darkness or reading ambient air
  const totalVisible = f1 + f2 + f3 + f4 + f5 + f6 + f7 + f8;
  
  if (clear < 50 || totalVisible < 30) {
    return {
      isLeaf: false,
      status: "Unknown",
      score: 0,
      ndvi: 0,
      chlorophyllIndex: 0,
      simpleRatio: 0,
      message: "No reading detected or sensor is in darkness. Place the sensor flat on a leaf."
    };
  }

  // Calculate NDVI: (NIR - Red) / (NIR + Red)
  // Red is f8 (680nm).
  const ndvi = (nir + f8 > 0) ? (nir - f8) / (nir + f8) : 0;

  // Chlorophyll index: NIR / Green - 1. Green is f5 (555nm).
  const chlorophyllIndex = (f5 > 0) ? (nir / f5) - 1 : 0;

  // Simple Ratio (SR) of NIR / Red
  const simpleRatio = (f8 > 0) ? (nir / f8) : 0;

  // Determine if it's actually a leaf:
  // A leaf MUST reflect NIR much more than visible Red (since it absorbs Red for photosynthesis).
  // If simpleRatio (NIR/Red) is less than 1.25, or NIR is an extremely low fraction of total light,
  // it is likely not a plant leaf (e.g. skin, wall, paper, or raw ambient light).
  const isLeaf = simpleRatio >= 1.25 && (nir / clear) > 0.08;

  if (!isLeaf) {
    return {
      isLeaf: false,
      status: "Not a Leaf",
      score: 0,
      ndvi: Number(ndvi.toFixed(3)),
      chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
      simpleRatio: Number(simpleRatio.toFixed(3)),
      message: "The spectral signature does not match a live plant leaf. Place sensor flush against the leaf surface."
    };
  }

  // Scoring algorithm based on NDVI and Chlorophyll Index:
  // Healthy leaves: NDVI >= 0.55
  // Stressed/Yellowing: NDVI 0.38 - 0.55
  // Severely Stressed/Dry: NDVI < 0.38
  
  let score = 0;
  let status = "Unknown";
  let message = "";

  if (ndvi >= 0.70) {
    // Excellent leaf health
    score = Math.min(100, Math.round(90 + (ndvi - 0.70) * 66)); // Maps 0.70-0.85+ to 90-100
    status = "Excellent";
    message = "Highly healthy leaf! Strong chlorophyll levels and excellent cellular structure.";
  } else if (ndvi >= 0.55) {
    // Normal healthy leaf
    score = Math.round(75 + ((ndvi - 0.55) / 0.15) * 15); // Maps 0.55-0.70 to 75-90
    status = "Healthy";
    message = "Healthy leaf with standard chlorophyll and moisture retention.";
  } else if (ndvi >= 0.38) {
    // Mildly stressed or early chlorosis (yellowing)
    score = Math.round(50 + ((ndvi - 0.38) / 0.17) * 25); // Maps 0.38-0.55 to 50-75
    status = "Mild Stress";
    message = "Mild stress detected. May indicate early yellowing, low light, or slight nutrient deficiency.";
  } else {
    // Severely stressed, dry, or dying leaf
    score = Math.max(0, Math.round((ndvi / 0.38) * 50)); // Maps <0.38 to 0-50
    status = "Severe Stress";
    message = "Significant health issues detected. High risk of dehydration, disease, or severe chlorosis.";
  }

  // Adjust score if chlorophyll concentration is unusually low
  if (chlorophyllIndex < 0.8 && status === "Healthy") {
    score = Math.max(65, score - 10);
    status = "Mild Stress";
    message = "Normal leaf structure but low chlorophyll absorption. Check for iron/nitrogen deficiency.";
  }

  return {
    isLeaf: true,
    status,
    score,
    ndvi: Number(ndvi.toFixed(3)),
    chlorophyllIndex: Number(chlorophyllIndex.toFixed(3)),
    simpleRatio: Number(simpleRatio.toFixed(3)),
    message
  };
}
