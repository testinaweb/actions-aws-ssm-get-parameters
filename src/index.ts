import { setFailed } from "@actions/core";
import { actionFactory } from "./action.class";

(async () => {
  try {
    actionFactory().run();
  } catch (error: any) {
    setFailed(`Action failed with error ${error.message}`);
  }
})();
