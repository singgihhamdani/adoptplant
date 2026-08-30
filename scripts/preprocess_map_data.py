import os
import glob
import json
import csv
import geopandas as gpd
from shapely.geometry import Point, mapping

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP_DATA_DIR = os.path.join(BASE_DIR, "data", "map")
OUTPUT_GEOJSON_DIR = os.path.join(BASE_DIR, "frontend", "public", "geojson")

os.makedirs(OUTPUT_GEOJSON_DIR, exist_ok=True)

def round_coords(geom_dict, precision=6):
    """Recursively round coordinates in GeoJSON geometry dictionary."""
    def _round(coords):
        if isinstance(coords, (float, int)):
            return round(coords, precision)
        elif isinstance(coords, (list, tuple)):
            return [_round(c) for c in coords]
        return coords

    if "coordinates" in geom_dict:
        geom_dict["coordinates"] = _round(geom_dict["coordinates"])
    return geom_dict

def process_geojson_file(input_path, output_path, src_crs=None, target_crs="EPSG:4326", simplify_tol=None, allowed_props=None):
    print(f"\nProcessing: {input_path}")
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return

    gdf = gpd.read_file(input_path)
    print(f"  Loaded {len(gdf)} features. Initial CRS: {gdf.crs}")

    if src_crs and gdf.crs is None:
        gdf.set_crs(src_crs, inplace=True)

    if gdf.crs and str(gdf.crs).upper() != target_crs.upper() and gdf.crs.to_string() != target_crs:
        print(f"  Reprojecting from {gdf.crs} to {target_crs}...")
        gdf = gdf.to_crs(target_crs)

    if simplify_tol:
        print(f"  Simplifying geometry with tolerance {simplify_tol}...")
        gdf["geometry"] = gdf["geometry"].simplify(simplify_tol, preserve_topology=True)

    if allowed_props:
        existing_cols = [col for col in allowed_props if col in gdf.columns]
        if "geometry" not in existing_cols:
            existing_cols.append("geometry")
        gdf = gdf[existing_cols]

    # Convert to GeoJSON dictionary
    geojson_dict = json.loads(gdf.to_json())

    # Optimize precision to 6 decimal places (~0.1 meter)
    for feat in geojson_dict["features"]:
        if feat.get("geometry"):
            feat["geometry"] = round_coords(feat["geometry"], precision=6)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson_dict, f, separators=(',', ':'))

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"  Saved -> {output_path} ({size_mb:.2f} MB)")

def process_riwayat_csv():
    print("\nProcessing Riwayat Kejadian Bencana CSV files...")
    riwayat_dir = os.path.join(MAP_DATA_DIR, "BENCANA", "RIWAYAT")
    csv_files = glob.glob(os.path.join(riwayat_dir, "tanah_longsor_banjarnegara_*.csv"))
    
    features = []
    total_rows = 0
    valid_points = 0

    for csv_file in sorted(csv_files):
        filename = os.path.basename(csv_file)
        year = filename.replace("tanah_longsor_banjarnegara_", "").replace(".csv", "")
        print(f"  Reading {filename} (Tahun {year})...")
        
        with open(csv_file, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_rows += 1
                lat_str = row.get("latitude", "").strip()
                lon_str = row.get("longitude", "").strip()
                
                if not lat_str or not lon_str:
                    coord_text = row.get("koordinat_text", "")
                    if "," in coord_text:
                        parts = coord_text.split(",")
                        lat_str = parts[0].strip()
                        lon_str = parts[1].strip()

                try:
                    lat = float(lat_str)
                    lon = float(lon_str)
                    
                    # Valid coordinate check for Banjarnegara area (Lat ~ -8 to -6.5, Lon ~ 109 to 110.5)
                    if -8.5 <= lat <= -6.5 and 109.0 <= lon <= 110.5:
                        feat = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [round(lon, 6), round(lat, 6)]
                            },
                            "properties": {
                                "tahun": int(year) if year.isdigit() else 2022,
                                "title": row.get("title", ""),
                                "jenis_kejadian": row.get("jenis_kejadian", "Tanah Longsor"),
                                "desa_kecamatan": row.get("lokasi_kejadian_desa_kecamatan", ""),
                                "dusun_rt_rw": row.get("lokasi_kejadian_dusun_rt_rw", ""),
                                "waktu": row.get("waktu_kejadian", ""),
                                "kronologi": row.get("kronologi_kondisi_umum", ""),
                                "dampak_bangunan": row.get("dampak_bangunan_fisik", ""),
                                "dampak_jiwa": row.get("dampak_jiwa_luka", ""),
                                "penanganan": row.get("penanganan", "")
                            }
                        }
                        features.append(feat)
                        valid_points += 1
                except (ValueError, TypeError):
                    continue

    geojson = {
        "type": "FeatureCollection",
        "name": "Riwayat Kejadian Longsor Banjarnegara",
        "features": features
    }
    
    out_path = os.path.join(OUTPUT_GEOJSON_DIR, "riwayat-longsor.geojson")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, separators=(',', ':'))

    size_kb = os.path.getsize(out_path) / 1024
    print(f"  Processed {total_rows} entries -> {valid_points} valid points saved to {out_path} ({size_kb:.2f} KB)")

def cleanup_unused_files():
    print("\nCleaning up unused files as per approved plan...")
    unused_items = [
        os.path.join(MAP_DATA_DIR, "BANGUNAN", "bangunan.geojson"),
        os.path.join(MAP_DATA_DIR, "BANGUNAN", "bangunan.rar"),
        os.path.join(MAP_DATA_DIR, "BANGUNAN", "bangunan.qmd"),
        os.path.join(MAP_DATA_DIR, "POLA RUANG V2", "POLA RUANG.zip"),
        os.path.join(MAP_DATA_DIR, "POLA RUANG V2", "POLA RUANG.qmd"),
        os.path.join(MAP_DATA_DIR, "BOUNDARY", "Administrasi Kecamatan.qmd"),
        os.path.join(MAP_DATA_DIR, "BOUNDARY", "Administrasi Kabupaten.qmd"),
        os.path.join(MAP_DATA_DIR, "BOUNDARY", "Administrasi Desa.qmd"),
        os.path.join(MAP_DATA_DIR, "BENCANA", "HASIL_GEOJSON", "Gempa_BUmi_final_4326.qmd"),
        os.path.join(MAP_DATA_DIR, "BENCANA", "INDEKS BENCANA 30", "Banjir Bandang.tif"),
        os.path.join(MAP_DATA_DIR, "BENCANA", "INDEKS BENCANA 30", "Indeks_Banjir.tif"),
        os.path.join(MAP_DATA_DIR, "BENCANA", "INDEKS BENCANA 30", "Indeks_Gempa_Bumi.tif"),
        os.path.join(MAP_DATA_DIR, "BENCANA", "INDEKS BENCANA 30", "Indeks_LIquifaksi.tif"),
        os.path.join(MAP_DATA_DIR, "BENCANA", "INDEKS BENCANA 30", "Indeks_Longsor.tif"),
        os.path.join(MAP_DATA_DIR, "BENCANA", "RIWAYAT", "scraper.py"),
    ]
    
    # Also riwayat json files
    json_riwayat = glob.glob(os.path.join(MAP_DATA_DIR, "BENCANA", "RIWAYAT", "*.json"))
    unused_items.extend(json_riwayat)

    deleted_count = 0
    freed_bytes = 0
    for item in unused_items:
        if os.path.exists(item):
            try:
                size = os.path.getsize(item)
                os.remove(item)
                freed_bytes += size
                deleted_count += 1
                print(f"  Deleted: {os.path.basename(item)} ({size / (1024*1024):.2f} MB)")
            except Exception as e:
                print(f"  Error deleting {item}: {e}")

    # Remove empty directories if BANGUNAN or INDEKS BENCANA 30 are now empty
    for d in [os.path.join(MAP_DATA_DIR, "BANGUNAN"), os.path.join(MAP_DATA_DIR, "BENCANA", "INDEKS BENCANA 30")]:
        if os.path.exists(d) and not os.listdir(d):
            try:
                os.rmdir(d)
                print(f"  Removed empty directory: {d}")
            except Exception:
                pass

    print(f"  Cleanup finished: {deleted_count} files removed, {freed_bytes / (1024*1024):.2f} MB freed.")

def main():
    print("=== REHABTRACK Map Data Pre-processing ===")

    # 1. Administrasi Kecamatan
    process_geojson_file(
        os.path.join(MAP_DATA_DIR, "BOUNDARY", "Administrasi Kecamatan.geojson"),
        os.path.join(OUTPUT_GEOJSON_DIR, "administrasi-kecamatan.geojson"),
        allowed_props=["KECAMATAN"]
    )

    # 2. Administrasi Desa
    process_geojson_file(
        os.path.join(MAP_DATA_DIR, "BOUNDARY", "Administrasi Desa.geojson"),
        os.path.join(OUTPUT_GEOJSON_DIR, "administrasi-desa.geojson"),
        allowed_props=["DESA", "KECAMATAN"]
    )

    # 3. POLA RUANG (Reproject from EPSG:32749 to EPSG:4326)
    process_geojson_file(
        os.path.join(MAP_DATA_DIR, "POLA RUANG V2", "POLA RUANG.geojson"),
        os.path.join(OUTPUT_GEOJSON_DIR, "pola-ruang.geojson"),
        src_crs="EPSG:32749",
        target_crs="EPSG:4326",
        simplify_tol=0.00005, # ~5 meters tolerance for light payload
        allowed_props=["POLA_RUANG", "PL_CONVERT"]
    )

    # 4. Rawan Longsor
    process_geojson_file(
        os.path.join(MAP_DATA_DIR, "BENCANA", "HASIL_GEOJSON", "LONGSOR_final_4326.geojson"),
        os.path.join(OUTPUT_GEOJSON_DIR, "rawan-longsor.geojson"),
        simplify_tol=0.00005,
        allowed_props=["DN", "Keterangan"]
    )

    # 5. Rawan Banjir Bandang
    process_geojson_file(
        os.path.join(MAP_DATA_DIR, "BENCANA", "HASIL_GEOJSON", "BANJIR BANDANG_final_4326.geojson"),
        os.path.join(OUTPUT_GEOJSON_DIR, "rawan-banjir-bandang.geojson"),
        simplify_tol=0.00005,
        allowed_props=["DN", "Keterangan"]
    )

    # 6. Rawan Banjir
    process_geojson_file(
        os.path.join(MAP_DATA_DIR, "BENCANA", "HASIL_GEOJSON", "BANJIR_final_4326.geojson"),
        os.path.join(OUTPUT_GEOJSON_DIR, "rawan-banjir.geojson"),
        allowed_props=["DN", "Keterangan"]
    )

    # 7. Rawan Gempa
    process_geojson_file(
        os.path.join(MAP_DATA_DIR, "BENCANA", "HASIL_GEOJSON", "Gempa_BUmi_final_4326.geojson"),
        os.path.join(OUTPUT_GEOJSON_DIR, "rawan-gempa.geojson"),
        allowed_props=["DN", "Keterangan"]
    )

    # 8. Rawan Likuifaksi
    process_geojson_file(
        os.path.join(MAP_DATA_DIR, "BENCANA", "HASIL_GEOJSON", "LIQUIFAKSI_final_4326.geojson"),
        os.path.join(OUTPUT_GEOJSON_DIR, "rawan-likuifaksi.geojson"),
        allowed_props=["DN", "Keterangan"]
    )

    # 9. Riwayat Longsor (Points from CSV)
    process_riwayat_csv()

    # 10. Cleanup unused files
    cleanup_unused_files()

    print("\n=== All Map Data Pre-processing Completed Successfully! ===")

if __name__ == "__main__":
    main()
