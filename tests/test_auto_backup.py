"""
Test Automated Backup Service
"""
import sys
import os
import unittest
import shutil
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.services.backup_service import BackupService
from src.database.db import DB_PATH

class TestAutoBackup(unittest.TestCase):
    def setUp(self):
        self.test_dir = "test_backups"
        if not os.path.exists(self.test_dir):
            os.makedirs(self.test_dir)
            
        # Ensure dummy db exists
        if not os.path.exists(DB_PATH):
            with open(DB_PATH, 'w') as f:
                f.write("dummy data")
                
    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_auto_backup_creation(self):
        """Test that auto-backup creates a timestamped file."""
        print(f"Testing auto-backup to {self.test_dir}")
        result_path = BackupService.create_auto_backup(self.test_dir)
        
        self.assertTrue(os.path.exists(result_path))
        self.assertIn("soapmanager_auto_", os.path.basename(result_path))
        
        # Check timestamp format roughly
        filename = os.path.basename(result_path)
        # soapmanager_auto_2023...
        parts = filename.split('_')
        self.assertEqual(len(parts), 4) # soapmanager, auto, date, time
        
        print(f"Created backup: {filename}")

if __name__ == '__main__':
    unittest.main()
