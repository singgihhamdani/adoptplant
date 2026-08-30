import os
from qgis.core import QgsProcessingProvider
from qgis.PyQt.QtGui import QIcon

class DasymetricProvider(QgsProcessingProvider):
    def __init__(self):
        super().__init__()

    def id(self):
        return 'ntlspopdistribution'

    def name(self):
        return 'NTLs_Pop_Distribution'

    def icon(self):
        return QIcon()

    def loadAlgorithms(self):
        import importlib.util
        import sys
        
        # 1. Load Algoritma DASSYMETRIC RASTER (File 1)
        script1_path = os.path.join(os.path.dirname(__file__), "DASSYMETRIC RASTER.py")
        if os.path.exists(script1_path):
            spec1 = importlib.util.spec_from_file_location("dasymetric_algo", script1_path)
            module1 = importlib.util.module_from_spec(spec1)
            sys.modules["dasymetric_algo"] = module1
            spec1.loader.exec_module(module1)
            self.addAlgorithm(module1.DasymetricPopulationAlgorithm())
            
        # 2. Load Algoritma DEPENDENCY INSTALLER (File 2)
        script2_path = os.path.join(os.path.dirname(__file__), "DEPENDENCY INSTALLER.py")
        if os.path.exists(script2_path):
            spec2 = importlib.util.spec_from_file_location("dependency_installer", script2_path)
            module2 = importlib.util.module_from_spec(spec2)
            sys.modules["dependency_installer"] = module2
            spec2.loader.exec_module(module2)
            self.addAlgorithm(module2.DependencyInstallerAlgorithm())
            
        # 3. Load Algoritma Download Building (File 3)
        script3_path = os.path.join(os.path.dirname(__file__), "Download building.py")
        if os.path.exists(script3_path):
            spec3 = importlib.util.spec_from_file_location("download_building", script3_path)
            module3 = importlib.util.module_from_spec(spec3)
            sys.modules["download_building"] = module3
            spec3.loader.exec_module(module3)
            self.addAlgorithm(module3.DownloadOpenBuildings())
            
        # 4. Load Algoritma Impact Kebencanaan (File 4)
        script4_path = os.path.join(os.path.dirname(__file__), "IMPACT KEBENCANAAN.py")
        if os.path.exists(script4_path):
            spec4 = importlib.util.spec_from_file_location("impact_kebencanaan", script4_path)
            module4 = importlib.util.module_from_spec(spec4)
            sys.modules["impact_kebencanaan"] = module4
            spec4.loader.exec_module(module4)
            self.addAlgorithm(module4.DasimetrikBencanaAlgorithm())
