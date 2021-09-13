import { test } from "tap";
import { generateIndex, generateIndexString } from "../src/index";

void test("generateIndex", async (t) => {
  const s = "./fixtures/*.proto";
  const options = await generateIndex(s);
  t.same(options,{ package: [ 'tutorial' ], protoPath: [ 'tutorial.proto' ] });
  const c = generateIndexString(options)
  const expected = `
const path = require('path');
module.exports = {
  package: ["tutorial"],
  protoPath:["tutorial.proto"].map(p => path.join(__dirname,p))
}
`
  t.equal(c,expected);
});

