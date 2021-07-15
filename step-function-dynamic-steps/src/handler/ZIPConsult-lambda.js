const https = require('https');

exports.handler = async (event) => {
  let zip = event.workflow.data.zip;
  let url = `https://viacep.com.br/ws/${zip}/json/`
  let data = '';
  let internalWorkflow = event.workflow;
  
  const response = await new Promise((resolve, reject) => {
    const req = https.get(url, function(res) {
      res.on('data', d => {
        data += d;
      });
      res.on('end', () => {
        resolve({
          statusCode: 200,
          body: JSON.stringify(JSON.parse(data))
        });
      });
    });
    
    req.on('error', (e) => {
      reject({
          statusCode: 500,
          body: 'Something went wrong!'
      });
    });
  });

  internalWorkflow.steps.shift();
  internalWorkflow.next_step = internalWorkflow.steps[0] == null ? "" : internalWorkflow.steps[0];
  internalWorkflow.data["address"] = response;

  return internalWorkflow;
};