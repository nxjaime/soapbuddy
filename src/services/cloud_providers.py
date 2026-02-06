"""
Cloud Providers

Abstraction layer for cloud backup providers (Google Drive, Dropbox).
"""
import os
import json
import webbrowser
from abc import ABC, abstractmethod
from pathlib import Path
from PySide6.QtCore import QSettings

# Token storage location
def get_token_path(provider_name: str) -> Path:
    """Get the path to store OAuth tokens for a provider."""
    from src.database.db import APP_ROOT
    return APP_ROOT / f".{provider_name}_token.json"


class CloudProvider(ABC):
    """Abstract base class for cloud backup providers."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name for display."""
        pass
    
    @abstractmethod
    def is_connected(self) -> bool:
        """Check if the provider is authenticated."""
        pass
    
    @abstractmethod
    def connect(self) -> bool:
        """Initiate OAuth flow to connect the account."""
        pass
    
    @abstractmethod
    def disconnect(self):
        """Remove stored credentials."""
        pass
    
    @abstractmethod
    def upload(self, file_path: str) -> str:
        """
        Upload a file to the cloud.
        
        Args:
            file_path: Path to the local file to upload.
            
        Returns:
            str: URL or identifier of the uploaded file.
        """
        pass


class GoogleDriveProvider(CloudProvider):
    """Google Drive backup provider."""
    
    SCOPES = ['https://www.googleapis.com/auth/drive.file']
    
    def __init__(self):
        self.settings = QSettings("SoapManager", "SoapManagerApp")
        self.token_path = get_token_path("google_drive")
        self._credentials = None
        
    @property
    def name(self) -> str:
        return "Google Drive"
    
    def _get_client_config(self) -> dict:
        """Get OAuth client config from settings."""
        client_id = self.settings.value("cloud/google_client_id", "")
        client_secret = self.settings.value("cloud/google_client_secret", "")
        
        if not client_id or not client_secret:
            return None
            
        return {
            "installed": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
            }
        }
    
    def is_connected(self) -> bool:
        """Check if we have valid credentials."""
        if self.token_path.exists():
            try:
                from google.oauth2.credentials import Credentials
                creds = Credentials.from_authorized_user_file(str(self.token_path), self.SCOPES)
                return creds and creds.valid
            except Exception:
                return False
        return False
    
    def connect(self) -> bool:
        """Run OAuth2 flow to authenticate."""
        try:
            from google_auth_oauthlib.flow import InstalledAppFlow
            
            client_config = self._get_client_config()
            if not client_config:
                raise ValueError("Google Drive credentials not configured. "
                               "Please set Client ID and Secret in Preferences.")
            
            flow = InstalledAppFlow.from_client_config(client_config, self.SCOPES)
            creds = flow.run_local_server(port=0)
            
            # Save credentials
            with open(self.token_path, 'w') as token_file:
                token_file.write(creds.to_json())
            
            self._credentials = creds
            return True
            
        except Exception as e:
            print(f"Google Drive connection failed: {e}")
            raise e
    
    def disconnect(self):
        """Remove stored credentials."""
        if self.token_path.exists():
            os.remove(self.token_path)
        self._credentials = None
    
    def upload(self, file_path: str) -> str:
        """Upload file to Google Drive."""
        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaFileUpload
            
            if not self.token_path.exists():
                raise ValueError("Not connected to Google Drive")
                
            creds = Credentials.from_authorized_user_file(str(self.token_path), self.SCOPES)
            
            # Refresh if expired
            if creds.expired and creds.refresh_token:
                from google.auth.transport.requests import Request
                creds.refresh(Request())
                with open(self.token_path, 'w') as token_file:
                    token_file.write(creds.to_json())
            
            service = build('drive', 'v3', credentials=creds)
            
            file_metadata = {'name': os.path.basename(file_path)}
            media = MediaFileUpload(file_path, mimetype='application/x-sqlite3')
            
            file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink'
            ).execute()
            
            return file.get('webViewLink', file.get('id'))
            
        except Exception as e:
            print(f"Google Drive upload failed: {e}")
            raise e


class DropboxProvider(CloudProvider):
    """Dropbox backup provider."""
    
    def __init__(self):
        self.settings = QSettings("SoapManager", "SoapManagerApp")
        self.token_path = get_token_path("dropbox")
        
    @property
    def name(self) -> str:
        return "Dropbox"
    
    def _get_access_token(self) -> str:
        """Get stored access token."""
        if self.token_path.exists():
            with open(self.token_path, 'r') as f:
                data = json.load(f)
                return data.get('access_token')
        return None
    
    def is_connected(self) -> bool:
        """Check if we have a valid token."""
        token = self._get_access_token()
        if not token:
            return False
        try:
            import dropbox
            dbx = dropbox.Dropbox(token)
            dbx.users_get_current_account()
            return True
        except Exception:
            return False
    
    def connect(self) -> bool:
        """Run OAuth2 flow for Dropbox."""
        try:
            import dropbox
            from dropbox import DropboxOAuth2FlowNoRedirect
            
            app_key = self.settings.value("cloud/dropbox_app_key", "")
            app_secret = self.settings.value("cloud/dropbox_app_secret", "")
            
            if not app_key or not app_secret:
                raise ValueError("Dropbox credentials not configured. "
                               "Please set App Key and Secret in Preferences.")
            
            auth_flow = DropboxOAuth2FlowNoRedirect(
                app_key, 
                consumer_secret=app_secret,
                token_access_type='offline'
            )
            
            authorize_url = auth_flow.start()
            webbrowser.open(authorize_url)
            
            # For a desktop app, we'd need a way to get the auth code
            # This is simplified - in production, use a local server or manual input
            from PySide6.QtWidgets import QInputDialog
            auth_code, ok = QInputDialog.getText(
                None, 
                "Dropbox Authorization",
                "Enter the authorization code from your browser:"
            )
            
            if not ok or not auth_code:
                return False
                
            oauth_result = auth_flow.finish(auth_code.strip())
            
            # Save token
            with open(self.token_path, 'w') as f:
                json.dump({'access_token': oauth_result.access_token}, f)
            
            return True
            
        except Exception as e:
            print(f"Dropbox connection failed: {e}")
            raise e
    
    def disconnect(self):
        """Remove stored credentials."""
        if self.token_path.exists():
            os.remove(self.token_path)
    
    def upload(self, file_path: str) -> str:
        """Upload file to Dropbox."""
        try:
            import dropbox
            
            token = self._get_access_token()
            if not token:
                raise ValueError("Not connected to Dropbox")
            
            dbx = dropbox.Dropbox(token)
            
            filename = os.path.basename(file_path)
            dropbox_path = f"/SoapManager Backups/{filename}"
            
            with open(file_path, 'rb') as f:
                dbx.files_upload(
                    f.read(),
                    dropbox_path,
                    mode=dropbox.files.WriteMode.overwrite
                )
            
            # Get shareable link
            try:
                link = dbx.sharing_create_shared_link_with_settings(dropbox_path)
                return link.url
            except dropbox.exceptions.ApiError:
                return dropbox_path
                
        except Exception as e:
            print(f"Dropbox upload failed: {e}")
            raise e


def get_provider(provider_name: str) -> CloudProvider:
    """Factory function to get a cloud provider instance."""
    providers = {
        "google_drive": GoogleDriveProvider,
        "dropbox": DropboxProvider,
    }
    
    provider_class = providers.get(provider_name.lower())
    if provider_class:
        return provider_class()
    return None
