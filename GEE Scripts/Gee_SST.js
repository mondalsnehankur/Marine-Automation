// ============================================================
// SEA SURFACE TEMPERATURE (SST) EXTRACTION
// SUNDARBANS ESTUARINE SYSTEM (2020 - 2024)
// ============================================================

// ------------------------------------------------------------
// DEFINE STATIONS
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// LOAD SST DATASET
// ------------------------------------------------------------

var sstCollection = ee.ImageCollection('NOAA/CDR/OISST/V2_1');
var allFeatures = [];

// ------------------------------------------------------------
// YEAR & MONTH LOOP
// ------------------------------------------------------------

for (var year = 2020; year <= 2024; year++) {

  for (var month = 1; month <= 12; month++) {

    var dateString = year + '-' + ('0' + month).slice(-2) + '-01';

    var start = ee.Date(dateString);
    var end = start.advance(1, 'month');

    var sstImage = sstCollection
      .filterDate(start, end)
      .mean()
      .select('sst')
      .multiply(0.01)
      .rename('SST_C');

    var sampled = sstImage.sampleRegions({
      collection: stations,
      scale: 25000,
      geometries: false
    });

    sampled = sampled.map(function(feature) {
      return feature.set({
        year: year,
        month: month
      });
    });

    allFeatures.push(sampled);
  }
}

// ------------------------------------------------------------
// FINAL COLLECTION
// ------------------------------------------------------------

var finalCollection = ee.FeatureCollection(allFeatures).flatten();

print('Final SST Time Series', finalCollection);

// ------------------------------------------------------------
// EXPORT CSV
// ------------------------------------------------------------

Export.table.toDrive({
  collection: finalCollection,
  description: 'Sundarbans_SST_2020_2024',
  folder: 'GEE_Marine_Project',
  fileNamePrefix: 'sundarbans_sst',
  fileFormat: 'CSV'
});

print('SST extraction completed successfully.');