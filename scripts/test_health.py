from datetime import datetime, timedelta, timezone
import io
import json
import subprocess
import unittest
from unittest.mock import patch
import urllib.error

import health


class HealthTests(unittest.TestCase):
    def test_missing_resources_do_not_pass(self):
        for function in [health.nodes_ready, health.pods_ready, health.workloads_ready]:
            with self.subTest(function=function.__name__), self.assertRaises(health.HealthError):
                function([])

    def test_zero_replicas_and_unobserved_update_fail(self):
        resource = {'kind': 'Deployment', 'metadata': {'name': 'php', 'generation': 2},
                    'spec': {'replicas': 0}, 'status': {'observedGeneration': 2}}
        with self.assertRaises(health.HealthError):
            health.workloads_ready([resource])
        resource['spec']['replicas'] = 1
        resource['status'] = {'observedGeneration': 1, 'readyReplicas': 1, 'updatedReplicas': 1}
        with self.assertRaises(health.HealthError):
            health.workloads_ready([resource])
        resource['status']['observedGeneration'] = 2
        health.workloads_ready([resource])

    def test_running_but_unready_pod_fails(self):
        pod = {'metadata': {'name': 'php'}, 'status': {'phase': 'Running',
               'conditions': [{'type': 'Ready', 'status': 'False'}], 'containerStatuses': [{'ready': True}]}}
        with self.assertRaises(health.HealthError):
            health.pods_ready([pod])

    def test_old_restarts_alone_do_not_fail(self):
        pod = {'metadata': {'name': 'php'}, 'status': {'phase': 'Running',
               'conditions': [{'type': 'Ready', 'status': 'True'}],
               'containerStatuses': [{'ready': True, 'restartCount': 20}]}}
        self.assertEqual(len(health.pods_ready([pod])), 1)

    def test_missing_zero_and_nan_metrics_fail(self):
        for result in [[], [{'value': [0, '0']}], [{'value': [0, 'NaN']}], [{'value': [0, 'bad']}]]:
            with self.subTest(result=result), self.assertRaises(health.HealthError):
                health.metrics_up(result, 'mysql_up')
        health.metrics_up([{'value': [0, '1']}], 'mysql_up')

    def test_stale_scrape_is_not_healthy(self):
        now = datetime.now(timezone.utc)
        target = {'labels': {'job': 'mysql'}, 'health': 'up', 'lastError': '',
                  'lastScrape': (now - timedelta(seconds=181)).isoformat()}
        with self.assertRaises(health.HealthError):
            health.targets_ready([target], 180, now)
        target['lastScrape'] = now.isoformat()
        health.targets_ready([target], 180, now)
        target['health'] = 'down'
        with self.assertRaises(health.HealthError):
            health.targets_ready([target], 180, now)

    def test_http_error_can_be_expected_without_printing_body(self):
        cluster = health.Cluster(1)
        response = urllib.error.HTTPError('http://test', 403, 'Forbidden', {}, io.BytesIO(b'sensitive-body'))
        with patch.object(cluster.opener, 'open', side_effect=response):
            cluster.http('http://test', expected=403)
        response = urllib.error.HTTPError('http://test', 302, 'Found', {}, io.BytesIO(b'sensitive-body'))
        with patch.object(cluster.opener, 'open', side_effect=response), self.assertRaises(health.HealthError) as caught:
            cluster.http('http://test')
        self.assertNotIn('sensitive-body', str(caught.exception))

    def test_kubectl_only_gets_state_and_hides_command_errors(self):
        cluster = health.Cluster(1)
        result = subprocess.CompletedProcess([], 0, json.dumps({'items': []}), '')
        with patch.object(health.subprocess, 'run', return_value=result) as run:
            self.assertEqual(cluster.get('pods', 'distro-space'), {'items': []})
        command = run.call_args.args[0]
        self.assertIn('get', command)
        self.assertNotIn('exec', command)
        with patch.object(health.subprocess, 'run', return_value=subprocess.CompletedProcess([], 1, '', 'private detail')):
            with self.assertRaises(health.HealthError) as caught:
                cluster.get('pods', 'distro-space')
        self.assertNotIn('private detail', str(caught.exception))


if __name__ == '__main__':
    unittest.main()
