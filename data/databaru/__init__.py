def classFactory(iface):
    """
    Fungsi utama yang dicari oleh QGIS saat menginisialisasi plugin.
    """
    # 2. Load struktur plugin utama (provider)
    from .dasy_plugin import DasymetricPlugin
    return DasymetricPlugin()
