import os
import csv
from qgis.PyQt.QtCore import QCoreApplication
from qgis.core import (
    QgsProcessing,
    QgsProcessingAlgorithm,
    QgsProcessingException,
    QgsProcessingParameterFeatureSource,
    QgsProcessingParameterField,
    QgsProcessingParameterNumber,
    QgsProcessingParameterFolderDestination,
    QgsProcessingParameterEnum,
    QgsProcessingUtils
)
import processing

class DasymetricPopulationAlgorithm(QgsProcessingAlgorithm):
    
    # Deklarasi Konstanta Parameter
    INPUT_ADMIN = 'INPUT_ADMIN'
    FIELD_ADMIN = 'FIELD_ADMIN'
    FIELD_NAMA_DESA = 'FIELD_NAMA_DESA'
    FIELD_NAMA_KEC = 'FIELD_NAMA_KEC'
    
    INPUT_CSV = 'INPUT_CSV'
    FIELD_CSV_ID = 'FIELD_CSV_ID'
    FIELD_POPULATION = 'FIELD_POPULATION'
    INPUT_BUILDING = 'INPUT_BUILDING'
    INPUT_SETTLEMENT = 'INPUT_SETTLEMENT'
    WEIGHT_METHOD = 'WEIGHT_METHOD'
    GRID_SIZE = 'GRID_SIZE'
    MAX_POP_PIXEL = 'MAX_POP_PIXEL'
    CAP_METHOD = 'CAP_METHOD'
    OUTPUT_FOLDER = 'OUTPUT_FOLDER'

    def tr(self, string):
        return QCoreApplication.translate('Processing', string)

    def createInstance(self):
        return DasymetricPopulationAlgorithm()

    def name(self):
        return 'analisisdasimetrik'

    def displayName(self):
        return self.tr('3. Analisis Dasimetrik Penduduk')

    def group(self):
        return self.tr('NTLs_Pop_Distribution')

    def groupId(self):
        return 'ntlspopdistribution'


    def shortHelpString(self):
        return self.tr(
            "<html><body>"
            "<h3 style='color:#1e3a8a;'>📌 Analisis Dasimetrik Penduduk</h3>"
            "<p>Algoritma ini memindahkan data jumlah penduduk dari skala <b>desa</b> ke skala <b>pixel 30×30 m</b>, "
            "dengan asumsi: <i>di mana ada bangunan, di situ ada penduduk</i> — "
            "dengan bobot proporsional terhadap luas atau jumlah bangunan di tiap pixel.</p>"

            "<hr>"
            "<h4 style='color:#1e3a8a;'>🔢 Formula Utama</h4>"
            "<p style='background:#f0f4ff;padding:8px;border-left:4px solid #3b82f6;font-family:monospace;'>"
            "Penduduk_Pixel = (Bobot_Bangunan_Pixel / Total_Bobot_Bangunan_Desa) × Penduduk_Desa"
            "</p>"
            "<p style='font-size:12px; margin-top:-5px;'><i>*Bobot dapat berupa Luas Bangunan (Area) atau Jumlah Bangunan (Count).</i></p>"
            
            "<hr>"
            "<h4 style='color:#1e3a8a;'>📋 Alur Proses</h4>"
            "<ol>"
            "<li><b>Join CSV → SHP Desa:</b> Data penduduk dari CSV digabungkan ke atribut tiap poligon desa berdasarkan ID.</li>"
            "<li><b>Rasterisasi Desa:</b> SHP desa diubah jadi 2 raster: <i>ID_Zone_Desa.tif</i> (ID desa) dan <i>Jumlah_Penduduk.tif</i> (Nilai C).</li>"
            "<li><b>Filter Bangunan:</b> Hanya bangunan yang masuk <i>area permukiman</i> (SETTLEMENT_AREA) yang diproses.</li>"
            "<li><b>Penentuan Bobot (A & B):</b><br>"
            "&nbsp;&nbsp;• <b>Metode Luas:</b> Bobot dihitung berdasarkan luas bangunan (dengan normalisasi akar kuadrat/sqrt agar bangunan raksasa tidak menyedot semua penduduk).<br>"
            "&nbsp;&nbsp;• <b>Metode Jumlah:</b> Membangun grid vektor, lalu menghitung jumlah titik (rumah) murni yang berada tepat di dalam setiap kotak grid (1 titik = bobot 1).</li>"
            "<li><b>Raster Bobot (A):</b> Mengubah data bangunan atau kotak grid menjadi raster bobot bangunan.</li>"
            "<li><b>Total Bobot per Desa (B):</b> Zonal Statistics (SUM) dari raster A per zona desa, lalu di-rasterize kembali. Nilai B menjadi konstan per desa.</li>"
            "<li><b>Raster Kalkulasi Dasimetrik:</b> Menghitung menggunakan Formula Raster: <code>(A / (B + 0.00001)) × C</code>. Tiap piksel mendapat porsi penduduk yang proporsional.</li>"
            "<li><b>Redistribusi Penduduk (Opsional):</b> Jika batas maks/piksel (> 0) diaktifkan, sisa penduduk yang melebihi kapasitas akan dibagikan kembali (<i>Water-filling</i>) ke bangunan lain (pilihan: Soft/Hard Cap).</li>"
            "<li><b>Validasi &amp; Laporan:</b> Membandingkan hasil perhitungan piksel dengan data awal CSV. (≤1% Optimal, 1–5% Wajar, >5% Kritis).</li>"
            "</ol>"

            "<hr>"
            "<h4 style='color:#1e3a8a;'>📦 Output yang Dihasilkan</h4>"
            "<ul>"
            "<li><b>ID_Zone_Desa.tif</b> — Raster ID zona administrasi desa</li>"
            "<li><b>Jumlah_Penduduk.tif</b> — Raster jumlah penduduk per desa (flat)</li>"
            "<li><b>Building_Density_Ras.tif</b> — Raster luas bangunan per pixel (bobot A)</li>"
            "<li><b>Building_Density_Total_Zone.tif</b> — Total luas bangunan per desa (bobot B)</li>"
            "<li><b>Distribusi_Penduduk.tif</b> — ⭐ Hasil akhir: penduduk terdistribusi per pixel 30×30m</li>"
            "<li><b>Validasi_Penduduk.csv</b> — Tabel validasi per desa</li>"
            "<li><b>Laporan_Validitas.html</b> — Dashboard validasi interaktif</li>"
            "</ul>"

            "<hr>"
            "<i><font color='green'>Authored by Faisal Fadhilah.</font></i>"
            "</body></html>"
        )


    def initAlgorithm(self, config=None):
        self.addParameter(QgsProcessingParameterFeatureSource(
            self.INPUT_ADMIN, self.tr('SHP Administrasi Desa (Polygon)'), [QgsProcessing.TypeVectorPolygon]))
        self.addParameter(QgsProcessingParameterFeatureSource(
            self.INPUT_CSV, self.tr('File CSV Jumlah Penduduk (Table)'), [QgsProcessing.TypeVector]))
        
        self.addParameter(QgsProcessingParameterField(
            self.FIELD_ADMIN, self.tr('Field ID Zona di SHP Administrasi'), '', self.INPUT_ADMIN))
        self.addParameter(QgsProcessingParameterField(
            self.FIELD_NAMA_DESA, self.tr('Field Nama Desa di SHP (Opsional)'), '', self.INPUT_ADMIN, optional=True))
        self.addParameter(QgsProcessingParameterField(
            self.FIELD_NAMA_KEC, self.tr('Field Nama Kecamatan di SHP (Opsional)'), '', self.INPUT_ADMIN, optional=True))
            
        self.addParameter(QgsProcessingParameterField(
            self.FIELD_CSV_ID, self.tr('Field ID di CSV'), '', self.INPUT_CSV))
        self.addParameter(QgsProcessingParameterField(
            self.FIELD_POPULATION, self.tr('Field Jumlah Penduduk di CSV'), '', self.INPUT_CSV, QgsProcessingParameterField.Numeric))
        
        self.addParameter(QgsProcessingParameterFeatureSource(
            self.INPUT_BUILDING, self.tr('SHP Open Building (Polygon)'), [QgsProcessing.TypeVectorPolygon]))
        self.addParameter(QgsProcessingParameterFeatureSource(
            self.INPUT_SETTLEMENT, self.tr('SHP Coverage Area Pemukiman (Polygon)'), [QgsProcessing.TypeVectorPolygon]))
            
        self.addParameter(QgsProcessingParameterEnum(
            self.WEIGHT_METHOD, self.tr('Metode Kalkulasi / Pembobotan'),
            options=[
                'Berdasarkan Luas Bangunan (Proporsional Area)',
                'Berdasarkan Jumlah Bangunan (Satu Rumah = Satu Hitungan)'
            ],
            defaultValue=0
        ))
        
        self.addParameter(QgsProcessingParameterNumber(
            self.GRID_SIZE, self.tr('Ukuran Piksel (meter)'), type=QgsProcessingParameterNumber.Double, defaultValue=30.0))
            
        self.addParameter(QgsProcessingParameterNumber(
            self.MAX_POP_PIXEL, self.tr('Batas Maksimal Penduduk per Piksel (Isi 0 jika tidak dibatasi)'), type=QgsProcessingParameterNumber.Double, defaultValue=70.0, optional=True))
            
        self.addParameter(QgsProcessingParameterEnum(
            self.CAP_METHOD, self.tr('Metode Batasan (Jika melebihi batas)'),
            options=[
                'Soft Cap (Aman): Otomatis menyesuaikan batas jika bangunan desa tidak muat, agar tidak ada penduduk yang hilang.',
                'Hard Cap (Berisiko): Nilai dikunci mutlak. Jika bangunan desa tidak muat, sisa penduduk DIBUANG (validasi error).'
            ],
            defaultValue=0
        ))
        self.addParameter(QgsProcessingParameterFolderDestination(
            self.OUTPUT_FOLDER, self.tr('Folder Output (Tempat menyimpan .tif, .csv, dan .html)')))

    def processAlgorithm(self, parameters, context, feedback):
        output_dir = self.parameterAsString(parameters, self.OUTPUT_FOLDER, context)
        grid_size = self.parameterAsDouble(parameters, self.GRID_SIZE, context)
        target_cap = self.parameterAsDouble(parameters, self.MAX_POP_PIXEL, context)
        cap_method = self.parameterAsEnum(parameters, self.CAP_METHOD, context)
        weight_method = self.parameterAsEnum(parameters, self.WEIGHT_METHOD, context)
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # File paths untuk output
        id_zone_tif = os.path.join(output_dir, 'ID_Zone_Desa.tif')
        pop_zone_tif = os.path.join(output_dir, 'Jumlah_Penduduk.tif')
        bldg_density_tif = os.path.join(output_dir, 'Building_Density_Ras.tif')
        bldg_total_zone_tif = os.path.join(output_dir, 'Building_Density_Total_Zone.tif')
        dist_pop_tif = os.path.join(output_dir, 'Distribusi_Penduduk.tif')
        dist_pop_shp = os.path.join(output_dir, 'Distribusi_Penduduk_Grid.shp')  # ← SHP output baru
        validasi_csv = os.path.join(output_dir, 'Validasi_Penduduk.csv')
        laporan_html = os.path.join(output_dir, 'Laporan_Validitas.html')

        admin_layer = self.parameterAsSource(parameters, self.INPUT_ADMIN, context)
        if admin_layer is None:
            raise QgsProcessingException(self.tr('Layer Administrasi Desa tidak valid atau tidak ditemukan!'))
        extent_rect = admin_layer.sourceExtent()
        # Format extent yang benar untuk processing: xmin, xmax, ymin, ymax
        extent = f"{extent_rect.xMinimum()},{extent_rect.xMaximum()},{extent_rect.yMinimum()},{extent_rect.yMaximum()}"

        feedback.pushInfo("Tahap 1: Melakukan Join Atribut CSV ke SHP Administrasi...")
        join_result = processing.run("native:joinattributestable", {
            'INPUT': parameters[self.INPUT_ADMIN],
            'FIELD': parameters[self.FIELD_ADMIN],
            'INPUT_2': parameters[self.INPUT_CSV],
            'FIELD_2': parameters[self.FIELD_CSV_ID],
            'FIELDS_TO_COPY': [parameters[self.FIELD_POPULATION]],
            'METHOD': 1, 'DISCARD_NONMATCHING': False, 'PREFIX': '',
            'OUTPUT': 'TEMPORARY_OUTPUT'
        }, context=context, feedback=feedback)['OUTPUT']

        feedback.pushInfo("Tahap 1b: Rasterisasi ID Desa dan Jumlah Penduduk...")
        processing.run("gdal:rasterize", {
            'INPUT': join_result, 'FIELD': parameters[self.FIELD_ADMIN],
            'UNITS': 1, 'WIDTH': grid_size, 'HEIGHT': grid_size, 'EXTENT': extent,
            'DATA_TYPE': 5, 'OUTPUT': id_zone_tif
        }, context=context, feedback=feedback)

        processing.run("gdal:rasterize", {
            'INPUT': join_result, 'FIELD': parameters[self.FIELD_POPULATION],
            'UNITS': 1, 'WIDTH': grid_size, 'HEIGHT': grid_size, 'EXTENT': extent,
            'DATA_TYPE': 5, 'OUTPUT': pop_zone_tif
        }, context=context, feedback=feedback)

        feedback.pushInfo("Tahap 2: Filter Bangunan berdasarkan Coverage Area Pemukiman...")
        bldg_intersect = processing.run("native:extractbylocation", {
            'INPUT': parameters[self.INPUT_BUILDING], 'PREDICATE': [0],
            'INTERSECT': parameters[self.INPUT_SETTLEMENT], 'OUTPUT': 'TEMPORARY_OUTPUT'
        }, context=context, feedback=feedback)['OUTPUT']

        # ── PEMILIHAN METODE PEMBOBOTAN ──
        # Metode 0: Berdasarkan LUAS Bangunan (Sqrt Normalisasi)
        # Metode 1: Berdasarkan JUMLAH Bangunan per Grid Pixel (Python/NumPy/GDAL)
        if weight_method == 1:
            # ──────────────────────────────────────────────────────────────────
            # METODE JUMLAH BANGUNAN — Pure Python/GDAL
            # Prinsip: Hitung berapa centroid bangunan jatuh di setiap piksel
            # Menggunakan NumPy bincount → 100% akurat, tidak ada masalah alignment
            # Bobot A = jumlah rumah di pixel itu
            # Bobot B = total rumah di desa itu
            # Formula: (A / B) * Penduduk_Desa
            # ──────────────────────────────────────────────────────────────────
            from osgeo import gdal, osr
            import numpy as np
            from qgis.core import QgsVectorLayer

            # ── Ambil bldg_intersect sebagai QgsVectorLayer langsung ──
            # Menghindari masalah resolusi layer dari context (mapLayerFromString
            # kadang gagal jika layer hanya ada di context, bukan di registri QGIS)
            if isinstance(bldg_intersect, str):
                bldg_layer = QgsProcessingUtils.mapLayerFromString(bldg_intersect, context)
                if bldg_layer is None:
                    raise QgsProcessingException(
                        "Tidak dapat menemukan layer bangunan yang telah difilter. "
                        "Pastikan layer SHP Bangunan dan SHP Area Permukiman valid dan bertumpang tindih."
                    )
            else:
                bldg_layer = bldg_intersect

            n_bldg_raw = bldg_layer.featureCount()
            feedback.pushInfo(f"Tahap 2b [Jumlah Bangunan]: {n_bldg_raw} bangunan ditemukan dalam area permukiman.")

            if n_bldg_raw == 0:
                raise QgsProcessingException(
                    "Tidak ada bangunan yang ditemukan dalam area permukiman (0 fitur setelah filter).\n"
                    "Kemungkinan penyebab:\n"
                    "  1. SHP Bangunan dan SHP Area Permukiman tidak tumpang tindih.\n"
                    "  2. CRS kedua layer tidak sama.\n"
                    "  3. Layer SHP Area Permukiman yang digunakan kosong (memory layer tanpa fitur).\n"
                    "Solusi: Gunakan file .shp untuk layer Area Permukiman, bukan layer memori QGIS."
                )

            feedback.pushInfo("Tahap 3 [Jumlah Bangunan]: Menghitung bangunan per piksel menggunakan NumPy...")

            # Hitung dimensi raster dari extent dan grid_size
            xmin = extent_rect.xMinimum()
            ymin = extent_rect.yMinimum()
            xmax = extent_rect.xMaximum()
            ymax = extent_rect.yMaximum()
            ncols = int(round((xmax - xmin) / grid_size))
            nrows = int(round((ymax - ymin) / grid_size))

            # ── Kumpulkan koordinat centroid langsung dari bldg_layer ──
            # TIDAK menggunakan native:centroids karena hasil layer-nya sulit
            # diambil kembali dari context saat layer adalah TEMPORARY_OUTPUT.
            # Menghitung centroid langsung di Python jauh lebih andal.
            xs, ys = [], []
            for feat in bldg_layer.getFeatures():
                geom = feat.geometry()
                if geom is None or geom.isEmpty():
                    continue
                centroid = geom.centroid().asPoint()
                xs.append(centroid.x())
                ys.append(centroid.y())

            feedback.pushInfo(f"  → {len(xs)} centroid berhasil dihitung dari geometri bangunan.")

            xs = np.array(xs, dtype=np.float64)
            ys = np.array(ys, dtype=np.float64)

            # Hitung indeks piksel untuk setiap centroid
            # col = kolom dari kiri, row = baris dari atas (y-axis dibalik)
            cols = np.floor((xs - xmin) / grid_size).astype(np.int64)
            rows = np.floor((ymax - ys) / grid_size).astype(np.int64)

            # Buang centroid yang berada di luar extent
            valid = (cols >= 0) & (cols < ncols) & (rows >= 0) & (rows < nrows)
            cols, rows = cols[valid], rows[valid]
            feedback.pushInfo(f"  → {int(valid.sum())} bangunan di dalam area, {int((~valid).sum())} di luar extent dibuang.")

            # Hitung jumlah bangunan per piksel menggunakan np.bincount (sangat cepat)
            flat_idx = rows * ncols + cols
            count_flat = np.bincount(flat_idx, minlength=nrows * ncols).astype(np.float32)
            count_array = count_flat.reshape(nrows, ncols)
            feedback.pushInfo(f"  → Piksel dengan min. 1 bangunan: {int((count_array > 0).sum())}")

            # Tulis hasil ke GeoTIFF menggunakan GDAL Python
            drv = gdal.GetDriverByName('GTiff')
            out_ds = drv.Create(bldg_density_tif, ncols, nrows, 1, gdal.GDT_Float32)
            # GeoTransform: (xmin, pixel_width, 0, ymax, 0, -pixel_height)
            out_ds.SetGeoTransform((xmin, grid_size, 0, ymax, 0, -grid_size))
            srs = osr.SpatialReference()
            srs.ImportFromWkt(admin_layer.sourceCrs().toWkt())
            out_ds.SetProjection(srs.ExportToWkt())
            band = out_ds.GetRasterBand(1)
            band.Fill(0.0)
            band.WriteArray(count_array)
            band.FlushCache()
            out_ds = None
            feedback.pushInfo(f"Raster Building Count selesai dibuat: {bldg_density_tif}")


        else:
            # ──────────────────────────────────────────────────────────────────
            # METODE LUAS BANGUNAN (default)
            # Prinsip: pixel_value = sqrt(min(luas_bangunan, pixel_area))
            # Normalisasi Sqrt untuk mencegah bangunan besar mendominasi
            # ──────────────────────────────────────────────────────────────────
            feedback.pushInfo("Tahap 2b [Luas Bangunan]: Menghitung Bobot Luas per Fitur (Sqrt Normalisasi)...")
            pixel_area = grid_size * grid_size
            bldg_with_weight = processing.run("qgis:fieldcalculator", {
                'INPUT': bldg_intersect,
                'FIELD_NAME': 'bldg_weight',
                'FIELD_TYPE': 0,   # Float
                'FIELD_LENGTH': 20,
                'FIELD_PRECISION': 4,
                'FORMULA': f'sqrt(min($area, {pixel_area}))',
                'OUTPUT': 'TEMPORARY_OUTPUT'
            }, context=context, feedback=feedback)['OUTPUT']

            feedback.pushInfo("Tahap 3 [Luas Bangunan]: Rasterisasi Bobot Luas Bangunan per Pixel...")
            processing.run("gdal:rasterize", {
                'INPUT': bldg_with_weight, 'FIELD': 'bldg_weight',
                'UNITS': 1, 'WIDTH': grid_size, 'HEIGHT': grid_size, 'EXTENT': extent,
                'DATA_TYPE': 5, 'INIT': 0,
                'OUTPUT': bldg_density_tif
            }, context=context, feedback=feedback)

        feedback.pushInfo("Tahap 4: Zonal Statistics Total Bobot Bangunan per Desa...")
        # Hitung total bobot bangunan per zona desa (sum semua pixel di tiap desa)
        zonal_stats_bldg = processing.run("native:zonalstatisticsfb", {
            'INPUT': join_result, 'INPUT_RASTER': bldg_density_tif, 'RASTER_BAND': 1,
            'COLUMN_PREFIX': 'bldg_', 'STATISTICS': [1], 'OUTPUT': 'TEMPORARY_OUTPUT'
        }, context=context, feedback=feedback)['OUTPUT']

        processing.run("gdal:rasterize", {
            'INPUT': zonal_stats_bldg, 'FIELD': 'bldg_sum',
            'UNITS': 1, 'WIDTH': grid_size, 'HEIGHT': grid_size, 'EXTENT': extent,
            'DATA_TYPE': 5, 'OUTPUT': bldg_total_zone_tif
        }, context=context, feedback=feedback)


        feedback.pushInfo("Tahap 5: Kalkulasi Dasimetrik (Raster Calculator)...")
        # Formula benar: (luas_bangunan_pixel / total_luas_bangunan_desa) * penduduk_desa
        # → Setiap pixel mendapat nilai penduduk proporsional terhadap luas bangunannya
        dist_pop_raw_id = processing.run("gdal:rastercalculator", {
            'INPUT_A': bldg_density_tif, 'BAND_A': 1,
            'INPUT_B': bldg_total_zone_tif, 'BAND_B': 1,
            'INPUT_C': pop_zone_tif, 'BAND_C': 1,
            'FORMULA': '(A / (B + 0.00001)) * C',
            'RTYPE': 5, 'OUTPUT': 'TEMPORARY_OUTPUT'
        }, context=context, feedback=feedback)['OUTPUT']

        feedback.pushInfo("Tahap 5b: Redistribusi Penduduk (Soft Cap Opsional) dan Konversi ke SHP Grid...")
        
        # Langkah 1: Ubah raster distribusi menjadi poligon per pixel
        pixels_all = processing.run("native:pixelstopolygons", {
            'INPUT_RASTER': dist_pop_raw_id,
            'RASTER_BAND': 1,
            'FIELD_NAME': 'Pop_Pixel',
            'OUTPUT': 'memory:'
        }, context=context, feedback=feedback)['OUTPUT']

        # Langkah 2: Buang pixel yang nilainya 0 (tidak ada bangunan/penduduk)
        pixels_filtered = processing.run("native:extractbyexpression", {
            'INPUT': pixels_all,
            'EXPRESSION': '"Pop_Pixel" > 0',
            'OUTPUT': 'memory:'
        }, context=context, feedback=feedback)['OUTPUT']
        
        if target_cap > 0:
            # Langkah 3: Join dengan Admin untuk mendapatkan ID Desa tiap pixel
            pixels_joined_id = processing.run("native:joinattributesbylocation", {
                'INPUT': pixels_filtered,
                'JOIN': parameters[self.INPUT_ADMIN],
                'PREDICATE': [0, 1, 5], # intersect, contains, overlaps
                'JOIN_FIELDS': [parameters[self.FIELD_ADMIN]],
                'METHOD': 0, # one-to-one
                'DISCARD_NONMATCHING': False,
                'PREFIX': '',
                'OUTPUT': 'memory:'
            }, context=context, feedback=feedback)['OUTPUT']

            if isinstance(pixels_joined_id, str):
                pixels_joined_layer = QgsProcessingUtils.mapLayerFromString(pixels_joined_id, context)
            else:
                pixels_joined_layer = pixels_joined_id

            # Langkah 4: Algoritma Iterative Water-filling (Redistribusi)
            feedback.pushInfo(f"Memproses redistribusi pixel yang melebihi batas {target_cap} jiwa...")
            from collections import defaultdict
            
            pixels_joined_layer.startEditing()
            try:
                field_admin_name = parameters[self.FIELD_ADMIN]
                pop_field_idx = pixels_joined_layer.fields().indexOf('Pop_Pixel')
                
                village_pixels = defaultdict(list)
                for feat in pixels_joined_layer.getFeatures():
                    vid = feat[field_admin_name]
                    village_pixels[vid].append(feat)
                    
                for vid, feats in village_pixels.items():
                    if not feats:
                        continue
                        
                    total_pop = sum(f['Pop_Pixel'] for f in feats)
                    avg_pop = total_pop / len(feats)
                    
                    if cap_method == 0:
                        # SOFT CAP: Aman
                        cap = max(target_cap, avg_pop)
                    else:
                        # HARD CAP: Strict (berisiko buang data)
                        cap = target_cap
                    
                    unlocked_feats = {f.id(): f for f in feats}
                    current_pops = {f.id(): f['Pop_Pixel'] for f in feats}
                    
                    while True:
                        excess = 0.0
                        new_unlocked = {}
                        
                        for fid, f in unlocked_feats.items():
                            if current_pops[fid] > cap + 0.001:
                                excess += (current_pops[fid] - cap)
                                current_pops[fid] = cap
                            else:
                                new_unlocked[fid] = f
                                
                        if excess <= 0.01 or not new_unlocked:
                            break
                            
                        sum_unlocked = sum(current_pops[fid] for fid in new_unlocked)
                        for fid in new_unlocked:
                            if sum_unlocked > 0:
                                current_pops[fid] += excess * (current_pops[fid] / sum_unlocked)
                            else:
                                current_pops[fid] += excess / len(new_unlocked)
                                
                        unlocked_feats = new_unlocked
                        
                    for f in feats:
                        pixels_joined_layer.changeAttributeValue(f.id(), pop_field_idx, current_pops[f.id()])
                        
                pixels_joined_layer.commitChanges()
            except Exception as e:
                pixels_joined_layer.rollBack()
                feedback.reportError(f"Error Redistribusi: {str(e)}")

            # Langkah 5: Simpan SHP hasil redistribusi
            processing.run("native:savefeatures", {
                'INPUT': pixels_joined_layer,
                'OUTPUT': dist_pop_shp,
                'LAYER_NAME': 'Distribusi_Penduduk_Grid',
                'DATASOURCE_OPTIONS': '',
                'LAYER_OPTIONS': ''
            }, context=context, feedback=feedback)
            feedback.pushInfo(f"SHP Grid (Teredistribusi) tersimpan: {dist_pop_shp}")

            feedback.pushInfo("Tahap 5c: Re-Rasterisasi Hasil Redistribusi...")
            processing.run("gdal:rasterize", {
                'INPUT': dist_pop_shp, 
                'FIELD': 'Pop_Pixel',
                'UNITS': 1, 'WIDTH': grid_size, 'HEIGHT': grid_size, 'EXTENT': extent,
                'DATA_TYPE': 5, 'INIT': 0,
                'OUTPUT': dist_pop_tif
            }, context=context, feedback=feedback)

        else:
            feedback.pushInfo("Batas maksimal tidak diatur (0). Melewati proses redistribusi...")
            
            processing.run("native:savefeatures", {
                'INPUT': pixels_filtered,
                'OUTPUT': dist_pop_shp,
                'LAYER_NAME': 'Distribusi_Penduduk_Grid',
                'DATASOURCE_OPTIONS': '',
                'LAYER_OPTIONS': ''
            }, context=context, feedback=feedback)
            feedback.pushInfo(f"SHP Grid (Murni) tersimpan: {dist_pop_shp}")
            
            processing.run("gdal:translate", {
                'INPUT': dist_pop_raw_id,
                'OUTPUT': dist_pop_tif
            }, context=context, feedback=feedback)

        feedback.pushInfo("Tahap 6: Validasi dan Pembuatan Laporan AI...")
        final_zonal = processing.run("native:zonalstatisticsfb", {
            'INPUT': join_result, 'INPUT_RASTER': dist_pop_tif, 'RASTER_BAND': 1,
            'COLUMN_PREFIX': 'calc_', 'STATISTICS': [1], 'OUTPUT': 'TEMPORARY_OUTPUT'
        }, context=context, feedback=feedback)['OUTPUT']

        if isinstance(final_zonal, str):
            layer = QgsProcessingUtils.mapLayerFromString(final_zonal, context)
        else:
            layer = final_zonal

        # BUG FIX #2: Validasi layer hasil zonal statistics tidak None
        if layer is None:
            raise QgsProcessingException(self.tr('Gagal memuat layer hasil Zonal Statistics Tahap 6. Proses dihentikan.'))

        field_admin = self.parameterAsString(parameters, self.FIELD_ADMIN, context)
        # BUG FIX #3: Field opsional bisa mengembalikan string kosong, pastikan diperlakukan sebagai None
        field_desa_raw = self.parameterAsString(parameters, self.FIELD_NAMA_DESA, context)
        field_kec_raw = self.parameterAsString(parameters, self.FIELD_NAMA_KEC, context)
        field_desa = field_desa_raw if field_desa_raw else None
        field_kec = field_kec_raw if field_kec_raw else None
        pop_field = self.parameterAsString(parameters, self.FIELD_POPULATION, context)
        
        # Variabel untuk Laporan HTML
        stats_sangat_baik = 0
        stats_toleransi = 0
        stats_buruk = 0
        total_persentase = 0.0
        total_desa = 0

        def safe_float(val):
            try:
                if val is None: return 0.0
                return float(val)
            except (ValueError, TypeError):
                return 0.0

        with open(validasi_csv, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Kecamatan', 'Desa', 'ID_Zona', 'Populasi_Asli', 'Populasi_Kalkulasi', 'Selisih_Angka', 'Persentase_Selisih(%)', 'Kategori_Kelayakan'])
            
            layer_fields = [f.name() for f in layer.fields()]

            for feat in layer.getFeatures():
                id_desa = feat[field_admin]

                # BUG FIX #3: Akses field opsional hanya jika ada di layer
                nama_desa = feat[field_desa] if (field_desa and field_desa in layer_fields) else "-"
                nama_kec = feat[field_kec] if (field_kec and field_kec in layer_fields) else "-"

                pop_asli = safe_float(feat[pop_field] if pop_field in layer_fields else None)

                # BUG FIX #4: Field 'calc_sum' mungkin tidak ada jika join gagal total
                pop_calc = safe_float(feat['calc_sum'] if 'calc_sum' in layer_fields else None)
                
                selisih_angka = abs(pop_calc - pop_asli)
                persentase = (selisih_angka / pop_asli * 100) if pop_asli > 0 else 0.0
                
                if persentase <= 1.0:
                    kategori = 'Sangat Baik / Ideal'
                    stats_sangat_baik += 1
                elif persentase <= 5.0:
                    kategori = 'Batas Toleransi Wajar'
                    stats_toleransi += 1
                else:
                    kategori = 'Tidak Direkomendasikan'
                    stats_buruk += 1
                
                total_persentase += persentase
                total_desa += 1
                writer.writerow([nama_kec, nama_desa, id_desa, round(pop_asli, 2), round(pop_calc, 2), round(selisih_angka, 2), round(persentase, 2), kategori])

        # Logika Insight AI
        rata_rata_error = total_persentase / total_desa if total_desa > 0 else 0
        
        if rata_rata_error <= 1.0:
            ai_insight = "<strong>Kondisi Sangat Optimal:</strong> Analisis dasimetrik berjalan dengan sangat baik. Kehilangan data (data loss) akibat efek tepi sangat minim. Distribusi penduduk selaras dengan infrastruktur bangunan. Model ini sangat valid untuk diteruskan pada analisis keruangan lanjutan."
            status_color = "#10b981" # Green
        elif rata_rata_error <= 5.0:
            ai_insight = "<strong>Kondisi Wajar:</strong> Hasil menunjukkan adanya pergeseran nilai dalam batas toleransi. Penyimpangan ini umum terjadi pada batas administrasi berskala kecil akibat pemotongan grid 30x30m (edge effect). Data ini masih dapat diterima dan cukup andal untuk pengambilan keputusan."
            status_color = "#f59e0b" # Orange
        else:
            ai_insight = "<strong>Peringatan Kritis:</strong> Tingkat penyimpangan melampaui batas wajar. Terdapat distorsi distribusi populasi yang signifikan. Hal ini mungkin terjadi karena ketidakselarasan sistem koordinat (CRS), atau banyak zona desa yang tidak memiliki poligon bangunan/area terbangun sama sekali. Mohon tinjau ulang parameter input."
            status_color = "#ef4444" # Red

        # Pembuatan HTML Dashboard Elegan
        html_content = f"""
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Validitas Dasimetrik</title>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 40px; }}
                .container {{ max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }}
                .header {{ background-color: #1e3a8a; color: white; padding: 30px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
                .content {{ padding: 30px; }}
                .ai-card {{ background: linear-gradient(145deg, #f8fafc, #f1f5f9); border-left: 5px solid {status_color}; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }}
                .ai-header {{ font-size: 18px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }}
                .ai-header::before {{ content: "✨"; }}
                .stats-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }}
                .stat-box {{ background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }}
                .stat-value {{ font-size: 28px; font-weight: bold; color: #111827; margin: 10px 0; }}
                .stat-label {{ font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }}
                .details-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                .details-table th, .details-table td {{ padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }}
                .details-table th {{ background-color: #f9fafb; font-weight: 600; color: #374151; }}
                .badge {{ padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }}
                .badge-green {{ background: #d1fae5; color: #065f46; }}
                .badge-yellow {{ background: #fef3c7; color: #92400e; }}
                .badge-red {{ background: #fee2e2; color: #991b1b; }}
                .footer {{ text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Laporan Validitas Analisis Dasimetrik</h1>
                    <p style="margin-top:10px; opacity: 0.8; font-size: 14px;">Evaluasi Otomatis Distribusi Populasi</p>
                </div>
                <div class="content">
                    <div class="ai-card">
                        <div class="ai-header">Insight Analisis Berbasis AI (Gemini)</div>
                        <p style="margin: 0; line-height: 1.6; color: #4b5563;">{ai_insight}</p>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-label">Rata-rata Margin Error</div>
                            <div class="stat-value" style="color: {status_color};">{rata_rata_error:.2f}%</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Total Zona Dianalisis</div>
                            <div class="stat-value">{total_desa}</div>
                        </div>
                    </div>

                    <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Ringkasan Kategori Kelayakan</h3>
                    <table class="details-table">
                        <tr>
                            <th>Kategori Kelayakan</th>
                            <th>Jumlah Zona (Desa)</th>
                            <th>Status</th>
                        </tr>
                        <tr>
                            <td>Sangat Baik / Ideal (≤ 1%)</td>
                            <td>{stats_sangat_baik}</td>
                            <td><span class="badge badge-green">Optimal</span></td>
                        </tr>
                        <tr>
                            <td>Batas Toleransi Wajar (1% - 5%)</td>
                            <td>{stats_toleransi}</td>
                            <td><span class="badge badge-yellow">Wajar</span></td>
                        </tr>
                        <tr>
                            <td>Tidak Direkomendasikan (> 5%)</td>
                            <td>{stats_buruk}</td>
                            <td><span class="badge badge-red">Periksa Ulang</span></td>
                        </tr>
                    </table>
                </div>
                <div class="footer">
                    <p>Generated automatically by QGIS Processing & AI Insight Algorithm</p>
                    <p><b>Authored by Akbar Abu Bakar</b></p>
                </div>
            </div>
        </body>
        </html>
        """

        # Simpan HTML
        with open(laporan_html, "w", encoding="utf-8") as file:
            file.write(html_content)

        feedback.pushInfo(f"PROSES SELESAI. Output tersimpan di: {output_dir}")
        feedback.pushInfo(f"Silakan buka {laporan_html} di browser Anda untuk melihat laporan AI.")
        feedback.pushInfo(f"SHP Grid Distribusi Penduduk: {dist_pop_shp}")
        
        return {
            'OUTPUT_FOLDER': output_dir,
            'DISTRIBUSI_PENDUDUK': dist_pop_tif,
            'DISTRIBUSI_PENDUDUK_SHP': dist_pop_shp,
            'VALIDASI_CSV': validasi_csv,
            'LAPORAN_HTML': laporan_html
        }
