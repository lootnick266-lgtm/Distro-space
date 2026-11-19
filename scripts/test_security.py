import copy
import json
import subprocess
import unittest
from unittest.mock import patch
import security
from check import CheckError


class SecurityTests(unittest.TestCase):
    def test_clone_preserves_source_and_real_dns_only(self):
        namespaces = {'app': 'test-app', 'monitoring': 'test-mon', 'ingress': 'test-ing'}
        doc = {'kind': 'NetworkPolicy', 'metadata': {'namespace': 'distro-space'},
               'spec': {'ingress': [{'from': [
                   {'namespaceSelector': {'matchLabels': {'kubernetes.io/metadata.name': 'monitoring'}},
                    'podSelector': {'matchLabels': {'app': 'mysql-exporter'}}}]}],
                        'egress': [{'to': [
                   {'namespaceSelector': {'matchLabels': {'kubernetes.io/metadata.name': 'kube-system'}},
                    'podSelector': {'matchLabels': {'k8s-app': 'kube-dns'}}}]}]}}
        before = copy.deepcopy(doc)
        result = security.clone_policy(doc, namespaces)
        self.assertEqual(doc, before)
        self.assertEqual(result['metadata']['namespace'], 'test-app')
        source = result['spec']['ingress'][0]['from'][0]
        self.assertEqual(source['namespaceSelector']['matchLabels']['kubernetes.io/metadata.name'], 'test-mon')
        self.assertIn('podSelector', source)
        dns = result['spec']['egress'][0]['to'][0]
        self.assertEqual(dns['namespaceSelector']['matchLabels']['kubernetes.io/metadata.name'], 'kube-system')

    def test_exec_failure_is_not_a_successful_block(self):
        with self.assertRaises(CheckError):
            security.connection_result(subprocess.CompletedProcess([], 1, '', 'unexpected EOF'))
        with self.assertRaises(CheckError):
            security.connection_result(subprocess.CompletedProcess([], 0, 'unexpected', ''))
        self.assertFalse(security.connection_result(subprocess.CompletedProcess([], 0, 'BLOCKED\n', '')))
        self.assertTrue(security.connection_result(subprocess.CompletedProcess([], 0, 'OPEN\n', '')))

    def test_cleanup_refuses_namespace_with_changed_owner(self):
        suite = security.Suite('local:test')
        suite.created = [('netpol-test-owned-app', 'original-uid')]
        response = json.dumps({'metadata': {'uid': 'other-uid', 'labels': {security.LABEL: suite.run_id}}})
        with patch.object(suite, 'command', return_value=response) as command:
            with self.assertRaises(CheckError):
                suite.cleanup()
        self.assertEqual(command.call_count, 1)
        self.assertEqual(command.call_args.args[0][0], 'get')

    def test_fixtures_do_not_pull_images_or_mount_credentials(self):
        pod = security.fixture('test', 'test-app', {}, 'local:test', 'run')
        self.assertFalse(pod['spec']['automountServiceAccountToken'])
        self.assertEqual(pod['spec']['containers'][0]['imagePullPolicy'], 'Never')
        self.assertFalse(pod['spec'].get('hostNetwork', False))
        self.assertTrue(all('hostPath' not in v and 'secret' not in v for v in pod['spec']['volumes']))


if __name__ == '__main__':
    unittest.main()
