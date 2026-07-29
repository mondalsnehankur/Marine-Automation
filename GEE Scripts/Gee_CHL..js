// ============================================================
// CHLOROPHYLL EXTRACTION
// SUNDARBANS ESTUARINE SYSTEM
// 2020 - 2024
// ============================================================

// ------------------------------------------------------------
// DEFINE STATIONS
// ------------------------------------------------------------

var stations = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([88.30, 21.75]),{station: 'S1'}),
  ee.Feature(ee.Geometry.Point([88.306735, 21.724995]),{station: 'S2'}),
  ee.Feature(ee.Geometry.Point([88.28667, 21.77179]),{station: 'S3'}),
  ee.Feature(ee.Geometry.Point([88.2506983, 21.57936]),{station: 'S4'}),
  ee.Feature(ee.Geometry.Point([88.2902333, 21.7103617]),{station: 'S5'}),
  ee.Feature(ee.Geometry.Point([88.274456, 21.577109]),{station: 'S6'}),
  ee.Feature(ee.Geometry.Point([88.4700, 21.6000]),{station: 'S7'}),
  ee.Feature(ee.Geometry.Point([88.2346817, 21.7603083]),{station: 'S8'}),
  ee.Feature(ee.Geometry.Point([88.3014583, 21.6000]),{station: 'S9'}),
  ee.Feature(ee.Geometry.Point([88.2078683, 21.74898]),{station: 'S10'})
]);
// ------------------------------------------------------------
// DISPLAY STATIONS
// ------------------------------------------------------------

Map.centerObject(stations, 9);
Map.addLayer(
  stations,
  {color: 'red'},
  'Stations'
);
// ------------------------------------------------------------
// LOAD MODIS CHLOROPHYLL DATASET
// ------------------------------------------------------------
var chlCollection = ee.ImageCollection(
  'NASA/OCEANDATA/MODIS-Aqua/L3SMI'
);
// ------------------------------------------------------------
// EMPTY FEATURE LIST
// ------------------------------------------------------------
var allFeatures = [];
// ------------------------------------------------------------
// YEAR LOOP
// ------------------------------------------------------------
for (var year = 2020; year <= 2024; year++) {
  // ----------------------------------------------------------
  // MONTH LOOP
  // ----------------------------------------------------------
  for (var month = 1; month <= 12; month++) {
    // --------------------------------------------------------
    // DATE
    // --------------------------------------------------------
    var dateString =
      year + '-' +
      ('0' + month).slice(-2) +
      '-01';

    var start = ee.Date(dateString);
    var end = start.advance(1, 'month');
    // --------------------------------------------------------
    // FILTER COLLECTION
    // --------------------------------------------------------
    var filtered = chlCollection.filterDate(start, end).filter(ee.Filter.listContains('system:band_names','chlor_a'));
    // --------------------------------------------------------
    // CREATE IMAGE
    // --------------------------------------------------------
    var chlImage = ee.Image(
      ee.Algorithms.If(
        filtered.size().gt(0),
        filtered
          .mean()
          .select('chlor_a')
          .rename('Chlorophyll'),
        ee.Image.constant(-9999)
          .rename('Chlorophyll')
      )
    );
    // --------------------------------------------------------
    // SAMPLE STATIONS
    // --------------------------------------------------------
    var sampled = chlImage.sampleRegions({collection: stations, scale: 4000, geometries: false});
    // --------------------------------------------------------
    // ADD YEAR + MONTH
    // --------------------------------------------------------
    sampled = sampled.map(function(feature) {
      return feature.set({
        year: year,
        month: month
      });
    });
    // --------------------------------------------------------
    // STORE FEATURES
    // --------------------------------------------------------
    allFeatures.push(sampled);
  }
}
// ------------------------------------------------------------
// CREATE FINAL COLLECTION
// ------------------------------------------------------------
var finalCollection = ee.FeatureCollection(allFeatures).flatten();
// ------------------------------------------------------------
// PRINT RESULTS
// ------------------------------------------------------------
print('Chlorophyll Dataset', finalCollection);
// ------------------------------------------------------------
// EXPORT CSV
// ------------------------------------------------------------
Export.table.toDrive({
  collection: finalCollection,
  description:
    'Sundarbans_Chlorophyll_2020_2024',
  folder:
    'GEE_Marine_Project',
  fileNamePrefix:
    'sundarbans_chlorophyll',
  fileFormat:
    'CSV'
});
// ------------------------------------------------------------
// COMPLETION MESSAGE
// ------------------------------------------------------------
print('Chlorophyll extraction completed successfully.');