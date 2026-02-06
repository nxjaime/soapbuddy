"""
Settings Dialog

Allows configuration of application preferences, including automated backups.
"""
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QTabWidget, QWidget, QCheckBox, 
    QComboBox, QLabel, QLineEdit, QPushButton, QHBoxLayout, 
    QDialogButtonBox, QFileDialog, QGroupBox, QRadioButton,
    QStackedWidget, QMessageBox, QFormLayout
)
from PySide6.QtCore import QSettings


class SettingsDialog(QDialog):
    """
    Dialog for application settings.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Preferences")
        self.resize(550, 550)
        
        self.settings = QSettings("SoapManager", "SoapManagerApp")
        
        layout = QVBoxLayout(self)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.addTab(self._create_backup_tab(), "Backups")
        self.tabs.addTab(self._create_cloud_credentials_tab(), "Cloud Credentials")
        layout.addWidget(self.tabs)
        
        # Buttons
        buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)
        
    def _create_backup_tab(self) -> QWidget:
        """Create the backup settings tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Auto Backup Group
        auto_group = QGroupBox("Automated Backups")
        auto_layout = QVBoxLayout(auto_group)
        
        # Enable Checkbox
        self.auto_backup_cb = QCheckBox("Enable Automated Backups")
        self.auto_backup_cb.setChecked(self.settings.value("backup/auto_enabled", False, type=bool))
        self.auto_backup_cb.toggled.connect(self._toggle_backup_options)
        auto_layout.addWidget(self.auto_backup_cb)
        
        # Frequency
        freq_layout = QHBoxLayout()
        freq_layout.addWidget(QLabel("Frequency:"))
        self.frequency_combo = QComboBox()
        self.frequency_combo.addItems(["Daily", "Weekly"])
        current_freq = self.settings.value("backup/frequency", "Daily")
        self.frequency_combo.setCurrentText(current_freq)
        freq_layout.addWidget(self.frequency_combo)
        freq_layout.addStretch()
        auto_layout.addLayout(freq_layout)
        
        layout.addWidget(auto_group)
        
        # Destination Group
        dest_group = QGroupBox("Backup Destination")
        dest_layout = QVBoxLayout(dest_group)
        
        # Radio buttons for destination type
        self.dest_local_radio = QRadioButton("Local Folder")
        self.dest_google_radio = QRadioButton("Google Drive (Direct Upload)")
        self.dest_dropbox_radio = QRadioButton("Dropbox (Direct Upload)")
        
        # Load current selection
        current_dest = self.settings.value("backup/destination_type", "local")
        if current_dest == "google_drive":
            self.dest_google_radio.setChecked(True)
        elif current_dest == "dropbox":
            self.dest_dropbox_radio.setChecked(True)
        else:
            self.dest_local_radio.setChecked(True)
        
        self.dest_local_radio.toggled.connect(self._on_destination_changed)
        self.dest_google_radio.toggled.connect(self._on_destination_changed)
        self.dest_dropbox_radio.toggled.connect(self._on_destination_changed)
        
        dest_layout.addWidget(self.dest_local_radio)
        dest_layout.addWidget(self.dest_google_radio)
        dest_layout.addWidget(self.dest_dropbox_radio)
        
        # Stacked widget for destination-specific options
        self.dest_stack = QStackedWidget()
        
        # Local folder options (page 0)
        local_widget = QWidget()
        local_layout = QVBoxLayout(local_widget)
        local_layout.setContentsMargins(20, 10, 0, 0)
        
        loc_layout = QHBoxLayout()
        self.location_edit = QLineEdit()
        self.location_edit.setText(self.settings.value("backup/location", ""))
        self.location_edit.setPlaceholderText("Select a folder...")
        loc_layout.addWidget(self.location_edit)
        
        browse_btn = QPushButton("Browse...")
        browse_btn.clicked.connect(self._browse_location)
        loc_layout.addWidget(browse_btn)
        local_layout.addLayout(loc_layout)
        
        help_text = QLabel("<i>Tip: Select a cloud-synced folder (Dropbox, OneDrive, etc.) for automatic cloud backup.</i>")
        help_text.setWordWrap(True)
        help_text.setStyleSheet("color: #666; font-size: 11px;")
        local_layout.addWidget(help_text)
        
        self.dest_stack.addWidget(local_widget)
        
        # Google Drive options (page 1)
        google_widget = QWidget()
        google_layout = QVBoxLayout(google_widget)
        google_layout.setContentsMargins(20, 10, 0, 0)
        
        self.google_status_label = QLabel()
        google_layout.addWidget(self.google_status_label)
        
        self.google_connect_btn = QPushButton()
        self.google_connect_btn.clicked.connect(self._toggle_google_connection)
        google_layout.addWidget(self.google_connect_btn)
        
        google_help = QLabel("<i>Requires Google Drive API credentials (set in Cloud Credentials tab).</i>")
        google_help.setWordWrap(True)
        google_help.setStyleSheet("color: #666; font-size: 11px;")
        google_layout.addWidget(google_help)
        
        self.dest_stack.addWidget(google_widget)
        
        # Dropbox options (page 2)
        dropbox_widget = QWidget()
        dropbox_layout = QVBoxLayout(dropbox_widget)
        dropbox_layout.setContentsMargins(20, 10, 0, 0)
        
        self.dropbox_status_label = QLabel()
        dropbox_layout.addWidget(self.dropbox_status_label)
        
        self.dropbox_connect_btn = QPushButton()
        self.dropbox_connect_btn.clicked.connect(self._toggle_dropbox_connection)
        dropbox_layout.addWidget(self.dropbox_connect_btn)
        
        dropbox_help = QLabel("<i>Requires Dropbox App credentials (set in Cloud Credentials tab).</i>")
        dropbox_help.setWordWrap(True)
        dropbox_help.setStyleSheet("color: #666; font-size: 11px;")
        dropbox_layout.addWidget(dropbox_help)
        
        self.dest_stack.addWidget(dropbox_widget)
        
        dest_layout.addWidget(self.dest_stack)
        layout.addWidget(dest_group)
        
        # Last Run Info
        last_run = self.settings.value("backup/last_run", "Never")
        self.last_run_label = QLabel(f"Last automated backup: {last_run}")
        layout.addWidget(self.last_run_label)
        
        layout.addStretch()
        
        # Initial State
        self._toggle_backup_options(self.auto_backup_cb.isChecked())
        self._on_destination_changed()
        self._update_cloud_status()
        
        return widget
    
    def _create_cloud_credentials_tab(self) -> QWidget:
        """Create the cloud credentials configuration tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Google Drive credentials
        google_group = QGroupBox("Google Drive API Credentials")
        google_layout = QFormLayout(google_group)
        
        self.google_client_id = QLineEdit()
        self.google_client_id.setText(self.settings.value("cloud/google_client_id", ""))
        self.google_client_id.setPlaceholderText("Your Google OAuth Client ID")
        google_layout.addRow("Client ID:", self.google_client_id)
        
        self.google_client_secret = QLineEdit()
        self.google_client_secret.setText(self.settings.value("cloud/google_client_secret", ""))
        self.google_client_secret.setPlaceholderText("Your Google OAuth Client Secret")
        self.google_client_secret.setEchoMode(QLineEdit.Password)
        google_layout.addRow("Client Secret:", self.google_client_secret)
        
        google_help = QLabel(
            '<a href="https://console.cloud.google.com/">Get credentials from Google Cloud Console</a>'
        )
        google_help.setOpenExternalLinks(True)
        google_layout.addRow("", google_help)
        
        layout.addWidget(google_group)
        
        # Dropbox credentials
        dropbox_group = QGroupBox("Dropbox App Credentials")
        dropbox_layout = QFormLayout(dropbox_group)
        
        self.dropbox_app_key = QLineEdit()
        self.dropbox_app_key.setText(self.settings.value("cloud/dropbox_app_key", ""))
        self.dropbox_app_key.setPlaceholderText("Your Dropbox App Key")
        dropbox_layout.addRow("App Key:", self.dropbox_app_key)
        
        self.dropbox_app_secret = QLineEdit()
        self.dropbox_app_secret.setText(self.settings.value("cloud/dropbox_app_secret", ""))
        self.dropbox_app_secret.setPlaceholderText("Your Dropbox App Secret")
        self.dropbox_app_secret.setEchoMode(QLineEdit.Password)
        dropbox_layout.addRow("App Secret:", self.dropbox_app_secret)
        
        dropbox_help = QLabel(
            '<a href="https://www.dropbox.com/developers/apps">Get credentials from Dropbox Developer Console</a>'
        )
        dropbox_help.setOpenExternalLinks(True)
        dropbox_layout.addRow("", dropbox_help)
        
        layout.addWidget(dropbox_group)
        
        layout.addStretch()
        
        return widget
        
    def _toggle_backup_options(self, checked: bool):
        """Enable/disable input fields based on checkbox."""
        self.frequency_combo.setEnabled(checked)
        self.dest_local_radio.setEnabled(checked)
        self.dest_google_radio.setEnabled(checked)
        self.dest_dropbox_radio.setEnabled(checked)
        self.dest_stack.setEnabled(checked)
        
    def _on_destination_changed(self):
        """Switch destination options based on selection."""
        if self.dest_local_radio.isChecked():
            self.dest_stack.setCurrentIndex(0)
        elif self.dest_google_radio.isChecked():
            self.dest_stack.setCurrentIndex(1)
        elif self.dest_dropbox_radio.isChecked():
            self.dest_stack.setCurrentIndex(2)
    
    def _update_cloud_status(self):
        """Update the connection status for cloud providers."""
        try:
            from src.services.cloud_providers import GoogleDriveProvider, DropboxProvider
            
            # Google Drive
            google = GoogleDriveProvider()
            if google.is_connected():
                self.google_status_label.setText("✅ Connected to Google Drive")
                self.google_connect_btn.setText("Disconnect")
            else:
                self.google_status_label.setText("❌ Not connected")
                self.google_connect_btn.setText("Connect Account")
            
            # Dropbox
            dropbox = DropboxProvider()
            if dropbox.is_connected():
                self.dropbox_status_label.setText("✅ Connected to Dropbox")
                self.dropbox_connect_btn.setText("Disconnect")
            else:
                self.dropbox_status_label.setText("❌ Not connected")
                self.dropbox_connect_btn.setText("Connect Account")
                
        except ImportError:
            self.google_status_label.setText("⚠️ Cloud libraries not installed")
            self.dropbox_status_label.setText("⚠️ Cloud libraries not installed")
    
    def _toggle_google_connection(self):
        """Connect or disconnect Google Drive."""
        try:
            from src.services.cloud_providers import GoogleDriveProvider
            
            provider = GoogleDriveProvider()
            if provider.is_connected():
                provider.disconnect()
                QMessageBox.information(self, "Disconnected", "Google Drive has been disconnected.")
            else:
                # Save credentials first
                self.settings.setValue("cloud/google_client_id", self.google_client_id.text())
                self.settings.setValue("cloud/google_client_secret", self.google_client_secret.text())
                
                provider.connect()
                QMessageBox.information(self, "Connected", "Successfully connected to Google Drive!")
            
            self._update_cloud_status()
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to connect:\n{str(e)}")
    
    def _toggle_dropbox_connection(self):
        """Connect or disconnect Dropbox."""
        try:
            from src.services.cloud_providers import DropboxProvider
            
            provider = DropboxProvider()
            if provider.is_connected():
                provider.disconnect()
                QMessageBox.information(self, "Disconnected", "Dropbox has been disconnected.")
            else:
                # Save credentials first
                self.settings.setValue("cloud/dropbox_app_key", self.dropbox_app_key.text())
                self.settings.setValue("cloud/dropbox_app_secret", self.dropbox_app_secret.text())
                
                provider.connect()
                QMessageBox.information(self, "Connected", "Successfully connected to Dropbox!")
            
            self._update_cloud_status()
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to connect:\n{str(e)}")
        
    def _browse_location(self):
        """Open folder picker."""
        folder = QFileDialog.getExistingDirectory(self, "Select Backup Folder")
        if folder:
            self.location_edit.setText(folder)
            
    def accept(self):
        """Save settings when OK is clicked."""
        # Backup settings
        self.settings.setValue("backup/auto_enabled", self.auto_backup_cb.isChecked())
        self.settings.setValue("backup/frequency", self.frequency_combo.currentText())
        self.settings.setValue("backup/location", self.location_edit.text())
        
        # Destination type
        if self.dest_google_radio.isChecked():
            self.settings.setValue("backup/destination_type", "google_drive")
        elif self.dest_dropbox_radio.isChecked():
            self.settings.setValue("backup/destination_type", "dropbox")
        else:
            self.settings.setValue("backup/destination_type", "local")
        
        # Cloud credentials
        self.settings.setValue("cloud/google_client_id", self.google_client_id.text())
        self.settings.setValue("cloud/google_client_secret", self.google_client_secret.text())
        self.settings.setValue("cloud/dropbox_app_key", self.dropbox_app_key.text())
        self.settings.setValue("cloud/dropbox_app_secret", self.dropbox_app_secret.text())
        
        super().accept()
