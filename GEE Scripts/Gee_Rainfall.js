// ============================================================
// RAINFALL EXTRACTION
// SUNDARBANS ESTUARINE SYSTEM
// 2020 - 2024
// ============================================================

// ------------------------------------------------------------
// STATIONS
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
Map.addLayer(stations, {color: 'blue'}, 'Stations');

// ------------------------------------------------------------
// CHIRPS DATASET
// ------------------------------------------------------------

var rainfall = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY');

// ------------------------------------------------------------
// CREATE MONTH LIST
// ------------------------------------------------------------

var years = ee.List.sequence(2020, 2024);
var months = ee.List.sequence(1, 12);

// ------------------------------------------------------------
// BUILD MONTHLY COLLECTION
// ------------------------------------------------------------

var monthlyCollection = ee.ImageCollection(

  years.map(function(y) {

    return months.map(function(m) {

      var start = ee.Date.fromYMD(y, m, 1);

      var end = start.advance(1, 'month');

      var monthlyRain = rainfall
        .filterDate(start, end)
        .sum()
        .select('precipitation')
        .rename('Rainfall_mm');

      return monthlyRain.set({
        year: y,
        month: m
      });

    });

  }).flatten()

);

// ------------------------------------------------------------
// SAMPLE MONTHLY IMAGES
// ------------------------------------------------------------

var extracted = monthlyCollection.map(function(image) {

  var sampled = image.reduceRegions({

    collection: stations,

    reducer: ee.Reducer.mean(),

    scale: 5000

  });

  sampled = sampled.map(function(feature) {

    return feature.set({

      year: image.get('year'),

      month: image.get('month')

    });

  });

  return sampled;

}).flatten();

// ------------------------------------------------------------
// PRINT RESULTS
// ------------------------------------------------------------

print('Rainfall Dataset', extracted);

// ------------------------------------------------------------
// EXPORT CSV
// ------------------------------------------------------------

Export.table.toDrive({

  collection: extracted,

  description: 'Sundarbans_Rainfall_2020_2024',

  folder: 'GEE_Marine_Project',

  fileNamePrefix: 'sundarbans_rainfall',

  fileFormat: 'CSV'

});

print('Rainfall extraction completed successfully.');