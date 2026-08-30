from qgis.core import QgsApplication
from .dasy_provider import DasymetricProvider

class DasymetricPlugin:
    """
    Kelas utama Plugin yang mengurus integrasi dengan GUI QGIS.
    """
    def __init__(self):
        self.provider = None

    def initProcessing(self):
        # Inisialisasi provider
        self.provider = DasymetricProvider()
        QgsApplication.processingRegistry().addProvider(self.provider)

    def initGui(self):
        # Dijalankan saat QGIS load plugin.
        # Karena ini adalah plugin berbasis Processing Algorithm, 
        # kita cukup meregistrasikan provider-nya saja.
        self.initProcessing()

    def unload(self):
        # Membersihkan registry saat plugin dimatikan/di-uninstall
        if self.provider:
            QgsApplication.processingRegistry().removeProvider(self.provider)
