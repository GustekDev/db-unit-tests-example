import {assertFails, assertSucceeds} from "@firebase/rules-unit-testing";
import firebase = require("@firebase/rules-unit-testing");
import fs = require("fs");
import {setDoc, deleteDoc} from "firebase/firestore";

const PROJECT_ID = "firestore-emulator-example";


describe("Rules test", function() {
  let env: firebase.RulesTestEnvironment;

  before(async () => {
  // Load the rules file before the tests begin
    const rules = fs.readFileSync("../firestore.rules", "utf8");
    env = await firebase.initializeTestEnvironment(
        {
          projectId: PROJECT_ID,
          firestore: {rules},
        }
    );
  });

  beforeEach(async () => {
  // Clear the database between tests
    await env.clearFirestore();
  });

  it("require users to log in before creating a profile", async () => {
    const userId = "alice";
    const context = env.authenticatedContext(userId);
    await assertSucceeds(
        setDoc(
            context.firestore().doc(`/privateProfiles/${userId}`),
            {}
        )
    );
  });

  it("edit only your own profile", async () => {
    const alice = "alice";
    const bob = "bob";
    const aliceContext = env.authenticatedContext(alice);
    const bobContext = env.authenticatedContext(bob);
    await assertSucceeds(
        setDoc(
            aliceContext.firestore().doc(`/privateProfiles/${alice}`),
            {}
        )
    );
    await assertFails(
        setDoc(
            bobContext.firestore().doc(`/privateProfiles/${alice}`),
            {}
        )
    );
  });

  it("can't directly delete a profile", async () => {
    const alice = "alice";
    const aliceContext = env.authenticatedContext(alice);
    const db = aliceContext.firestore();
    await assertSucceeds(
        setDoc(
            db.doc(`/privateProfiles/${alice}`),
            {"smth": 1}
        )
    );
    await assertFails(
        deleteDoc(
            db.doc(`/privateProfiles/${alice}`)
        )
    );
  });
});
