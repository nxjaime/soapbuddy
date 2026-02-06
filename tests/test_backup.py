"""
Test Backup Service
"""
import sys
import os
import unittest
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.services.backup_service import BackupService
from src.database.db import DB_PATH

class TestBackupService(unittest.TestCase):
    def setUp(self):
        self.backup_path = "test_backup.db"
        # Ensure we have a dummy db file if it doesn't exist
        if not os.path.exists(DB_PATH):
            with open(DB_PATH, 'w') as f:
                f.write("dummy data")
                
    def tearDown(self):
        if os.path.exists(self.backup_path):
            os.remove(self.backup_path)

    def test_backup_creation(self):
        """Test that a backup file is created correctly."""
        print(f"Testing backup from {DB_PATH} to {self.backup_path}")
        result = BackupService.create_backup(self.backup_path)
        self.assertTrue(result)
        self.assertTrue(os.path.exists(self.backup_path))
        self.assertGreater(os.path.getsize(self.backup_path), 0)
        print("Backup verified successfully.")

if __name__ == '__main__':
    unittest.main()
