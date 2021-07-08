exports.handler = async (event) => {

  let internalWorkflow = event.workflow;

  internalWorkflow.steps.shift();
  internalWorkflow.next_step = internalWorkflow.steps[0] == null ? "" : internalWorkflow.steps[0];
  internalWorkflow.data["result_lambda_2"] = "Successfully passed the lambda 2";

  return internalWorkflow;
};