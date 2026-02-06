"""
Backup Service

Handles the logic for backing up the application database.
"""
import shutil
import os
from datetime import datetime
from src.database.db import DB_PATH

class BackupService:
    """
    Service for managing database backups.
    """
    
    @staticmethod
    def create_backup(destination_path: str) -> bool:
        """
        Create a backup of the current database to the specified path.
        
        Args:
            destination_path: The full path where the backup should be saved.
            
        Returns:
            bool: True if backup was successful, False otherwise.
            
        Raises:
            Exception: If the copy operation fails.
        """
        try:
            # Ensure the source exists (it should, if the app is running)
            if not os.path.exists(DB_PATH):
                raise FileNotFoundError(f"Database file not found at {DB_PATH}")
                
            # Perform the copy
            shutil.copy2(DB_PATH, destination_path)
            return True
            
        except Exception as e:
            # Re-raise the exception to be handled by the UI
            raise e

    @staticmethod
    def create_auto_backup(destination_folder: str) -> str:
        """
        Create an automated backup with a timestamped filename.
        
        Args:
            destination_folder: The directory to save the backup in.
            
        Returns:
            str: Path to the created backup file if successful.
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"soapmanager_auto_{timestamp}.db"
            destination_path = os.path.join(destination_folder, filename)
            
            # Ensure destination folder exists
            os.makedirs(destination_folder, exist_ok=True)
            
            BackupService.create_backup(destination_path)
            return destination_path
        except Exception as e:
            print(f"Auto-backup failed: {e}")
            raise e

    @staticmethod
    def create_cloud_backup(provider_name: str) -> str:
        """
        Create a backup and upload to a cloud provider.
        
        Args:
            provider_name: Name of the cloud provider ('google_drive' or 'dropbox').
            
        Returns:
            str: URL or identifier of the uploaded file.
        """
        import tempfile
        try:
            from src.services.cloud_providers import get_provider
            
            provider = get_provider(provider_name)
            if not provider:
                raise ValueError(f"Unknown cloud provider: {provider_name}")
            
            if not provider.is_connected():
                raise ValueError(f"Not connected to {provider.name}. Please connect in Preferences.")
            
            # Create a temp backup file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"soapmanager_auto_{timestamp}.db"
            temp_path = os.path.join(tempfile.gettempdir(), filename)
            
            BackupService.create_backup(temp_path)
            
            # Upload to cloud
            result = provider.upload(temp_path)
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            return result
            
        except Exception as e:
            print(f"Cloud backup failed: {e}")
            raise e
