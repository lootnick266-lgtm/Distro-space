"""Regression checks for database migration safeguards; no real cluster or DB."""
import hashlib
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('restore_db', ROOT / 'ansible/roles/distro/files/restore-db.py')
RESTORE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RESTORE)

class MigrationTests(unittest.TestCase):
    def setUp(self):
        self.work = tempfile.TemporaryDirectory()
        self.addCleanup(self.work.cleanup)
        self.path = Path(self.work.name) / 'snapshot.sql'
        self.sql = ''.join('CREATE TABLE `' + name + '` (id INT);\n' for name in RESTORE.TABLES)
        self.sql += "INSERT INTO `users` (`id`) VALUES (1);\n"
        self.path.write_text(self.sql)
        self.digest = hashlib.sha256(self.path.read_bytes()).hexdigest()
        self.calls = []

    def run_restore(self, marker='', nonempty=False, checksum=None):
        def fake_run(args, **kwargs):
            self.calls.append((args, kwargs))
            if 'get' in args:
                result = marker.encode()
            elif 'apply' in args:
                result = b'configmap/database-migration created'
            else:
                sql = kwargs['input'].decode()
                if sql.startswith("SELECT '"):
                    imported = any(call.get('input', b'').startswith(b'CREATE TABLE')
                                   for _, call in self.calls)
                    result = ''.join(name + '\t' + str(int(name == 'users' and
                                   (nonempty or imported))) + '\n'
                                   for name in RESTORE.TABLES).encode()
                else:
                    result = b''
            return subprocess.CompletedProcess(args, 0, stdout=result, stderr=b'')
        with patch('sys.argv', ['restore-db.py', str(self.path), checksum or self.digest]), \
             patch.object(RESTORE.subprocess, 'run', side_effect=fake_run):
            RESTORE.main()

    def test_checksum_mismatch_never_contacts_cluster(self):
        with self.assertRaisesRegex(RuntimeError, 'checksum mismatch'):
            self.run_restore(checksum='0' * 64)
        self.assertEqual(self.calls, [])

    def test_nonempty_target_is_never_overwritten(self):
        with self.assertRaisesRegex(RuntimeError, 'not empty'):
            self.run_restore(nonempty=True)
        self.assertFalse(any(kw.get('input', b'').startswith(b'CREATE TABLE') for _, kw in self.calls))

    def test_same_snapshot_is_not_imported_twice(self):
        self.run_restore(marker=self.digest)
        self.assertEqual(len(self.calls), 1)

    def test_other_snapshot_is_refused(self):
        with self.assertRaisesRegex(RuntimeError, 'different snapshot'):
            self.run_restore(marker='1' * 64)
        self.assertEqual(len(self.calls), 1)

    def test_success_records_marker_after_import_and_verification(self):
        self.run_restore()
        self.assertIn('apply', self.calls[-1][0])
        self.assertTrue(any(kw.get('input', b'').startswith(b'CREATE TABLE') for _, kw in self.calls))

    def test_system_database_statements_are_rejected(self):
        self.path.write_text(self.sql + 'CREATE USER unsafe;\n')
        self.digest = hashlib.sha256(self.path.read_bytes()).hexdigest()
        with self.assertRaisesRegex(RuntimeError, 'app-table'):
            self.run_restore()
        self.assertEqual(self.calls, [])

if __name__ == '__main__':
    unittest.main()
