// ============================================================
// SEA SURFACE SALINITY (SSS) EXTRACTION
// SUNDARBANS ESTUARINE SYSTEM
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
Map.addLayer(stations, {color: 'red'}, 'Stations');

// ------------------------------------------------------------
// LOAD HYCOM DATASET
// ------------------------------------------------------------

var salinityCollection = ee.ImageCollection(
  'HYCOM/sea_temp_salinity'
);

// ------------------------------------------------------------
// EMPTY FEATURE LIST
// ------------------------------------------------------------

var allFeatures = [];

// ------------------------------------------------------------
// YEAR & MONTH LOOP
// ------------------------------------------------------------

for (var year = 2020; year <= 2024; year++) {

  for (var month = 1; month <= 12; month++) {

    var dateString = year + '-' + ('0' + month).slice(-2) + '-01';

    var start = ee.Date(dateString);
    var end = start.advance(1, 'month');

    // --------------------------------------------------------
    // FILTER VALID IMAGES
    // --------------------------------------------------------

    var filtered = salinityCollection
      .filterDate(start, end)
      .filter(
        ee.Filter.listContains(
          'system:band_names',
          'salinity_0'
        )
      );

    // --------------------------------------------------------
    // CREATE SALINITY IMAGE
    // --------------------------------------------------------

    var salinityImage = ee.Image(

      ee.Algorithms.If(

        filtered.size().gt(0),

        filtered
          .mean()
          .select('salinity_0')
          .rename('Salinity'),

        ee.Image.constant(-9999)
          .rename('Salinity')

      )

    );

    // --------------------------------------------------------
    // SAMPLE STATIONS
    // --------------------------------------------------------

    var sampled = salinityImage.sampleRegions({
      collection: stations,
      scale: 9000,
      geometries: false
    });

    // --------------------------------------------------------
    // ADD YEAR + MONTH
    // --------------------------------------------------------

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

print('Salinity Dataset', finalCollection);

// ------------------------------------------------------------
// EXPORT CSV
// ------------------------------------------------------------

Export.table.toDrive({
  collection: finalCollection,
  description: 'Sundarbans_Salinity_2020_2024',
  folder: 'GEE_Marine_Project',
  fileNamePrefix: 'sundarbans_salinity',
  fileFormat: 'CSV'
});

print('Salinity extraction completed successfully.');