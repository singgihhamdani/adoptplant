import sys
import os
import subprocess
import importlib
from qgis.core import QgsProcessingAlgorithm

class DependencyInstallerAlgorithm(QgsProcessingAlgorithm):
    def tr(self, string):
        from qgis.PyQt.QtCore import QCoreApplication
        return QCoreApplication.translate('Processing', string)

    def createInstance(self):
        return DependencyInstallerAlgorithm()

    def name(self):
        return 'installdependencies'

    def displayName(self):
        return self.tr('1. Install Dependencies')

    def group(self):
        return self.tr('NTLs_Pop_Distribution')

    def groupId(self):
        return 'ntlspopdistribution'

    def shortHelpString(self):
        return self.tr(
            "<html><body>"
            "<h2>Install Dependencies</h2>"
            "<p>Script ini akan mendownload dan menginstall library Python tambahan (pandas, geopandas, earthengine-api) "
            "yang dibutuhkan oleh algoritma dasimetrik dan plugin download building ke dalam QGIS Anda.</p>"
            "<p>Pastikan komputer Anda terhubung ke <b>Internet</b> sebelum menjalankan tool ini.</p>"
            "</body></html>"
        )

    def initAlgorithm(self, config=None):
        pass

    def processAlgorithm(self, parameters, context, feedback):
        required_packages = {
            'pandas': 'pandas',
            'geopandas': 'geopandas',
            'ee': 'earthengine-api',
        }
        
        python_exe = sys.executable
        if sys.platform == 'win32':
            python_exe = os.path.join(sys.prefix, 'python.exe')
            if not os.path.exists(python_exe):
                python_exe = os.path.join(sys.prefix, 'bin', 'python.exe')
            if not os.path.exists(python_exe):
                python_exe = "python"
        
        startupinfo = None
        if sys.platform == 'win32':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

        installed_any = False
        for module_name, pip_name in required_packages.items():
            feedback.pushInfo(f"Mengecek library '{module_name}'...")
            try:
                importlib.import_module(module_name)
                feedback.pushInfo(f"-> OK. '{module_name}' sudah terinstall.")
            except ImportError:
                feedback.pushInfo(f"-> BELUM ADA. Memulai proses download & install '{pip_name}' via pip. Mohon tunggu...")
                try:
                    subprocess.check_call(
                        [python_exe, "-m", "pip", "install", pip_name],
                        startupinfo=startupinfo
                    )
                    installed_any = True
                    feedback.pushInfo(f"-> SUKSES menginstall '{pip_name}'.")
                except subprocess.CalledProcessError as e:
                    feedback.reportError(f"-> GAGAL menginstall '{pip_name}'. Error code: {e.returncode}. Pastikan koneksi internet stabil.")
                    return {}
                except Exception as e:
                    feedback.reportError(f"-> GAGAL menginstall '{pip_name}'. Error: {str(e)}")
                    return {}
                    
        if installed_any:
            feedback.pushInfo("\n==========\nINSTALASI SELESAI!\nSilakan RESTART QGIS Anda agar library bisa digunakan.\n==========")
        else:
            feedback.pushInfo("\n==========\nSemua library sudah siap, tidak ada yang perlu diinstall. Anda bisa langsung menggunakan algoritma dasimetrik.\n==========")
            
        return {}
