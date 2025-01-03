#!/usr/bin/python

import os
import sys
import logging
from urllib import parse as url_parse
import datetime
import requests
from bs4 import BeautifulSoup

print("ALL ENVIRONMENT VARIABLES IN PYTHON SCRIPT\n")
for k, v in os.environ.items():
    print("{0}={1}".format(k, v))

logger = logging.getLogger('junit_to_qase')
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler('junit_to_qase.log')
fh.setLevel(logging.DEBUG)
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)
logger.addHandler(fh)
logger.addHandler(ch)

REPORT_FILENAME = "results.xml"
TEST_SOURCE = "UIValidation"
qase_token = ""
qase_automation_project = ""
build_cause = ""
rancher_image_tag = ""
cypress_tags = ""
if 'QASE_AUTOMATION_TOKEN' in os.environ:
    qase_token = os.environ['QASE_AUTOMATION_TOKEN']
else:
    logger.error("QASE_AUTOMATION_TOKEN NOT PROVIDED")
    sys.exit(1)
if 'QASE_PROJECT' in os.environ:
    qase_automation_project = os.environ['QASE_PROJECT']
else:
    logger.error("QASE_PROJECT NOT PROVIDED")
    sys.exit(1)
if 'BUILDTYPE' in os.environ:
    build_cause = "1" if os.environ['BUILDTYPE'] == "RecurringRun" else "2"
else:
    logger.info("No BUILDTYPE environment variable found. Default is AdHoc")
    build_cause = "2"
if 'RANCHER_IMAGE_TAG' in os.environ:
    rancher_image_tag = os.environ['RANCHER_IMAGE_TAG']
else:
    logger.error("RANCHER_IMAGE_TAG NOT PROVIDED")
    sys.exit(1)
if 'CYPRESS_TAGS' in os.environ:
    cypress_tags = os.environ['CYPRESS_TAGS']
else:
    logger.error("CYPRESS_TAGS NOT PROVIDED")
    sys.exit(1)
if qase_token is None or qase_token == "":
    logger.error("NO API TOKEN PROVIDED")
    sys.exit(1)

logger.info("Qase Project: {0}".format(qase_automation_project))
logger.info("Build cause: {0}".format(build_cause))

with open(REPORT_FILENAME, 'r') as f:
    file = f.read()

soup = BeautifulSoup(file, 'lxml-xml')


def sanitize_suite_title(string_to_clean):
    return string_to_clean.replace("Root Suite.", "") \
            .replace(".", " ") \
            .replace("\"", "") \
            .replace(":", "") \
            .replace(",", "") \
            .strip()


def sanitize_testcase_title(string_to_clean):
    return string_to_clean.replace(".", " ") \
            .replace("\"", "") \
            .replace(":", "") \
            .replace(",", "") \
            .replace("before all hook for ", "") \
            .replace("before each hook for ", "") \
            .replace("after all hook for ", "") \
            .replace("after each hook for ", "") \
            .strip()


results = {}

suite_title_tmp = soup.find_all("testsuite", {"name": True})
suite_title = [s for s in suite_title_tmp if s.attrs["name"] != ""]

for ts in suite_title:
    testcases = ts.findChildren("testcase", recursive=False)
    if len(testcases) > 0:
        suite_name = ts.get("name")
        suite_name = sanitize_suite_title(suite_name)
        results[suite_name] = {}
        for tc in testcases:
            testcase_name = tc.get("name")
            testcase_name = sanitize_testcase_title(testcase_name)
            skipped = tc.findChildren("skipped", recursive=False)
            failure_msgs = tc.findChildren("failure", recursive=False)
            if len(skipped) == 1:
                logger.debug("An skip tag was found in the test case: {0}".format(testcase_name))
                results[suite_name][testcase_name] = "skipped_test"
                continue
            elif len(failure_msgs) == 1:
                logger.debug("An error message was found in the test case: {0}".format(testcase_name))
                results[suite_name][testcase_name] = failure_msgs[0].get("message")
            else:
                logger.debug("Success of test case: {0}".format(testcase_name))
                results[suite_name][testcase_name] = None

total_test_cases_in_junit = 0
for st in results.keys():
    total_test_cases_in_junit += len(results[st])
logger.info("Total number of test cases in the jUnit file: {0}".format(total_test_cases_in_junit))

# API Transform

base_url = "https://api.qase.io/v1"
qase_headers = {'Token': "{0}".format(qase_token), "accept": "application/json"}
cases_url = "{0}/case".format(base_url)
suites_url = "{0}/suite".format(base_url)
runs_url = "{0}/run".format(base_url)
results_url = "{0}/result".format(base_url)
cases_ids = []
skipped_cases_ids = []
failed_cases_ids_stack = {}


def qase_cases(project, case_id=None, suite_id=None, limit=100):
    if case_id is not None:
        return requests.get("{0}/{1}/{2}".format(cases_url, project, case_id),
                            headers=qase_headers)
    elif suite_id is not None:
        return requests.get("{0}/{1}?suite_id={2}&limit={3}".format(cases_url, project, suite_id, limit),
                            headers=qase_headers)
    else:
        return requests.get("{0}/{1}?limit={2}".format(cases_url, project, limit),
                            headers=qase_headers)


def qase_add_case(project, payload):
    if isinstance(payload, dict):
        return requests.post("{0}/{1}".format(cases_url, project),
                             json=payload, headers=qase_headers)
    else:
        return None


def qase_update_case(project, payload, case_id):
    if isinstance(payload, dict) and case_id is not None:
        return requests.patch("{0}/{1}/{2}".format(cases_url, project, case_id),
                              json=payload, headers=qase_headers)
    else:
        return None


def qase_suites(project, suite_id=None, search_string="", limit=100):
    if search_string:
        return requests.get("{0}/{1}?search={2}&limit={3}".format(suites_url, project, search_string, limit),
                            headers=qase_headers)
    if suite_id is not None:
        return requests.get("{0}/{1}/{2}".format(suites_url, project, suite_id),
                            headers=qase_headers)
    else:
        return requests.get("{0}/{1}?limit={2}".format(suites_url, project, limit),
                            headers=qase_headers)


def qase_add_suite(project, payload):
    if isinstance(payload, dict):
        return requests.post("{0}/{1}".format(suites_url, project),
                             json=payload, headers=qase_headers)
    else:
        return None


def qase_update_suite(project, payload, suite_id):
    if isinstance(payload, dict) and suite_id is not None:
        return requests.patch("{0}/{1}/{2}".format(suites_url, project, suite_id),
                              json=payload, headers=qase_headers)
    else:
        return None


def qase_search_qql(search_query, limit=100):
    if isinstance(search_query, dict):
        params = url_parse.urlencode(search_query, quote_via=url_parse.quote)
        return requests.get("{0}/search?limit={1}".format(base_url, limit), params=params,
                            headers=qase_headers)


def qase_create_run(project, payload):
    if isinstance(payload, dict):
        return requests.post("{0}/{1}".format(runs_url, project),
                             json=payload, headers=qase_headers)
    else:
        return None


def qase_complete_run(project, run_id):
    return requests.post("{0}/{1}/{2}/complete".format(runs_url, project, run_id),
                         headers=qase_headers)


def create_run_result(project, payload, run_id):
    if isinstance(payload, dict):
        return requests.post("{0}/{1}/{2}".format(results_url, project, run_id),
                             json=payload, headers=qase_headers)
    else:
        return None


def create_testcases_under_suite(case_entities, suite_title_from_junit, suite_id):
    """
    Custom Fields
    - TestSource -> 14
    - AutomationTestName -> 15
    """
    case_titles_from_junit = results[suite_title_from_junit].keys()
    if len(case_entities) > 0:
        case_titles = [subs["title"] for subs in case_entities]
        case_title_and_id = {subs["title"]: subs['id'] for subs in case_entities}
        case_descriptions = [subs["description"] for subs in case_entities]
    else:
        case_titles = []

    logger.debug("Titles from jUnit: {0}".format(list(case_titles_from_junit)))
    logger.debug("Titles from Qase: {0}".format(case_titles))
    for ct in case_titles_from_junit:
        failed = False
        tc_skipped = False
        if ct not in case_titles:
            # Title ct not found add it
            logger.info("Case title not found in suite: {0}".format(ct))
            # if the result from junit has a description, add it
            # This part is where the error message goes if we want it in the Test Case description
            testcase_value = results[suite_title_from_junit][ct]
            req_body = {"title": ct,
                        "is_flaky": 0,
                        "automation": 0,
                        "isManual": 1,
                        "isToBeAutomated": False,
                        "custom_field": {
                            "14": TEST_SOURCE,
                            "15": "{0}/{1}".format(suite_title_from_junit, ct)},
                        "suite_id": suite_id}
            if testcase_value and testcase_value != "skipped_test":
                req_body.update({'description': results[suite_title_from_junit][ct]})
                failed = True
            if testcase_value == "skipped_test":
                tc_skipped = True
            resp = qase_add_case(qase_automation_project, req_body)
            id_to_add = resp.json()["result"]["id"]
            cases_ids.append(id_to_add)
            if tc_skipped:
                skipped_cases_ids.append(id_to_add)
            if failed:
                failed_cases_ids_stack[id_to_add] = results[suite_title_from_junit][ct]
        else:
            logger.info("Case title found: {0}".format(ct))
            case_id_from_title = case_title_and_id[ct]
            cases_ids.append(case_id_from_title)
            req_body = {"suite_id": suite_id,
                        "automation": 0,
                        "isManual": 1,
                        "isToBeAutomated": False,
                        "custom_field": {
                                "14": TEST_SOURCE,
                                "15": "{0}/{1}".format(suite_title_from_junit, ct)
                            },
                        }
            logger.debug("Refresh test case id {0} "
                         "to ensure it is in the correct Suite {1}".
                         format(case_id_from_title, suite_id))
            qase_update_case(qase_automation_project, req_body, case_id_from_title)
            has_skipped_or_error = results[suite_title_from_junit][ct]
            if has_skipped_or_error:
                logger.info("A description or skip value exist for test case")
                if has_skipped_or_error == "skipped_test":
                    logger.info("Skipped ID: {0} Title: {1}".format(case_id_from_title, ct))
                    skipped_cases_ids.append(case_id_from_title)
                else:
                    logger.info("Failed ID: {0} Title: {1}".format(case_id_from_title, ct))
                    failed_cases_ids_stack[case_id_from_title] = results[suite_title_from_junit][ct]
                    if results[suite_title_from_junit][ct] not in case_descriptions:
                        logger.debug("A description was found that is not in Qase "
                                     "in a test case with ID: {0} Title: {1}".
                                     format(case_id_from_title, ct))
                        req_body = {'description': results[suite_title_from_junit][ct]}
                        qase_update_case(qase_automation_project, req_body, case_id_from_title)
            else:
                logger.info("There isn't a failure message from junit data, clear the description in qase")
                req_body = {'description': None}
                qase_update_case(qase_automation_project, req_body, case_id_from_title)


global_suite_id_name = "Global UI"
global_suite_id = None
check_global_suite = qase_suites(qase_automation_project, search_string=global_suite_id_name)
logger.info(check_global_suite.text)
logger.info(check_global_suite.status_code)
suite_objects = check_global_suite.json()["result"]["entities"]
suite_objects = sorted(suite_objects, key=lambda x: x['id'], reverse=True)
suite_titles = [subs["title"] for subs in suite_objects
                if subs["title"] == global_suite_id_name]
suite_title_and_id = {subs["title"]: subs['id']
                      for subs in suite_objects
                      if subs["title"] == global_suite_id_name}

if global_suite_id_name not in suite_titles:
    suite_post_data = {"title": global_suite_id_name}
    suite_response = qase_add_suite(qase_automation_project, suite_post_data)
    global_suite_id = suite_response.json()["result"]["id"]
else:
    global_suite_id = suite_title_and_id[global_suite_id_name]

logger.info("Suite ID: {0} Name: {1}".format(global_suite_id, global_suite_id_name))

for k in list(results.keys()):
    suite = qase_suites(qase_automation_project, search_string=k)
    suite_result = suite.json()
    if suite_result["status"]:
        suite_entities = suite_result["result"]["entities"]
    else:
        logger.error("There was an error retrieving suites")
        sys.exit(1)
    suite_entities = [suite_ent for suite_ent in suite_entities
                       if suite_ent["title"] == k and suite_ent["cases_count"] > 0]
    logger.info(suite_entities)
    if len(suite_entities) < 1:
        suite_data = {"title": k, "parent_id": global_suite_id}
        r = qase_add_suite(qase_automation_project, suite_data)
        suiteid = r.json()["result"]["id"]
        create_testcases_under_suite([], k, suiteid)
    else:
        suiteid = None
        suite_entities = sorted(suite_entities, key=lambda x: x['id'])
        if suite_entities[0]:
            suiteid = suite_entities[0]["id"]
        if suiteid == None:
            logger.error("There was an error getting a suite id")
            sys.exit(1)
        suite_cases = qase_cases(qase_automation_project, suite_id=suiteid)
        cases_entities = suite_cases.json()["result"]["entities"]
        create_testcases_under_suite(cases_entities, k, suiteid)

formatted_date = "{0}".format(datetime.datetime.now().strftime("%m-%d-%y/%H-%M-%S"))

logger.info("BUILD CAUSE: {0}".format(build_cause))
# RunSource (16) custom field values:
# - RecurringRun -> 1
# - AdHoc        -> 2
# - Manual       -> 3
data_to_run = {"title": "UI RUN {0} - {1} - {2}".format(formatted_date, rancher_image_tag, cypress_tags),
               "cases": cases_ids,
               "custom_field": {"16": build_cause}
               }

logger.info("DATA FOR TEST_RUN: {0}".format(data_to_run))
test_run_info = qase_create_run(qase_automation_project, data_to_run)
test_run_id = test_run_info.json()["result"]["id"]

test_result_data = None
for ci in cases_ids:
    # Skipped case id is 5 -> "skipped"  ?
    test_result_data = {"case_id": ci}
    if ci in failed_cases_ids_stack.keys():
        test_result_data.update({"status": "failed", "stacktrace": failed_cases_ids_stack[ci]})
    elif ci in skipped_cases_ids:
        test_result_data.update({"status": "skipped"})
    else:
        test_result_data.update({"status": "passed"})
    logger.info("Test Case ID: {0} Result Data {1}".format(ci, test_result_data))
    create_run_result(qase_automation_project, test_result_data, test_run_id)

qase_complete_run(qase_automation_project, test_run_id)
logger.info("jUnit to Qase completed")
