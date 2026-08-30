from qgis.PyQt.QtCore import QCoreApplication
from qgis.core import (
    QgsProcessing,
    QgsProcessingAlgorithm,
    QgsProcessingParameterFeatureSource,
    QgsProcessingParameterFileDestination,
    QgsVectorLayer,
    QgsProject
)

import ee
import os
import urllib.request
import json
from osgeo import ogr

# Initialize Earth Engine
try:
    ee.Initialize()
except Exception:
    ee.Authenticate()
    ee.Initialize()


class DownloadOpenBuildings(QgsProcessingAlgorithm):

    INPUT_AOI = 'INPUT_AOI'
    OUTPUT_SHP = 'OUTPUT_SHP'

    def tr(self, string):
        return QCoreApplication.translate('Processing', string)

    def createInstance(self):
        return DownloadOpenBuildings()

    def name(self):
        return 'download_open_buildings'

    def displayName(self):
        return self.tr('2. Download Open Buildings from GEE')

    def group(self):
        return self.tr('NTLs_Pop_Distribution')

    def groupId(self):
        return 'ntlspopdistribution'

    def shortHelpString(self):
        return self.tr(
            "Download dataset Google Open Buildings v3 dari Google Earth Engine "
            "berdasarkan polygon AOI dan simpan sebagai Shapefile."
        )

    def initAlgorithm(self, config=None):

        self.addParameter(
            QgsProcessingParameterFeatureSource(
                self.INPUT_AOI,
                self.tr('Input Polygon Layer (AOI)'),
                [QgsProcessing.TypeVectorPolygon]
            )
        )

        self.addParameter(
            QgsProcessingParameterFileDestination(
                self.OUTPUT_SHP,
                self.tr('Output Shapefile'),
                fileFilter='Shapefile (*.shp)'
            )
        )

    def processAlgorithm(self, parameters, context, feedback):

        feedback.pushInfo("Mengambil AOI...")

        aoi_source = self.parameterAsSource(parameters, self.INPUT_AOI, context)

        if aoi_source is None:
            raise Exception("Layer AOI tidak valid.")

        features = list(aoi_source.getFeatures())

        if len(features) == 0:
            raise Exception("AOI tidak memiliki fitur.")

        geom = features[0].geometry()

        if geom.isEmpty():
            raise Exception("Geometry AOI kosong.")

        feedback.pushInfo("Konversi geometry ke format GEE...")

        # Clone geometry agar aman
        geom = geom.constGet().clone()

        # Drop Z dan M jika ada
        geom.dropZValue()
        geom.dropMValue()

        # Convert ke dict GeoJSON (WAJIB)
        geom_json = json.loads(geom.asJson())

        # Buat ee.Geometry (non-geodesic agar stabil)
        roi = ee.Geometry(geom_json, None, False)

        feedback.pushInfo("Mengakses dataset Open Buildings...")

        buildings = ee.FeatureCollection(
            "GOOGLE/Research/open-buildings/v3/polygons"
        )

        buildings_roi = buildings.filterBounds(roi)

        out_shp = self.parameterAsFileOutput(
            parameters,
            self.OUTPUT_SHP,
            context
        )

        out_dir = os.path.dirname(out_shp)
        out_name = os.path.splitext(os.path.basename(out_shp))[0]

        if not os.path.exists(out_dir):
            os.makedirs(out_dir)

        feedback.pushInfo("Mengunduh data dari GEE...")

        try:
            url = buildings_roi.getDownloadURL(filetype='geojson')
        except Exception as e:
            raise Exception(f"Gagal generate download URL: {str(e)}")

        geojson_path = os.path.join(out_dir, out_name + ".geojson")

        try:
            urllib.request.urlretrieve(url, geojson_path)
        except Exception as e:
            raise Exception(f"Gagal mengunduh data: {str(e)}")

        feedback.pushInfo("Mengonversi ke Shapefile...")

        driver = ogr.GetDriverByName("ESRI Shapefile")

        if os.path.exists(out_shp):
            driver.DeleteDataSource(out_shp)

        src_ds = ogr.Open(geojson_path)
        if src_ds is None:
            raise Exception("Gagal membuka file GeoJSON hasil download.")

        src_lyr = src_ds.GetLayer()

        dst_ds = driver.CreateDataSource(out_dir)
        if dst_ds is None:
            raise Exception("Gagal membuat Shapefile output.")

        dst_ds.CopyLayer(src_lyr, out_name)

        src_ds = None
        dst_ds = None

        feedback.pushInfo(f"SHP berhasil dibuat: {out_shp}")

        layer = QgsVectorLayer(out_shp, "Open Buildings ROI", "ogr")

        if layer.isValid():
            QgsProject.instance().addMapLayer(layer)
            feedback.pushInfo("Layer berhasil ditambahkan ke QGIS.")
        else:
            feedback.pushWarning("Layer tidak valid, tetapi file SHP sudah dibuat.")

        return {self.OUTPUT_SHP: out_shp}
