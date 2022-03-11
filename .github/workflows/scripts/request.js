const USER_AGENT = 'PR Action'
const TOKEN = process.argv.length > 2 ? process.argv[2] : process.env.TOKEN;

const https = require('https');

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
                resolve(JSON.parse(response_body.toString()));
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
};
