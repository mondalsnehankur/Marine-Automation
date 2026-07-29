// ============================================================
// SUNDARBANS NUTRIENT EXTRACTION (CURATED VERSION)
// Landsat 8 C2 L2
// Stations-based extraction
// ============================================================

// -----------------------------
// 1. STATIONS (your coordinates)
// -----------------------------

var stations = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([88.30, 21.75]), {station: 'S1'}),
  ee.Feature(ee.Geometry.Point([88.306735, 21.724995]), {station: 'S2'}),
  ee.Feature(ee.Geometry.Point([88.28667, 21.77179]), {station: 'S3'}),
  ee.Feature(ee.Geometry.Point([88.2506983, 21.57936]), {station: 'S4'}),
  ee.Feature(ee.Geometry.Point([88.2902333, 21.7103617]), {station: 'S5'}),
  ee.Feature(ee.Geometry.Point([88.274456, 21.577109]), {station: 'S6'}),
  ee.Feature(ee.Geometry.Point([88.4700, 21.6000]), {station: 'S7'}),
  ee.Feature(ee.Geometry.Point([88.2346817, 21.7603083]), {station: 'S8'}),
  ee.Feature(ee.Geometry.Point([88.3014583, 21.6000]), {station: 'S9'}),
  ee.Feature(ee.Geometry.Point([88.2078683, 21.74898]), {station: 'S10'})
]);

Map.centerObject(stations, 9);
Map.addLayer(stations, {color: 'red'}, 'Stations');

var region = stations.geometry();

// -----------------------------
// 2. LOAD LANDSAT 8
// -----------------------------

var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(region)
  .filterDate('2020-01-01', '2024-12-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 40));

// -----------------------------
// 3. SCALE FUNCTION
// -----------------------------

function scale(image) {
  var optical = image.select('SR_B.*')
    .multiply(0.0000275)
    .add(-0.2);

  return image.addBands(optical, null, true);
}

var data = l8.map(scale);

// -----------------------------
// 4. INDICES + PARAMETERS
// -----------------------------

function addParams(img) {

  var G = img.select('SR_B3');
  var R = img.select('SR_B4');
  var B = img.select('SR_B2');
  var NIR = img.select('SR_B5');
  var SWIR = img.select('SR_B6');

  // pH
  var pH = img.expression(
    "8.4 + 0.141*(SWIR) - 0.228*(G/R)",
    {SWIR: SWIR, G: G, R: R}
  ).rename('pH');

  // nitrate
  var nitrate = img.expression(
    "7.043 - 2.068*(R/B)",
    {R: R, B: B}
  ).rename('NO3');

  // nitrite
  var nitrite = img.expression(
    "2.072 - 2.445*((NIR - SWIR)/(NIR + SWIR)) + 0.001*(B/NIR + B)",
    {NIR: NIR, SWIR: SWIR, B: B}
  ).rename('NO2');

  // phosphate
  var phosphate = img.expression(
    "0.601 + 0.83*(G/R)",
    {G: G, R: R}
  ).rename('PO4');

  // chlorophyll
  var chl = img.expression(
    "15.717 + (-1247.530*B) + (192.236*G) + (846.290*R)",
    {B: B, G: G, R: R}
  ).rename('Chl');

  return img.addBands([pH, nitrate, nitrite, phosphate, chl]);
}

var processed = data.map(addParams);

// -----------------------------
// 5. SAMPLE AT STATIONS
// -----------------------------

var extracted = processed.map(function(image) {

  var date = ee.Date(image.get('system:time_start'));

  var sampled = image.select(['pH','NO3','NO2','PO4','Chl'])
    .reduceRegions({
      collection: stations,
      reducer: ee.Reducer.mean(),
      scale: 30
    })
    .map(function(f) {
      return f.set({
        year: date.get('year'),
        month: date.get('month')
      });
    });

  return sampled;
}).flatten();

// -----------------------------
// 6. OUTPUT
// -----------------------------

print('Nutrient Dataset', extracted);

Export.table.toDrive({
  collection: extracted,
  description: 'Sundarbans_Nutrients_2020_2024',
  fileFormat: 'CSV'
});