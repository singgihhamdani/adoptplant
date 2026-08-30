import os
import sys
import csv
import json
import urllib.request
import xml.etree.ElementTree as ET

# Configuration
MAP_CONFIGS = {
    "2022": {
        "map_id": "1ePJ7m5m8sZ85ZoDpizVMrh38rWVEl7ir",
        "output_csv": "tanah_longsor_banjarnegara_2022.csv",
        "output_json": "tanah_longsor_banjarnegara_2022.json"
    },
    "2023": {
        "map_id": "1_k4xxzNlbajkwey5uNFnjm7aJY3sGQQ",
        "output_csv": "tanah_longsor_banjarnegara_2023.csv",
        "output_json": "tanah_longsor_banjarnegara_2023.json"
    },
    "2024": {
        "map_id": "1368vfwGIeYHd5HH_JJ5jaH6sz4WKlhE",
        "output_csv": "tanah_longsor_banjarnegara_2024.csv",
        "output_json": "tanah_longsor_banjarnegara_2024.json"
    },
    "2026": {
        "map_id": "1ZfL626rCLg3ZOCGviaYh6fxSfMtFJ98",
        "output_csv": "tanah_longsor_banjarnegara_2026.csv",
        "output_json": "tanah_longsor_banjarnegara_2026.json"
    }
}

def clean_string(val):
    if val is None:
        return ""
    # Strip whitespace and clean up some special char/non-breaking spaces
    val = val.replace('\xa0', ' ')
    return val.strip()

def extract_landslide_data(year):
    if year not in MAP_CONFIGS:
        print(f"Error: Unsupported year '{year}'. Supported years: {list(MAP_CONFIGS.keys())}")
        return
        
    config = MAP_CONFIGS[year]
    map_id = config["map_id"]
    kml_url = f"https://www.google.com/maps/d/kml?mid={map_id}&forcekml=1"
    output_csv = config["output_csv"]
    output_json = config["output_json"]
    
    print(f"[{year}] Downloading KML from {kml_url}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(kml_url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            content = response.read()
    except Exception as e:
        print(f"[{year}] Failed to download KML: {e}")
        return
        
    print(f"[{year}] Successfully downloaded KML ({len(content)} bytes). Parsing XML...")
    
    try:
        root = ET.fromstring(content)
    except Exception as e:
        print(f"[{year}] Failed to parse XML: {e}")
        return
        
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    folders = root.findall('.//kml:Folder', ns)
    print(f"[{year}] Found {len(folders)} folders in the KML map.")
    
    records = []
    
    for folder in folders:
        folder_name = clean_string(folder.find('kml:name', ns).text)
        placemarks = folder.findall('kml:Placemark', ns)
        
        for p in placemarks:
            p_name = clean_string(p.find('kml:name', ns).text)
            
            # Extract ExtendedData
            ext_data = {}
            ext_el = p.find('kml:ExtendedData', ns)
            if ext_el is not None:
                for data in ext_el.findall('.//kml:Data', ns):
                    name_attr = data.attrib.get('name')
                    value_el = data.find('kml:value', ns)
                    value = value_el.text if value_el is not None else ""
                    if name_attr:
                        ext_data[name_attr] = clean_string(value)
            
            # Filter logic: Check if it's "Tanah Longsor"
            jenis_kejadian = ext_data.get('JENIS KEJADIAN', '')
            is_longsor = False
            
            if jenis_kejadian and "longsor" in jenis_kejadian.lower():
                is_longsor = True
            elif "longsor" in p_name.lower():
                is_longsor = True
                
            if not is_longsor:
                continue
                
            # If JENIS KEJADIAN is missing but it is a landslide, fill it
            if not jenis_kejadian:
                jenis_kejadian = "Tanah Longsor"
                
            # Parse coordinates from Point element
            coords_text = ""
            point_el = p.find('.//kml:Point', ns)
            if point_el is not None:
                coords_el = point_el.find('kml:coordinates', ns)
                if coords_el is not None and coords_el.text:
                    coords_text = clean_string(coords_el.text)
                    
            longitude, latitude = "", ""
            if coords_text:
                parts = coords_text.split(',')
                if len(parts) >= 2:
                    longitude = clean_string(parts[0])
                    latitude = clean_string(parts[1])
            
            # Normalize and merge keys
            dampak_bangunan = ext_data.get('DAMPAK Bangunan/ Fisik', '') or ext_data.get('DAMPAK Bangunan', '')
            keterangan_lain = ext_data.get('KETERANGAN LAIN', '') or ext_data.get('Keterangan Lain', '')
            jam_kejadian = ext_data.get('JAM KEJADIAN (WIB)', '')
            
            # Build normalized record
            record = {
                "folder_name": folder_name,
                "title": p_name,
                "no": ext_data.get('No', ''),
                "jenis_kejadian": jenis_kejadian,
                "lokasi_kejadian_desa_kecamatan": ext_data.get('LOKASI KEJADIAN (Desa, Kecamatan)', ''),
                "lokasi_kejadian_dusun_rt_rw": ext_data.get('LOKASI KEJADIAN (Dusun, RT/RW)', ''),
                "koordinat_text": ext_data.get('KOORDINAT', ''),
                "latitude": latitude,
                "longitude": longitude,
                "waktu_kejadian": ext_data.get('WAKTU KEJADIAN', ''),
                "jam_kejadian": jam_kejadian,
                "kronologi_kondisi_umum": ext_data.get('KRONOLOGI/ KONDISI UMUM', ''),
                "dampak_bangunan_fisik": dampak_bangunan,
                "dampak_jiwa_luka": ext_data.get('DAMPAK Jiwa/ Luka', ''),
                "dampak_pengungsian": ext_data.get('DAMPAK Pengungsian', ''),
                "penanganan": ext_data.get('PENANGANAN', ''),
                "tim_terlibat": ext_data.get('TIM TERLIBAT', ''),
                "saran_tl": ext_data.get('SARAN TL', ''),
                "nara_sumber": ext_data.get('NARA SUMBER', ''),
                "petugas_bpbd": ext_data.get('PETUGAS BPBD', ''),
                "keterangan_lain": keterangan_lain,
                "media_links": ext_data.get('gx_media_links', '').split() if ext_data.get('gx_media_links') else []
            }
            records.append(record)
            
    print(f"[{year}] Total Tanah Longsor records extracted: {len(records)}")
    
    # Save to JSON
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=4, ensure_ascii=False)
    print(f"[{year}] Saved database to {output_json}")
    
    # Save to CSV
    csv_headers = [
        "folder_name", "title", "no", "jenis_kejadian", 
        "lokasi_kejadian_desa_kecamatan", "lokasi_kejadian_dusun_rt_rw",
        "koordinat_text", "latitude", "longitude", "waktu_kejadian", "jam_kejadian",
        "kronologi_kondisi_umum", "dampak_bangunan_fisik", "dampak_jiwa_luka",
        "dampak_pengungsian", "penanganan", "tim_terlibat", "saran_tl",
        "nara_sumber", "petugas_bpbd", "keterangan_lain", "media_links"
    ]
    
    with open(output_csv, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=csv_headers)
        writer.writeheader()
        for r in records:
            r_copy = r.copy()
            r_copy["media_links"] = ", ".join(r_copy["media_links"])
            writer.writerow(r_copy)
    print(f"[{year}] Saved database to {output_csv}")

if __name__ == "__main__":
    # If a year is specified as argument, scrape only that. Otherwise scrape all configured years.
    if len(sys.argv) > 1:
        target_year = sys.argv[1].strip()
        extract_landslide_data(target_year)
    else:
        for year in MAP_CONFIGS.keys():
            extract_landslide_data(year)
            print("-" * 50)
