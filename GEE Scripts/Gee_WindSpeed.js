// ============================================================
// WIND SPEED EXTRACTION
// SUNDARBANS ESTUARINE SYSTEM
// ERA5 MONTHLY DATA
// 2020 - 2024
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
Map.addLayer(stations, {color: 'green'}, 'Stations');

// ------------------------------------------------------------
// LOAD ERA5 MONTHLY DATASET
// ------------------------------------------------------------

var era5 = ee.ImageCollection(
  'ECMWF/ERA5_LAND/MONTHLY'
);

// ------------------------------------------------------------
// FILTER DATE
// ------------------------------------------------------------

var collection = era5.filterDate('2020-01-01', '2025-01-01');

// ------------------------------------------------------------
// CALCULATE WIND SPEED
// sqrt(u² + v²)
// ------------------------------------------------------------

var windCollection = collection.map(function(image) {

  var u = image.select('u_component_of_wind_10m');

  var v = image.select('v_component_of_wind_10m');

  var windSpeed = u.pow(2)
    .add(v.pow(2))
    .sqrt()
    .rename('WindSpeed');

  return windSpeed.copyProperties(
    image,
    ['system:time_start']
  );

});

// ------------------------------------------------------------
// SAMPLE MONTHLY DATA
// ------------------------------------------------------------

var extracted = windCollection.map(function(image) {

  var sampled = image.reduceRegions({

    collection: stations,

    reducer: ee.Reducer.mean(),

    scale: 10000

  });

  var date = ee.Date(image.get('system:time_start'));

  sampled = sampled.map(function(feature) {

    return feature.set({

      year: date.get('year'),

      month: date.get('month')

    });

  });

  return sampled;

}).flatten();

// ------------------------------------------------------------
// PRINT RESULTS
// ------------------------------------------------------------

print('Wind Speed Dataset', extracted);

// ------------------------------------------------------------
// EXPORT CSV
// ------------------------------------------------------------

Export.table.toDrive({

  collection: extracted,

  description: 'Sundarbans_WindSpeed_2020_2024',

  folder: 'GEE_Marine_Project',

  fileNamePrefix: 'sundarbans_windspeed',

  fileFormat: 'CSV'

});

print('Wind speed extraction completed successfully.');