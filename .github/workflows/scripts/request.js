const USER_AGENT = 'PR Action'
const TOKEN = process.env.TOKEN || process.env.GH_TOKEN;
const GRAPHQL = 'https://api.github.com/graphql';

const https = require('https');

/**
 * Get the Project Information for the specified GH project
 *
 * @param org GitHub Organization
 * @param num Project number
 * @returns Project Info (ID and Status Field info)
 */
async function ghProject(org, num) {
  let orgOrUser = org;

  if (orgOrUser.startsWith('@')) {
    orgOrUser = orgOrUser.substr(1);
  }

  const type = orgOrUser !== org ? 'user' : 'organization';
  
  const gQL = `query {
    ${ type }(login: "${ orgOrUser }") {
      projectV2(number: ${ num }) {
        id
        fields(first:100) {
        	nodes {
            ... on ProjectV2SingleSelectField {
            	id
              name
              options {
                id
                name
              }
            }
            ... on ProjectV2FieldCommon {
              id
              name
            }            
        	}
      	}        
      }
    }
  }`;

  // console.log(gQL);

  const res = await graphql(gQL);

  const prj = {};

  if (res.data?.organization?.projectV2) {
    const v2Project = res.data?.organization?.projectV2;

    prj.id = v2Project.id;

    const statusField = v2Project.fields?.nodes.find((node) => node.name === 'Status');

    if (statusField) {
      const optionMap = {};
      statusField.options.forEach((opt) => {
        optionMap[opt.name] = opt.id;
      });

      prj.statusField = {
        id: statusField.id,
        options: optionMap
      };
    }

    const storyPointsField = v2Project.fields?.nodes.find((node) => node.name === 'Story Points');

    if (storyPointsField) {
      prj.storyPointsField = {
        id: storyPointsField.id
      };
    }

  } else {
    console.log(res);
  }

  return prj;
}
/**
 * Fetch the issue and get the project info for the issue (map of project ID to project issue ID)
 *
 * @param org GitHub Organization
 * @param repo GitHub Repository
 * @param num Project number
 * @returns Project Issue Map metadata
 */
async function ghProjectIssue(org, repo, num) {
  const gQL = `query {
    repository(name:"${ repo }", owner:"${ org }") {
      issue(number: ${ num }) {
        title,
        labels(first: 100) {
          nodes {
          	name
          }
        }        
        projectItems(first:100){
          nodes {
            id
            project {
              id
              title
            }
          }
        }
      }
    }
  }`;

  const res = await graphql(gQL);

  if (res.data?.repository?.issue?.projectItems) {
    const projectItems = res.data?.repository?.issue?.projectItems?.nodes;
    const projectMap = {};

    // Map of project ID to the Issue ID within that project
    projectItems.forEach((item) => {
      projectMap[item.project.id] = item.id;
    });

    return projectMap;
  } else {
    console.log('No project items');
    console.log(JSON.stringify(res, null, 2));
  }

  return undefined;
}

/**
 * Change the status of an issue on a project board
 *
 * @param prj Project metadata
 * @param prjIssueID Issue ID in project
 * @param status New status name
 * @returns 
 */
async function ghUpdateProjectIssueStatus(prj, prjIssueID, status) {
  // Check status exists
  const statusOptionID = prj.statusField?.options?.[status];

  if (!statusOptionID) {
    console.log(`Can not find status ${ status } as a valid option for the project's status field`);

    return false;
  }

  const gQL = `mutation {
    updateProjectV2ItemFieldValue(
      input: {
        projectId: "${ prj.id }"
        itemId: "${ prjIssueID }"
        fieldId: "${ (prj.statusField.id) }"
        value: { 
          singleSelectOptionId: "${ statusOptionID }"
        }
      }
    ) {
      projectV2Item {
        id
      }
    }
  }`;

  return await graphql(gQL);
}

/**
 * Add an issue to the GitHub Project boar4d
 * @param {*} prj Project metadata
 * @param {*} issue Issue metadata
 * @returns Response from add request
 */
async function ghAddIssueToProject(prj, issue) {
  const gQL = `mutation {
    addProjectV2ItemById(input: {projectId: "${ prj.id }" contentId: "${ issue.node_id }"}) {
      item {
        id
      }
    }
  }`;

  return await graphql(gQL);
}

/**
 * Fetch the open issues for the given org/repo with the given milestone and label
 *
 */
async function ghFetchOpenIssues(org, repo, milestone, label, previous) {
  let extra = milestone ? `milestone:${ milestone }` : '';

  if (label) {
    extra += ` label:\\"${label}\\"`;
  }

  const query = `repo:${org}/${repo} ${extra}`;

  return ghQueryIssues(query, previous);
}

async function ghFetchOpenIssuesInProject(org, projectId, milestone, label, previous) {
  let extra = milestone ? `milestone:${ milestone }` : '';

  if (label) {
    extra += ` label:\\"${label}\\"`;
  }

  const query = `project:${org}/${projectId} ${extra}`;

  return ghQueryIssues(query, previous);
}

async function ghQueryIssues(query, previous) {
  let after = '';

  if (previous && previous.pageInfo?.endCursor) {
    after = `after: "${ previous.pageInfo.endCursor }",`;
  }

  const gQL = `query {
    search(first:100, ${after} type:ISSUE, query:"is:open is:issue ${query}") {
      issueCount,
      pageInfo {
        startCursor
        hasNextPage
        endCursor
      }
        nodes {
        ...on Issue {
          id
          number
          state
          title
          labels(first: 100) {
            nodes {
              name
            }
          }        
          projectItems(first:100) {
            totalCount
            nodes {
              id
              project {
                id
              }
              status: fieldValueByName(name: "Status") {
                ...on ProjectV2ItemFieldSingleSelectValue {
                  name
                  id
                }
              }
              storyPoints: fieldValueByName(name: "Story Points") {
                ...on ProjectV2ItemFieldNumberValue {
                  number
                }
              }
            }
          }
        }
      }
    }
  }`;

  const res = await graphql(gQL);

  if (res.data?.search) {
    if (previous) {
      // Copy in the previous issues
      res.data.search.nodes = [
        ...previous.nodes,
        ...res.data.search.nodes,
      ];
    }

    if (res.data.search.pageInfo.hasNextPage) {
      return await ghQueryIssues(query, res.data.search)
    }

    return res.data.search.nodes;
  }

  return false;
}

function fetch (url) {
    const opts = {
        headers: {
            'User-Agent': USER_AGENT,
            'Authorization': `token ${TOKEN}`
        }
    };

    return new Promise((resolve, reject) => {
        https.get(url, opts, (response) => {
            let chunks_of_data = [];

            response.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });

            response.on('end', () => {
                let response_body = Buffer.concat(chunks_of_data);
                resolve(JSON.parse(response_body.toString()));
            });

            response.on('error', (error) => {
                reject(error);
            });
        });
    });
};

function post(url, data) {
    return write(url, data, 'POST');
}

function put(url, data) {
    return write(url, data, 'PUT');
}

function patch(url, data) {
    return write(url, data, 'PATCH');
}

function graphql(data) {
    return write(GRAPHQL, { query: data }, 'POST')
}

function write(url, data, method) {
    const json = JSON.stringify(data);
    const opts = {
        method: method || 'POST',
        headers: {
            'User-Agent': USER_AGENT,
            'Authorization': `token ${TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': json.length            
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(url, opts, (response) => {
            let chunks_of_data = [];

            response.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });

            response.on('end', () => {
                let response_body = Buffer.concat(chunks_of_data);
                try {
                  resolve(JSON.parse(response_body.toString()));
                } catch (e) {
                  reject(response);
                }
            });

            response.on('error', (error) => {
                reject(error);
            });
        });
        req.write(json);
        req.end();
    });
}

module.exports = {
    fetch,
    post,
    put,
    patch,
    graphql,
    ghProject,
    ghProjectIssue,
    ghUpdateProjectIssueStatus,
    ghFetchOpenIssues,
    ghAddIssueToProject,
    ghFetchOpenIssuesInProject,
};
