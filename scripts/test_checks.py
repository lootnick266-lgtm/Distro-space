import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch

import check


class CheckerTests(unittest.TestCase):
    def test_duplicate_yaml_key_is_rejected_without_source(self):
        secret = 'do-not-print-this-value'
        with self.assertRaises(check.CheckError) as caught:
            check.load_documents(f'key: {secret}\nkey: other\n', 'fixture.yaml')
        self.assertNotIn(secret, str(caught.exception))
        self.assertIn('duplicate YAML key', str(caught.exception))

    def test_actions_trigger_is_not_a_boolean(self):
        doc = check.load_documents('on:\n  push:\njobs: {}\n', 'workflow.yaml')[0]
        self.assertIn('on', doc)
        self.assertNotIn(True, doc)

    def test_invalid_yaml_does_not_echo_source(self):
        with self.assertRaises(check.CheckError) as caught:
            check.load_documents('password: [do-not-print-this-value', 'fixture.yaml')
        self.assertNotIn('do-not-print-this-value', str(caught.exception))

    def test_secret_match_reports_location_only(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            token = 'ghp_' + 'x' * 36
            (root / 'fixture.php').write_text(token)
            with patch.object(check, 'ROOT', root), patch.object(check, 'run', return_value='fixture.php\0'):
                with self.assertRaises(check.CheckError) as caught:
                    check.check_secrets()
            self.assertIn('fixture.php:1', str(caught.exception))
            self.assertNotIn(token, str(caught.exception))

    def test_sensitive_path_rejected_before_file_read(self):
        with patch.object(check, 'run', return_value='.env\0'), patch.object(Path, 'read_text', side_effect=AssertionError('must not read')):
            with self.assertRaises(check.CheckError) as caught:
                check.check_secrets()
        self.assertIn('contents not read', str(caught.exception))


if __name__ == '__main__':
    unittest.main()
